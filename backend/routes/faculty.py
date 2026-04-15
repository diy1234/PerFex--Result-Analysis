from flask import Blueprint, request, jsonify
from database import get_db
from auth_utils import token_required

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


# ── GET /api/faculty/students ─────────────────────────────────────────────────
@faculty_bp.route('/students', methods=['GET'])
@token_required
def get_students():
    course   = request.args.get('course')
    semester = request.args.get('semester')
    section  = request.args.get('section')

    query  = "SELECT id,name,enroll,course,semester,section FROM users WHERE role='student'"
    params = []
    if course:   query += " AND course=?";   params.append(course)
    if semester: query += " AND semester=?"; params.append(semester)
    if section:  query += " AND (section=? OR section IS NULL OR section='')";  params.append(section)
    query += " ORDER BY name"

    conn = get_db()
    rows = conn.execute(query, params).fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])


# ── GET /api/faculty/subjects ─────────────────────────────────────────────────
@faculty_bp.route('/subjects', methods=['GET'])
@token_required
def get_subjects():
    course   = request.args.get('course')
    semester = request.args.get('semester')

    query  = "SELECT * FROM subjects WHERE 1=1"
    params = []
    if course:   query += " AND course=?";   params.append(course)
    if semester: query += " AND semester=?"; params.append(semester)
    query += " ORDER BY semester, name"

    conn = get_db()
    rows = conn.execute(query, params).fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])


# ── GET /api/faculty/marks?course=MCA&semester=Sem1&subject_id=1&exam_type=CIE1
@faculty_bp.route('/marks', methods=['GET'])
@token_required
def get_marks():
    subject_id = request.args.get('subject_id')
    exam_type  = request.args.get('exam_type')
    course     = request.args.get('course')
    semester   = request.args.get('semester')
    section    = request.args.get('section')

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

    if course:   query += " AND u.course=?";   params.append(course)
    if semester: query += " AND u.semester=?"; params.append(semester)
    if section:  query += " AND (u.section=? OR u.section IS NULL OR u.section='')";  params.append(section)
    query += " ORDER BY u.name"

    conn = get_db()
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


# ── GET /api/faculty/class-results ───────────────────────────────────────────
@faculty_bp.route('/class-results', methods=['GET'])
@token_required
def class_results():
    """Returns full result table like FacultyDashboard's studentResultsData"""
    course   = request.args.get('course', 'MCA')
    semester = request.args.get('semester', 'Sem1')

    conn = get_db()

    # Get students
    students = conn.execute(
        "SELECT id,name,enroll FROM users WHERE role='student' AND course=? AND semester=? ORDER BY name",
        (course, semester)
    ).fetchall()

    # Get all subjects for this course/semester
    subjects = conn.execute(
        "SELECT id, name, code FROM subjects WHERE course=? AND semester=? ORDER BY name",
        (course, semester)
    ).fetchall()

    result = []
    for st in students:
        row = {'id': st['id'], 'name': st['name'], 'enroll': st['enroll']}
        total = 0
        for sub in subjects:
            m = conn.execute(
                "SELECT marks FROM marks WHERE student_id=? AND subject_id=? AND exam_type=?",
                (st['id'], sub['id'], request.args.get('exam_type', 'CIE1'))
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
        SELECT a.*, u.name AS posted_by_name
        FROM announcements a LEFT JOIN users u ON u.id=a.posted_by
        ORDER BY a.date DESC
    """).fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])


# ── POST /api/faculty/announcements ──────────────────────────────────────────
@faculty_bp.route('/announcements', methods=['POST'])
@token_required
def post_announcement():
    data = request.get_json() or {}
    conn = get_db()
    conn.execute("""
        INSERT INTO announcements (title,message,type,course,semester,subject,class,posted_by)
        VALUES (?,?,?,?,?,?,?,?)
    """, (
        data.get('title'), data.get('message'), data.get('type', 'Notice'),
        data.get('course'), data.get('semester'), data.get('subject'),
        data.get('class', 'All'), request.user_id
    ))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Announcement posted'}), 201


# ── DELETE /api/faculty/announcements/<id> ───────────────────────────────────
@faculty_bp.route('/announcements/<int:ann_id>', methods=['DELETE'])
@token_required
def delete_announcement(ann_id):
    conn = get_db()
    conn.execute("DELETE FROM announcements WHERE id=?", (ann_id,))
    conn.commit()
    conn.close()
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

