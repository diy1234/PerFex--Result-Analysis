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
    conn = get_db()
    
    # Build base query with optional course filter
    student_q = "SELECT COUNT(*) FROM users WHERE role='student'"
    teacher_q = "SELECT COUNT(*) FROM users WHERE role='faculty'"
    if course:
        student_q += f" AND course=?"
        teacher_q += f" AND course=?"
    
    if course:
        total_students = conn.execute(student_q, (course,)).fetchone()[0]
        total_teachers = conn.execute(teacher_q, (course,)).fetchone()[0]
    else:
        total_students = conn.execute(student_q).fetchone()[0]
        total_teachers = conn.execute(teacher_q).fetchone()[0]
    
    data = {
        'total_students':      total_students,
        'total_teachers':      total_teachers,
        'total_subjects':      conn.execute("SELECT COUNT(*) FROM subjects").fetchone()[0],
        'total_announcements': conn.execute("SELECT COUNT(*) FROM announcements").fetchone()[0],
        'marks_entered':       conn.execute("SELECT COUNT(*) FROM marks WHERE student_id IN (SELECT id FROM users WHERE course=?)", (course,)).fetchone()[0] if course else conn.execute("SELECT COUNT(*) FROM marks").fetchone()[0],
        'pending_queries':     conn.execute("SELECT COUNT(*) FROM queries WHERE status='Pending'").fetchone()[0],
    }
    
    avg_marks_q = "SELECT ROUND(AVG(marks),2) FROM marks"
    if course:
        avg_marks_q += " WHERE student_id IN (SELECT id FROM users WHERE course=?)"
        avg_marks = conn.execute(avg_marks_q, (course,)).fetchone()[0]
    else:
        avg_marks = conn.execute(avg_marks_q).fetchone()[0]

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
    q    = "SELECT id,name,email,role,enroll,course,semester,section,faculty_id,department,subject,created_at FROM users WHERE role != 'admin'"
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
            INSERT INTO users (name,email,password,role,enroll,course,semester,section,faculty_id,department,subject)
            VALUES (?,?,?,?,?,?,?,?,?,?,?)
        """, (name, email, generate_password_hash(pwd), role,
              d.get('enroll'), d.get('course'), d.get('semester'),
              d.get('section'), d.get('faculty_id'), d.get('department'), d.get('subject')))
        conn.commit()
    except Exception as e:
        conn.close()
        return jsonify({'error': str(e)}), 409
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


# ── GET /api/admin/leaderboard?course=MCA&session=2024-25 ────────────────────
@admin_bp.route('/leaderboard', methods=['GET'])
@token_required
def leaderboard():

    if request.user_role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    
    course = request.args.get('course', 'MCA')
    conn   = get_db()

    students = conn.execute(
        "SELECT id, name, course FROM users WHERE role='student' AND course=? ORDER BY name",
        (course,)
    ).fetchall()

    result = []
    for st in students:
        avg = conn.execute(
            "SELECT ROUND(AVG(marks),1) AS avg FROM marks WHERE student_id=?",
            (st['id'],)
        ).fetchone()
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
@admin_bp.route('/announcements', methods=['POST'])
@token_required
def post_announcement():

    if request.user_role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    
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
    return jsonify({'message': 'Posted'}), 201


# ── GET /api/admin/analytics ───────────────────────────────────────────────
@admin_bp.route('/analytics', methods=['GET'])
@token_required
def analytics():

    if request.user_role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    
    course = request.args.get('course')
    conn = get_db()

    if course:
        subjects = conn.execute("""
        SELECT s.name,
               ROUND(AVG(m.marks),2) as avg_marks,
               ROUND(100.0 * SUM(CASE WHEN m.marks >= 40 THEN 1 ELSE 0 END) / COUNT(*), 1) as pass_rate
        FROM marks m
        JOIN subjects s ON s.id = m.subject_id
        JOIN users u ON u.id = m.student_id
        WHERE u.course = ?
        GROUP BY s.id
        """, (course,)).fetchall()
    else:
        subjects = conn.execute("""
        SELECT s.name,
               ROUND(AVG(m.marks),2) as avg_marks,
               ROUND(100.0 * SUM(CASE WHEN m.marks >= 40 THEN 1 ELSE 0 END) / COUNT(*), 1) as pass_rate
        FROM marks m
        JOIN subjects s ON s.id = m.subject_id
        GROUP BY s.id
        """).fetchall()

    conn.close()

    return jsonify([dict(r) for r in subjects])