import sqlite3

DB_PATH = 'perfex.db'

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    c = conn.cursor()

    # ── users ────────────────────────────────────────────────────────────────
    # role: 'student' | 'faculty' | 'admin'
    c.execute('''CREATE TABLE IF NOT EXISTS users (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        name        TEXT NOT NULL,
        email       TEXT UNIQUE NOT NULL,
        password    TEXT NOT NULL,
        role        TEXT NOT NULL,
        -- student fields
        enroll      TEXT UNIQUE,
        course      TEXT,
        semester    TEXT,
        section     TEXT,
        -- faculty fields
        faculty_id  TEXT UNIQUE,
        department  TEXT,
        phone       TEXT,
        dob         TEXT,
        gender      TEXT,
        address     TEXT,
        city        TEXT,
        state       TEXT,
        pincode     TEXT,
        profile_image TEXT,
        created_at  TEXT DEFAULT (datetime('now'))
    )''')

    # ── subjects ─────────────────────────────────────────────────────────────
    c.execute('''CREATE TABLE IF NOT EXISTS subjects (
        id       INTEGER PRIMARY KEY AUTOINCREMENT,
        name     TEXT NOT NULL,
        code     TEXT UNIQUE NOT NULL,
        course   TEXT NOT NULL,
        semester TEXT NOT NULL
    )''')

    # ── marks ────────────────────────────────────────────────────────────────
    # exam_type: CIE1 | CIE2 | Internal1 | Internal2 | FULLRESULT
    c.execute('''CREATE TABLE IF NOT EXISTS marks (
        id           INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        subject_id   INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
        exam_type    TEXT NOT NULL,
        marks        REAL NOT NULL,
        max_marks    REAL NOT NULL DEFAULT 100,
        entered_by   INTEGER REFERENCES users(id),
        entered_at   TEXT DEFAULT (datetime('now')),
        UNIQUE(student_id, subject_id, exam_type)
    )''')

    # ── announcements ─────────────────────────────────────────────────────────
    c.execute('''CREATE TABLE IF NOT EXISTS announcements (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        title      TEXT NOT NULL,
        message    TEXT NOT NULL,
        type       TEXT DEFAULT 'Notice',
        course     TEXT,
        semester   TEXT,
        subject    TEXT,
        class      TEXT DEFAULT 'All',
        posted_by  INTEGER REFERENCES users(id),
        date       TEXT DEFAULT (date('now'))
    )''')

    # ── student queries / concerns ────────────────────────────────────────────
    c.execute('''CREATE TABLE IF NOT EXISTS queries (
        id             INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        student_name   TEXT,
        roll_no        TEXT,
        subject        TEXT NOT NULL,
        exam_type      TEXT NOT NULL,
        marks_obtained TEXT,
        description    TEXT NOT NULL,
        status         TEXT DEFAULT 'Pending',
        date           TEXT DEFAULT (date('now'))
    )''')

    conn.commit()
    conn.close()
    print("✅  Database ready — perfex.db")
    _seed()


def _seed():
    from werkzeug.security import generate_password_hash
    conn = get_db()
    c = conn.cursor()

    # Default admin
    if not c.execute("SELECT id FROM users WHERE role='admin'").fetchone():
        c.execute("INSERT INTO users (name,email,password,role,department) VALUES (?,?,?,?,?)",
                  ("Admin", "admin@jims.edu", generate_password_hash("Admin@123"), "admin", "Examination Cell"))
        print("  → Admin:   admin@jims.edu / Admin@123")

    # Default faculty
    if not c.execute("SELECT id FROM users WHERE role='faculty'").fetchone():
        c.execute("""INSERT INTO users (name,email,password,role,faculty_id,department)
                     VALUES (?,?,?,?,?,?)""",
                  ("Dr. Rajesh Kumar", "rajesh@jims.edu",
                   generate_password_hash("Faculty@123"), "faculty", "FAC-2021-001",
                   "Computer Science & Engineering"))
        print("  → Faculty: rajesh@jims.edu / Faculty@123")

    # Default student
    if not c.execute("SELECT id FROM users WHERE role='student'").fetchone():
        c.execute("""INSERT INTO users (name,email,password,role,enroll,course,semester)
                     VALUES (?,?,?,?,?,?,?)""",
                  ("Riya Sharma", "riya@jims.edu",
                   generate_password_hash("Student@123"), "student", "22101", "MCA", "Sem1"))
        print("  → Student: riya@jims.edu / Student@123")

    # Subjects
    subs = [
        ("Database Management Systems", "DBMS101", "MCA", "Sem1"),
        ("Operating Systems",           "OS101",   "MCA", "Sem1"),
        ("Data Structures",             "DS201",   "MCA", "Sem1"),
        ("Computer Networks",           "CN101",   "MCA", "Sem1"),
        ("Artificial Intelligence",     "AI101",   "MCA", "Sem1"),
        ("Java Programming",            "JAVA201",  "MCA", "Sem2"),
        ("Algorithms",                  "ALGO201",  "MCA", "Sem2"),
        ("Software Engineering",        "SE201",    "MCA", "Sem2"),
        ("Web Technology",              "WT201",    "MCA", "Sem2"),
    ]
    for s in subs:
        c.execute("INSERT OR IGNORE INTO subjects (name,code,course,semester) VALUES (?,?,?,?)", s)

    # Sample student marks for Riay Sharma only
    student = c.execute("SELECT id FROM users WHERE email=?", ("riya@jims.edu",)).fetchone()
    if student:
        subject_rows = c.execute("SELECT id, code, semester FROM subjects WHERE course='MCA'").fetchall()
        exam_types = ["CIE1", "CIE2", "Internal1", "Internal2"]

        for subject_index, subject in enumerate(subject_rows):
            semester_offset = {
                'Sem1': 0,
                'Sem2': 4,
                'Sem3': 8,
                'Sem4': 12,
            }.get(subject['semester'], 0)

            for exam_index, exam_type in enumerate(exam_types):
                base_mark = 70 + semester_offset + ((subject_index % 5) * 2)
                exam_adjust = [8, 6, 4, 5][exam_index]
                marks = min(96.0, base_mark + exam_adjust)
                c.execute(
                    "INSERT OR IGNORE INTO marks (student_id, subject_id, exam_type, marks, max_marks) VALUES (?,?,?,?,?)",
                    (student['id'], subject['id'], exam_type, marks, 100.0)
                )

    # Sample announcements
    if not c.execute("SELECT id FROM announcements").fetchone():
        ann = [
            ("CIE1 Results Published", "CIE1 Results uploaded for MCA Sem 1.", "Results", "MCA", "Sem1", "DBMS", "All"),
            ("Important Notice",        "Please submit updated marks within 3 days.", "Notice", "MCA", "Sem1", "OS", "A"),
            ("Exam Schedule",           "CIE2 examinations will be held next week.",  "Schedule","MCA", "Sem2", "DS", "B"),
        ]
        fac = c.execute("SELECT id FROM users WHERE role='faculty'").fetchone()
        fac_id = fac['id'] if fac else None
        for a in ann:
            c.execute("INSERT INTO announcements (title,message,type,course,semester,subject,class,posted_by) VALUES (?,?,?,?,?,?,?,?)",
                      (*a, fac_id))

    conn.commit()
    conn.close()
