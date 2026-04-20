from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash
from database import get_db
from auth_utils import token_required

admin_bp = Blueprint('admin', __name__)

# ── GET /api/admin/stats ──────────────────────────────────────────────────────
@admin_bp.route('/stats', methods=['GET'])
@token_required
def stats():

    if request.user_role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403

    course = request.args.get('course')
    semester = request.args.get('semester')
    exam_type = request.args.get('exam_type')
    conn = get_db()
    
    # Build base query with optional course/semester filter for students
    student_q = "SELECT COUNT(*) FROM users WHERE role='student'"
    student_params = []
    if course:
        student_q += " AND course=?"
        student_params.append(course)
    if semester:
        student_q += " AND semester=?"
        student_params.append(semester)
    total_students = conn.execute(student_q, student_params).fetchone()[0]
    
    # Teachers (use course filter)
    teacher_q = "SELECT COUNT(DISTINCT fa.faculty_id) FROM faculty_allocations fa WHERE 1=1"
    teacher_params = []
    if course:
        teacher_q += " AND fa.course=?"
        teacher_params.append(course)
    total_teachers = conn.execute(teacher_q, teacher_params).fetchone()[0]
    
    # Marks entered - filter by course, semester, exam_type
    marks_q = "SELECT COUNT(*) FROM marks m JOIN users u ON u.id=m.student_id WHERE 1=1"
    marks_params = []
    if course:
        marks_q += " AND u.course=?"
        marks_params.append(course)
    if semester:
        marks_q += " AND u.semester=?"
        marks_params.append(semester)
    if exam_type:
        marks_q += " AND LOWER(m.exam_type)=LOWER(?)"
        marks_params.append(exam_type)
    marks_entered = conn.execute(marks_q, marks_params).fetchone()[0]
    
    data = {
        'total_students':      total_students,
        'total_teachers':      total_teachers,
        'total_subjects':      conn.execute("SELECT COUNT(*) FROM subjects").fetchone()[0],
        'total_announcements': conn.execute("SELECT COUNT(*) FROM announcements").fetchone()[0],
        'marks_entered':       marks_entered,
        'pending_queries':     conn.execute("SELECT COUNT(*) FROM queries WHERE status='Pending'").fetchone()[0],
    }
    
    # Average marks - filter by course, semester, exam_type
    avg_marks_q = "SELECT ROUND(AVG(m.marks),2) FROM marks m JOIN users u ON u.id=m.student_id WHERE 1=1"
    avg_params = []
    if course:
        avg_marks_q += " AND u.course=?"
        avg_params.append(course)
    if semester:
        avg_marks_q += " AND u.semester=?"
        avg_params.append(semester)
    if exam_type:
        avg_marks_q += " AND LOWER(m.exam_type)=LOWER(?)"
        avg_params.append(exam_type)
    avg_marks = conn.execute(avg_marks_q, avg_params).fetchone()[0]
    data['average_marks'] = avg_marks or 0

    conn.close()
    return jsonify(data)


# ── GET /api/admin/users?role=student ────────────────────────────────────────
@admin_bp.route('/users', methods=['GET'])
@token_required
def list_users():

    if request.user_role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403

    role = request.args.get('role')
    conn = get_db()
    q    = "SELECT id,name,email,role,enroll,course,semester,section,faculty_id,department,created_at FROM users WHERE role != 'admin'"
    p    = []
    if role:
        q += " AND role=?"; p.append(role)
    q += " ORDER BY role, name"
    rows = conn.execute(q, p).fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])


# ── POST /api/admin/users ─────────────────────────────────────────────────────
@admin_bp.route('/users', methods=['POST'])
@token_required
def create_user():

    if request.user_role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    
    d    = request.get_json() or {}
    name = d.get('name', '').strip()
    email= d.get('email', '').strip().lower()
    role = d.get('role', 'student')
    pwd  = d.get('password', 'Welcome@123')

    if not name or not email:
        return jsonify({'error': 'Name and email required'}), 400

    conn = get_db()
    try:
        conn.execute("""
            INSERT INTO users (name,email,password,role,enroll,course,semester,section,faculty_id,department)
            VALUES (?,?,?,?,?,?,?,?,?,?)
        """, (name, email, generate_password_hash(pwd), role,
              d.get('enroll'), d.get('course'), d.get('semester'),
              d.get('section'), d.get('faculty_id'), d.get('department')))
        conn.commit()
    except Exception as e:
        conn.close()
        error_msg = str(e)
        if 'UNIQUE constraint failed' in error_msg and 'email' in error_msg:
            return jsonify({'error': f'Email {email} already exists'}), 409
        elif 'UNIQUE constraint failed' in error_msg and 'enroll' in error_msg:
            enroll = d.get('enroll', 'unknown')
            return jsonify({'error': f'Enrollment {enroll} already exists'}), 409
        else:
            return jsonify({'error': error_msg}), 409
    conn.close()
    return jsonify({'message': f'{name} added. Default password: {pwd}'}), 201


# ── DELETE /api/admin/users/<id> ──────────────────────────────────────────────
@admin_bp.route('/users/<int:uid>', methods=['DELETE'])
@token_required
def delete_user(uid):

    if request.user_role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    
    conn = get_db()
    conn.execute("DELETE FROM users WHERE id=?", (uid,))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Deleted'})


# ── GET/POST/DELETE /api/admin/subjects ──────────────────────────────────────
@admin_bp.route('/subjects', methods=['GET'])
@token_required
def list_subjects():

    if request.user_role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    
    conn = get_db()
    rows = conn.execute("SELECT * FROM subjects ORDER BY course,semester,name").fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])


@admin_bp.route('/subjects', methods=['POST'])
@token_required
def add_subject():

    if request.user_role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    
    d = request.get_json() or {}
    conn = get_db()
    try:
        conn.execute("INSERT INTO subjects (name,code,course,semester) VALUES (?,?,?,?)",
                     (d['name'], d['code'], d['course'], d['semester']))
        conn.commit()
    except Exception as e:
        conn.close()
        return jsonify({'error': str(e)}), 409
    conn.close()
    return jsonify({'message': 'Subject added'}), 201


@admin_bp.route('/subjects/<int:sid>', methods=['DELETE'])
@token_required
def delete_subject(sid):

    if request.user_role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    
    conn = get_db()
    conn.execute("DELETE FROM subjects WHERE id=?", (sid,))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Deleted'})


# ── GET /api/admin/profile ─────────────────────────────────────────────────
@admin_bp.route('/profile', methods=['GET'])
@token_required
def get_profile():

    if request.user_role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403

    conn = get_db()
    u = conn.execute("SELECT * FROM users WHERE id=?", (request.user_id,)).fetchone()
    conn.close()
    if not u:
        return jsonify({'error': 'Not found'}), 404

    return jsonify({
        'id': u['id'],
        'name': u['name'],
        'email': u['email'],
        'department': u['department'],
        'phone': u['phone'],
        'profileImage': u['profile_image'],
    })


# ── PUT /api/admin/profile ─────────────────────────────────────────────────
@admin_bp.route('/profile', methods=['PUT'])
@token_required
def update_profile():

    if request.user_role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403

    data = request.get_json() or {}
    conn = get_db()
    conn.execute("""
        UPDATE users SET name=?, department=?, phone=?, profile_image=?
        WHERE id=?
    """, (
        data.get('name'),
        data.get('department'),
        data.get('phone'),
        data.get('profileImage'),
        request.user_id,
    ))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Profile updated'})


# ── GET /api/admin/leaderboard?course=MCA&semester=Sem1&exam_type=CIE1 ────────────────────
@admin_bp.route('/leaderboard', methods=['GET'])
@token_required
def leaderboard():

    if request.user_role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    
    course = request.args.get('course', 'MCA')
    semester = request.args.get('semester')
    exam_type = request.args.get('exam_type')
    conn = get_db()

    # Build student query with course and semester filters
    student_q = "SELECT id, name, course FROM users WHERE role='student' AND course=?"
    student_params = [course]
    if semester:
        student_q += " AND semester=?"
        student_params.append(semester)
    student_q += " ORDER BY name"
    
    students = conn.execute(student_q, student_params).fetchall()

    result = []
    for st in students:
        # Build marks query with optional exam_type filter
        marks_q = "SELECT ROUND(AVG(marks),1) AS avg FROM marks WHERE student_id=?"
        marks_params = [st['id']]
        if exam_type:
            marks_q += " AND LOWER(exam_type)=LOWER(?)"
            marks_params.append(exam_type)
        
        avg = conn.execute(marks_q, marks_params).fetchone()
        result.append({
            'name':   st['name'],
            'course': st['course'],
            'marks':  avg['avg'] if avg and avg['avg'] else 0,
        })

    result.sort(key=lambda x: x['marks'], reverse=True)
    conn.close()
    return jsonify(result)


# ── GET /api/admin/announcements ─────────────────────────────────────────────
@admin_bp.route('/announcements', methods=['GET'])
@token_required
def list_announcements():

    if request.user_role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    
    conn = get_db()
    rows = conn.execute("""
        SELECT a.*, u.name AS posted_by_name
        FROM announcements a LEFT JOIN users u ON u.id=a.posted_by
        ORDER BY a.date DESC
    """).fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])


# ── POST /api/admin/announcements ────────────────────────────────────────────

import os
from werkzeug.utils import secure_filename

UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), '..', 'uploads', 'announcements')
ALLOWED_EXTENSIONS = {'pdf', 'doc', 'docx', 'jpg', 'png', 'csv', 'txt'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@admin_bp.route('/announcements', methods=['POST'])
@token_required
def post_announcement():
    if request.user_role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403

    # Accept both form-data and JSON
    if request.content_type and request.content_type.startswith('multipart/form-data'):
        data = request.form
        file = request.files.get('attachment')
    else:
        data = request.get_json() or {}
        file = None

    attachment_path = None
    if file and allowed_file(file.filename):
        if not os.path.exists(UPLOAD_FOLDER):
            os.makedirs(UPLOAD_FOLDER)
        filename = secure_filename(file.filename)
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)
        attachment_path = f'uploads/announcements/{filename}'

    conn = get_db()
    conn.execute("""
        INSERT INTO announcements (title, message, type, course, semester, subject, class, posted_by, attachment)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        data.get('title'), data.get('message'), data.get('type', 'Notice'),
        data.get('course'), data.get('semester'), data.get('subject'),
        data.get('class', 'All'), request.user_id, attachment_path
    ))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Posted'}), 201


# ── GET /api/admin/analytics?course=MCA&semester=Sem1&exam_type=CIE1 ───────────────────────
@admin_bp.route('/analytics', methods=['GET'])
@token_required
def analytics():

    if request.user_role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    
    course = request.args.get('course')
    semester = request.args.get('semester')
    exam_type = request.args.get('exam_type')
    conn = get_db()

    # Build query with optional filters
    q = """
    SELECT s.name,
           ROUND(AVG(m.marks),2) as avg_marks,
           ROUND(100.0 * SUM(CASE WHEN m.marks >= 40 THEN 1 ELSE 0 END) / COUNT(*), 1) as pass_rate
    FROM marks m
    JOIN subjects s ON s.id = m.subject_id
    JOIN users u ON u.id = m.student_id
    WHERE 1=1
    """
    params = []
    
    if course:
        q += " AND u.course = ?"
        params.append(course)
    if semester:
        q += " AND u.semester = ?"
        params.append(semester)
    if exam_type:
        q += " AND LOWER(m.exam_type) = LOWER(?)"
        params.append(exam_type)
    
    q += " GROUP BY s.id"
    
    subjects = conn.execute(q, params).fetchall()
    conn.close()

    return jsonify([dict(r) for r in subjects])