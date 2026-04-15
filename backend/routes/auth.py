from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from database import get_db
from auth_utils import generate_token

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    data     = request.get_json() or {}
    email    = data.get('email', '').strip().lower()
    password = data.get('password', '')
    role     = data.get('role', '')

    if not email or not password or not role:
        return jsonify({'error': 'Email, password and role are required'}), 400

    conn = get_db()
    user = conn.execute("SELECT * FROM users WHERE email=? AND role=?", (email, role)).fetchone()
    conn.close()

    if not user or not check_password_hash(user['password'], password):
        return jsonify({'error': 'Invalid credentials'}), 401

    token = generate_token(user['id'], user['role'])
    return jsonify({
        'token': token,
        'user': {
            'id':          user['id'],
            'name':        user['name'],
            'email':       user['email'],
            'role':        user['role'],
            'enroll':      user['enroll'],
            'course':      user['course'],
            'semester':    user['semester'],
            'section':     user['section'],
            'faculty_id':  user['faculty_id'],
            'department':  user['department'],
            'profileImage':user['profile_image'],
        }
    })


@auth_bp.route('/signup', methods=['POST'])
def signup():
    data     = request.get_json() or {}
    name     = data.get('name', '').strip()
    email    = data.get('email', '').strip().lower()
    password = data.get('password', '')
    role     = data.get('role', 'student')
    enroll   = data.get('enroll', '')
    course   = data.get('course', '')
    semester = data.get('semester', '')

    if not name or not email or not password:
        return jsonify({'error': 'Name, email and password are required'}), 400

    conn = get_db()
    if conn.execute("SELECT id FROM users WHERE email=?", (email,)).fetchone():
        conn.close()
        return jsonify({'error': 'Email already registered'}), 409

    conn.execute(
        "INSERT INTO users (name,email,password,role,enroll,course,semester) VALUES (?,?,?,?,?,?,?)",
        (name, email, generate_password_hash(password), role, enroll or None, course, semester)
    )
    conn.commit()
    conn.close()
    return jsonify({'message': 'Account created successfully'}), 201


@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    # In production: send real email. For college project, just confirm.
    return jsonify({'message': 'If this email exists, a reset link has been sent.'})
