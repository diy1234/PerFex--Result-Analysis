from flask import Blueprint, request, jsonify, send_file
from database import get_db
from auth_utils import token_required
import os

student_bp = Blueprint('student', __name__)


def _ensure_announcement_reads_table(conn):
    conn.execute('''CREATE TABLE IF NOT EXISTS announcement_reads (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        announcement_id INTEGER NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
        read_at         TEXT DEFAULT (datetime('now')),
        UNIQUE(student_id, announcement_id)
    )''')


# ── GET /api/student/profile ─────────────────────────────────────────────────
@student_bp.route('/profile', methods=['GET'])
@token_required
def get_profile():
    conn = get_db()
    u = conn.execute("SELECT * FROM users WHERE id=?", (request.user_id,)).fetchone()
    conn.close()
    if not u:
        return jsonify({'error': 'Not found'}), 404
    return jsonify({
        'id': u['id'], 'name': u['name'], 'email': u['email'],
        'enroll': u['enroll'], 'course': u['course'], 'semester': u['semester'],
        'phone': u['phone'], 'dob': u['dob'], 'gender': u['gender'],
        'address': u['address'], 'city': u['city'], 'state': u['state'],
        'pincode': u['pincode'], 'profileImage': u['profile_image'],
    })


# ── PUT /api/student/profile ─────────────────────────────────────────────────
@student_bp.route('/profile', methods=['PUT'])
@token_required
def update_profile():
    data = request.get_json() or {}
    conn = get_db()
    conn.execute("""
        UPDATE users SET name=?, phone=?, dob=?, gender=?,
            address=?, city=?, state=?, pincode=?, profile_image=?
        WHERE id=?
    """, (
        data.get('name'), data.get('phone'), data.get('dob'), data.get('gender'),
        data.get('address'), data.get('city'), data.get('state'),
        data.get('pincode'), data.get('profileImage'), request.user_id
    ))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Profile updated'})


# ── GET /api/student/marks?semester=Sem1&exam_type=CIE1 ──────────────────────
@student_bp.route('/marks', methods=['GET'])
@token_required
def get_marks():
    sem       = request.args.get('semester')
    exam_type = request.args.get('exam_type')

    query  = """
        SELECT s.name AS subject, s.semester, m.exam_type,
               m.marks, m.max_marks,
               ROUND(m.marks * 100.0 / m.max_marks, 1) AS pct
        FROM marks m
        JOIN subjects s ON s.id = m.subject_id
        WHERE m.student_id = ?
    """
    params = [request.user_id]

    if sem:
        query += " AND s.semester = ?"
        params.append(sem)
    if exam_type:
        query += " AND m.exam_type = ?"
        params.append(exam_type)

    query += " ORDER BY s.semester, s.name, m.exam_type"

    conn = get_db()
    rows = conn.execute(query, params).fetchall()

    if exam_type and not rows and exam_type != "FULLRESULT":
        params[-1] = "FULLRESULT"
        rows = conn.execute(query, params).fetchall()

    conn.close()
    return jsonify([dict(r) for r in rows])


# ── GET /api/student/marks/summary ───────────────────────────────────────────
@student_bp.route('/marks/summary', methods=['GET'])
@token_required
def marks_summary():
    conn = get_db()
    rows = conn.execute("""
        SELECT s.name AS subject, s.semester,
               ROUND(AVG(m.marks*100.0/m.max_marks),1) AS avg_pct,
               MAX(m.marks) AS highest, MIN(m.marks) AS lowest
        FROM marks m JOIN subjects s ON s.id = m.subject_id
        WHERE m.student_id = ?
        GROUP BY m.subject_id
    """, (request.user_id,)).fetchall()

    overall = conn.execute("""
        SELECT ROUND(AVG(m.marks*100.0/m.max_marks),1) AS avg
        FROM marks m WHERE m.student_id=?
    """, (request.user_id,)).fetchone()
    conn.close()

    return jsonify({
        'subjects': [dict(r) for r in rows],
        'overall_pct': overall['avg'] if overall else None
    })


# ── GET /api/student/announcements ───────────────────────────────────────────
@student_bp.route('/announcements', methods=['GET'])
@token_required
def get_announcements():
    conn = get_db()
    _ensure_announcement_reads_table(conn)

    student = conn.execute("SELECT course, semester FROM users WHERE id=?",
                           (request.user_id,)).fetchone()
    course   = student['course']   if student else ''
    semester = student['semester'] if student else ''
    semestreq = semester.lower().replace('sem', '').strip()

    rows = conn.execute("""
        SELECT a.*, a.class AS section, u.name AS posted_by_name,
               CASE WHEN ar.id IS NOT NULL THEN 1 ELSE 0 END AS read
        FROM announcements a
        LEFT JOIN users u ON u.id = a.posted_by
        LEFT JOIN announcement_reads ar
               ON ar.announcement_id = a.id AND ar.student_id = ?
        WHERE (a.course IS NULL OR a.course=? OR a.course='All')
          AND (
                a.semester IS NULL
             OR a.semester=?
             OR a.semester='All'
             OR LOWER(REPLACE(a.semester, 'Sem', '')) = ?
          )
        ORDER BY a.date DESC
    """, (request.user_id, course, semester, semestreq)).fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])


# ── POST /api/student/announcements/<id>/read ─────────────────────────────────
@student_bp.route('/announcements/<int:ann_id>/read', methods=['POST'])
@token_required
def mark_announcement_read(ann_id):
    conn = get_db()
    _ensure_announcement_reads_table(conn)
    conn.execute("""
        INSERT INTO announcement_reads (student_id, announcement_id, read_at)
        VALUES (?, ?, datetime('now'))
        ON CONFLICT(student_id, announcement_id) DO UPDATE SET read_at = excluded.read_at
    """, (request.user_id, ann_id))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Announcement marked read'})


# ── POST /api/student/announcements/read-all ─────────────────────────────────
@student_bp.route('/announcements/read-all', methods=['POST'])
@token_required
def mark_all_announcements_read():
    conn = get_db()
    _ensure_announcement_reads_table(conn)

    student = conn.execute("SELECT course, semester FROM users WHERE id=?",
                           (request.user_id,)).fetchone()
    course   = student['course']   if student else ''
    semester = student['semester'] if student else ''

    semestreq = semester.lower().replace('sem', '').strip()
    ids = conn.execute("""
        SELECT a.id
        FROM announcements a
        WHERE (a.course IS NULL OR a.course=? OR a.course='All')
          AND (
                a.semester IS NULL
             OR a.semester=?
             OR a.semester='All'
             OR LOWER(REPLACE(a.semester, 'Sem', '')) = ?
          )
    """, (course, semester, semestreq)).fetchall()

    for row in ids:
        conn.execute("""
            INSERT INTO announcement_reads (student_id, announcement_id, read_at)
            VALUES (?, ?, datetime('now'))
            ON CONFLICT(student_id, announcement_id) DO UPDATE SET read_at = excluded.read_at
        """, (request.user_id, row['id']))

    conn.commit()
    conn.close()
    return jsonify({'message': 'All announcements marked read'})


# ── GET /api/student/announcements/<id>/download ─────────────────────────────
@student_bp.route('/announcements/<int:ann_id>/download', methods=['GET'])
@token_required
def download_announcement_file(ann_id):
    conn = get_db()
    ann = conn.execute("SELECT attachment FROM announcements WHERE id=?", (ann_id,)).fetchone()
    conn.close()
    
    if not ann or not ann['attachment']:
        return jsonify({'error': 'File not found'}), 404
    
    file_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ann['attachment'])
    if not os.path.exists(file_path):
        return jsonify({'error': 'File not found'}), 404
    
    return send_file(file_path, as_attachment=True)


# ── POST /api/student/concerns ────────────────────────────────────────────────
@student_bp.route('/concerns', methods=['POST'])
@token_required
def post_concern():
    data = request.get_json() or {}
    conn = get_db()

    student = conn.execute("SELECT name, enroll FROM users WHERE id=?",
                           (request.user_id,)).fetchone()

    conn.execute("""
        INSERT INTO queries (student_id, student_name, roll_no, subject, exam_type, marks_obtained, description)
        VALUES (?,?,?,?,?,?,?)
    """, (
        request.user_id,
        student['name']   if student else '',
        student['enroll'] if student else '',
        data.get('subject', ''),
        data.get('examType', 'CIE1'),
        data.get('marksObtained', ''),
        data.get('description', ''),
    ))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Concern submitted'}), 201


# ── GET /api/student/concerns ─────────────────────────────────────────────────
@student_bp.route('/concerns', methods=['GET'])
@token_required
def get_concerns():
    conn = get_db()
    rows = conn.execute("""
        SELECT id, student_id, student_name, roll_no, subject, exam_type,
               marks_obtained AS marksObtained, description AS query, reply_message, status, date
        FROM queries
        WHERE student_id=?
        ORDER BY date DESC
    """, (request.user_id,)).fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])
