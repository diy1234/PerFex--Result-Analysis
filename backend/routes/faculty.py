from flask import Blueprint, request, jsonify, send_file
from werkzeug.utils import secure_filename
from database import get_db
from auth_utils import token_required
import os
from datetime import datetime

faculty_bp = Blueprint('faculty', __name__)

# ── GET /api/faculty/profile ─────────────────────────────────────────────────
@faculty_bp.route('/profile', methods=['GET'])
@token_required
def get_profile():
    conn = get_db()
    u = conn.execute("SELECT * FROM users WHERE id=?", (request.user_id,)).fetchone()
    conn.close()
    if not u:
        return jsonify({'error': 'Not found'}), 404
    return jsonify({
        'id': u['id'], 'name': u['name'], 'email': u['email'],
        'faculty_id': u['faculty_id'], 'department': u['department'],
        'phone': u['phone'], 'profileImage': u['profile_image'],
    })


# ── GET /api/faculty/allocations - Returns faculty's subject allocations
@faculty_bp.route('/allocations', methods=['GET'])
@token_required
def get_allocations():
    """Returns all courses, semesters, subjects, and sections allocated to this faculty"""
    conn = get_db()
    allocations = conn.execute("""
        SELECT DISTINCT 
            fa.id, fa.faculty_id, 
            s.id AS subject_id, s.name AS subject_name, s.code AS subject_code,
            fa.course, fa.semester, fa.section
        FROM faculty_allocations fa
        INNER JOIN subjects s ON s.id = fa.subject_id
        WHERE fa.faculty_id = ?
        ORDER BY fa.course, fa.semester, s.name, fa.section
    """, (request.user_id,)).fetchall()
    conn.close()
    
    return jsonify([dict(a) for a in allocations])


# ── PUT /api/faculty/profile ─────────────────────────────────────────────────
@faculty_bp.route('/profile', methods=['PUT'])
@token_required
def update_profile():
    data = request.get_json() or {}
    conn = get_db()
    conn.execute("""
        UPDATE users SET name=?, department=?, phone=?, profile_image=?
        WHERE id=?
    """, (data.get('name'), data.get('department'),
          data.get('phone'), data.get('profileImage'), request.user_id))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Profile updated'})


# ── GET /api/faculty/students - Returns only students in faculty's allocated sections
@faculty_bp.route('/students', methods=['GET'])
@token_required
def get_students():
    """Returns only students in sections allocated to this faculty"""
    course   = request.args.get('course')
    semester = request.args.get('semester')
    section  = request.args.get('section')
    is_admin = request.user_role == 'admin'

    conn = get_db()

    if is_admin:
        query = "SELECT id,name,enroll,course,semester,section FROM users WHERE role='student'"
        params = []
        if course:   query += " AND course=?";   params.append(course)
        if semester: query += " AND semester=?"; params.append(semester)
        if section:  query += " AND section=?";  params.append(section)
        query += " ORDER BY name"
        rows = conn.execute(query, params).fetchall()
        conn.close()
        return jsonify([dict(r) for r in rows])

    # First get all sections allocated to this faculty
    alloc_query = "SELECT DISTINCT section FROM faculty_allocations WHERE faculty_id=?"
    alloc_params = [request.user_id]
    
    if course:   alloc_query += " AND course=?";   alloc_params.append(course)
    if semester: alloc_query += " AND semester=?"; alloc_params.append(semester)
    
    sections = conn.execute(alloc_query, alloc_params).fetchall()
    section_list = [s['section'] for s in sections if s['section']]
    
    if not section_list:
        conn.close()
        return jsonify([])

    # Build query for students in allocated sections
    placeholders = ','.join('?' * len(section_list))
    query  = f"SELECT id,name,enroll,course,semester,section FROM users WHERE role='student' AND section IN ({placeholders})"
    params = section_list
    
    if course:   query += " AND course=?";   params.append(course)
    if semester: query += " AND semester=?"; params.append(semester)
    if section:  query += " AND section=?";  params.append(section)
    query += " ORDER BY name"

    rows = conn.execute(query, params).fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])


# ── GET /api/faculty/subjects - Returns only subjects allocated to this faculty
@faculty_bp.route('/subjects', methods=['GET'])
@token_required
def get_subjects():
    """Returns only subjects allocated to the logged-in faculty member"""
    course   = request.args.get('course')
    semester = request.args.get('semester')
    is_admin = request.user_role == 'admin'

    if is_admin:
        query = "SELECT * FROM subjects WHERE 1=1"
        params = []
        if course:   query += " AND course=?";   params.append(course)
        if semester: query += " AND semester=?"; params.append(semester)
        query += " ORDER BY semester, name"
    else:
        query  = """
            SELECT DISTINCT s.* FROM subjects s
            INNER JOIN faculty_allocations fa ON fa.subject_id = s.id
            WHERE fa.faculty_id = ?
        """
        params = [request.user_id]
        if course:   query += " AND s.course=?";   params.append(course)
        if semester: query += " AND s.semester=?"; params.append(semester)
        query += " ORDER BY s.semester, s.name"

    conn = get_db()
    rows = conn.execute(query, params).fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])


# ── GET /api/faculty/marks - Returns marks only for faculty's allocated subjects
@faculty_bp.route('/marks', methods=['GET'])
@token_required
def get_marks():
    """Returns marks only for subjects allocated to this faculty"""
    subject_id = request.args.get('subject_id')
    exam_type  = request.args.get('exam_type')
    course     = request.args.get('course')
    semester   = request.args.get('semester')
    section    = request.args.get('section')

    conn = get_db()
    is_admin = request.user_role == 'admin'
    
    # Check if subject_id is allocated to this faculty
    if subject_id and not is_admin:
        allowed = conn.execute(
            "SELECT id FROM faculty_allocations WHERE faculty_id=? AND subject_id=?",
            (request.user_id, subject_id)
        ).fetchone()
        if not allowed:
            conn.close()
            return jsonify({'error': 'Not authorized for this subject'}), 403

    if is_admin:
        query  = """
            SELECT m.id AS mark_id, u.id AS student_id, u.name, u.enroll,
                   m.marks, m.max_marks, m.exam_type,
                   ROUND(m.marks*100.0/m.max_marks,1) AS pct,
                   s.name AS subject
            FROM users u
            LEFT JOIN marks m ON m.student_id=u.id
                AND (?1 IS NULL OR m.subject_id=?1)
                AND (?2 IS NULL OR m.exam_type=?2)
            LEFT JOIN subjects s ON s.id=m.subject_id
            WHERE u.role='student'
        """
        params = [subject_id, exam_type]
    else:
        query  = """
            SELECT m.id AS mark_id, u.id AS student_id, u.name, u.enroll,
                   m.marks, m.max_marks, m.exam_type,
                   ROUND(m.marks*100.0/m.max_marks,1) AS pct,
                   s.name AS subject
            FROM users u
            LEFT JOIN marks m ON m.student_id=u.id
                AND (?1 IS NULL OR m.subject_id=?1)
                AND (?2 IS NULL OR m.exam_type=?2)
                AND (?1 IS NOT NULL OR m.subject_id IN (
                    SELECT subject_id FROM faculty_allocations
                    WHERE faculty_id=?3
                      AND (?4 IS NULL OR course=?4)
                      AND (?5 IS NULL OR semester=?5)
                      AND (?6 IS NULL OR section=?6)
                ))
            LEFT JOIN subjects s ON s.id=m.subject_id
            WHERE u.role='student'
                AND u.section IN (
                    SELECT DISTINCT section FROM faculty_allocations 
                    WHERE faculty_id=?3
                )
        """
        params = [subject_id, exam_type, request.user_id, course, semester, section]

    if course:   query += " AND u.course=?";   params.append(course)
    if semester: query += " AND u.semester=?"; params.append(semester)
    if section:  query += " AND u.section=?";  params.append(section)
    query += " ORDER BY u.name"

    rows = conn.execute(query, params).fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])


# ── POST /api/faculty/marks  (single entry) ────────────────────────────────
@faculty_bp.route('/marks', methods=['POST'])
@token_required
def enter_marks():
    data = request.get_json() or {}
    sid  = data.get('student_id')
    subj = data.get('subject_id')
    et   = data.get('exam_type')
    m    = data.get('marks')
    mx   = data.get('max_marks', 100)

    if None in (sid, subj, et, m):
        return jsonify({'error': 'student_id, subject_id, exam_type, marks required'}), 400

    conn = get_db()
    
    # Check if faculty is allocated this subject
    allowed = conn.execute(
        "SELECT id FROM faculty_allocations WHERE faculty_id=? AND subject_id=?",
        (request.user_id, subj)
    ).fetchone()
    
    if not allowed:
        conn.close()
        return jsonify({'error': 'Not authorized for this subject'}), 403

    conn.execute("""
        INSERT INTO marks (student_id,subject_id,exam_type,marks,max_marks,entered_by)
        VALUES (?,?,?,?,?,?)
        ON CONFLICT(student_id,subject_id,exam_type)
        DO UPDATE SET marks=excluded.marks, max_marks=excluded.max_marks,
                      entered_by=excluded.entered_by, entered_at=datetime('now')
    """, (sid, subj, et, m, mx, request.user_id))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Marks saved'})


# ── POST /api/faculty/marks/bulk ─────────────────────────────────────────────
@faculty_bp.route('/marks/bulk', methods=['POST'])
@token_required
def enter_marks_bulk():
    entries = (request.get_json() or {}).get('entries', [])
    if not entries:
        return jsonify({'error': 'No entries'}), 400

    conn = get_db()
    saved = 0
    for e in entries:
        try:
            conn.execute("""
                INSERT INTO marks (student_id,subject_id,exam_type,marks,max_marks,entered_by)
                VALUES (?,?,?,?,?,?)
                ON CONFLICT(student_id,subject_id,exam_type)
                DO UPDATE SET marks=excluded.marks, max_marks=excluded.max_marks,
                              entered_by=excluded.entered_by, entered_at=datetime('now')
            """, (e['student_id'], e['subject_id'], e['exam_type'],
                  e['marks'], e.get('max_marks', 100), request.user_id))
            saved += 1
        except Exception:
            pass
    conn.commit()
    conn.close()
    return jsonify({'message': f'{saved} marks saved'})


# ── DELETE /api/faculty/marks/<id> ────────────────────────────────────────────
@faculty_bp.route('/marks/<int:mark_id>', methods=['DELETE'])
@token_required
def delete_mark(mark_id):
    conn = get_db()
    conn.execute("DELETE FROM marks WHERE id=?", (mark_id,))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Mark deleted'})


# ── GET /api/faculty/class-results - Returns results only for faculty's allocations
@faculty_bp.route('/class-results', methods=['GET'])
@token_required
def class_results():
    """Returns result table only for subjects/sections allocated to this faculty"""
    course   = request.args.get('course', 'MCA')
    semester = request.args.get('semester', 'Sem1')
    exam_type = request.args.get('exam_type', 'CIE1')
    is_admin = request.user_role == 'admin'

    conn = get_db()

    if is_admin:
        students = conn.execute(
            "SELECT id,name,enroll,section FROM users WHERE role='student' AND course=? AND semester=? ORDER BY name",
            (course, semester)
        ).fetchall()
        subjects = conn.execute(
            "SELECT id,name,code FROM subjects WHERE course=? AND semester=? ORDER BY name",
            (course, semester)
        ).fetchall()
    else:
        # Get faculty's allocated sections for this course/semester
        allocations = conn.execute(
            """SELECT DISTINCT section FROM faculty_allocations 
               WHERE faculty_id=? AND course=? AND semester=?""",
            (request.user_id, course, semester)
        ).fetchall()
        
        sections = [a['section'] for a in allocations if a['section']]
        if not sections:
            conn.close()
            return jsonify({'students': [], 'subjects': []})

        # Get students in allocated sections
        placeholders = ','.join('?' * len(sections))
        students = conn.execute(
            f"""SELECT id,name,enroll FROM users 
               WHERE role='student' AND course=? AND semester=? AND section IN ({placeholders}) 
               ORDER BY name""",
            (course, semester, *sections)
        ).fetchall()

        # Get faculty's allocated subjects for this course/semester
        subjects = conn.execute(
            """SELECT DISTINCT s.id, s.name, s.code FROM subjects s
               INNER JOIN faculty_allocations fa ON fa.subject_id = s.id
               WHERE fa.faculty_id=? AND s.course=? AND s.semester=?
               ORDER BY s.name""",
            (request.user_id, course, semester)
        ).fetchall()

    result = []
    for st in students:
        row = {'id': st['id'], 'name': st['name'], 'enroll': st['enroll']}
        total = 0
        for sub in subjects:
            m = conn.execute(
                "SELECT marks FROM marks WHERE student_id=? AND subject_id=? AND exam_type=?",
                (st['id'], sub['id'], exam_type)
            ).fetchone()
            mark = m['marks'] if m else 0
            row[sub['code'].lower()] = mark
            total += mark
        row['total'] = total
        row['pct']   = round(total / (len(subjects) * 100) * 100, 2) if subjects else 0
        result.append(row)

    conn.close()
    return jsonify({'students': result, 'subjects': [dict(s) for s in subjects]})


# ── GET /api/faculty/announcements ───────────────────────────────────────────
@faculty_bp.route('/announcements', methods=['GET'])
@token_required
def get_announcements():
    conn = get_db()
    rows = conn.execute("""
        SELECT a.*, a.class AS section, u.name AS posted_by_name
        FROM announcements a LEFT JOIN users u ON u.id=a.posted_by
        ORDER BY a.date DESC
    """).fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])


# ── POST /api/faculty/announcements ──────────────────────────────────────────
@faculty_bp.route('/announcements', methods=['POST'])
@token_required
def post_announcement():
    try:
        # Handle both form data and JSON
        data = request.form.to_dict() if request.form else (request.get_json() or {})
        
        file_path = None
        # Check if file is present in the request
        if 'file' in request.files:
            file = request.files['file']
            if file and file.filename:
                # Create uploads directory if it doesn't exist
                uploads_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads', 'announcements')
                os.makedirs(uploads_dir, exist_ok=True)
                
                # Generate unique filename with timestamp
                timestamp = datetime.now().strftime('%Y%m%d_%H%M%S_')
                filename = timestamp + secure_filename(file.filename)
                file_path_full = os.path.join(uploads_dir, filename)
                
                # Save the file
                file.save(file_path_full)
                # Store relative path for database
                file_path = os.path.join('uploads', 'announcements', filename)
        
        conn = get_db()
        
        # Check if file_path column exists, if not add it
        try:
            conn.execute("ALTER TABLE announcements ADD COLUMN file_path TEXT")
            conn.commit()
        except:
            pass  # Column already exists
        
        conn.execute("""
            INSERT INTO announcements (title,message,type,course,semester,subject,class,posted_by,file_path)
            VALUES (?,?,?,?,?,?,?,?,?)
        """, (
            data.get('title'), data.get('message'), data.get('type', 'Notice'),
            data.get('course'), data.get('semester'), data.get('subject'),
            data.get('class', 'All'), request.user_id, file_path
        ))
        conn.commit()
        conn.close()
        return jsonify({'message': 'Announcement posted', 'file_path': file_path}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 400


# ── DELETE /api/faculty/announcements/<id> ───────────────────────────────────
@faculty_bp.route('/announcements/<int:ann_id>', methods=['DELETE'])
@token_required
def delete_announcement(ann_id):
    conn = get_db()
    ann = conn.execute("SELECT file_path FROM announcements WHERE id=?", (ann_id,)).fetchone()
    conn.execute("DELETE FROM announcements WHERE id=?", (ann_id,))
    conn.commit()
    conn.close()
    
    # Delete file if it exists
    if ann and ann['file_path']:
        file_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ann['file_path'])
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except:
                pass
    
    return jsonify({'message': 'Deleted'})


# ── GET /api/faculty/queries ──────────────────────────────────────────────────
@faculty_bp.route('/queries', methods=['GET'])
@token_required
def get_queries():
    conn = get_db()
    rows = conn.execute("""
        SELECT q.*, u.name AS student_name_db
        FROM queries q LEFT JOIN users u ON u.id=q.student_id
        ORDER BY q.date DESC
    """).fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])


# ── PUT /api/faculty/queries/<id>/resolve ─────────────────────────────────────
@faculty_bp.route('/queries/<int:qid>/resolve', methods=['PUT'])
@token_required
def resolve_query(qid):
    conn = get_db()
    conn.execute("UPDATE queries SET status='Resolved' WHERE id=?", (qid,))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Resolved'})

