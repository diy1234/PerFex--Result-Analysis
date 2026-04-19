import sqlite3

DB_PATH = 'perfex.db'


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()
    c = conn.cursor()

    # ── users ─────────────────────────────────────────────────────────────────
    # role: 'student' | 'faculty' | 'admin'
    c.execute('''CREATE TABLE IF NOT EXISTS users (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        name          TEXT NOT NULL,
        email         TEXT UNIQUE NOT NULL,
        password      TEXT NOT NULL,
        role          TEXT NOT NULL,
        enroll        TEXT UNIQUE,
        course        TEXT,
        semester      TEXT,
        section       TEXT,
        faculty_id    TEXT UNIQUE,
        department    TEXT,
        phone         TEXT,
        dob           TEXT,
        gender        TEXT,
        address       TEXT,
        city          TEXT,
        state         TEXT,
        pincode       TEXT,
        profile_image TEXT,
        created_at    TEXT DEFAULT (datetime('now'))
    )''')

    # ── subjects ──────────────────────────────────────────────────────────────
    c.execute('''CREATE TABLE IF NOT EXISTS subjects (
        id       INTEGER PRIMARY KEY AUTOINCREMENT,
        name     TEXT NOT NULL,
        code     TEXT UNIQUE NOT NULL,
        course   TEXT NOT NULL,
        semester TEXT NOT NULL
    )''')

    # ── marks ─────────────────────────────────────────────────────────────────
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
        id        INTEGER PRIMARY KEY AUTOINCREMENT,
        title     TEXT NOT NULL,
        message   TEXT NOT NULL,
        type      TEXT DEFAULT 'Notice',
        course    TEXT,
        semester  TEXT,
        subject   TEXT,
        class     TEXT DEFAULT 'All',
        posted_by INTEGER REFERENCES users(id),
        file_path TEXT,
        date      TEXT DEFAULT (date('now'))
    )''')
    
    # ── Add file_path column if it doesn't exist (migration) ────────────────────
    try:
        c.execute("ALTER TABLE announcements ADD COLUMN file_path TEXT")
    except:
        pass  # Column already exists

    # ── Add attachment column if it doesn't exist (migration) ────────────────────
    try:
        c.execute("ALTER TABLE announcements ADD COLUMN attachment TEXT")
    except:
        pass  # Column already exists

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
        reply_message  TEXT,
        status         TEXT DEFAULT 'Pending',
        date           TEXT DEFAULT (date('now'))
    )''')

    try:
        c.execute("ALTER TABLE queries ADD COLUMN reply_message TEXT")
    except:
        pass

    # ── faculty_allocations ───────────────────────────────────────────────────
    # Each row = one teacher teaches one subject to one section in one semester.
    # The same subject taught to Section A and Section B can be (and usually is)
    # a different teacher — enforced by not duplicating (faculty_id, subject_id,
    # course, semester, section).
    c.execute('''CREATE TABLE IF NOT EXISTS faculty_allocations (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        faculty_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
        course     TEXT NOT NULL,
        semester   TEXT NOT NULL,
        section    TEXT,
        UNIQUE(faculty_id, subject_id, course, semester, section)
    )''')

    # ── announcement_reads ────────────────────────────────────────────────────
    # Tracks which student has read which announcement (for unread badge).
    c.execute('''CREATE TABLE IF NOT EXISTS announcement_reads (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        announcement_id INTEGER NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
        read_at         TEXT DEFAULT (datetime('now')),
        UNIQUE(student_id, announcement_id)
    )''')

    conn.commit()
    conn.close()
    print("✅  Database ready — perfex.db")
    _seed()


def _seed():
    from werkzeug.security import generate_password_hash

    conn = get_db()
    c = conn.cursor()

    # ── Skip seeding if data already present ──────────────────────────────────
    if c.execute("SELECT COUNT(*) FROM users").fetchone()[0] > 0:
        conn.close()
        return

    # =========================================================================
    # 1. USERS
    # =========================================================================

    # Admin
    c.execute(
        "INSERT INTO users (name,email,password,role,department) VALUES (?,?,?,?,?)",
        ("Admin", "admin@jims.edu",
         generate_password_hash("Admin@123"), "admin", "Examination Cell")
    )
    # id = 1

    # ── Faculty ───────────────────────────────────────────────────────────────
    # 3 faculty members. Each teaches specific subjects to specific sections.
    # No teacher teaches the same subject to both Section A and Section B.
    faculty = [
        # (name, email, password, faculty_id, department)
        ("Dr. Rajesh Kumar", "rajesh@jims.edu", "Faculty@123",
         "FAC-2021-001", "Computer Science & Engineering"),   # id=2
        ("Dr. Meena Iyer",   "meena@jims.edu",  "Faculty@123",
         "FAC-2021-002", "Computer Science & Engineering"),   # id=13 → will be 3
        ("Dr. Arjun Das",    "arjun@jims.edu",  "Faculty@123",
         "FAC-2021-003", "Computer Science & Engineering"),   # id=14 → will be 4
    ]
    for name, email, pwd, fid, dept in faculty:
        c.execute(
            """INSERT INTO users (name,email,password,role,faculty_id,department)
               VALUES (?,?,?,?,?,?)""",
            (name, email, generate_password_hash(pwd), "faculty", fid, dept)
        )

    # After insert: Rajesh=2, Meena=3, Arjun=4  (fresh DB, sequential IDs)
    rajesh_id = c.execute("SELECT id FROM users WHERE email='rajesh@jims.edu'").fetchone()[0]
    meena_id  = c.execute("SELECT id FROM users WHERE email='meena@jims.edu'").fetchone()[0]
    arjun_id  = c.execute("SELECT id FROM users WHERE email='arjun@jims.edu'").fetchone()[0]

    # ── Students ──────────────────────────────────────────────────────────────
    # Riya Sharma  — currently in Sem2 (has completed Sem1, marks stored for both)
    # All others   — currently in Sem1
    students = [
        # (name, email, enroll, course, semester, section)
        ("Riya Sharma",  "riya@jims.edu",   "22101", "MCA", "Sem2", "A"),  # completed Sem1
        ("Amit Kumar",   "amit@jims.edu",   "22102", "MCA", "Sem1", "A"),
        ("Priya Singh",  "priya@jims.edu",  "22103", "MCA", "Sem1", "A"),
        ("Rahul Verma",  "rahul@jims.edu",  "22104", "MCA", "Sem1", "A"),
        ("Sneha Patel",  "sneha@jims.edu",  "22105", "MCA", "Sem1", "A"),
        ("Vikram Joshi", "vikram@jims.edu", "22106", "MCA", "Sem1", "B"),
        ("Anjali Gupta", "anjali@jims.edu", "22107", "MCA", "Sem1", "B"),
        ("Karan Mehta",  "karan@jims.edu",  "22108", "MCA", "Sem1", "B"),
        ("Neha Sharma",  "neha@jims.edu",   "22109", "MCA", "Sem1", "B"),
        ("Rohit Jain",   "rohit@jims.edu",  "22110", "MCA", "Sem1", "B"),
    ]
    for name, email, enroll, course, sem, section in students:
        c.execute(
            """INSERT INTO users (name,email,password,role,enroll,course,semester,section)
               VALUES (?,?,?,?,?,?,?,?)""",
            (name, email, generate_password_hash("Student@123"),
             "student", enroll, course, sem, section)
        )

    # Fetch student IDs by enroll number (safe regardless of autoincrement value)
    def sid(enroll):
        return c.execute("SELECT id FROM users WHERE enroll=?", (enroll,)).fetchone()[0]

    riya   = sid("22101")
    amit   = sid("22102")
    priya  = sid("22103")
    rahul  = sid("22104")
    sneha  = sid("22105")
    vikram = sid("22106")
    anjali = sid("22107")
    karan  = sid("22108")
    neha   = sid("22109")
    rohit  = sid("22110")

    # =========================================================================
    # 2. SUBJECTS
    # =========================================================================
    subjects_data = [
        ("Database Management Systems", "DBMS101", "MCA", "Sem1"),  # id=1
        ("Operating Systems",           "OS101",   "MCA", "Sem1"),  # id=2
        ("Data Structures",             "DS201",   "MCA", "Sem1"),  # id=3
        ("Computer Networks",           "CN101",   "MCA", "Sem1"),  # id=4
        ("Artificial Intelligence",     "AI101",   "MCA", "Sem1"),  # id=5
        ("Java Programming",            "JAVA201", "MCA", "Sem2"),  # id=6
        ("Algorithms",                  "ALGO201", "MCA", "Sem2"),  # id=7
        ("Software Engineering",        "SE201",   "MCA", "Sem2"),  # id=8
        ("Web Technology",              "WT201",   "MCA", "Sem2"),  # id=9
    ]
    for s in subjects_data:
        c.execute(
            "INSERT OR IGNORE INTO subjects (name,code,course,semester) VALUES (?,?,?,?)", s
        )

    def sub(code):
        return c.execute("SELECT id FROM subjects WHERE code=?", (code,)).fetchone()[0]

    dbms = sub("DBMS101")
    os_  = sub("OS101")
    ds   = sub("DS201")
    cn   = sub("CN101")
    ai   = sub("AI101")
    java = sub("JAVA201")
    algo = sub("ALGO201")
    se   = sub("SE201")
    wt   = sub("WT201")

    # =========================================================================
    # 3. FACULTY ALLOCATIONS
    # ─────────────────────────────────────────────────────────────────────────
    # Rule: each subject is taught by a DIFFERENT teacher to Section A vs B.
    #
    # Subject            Section A        Section B
    # ─────────────────────────────────────────────
    # DBMS      Sem1     Dr. Rajesh       Dr. Arjun
    # OS        Sem1     Dr. Meena        Dr. Rajesh
    # DS        Sem1     Dr. Arjun        Dr. Meena
    # CN        Sem1     Dr. Rajesh       Dr. Meena
    # AI        Sem1     Dr. Meena        Dr. Arjun
    # Java      Sem2     Dr. Rajesh       Dr. Arjun
    # Algorithms Sem2    Dr. Arjun        Dr. Meena
    # SE        Sem2     Dr. Meena        Dr. Rajesh
    # WT        Sem2     Dr. Arjun        Dr. Rajesh
    # =========================================================================
    allocations = [
        # Sem1
        (rajesh_id, dbms, "MCA", "Sem1", "A"),
        (arjun_id,  dbms, "MCA", "Sem1", "B"),
        (meena_id,  os_,  "MCA", "Sem1", "A"),
        (rajesh_id, os_,  "MCA", "Sem1", "B"),
        (arjun_id,  ds,   "MCA", "Sem1", "A"),
        (meena_id,  ds,   "MCA", "Sem1", "B"),
        (rajesh_id, cn,   "MCA", "Sem1", "A"),
        (meena_id,  cn,   "MCA", "Sem1", "B"),
        (meena_id,  ai,   "MCA", "Sem1", "A"),
        (arjun_id,  ai,   "MCA", "Sem1", "B"),
        # Sem2
        (rajesh_id, java, "MCA", "Sem2", "A"),
        (arjun_id,  java, "MCA", "Sem2", "B"),
        (arjun_id,  algo, "MCA", "Sem2", "A"),
        (meena_id,  algo, "MCA", "Sem2", "B"),
        (meena_id,  se,   "MCA", "Sem2", "A"),
        (rajesh_id, se,   "MCA", "Sem2", "B"),
        (arjun_id,  wt,   "MCA", "Sem2", "A"),
        (rajesh_id, wt,   "MCA", "Sem2", "B"),
    ]
    c.executemany(
        """INSERT OR IGNORE INTO faculty_allocations
           (faculty_id, subject_id, course, semester, section) VALUES (?,?,?,?,?)""",
        allocations
    )

    # =========================================================================
    # 4. MARKS
    # ─────────────────────────────────────────────────────────────────────────
    # entered_by = the faculty allocated to that subject+section combination.
    #
    # Riya (Sem2 student, Section A):
    #   Sem1 marks — historical, entered by her Sem1 teachers
    #   Sem2 marks — current, entered by her Sem2 teachers
    # All others (Sem1, Sections A or B):
    #   Sem1 marks only, entered by their respective allocated teachers.
    # =========================================================================
    marks_data = [
        # ── Riya Sharma (Sem1 historical — Section A teachers) ────────────────
        # DBMS: Rajesh teaches DBMS to Sec A
        (riya, dbms, "CIE1",      78.0, 100.0, rajesh_id),
        (riya, dbms, "CIE2",      76.0, 100.0, rajesh_id),
        (riya, dbms, "Internal1", 72.0, 100.0, rajesh_id),
        (riya, dbms, "Internal2", 75.0, 100.0, rajesh_id),
        # OS: Meena teaches OS to Sec A
        (riya, os_,  "CIE1",      82.0, 100.0, meena_id),
        (riya, os_,  "CIE2",      77.0, 100.0, meena_id),
        (riya, os_,  "Internal1", 78.0, 100.0, meena_id),
        (riya, os_,  "Internal2", 84.0, 100.0, meena_id),
        # DS: Arjun teaches DS to Sec A
        (riya, ds,   "CIE1",      84.0, 100.0, arjun_id),
        (riya, ds,   "CIE2",      76.0, 100.0, arjun_id),
        (riya, ds,   "Internal1", 73.0, 100.0, arjun_id),
        (riya, ds,   "Internal2", 82.0, 100.0, arjun_id),
        # CN: Rajesh teaches CN to Sec A
        (riya, cn,   "CIE1",      92.0, 100.0, rajesh_id),
        (riya, cn,   "CIE2",      81.0, 100.0, rajesh_id),
        (riya, cn,   "Internal1", 83.0, 100.0, rajesh_id),
        (riya, cn,   "Internal2", 82.0, 100.0, rajesh_id),
        # AI: Meena teaches AI to Sec A
        (riya, ai,   "CIE1",      88.0, 100.0, meena_id),
        (riya, ai,   "CIE2",      80.0, 100.0, meena_id),
        (riya, ai,   "Internal1", 79.0, 100.0, meena_id),
        (riya, ai,   "Internal2", 87.0, 100.0, meena_id),

        # ── Riya Sharma (Sem2 current — Section A teachers) ───────────────────
        # Java: Rajesh teaches Java to Sec A
        (riya, java, "CIE1",      90.0, 100.0, rajesh_id),
        (riya, java, "CIE2",      87.0, 100.0, rajesh_id),
        (riya, java, "Internal1", 82.0, 100.0, rajesh_id),
        (riya, java, "Internal2", 84.0, 100.0, rajesh_id),
        # Algorithms: Arjun teaches Algo to Sec A
        (riya, algo, "CIE1",      84.0, 100.0, arjun_id),
        (riya, algo, "CIE2",      81.0, 100.0, arjun_id),
        (riya, algo, "Internal1", 78.0, 100.0, arjun_id),
        (riya, algo, "Internal2", 80.0, 100.0, arjun_id),
        # SE: Meena teaches SE to Sec A
        (riya, se,   "CIE1",      90.0, 100.0, meena_id),
        (riya, se,   "CIE2",      89.0, 100.0, meena_id),
        (riya, se,   "Internal1", 89.0, 100.0, meena_id),
        (riya, se,   "Internal2", 92.0, 100.0, meena_id),
        # WT: Arjun teaches WT to Sec A
        (riya, wt,   "CIE1",      90.0, 100.0, arjun_id),
        (riya, wt,   "CIE2",      93.0, 100.0, arjun_id),
        (riya, wt,   "Internal1", 87.0, 100.0, arjun_id),
        (riya, wt,   "Internal2", 93.0, 100.0, arjun_id),

        # ── Amit Kumar  (Sem1, Section A) ─────────────────────────────────────
        (amit, dbms, "CIE1",      78.0, 100.0, rajesh_id),
        (amit, dbms, "CIE2",      72.0, 100.0, rajesh_id),
        (amit, dbms, "Internal1", 74.0, 100.0, rajesh_id),
        (amit, dbms, "Internal2", 74.0, 100.0, rajesh_id),
        (amit, os_,  "CIE1",      77.0, 100.0, meena_id),
        (amit, os_,  "CIE2",      76.0, 100.0, meena_id),
        (amit, os_,  "Internal1", 78.0, 100.0, meena_id),
        (amit, os_,  "Internal2", 80.0, 100.0, meena_id),
        (amit, ds,   "CIE1",      78.0, 100.0, arjun_id),
        (amit, ds,   "CIE2",      73.0, 100.0, arjun_id),
        (amit, ds,   "Internal1", 72.0, 100.0, arjun_id),
        (amit, ds,   "Internal2", 77.0, 100.0, arjun_id),
        (amit, cn,   "CIE1",      83.0, 100.0, rajesh_id),
        (amit, cn,   "CIE2",      80.0, 100.0, rajesh_id),
        (amit, cn,   "Internal1", 83.0, 100.0, rajesh_id),
        (amit, cn,   "Internal2", 81.0, 100.0, rajesh_id),
        (amit, ai,   "CIE1",      84.0, 100.0, meena_id),
        (amit, ai,   "CIE2",      81.0, 100.0, meena_id),
        (amit, ai,   "Internal1", 78.0, 100.0, meena_id),
        (amit, ai,   "Internal2", 77.0, 100.0, meena_id),

        # ── Priya Singh  (Sem1, Section A) ────────────────────────────────────
        (priya, dbms, "CIE1",      93.0, 100.0, rajesh_id),
        (priya, dbms, "CIE2",      91.0, 100.0, rajesh_id),
        (priya, dbms, "Internal1", 82.0, 100.0, rajesh_id),
        (priya, dbms, "Internal2", 90.0, 100.0, rajesh_id),
        (priya, os_,  "CIE1",      92.0, 100.0, meena_id),
        (priya, os_,  "CIE2",      96.0, 100.0, meena_id),
        (priya, os_,  "Internal1", 90.0, 100.0, meena_id),
        (priya, os_,  "Internal2", 94.0, 100.0, meena_id),
        (priya, ds,   "CIE1",      91.0, 100.0, arjun_id),
        (priya, ds,   "CIE2",      86.0, 100.0, arjun_id),
        (priya, ds,   "Internal1", 83.0, 100.0, arjun_id),
        (priya, ds,   "Internal2", 89.0, 100.0, arjun_id),
        (priya, cn,   "CIE1",      98.0, 100.0, rajesh_id),
        (priya, cn,   "CIE2",      94.0, 100.0, rajesh_id),
        (priya, cn,   "Internal1", 94.0, 100.0, rajesh_id),
        (priya, cn,   "Internal2", 95.0, 100.0, rajesh_id),
        (priya, ai,   "CIE1",      98.0, 100.0, meena_id),
        (priya, ai,   "CIE2",      94.0, 100.0, meena_id),
        (priya, ai,   "Internal1", 95.0, 100.0, meena_id),
        (priya, ai,   "Internal2", 96.0, 100.0, meena_id),

        # ── Rahul Verma  (Sem1, Section A) ────────────────────────────────────
        (rahul, dbms, "CIE1",      51.0, 100.0, rajesh_id),
        (rahul, dbms, "CIE2",      51.0, 100.0, rajesh_id),
        (rahul, dbms, "Internal1", 49.0, 100.0, rajesh_id),
        (rahul, dbms, "Internal2", 50.0, 100.0, rajesh_id),
        (rahul, os_,  "CIE1",      58.0, 100.0, meena_id),
        (rahul, os_,  "CIE2",      52.0, 100.0, meena_id),
        (rahul, os_,  "Internal1", 51.0, 100.0, meena_id),
        (rahul, os_,  "Internal2", 60.0, 100.0, meena_id),
        (rahul, ds,   "CIE1",      54.0, 100.0, arjun_id),
        (rahul, ds,   "CIE2",      50.0, 100.0, arjun_id),
        (rahul, ds,   "Internal1", 53.0, 100.0, arjun_id),
        (rahul, ds,   "Internal2", 55.0, 100.0, arjun_id),
        (rahul, cn,   "CIE1",      63.0, 100.0, rajesh_id),
        (rahul, cn,   "CIE2",      64.0, 100.0, rajesh_id),
        (rahul, cn,   "Internal1", 57.0, 100.0, rajesh_id),
        (rahul, cn,   "Internal2", 62.0, 100.0, rajesh_id),
        (rahul, ai,   "CIE1",      56.0, 100.0, meena_id),
        (rahul, ai,   "CIE2",      56.0, 100.0, meena_id),
        (rahul, ai,   "Internal1", 51.0, 100.0, meena_id),
        (rahul, ai,   "Internal2", 59.0, 100.0, meena_id),

        # ── Sneha Patel  (Sem1, Section A) ────────────────────────────────────
        (sneha, dbms, "CIE1",      70.0, 100.0, rajesh_id),
        (sneha, dbms, "CIE2",      65.0, 100.0, rajesh_id),
        (sneha, dbms, "Internal1", 60.0, 100.0, rajesh_id),
        (sneha, dbms, "Internal2", 65.0, 100.0, rajesh_id),
        (sneha, os_,  "CIE1",      74.0, 100.0, meena_id),
        (sneha, os_,  "CIE2",      69.0, 100.0, meena_id),
        (sneha, os_,  "Internal1", 71.0, 100.0, meena_id),
        (sneha, os_,  "Internal2", 73.0, 100.0, meena_id),
        (sneha, ds,   "CIE1",      73.0, 100.0, arjun_id),
        (sneha, ds,   "CIE2",      65.0, 100.0, arjun_id),
        (sneha, ds,   "Internal1", 65.0, 100.0, arjun_id),
        (sneha, ds,   "Internal2", 66.0, 100.0, arjun_id),
        (sneha, cn,   "CIE1",      77.0, 100.0, rajesh_id),
        (sneha, cn,   "CIE2",      79.0, 100.0, rajesh_id),
        (sneha, cn,   "Internal1", 77.0, 100.0, rajesh_id),
        (sneha, cn,   "Internal2", 76.0, 100.0, rajesh_id),
        (sneha, ai,   "CIE1",      77.0, 100.0, meena_id),
        (sneha, ai,   "CIE2",      74.0, 100.0, meena_id),
        (sneha, ai,   "Internal1", 71.0, 100.0, meena_id),
        (sneha, ai,   "Internal2", 72.0, 100.0, meena_id),

        # ── Vikram Joshi  (Sem1, Section B) ───────────────────────────────────
        # Section B teachers: DBMS→Arjun, OS→Rajesh, DS→Meena, CN→Meena, AI→Arjun
        (vikram, dbms, "CIE1",      84.0, 100.0, arjun_id),
        (vikram, dbms, "CIE2",      87.0, 100.0, arjun_id),
        (vikram, dbms, "Internal1", 84.0, 100.0, arjun_id),
        (vikram, dbms, "Internal2", 81.0, 100.0, arjun_id),
        (vikram, os_,  "CIE1",      87.0, 100.0, rajesh_id),
        (vikram, os_,  "CIE2",      85.0, 100.0, rajesh_id),
        (vikram, os_,  "Internal1", 84.0, 100.0, rajesh_id),
        (vikram, os_,  "Internal2", 87.0, 100.0, rajesh_id),
        (vikram, ds,   "CIE1",      90.0, 100.0, meena_id),
        (vikram, ds,   "CIE2",      82.0, 100.0, meena_id),
        (vikram, ds,   "Internal1", 85.0, 100.0, meena_id),
        (vikram, ds,   "Internal2", 88.0, 100.0, meena_id),
        (vikram, cn,   "CIE1",      98.0, 100.0, meena_id),
        (vikram, cn,   "CIE2",      97.0, 100.0, meena_id),
        (vikram, cn,   "Internal1", 91.0, 100.0, meena_id),
        (vikram, cn,   "Internal2", 98.0, 100.0, meena_id),
        (vikram, ai,   "CIE1",      89.0, 100.0, arjun_id),
        (vikram, ai,   "CIE2",      87.0, 100.0, arjun_id),
        (vikram, ai,   "Internal1", 92.0, 100.0, arjun_id),
        (vikram, ai,   "Internal2", 91.0, 100.0, arjun_id),

        # ── Anjali Gupta  (Sem1, Section B) ───────────────────────────────────
        (anjali, dbms, "CIE1",      44.0, 100.0, arjun_id),
        (anjali, dbms, "CIE2",      37.0, 100.0, arjun_id),
        (anjali, dbms, "Internal1", 38.0, 100.0, arjun_id),
        (anjali, dbms, "Internal2", 43.0, 100.0, arjun_id),
        (anjali, os_,  "CIE1",      46.0, 100.0, rajesh_id),
        (anjali, os_,  "CIE2",      48.0, 100.0, rajesh_id),
        (anjali, os_,  "Internal1", 39.0, 100.0, rajesh_id),
        (anjali, os_,  "Internal2", 46.0, 100.0, rajesh_id),
        (anjali, ds,   "CIE1",      49.0, 100.0, meena_id),
        (anjali, ds,   "CIE2",      40.0, 100.0, meena_id),
        (anjali, ds,   "Internal1", 44.0, 100.0, meena_id),
        (anjali, ds,   "Internal2", 40.0, 100.0, meena_id),
        (anjali, cn,   "CIE1",      53.0, 100.0, meena_id),
        (anjali, cn,   "CIE2",      54.0, 100.0, meena_id),
        (anjali, cn,   "Internal1", 47.0, 100.0, meena_id),
        (anjali, cn,   "Internal2", 49.0, 100.0, meena_id),
        (anjali, ai,   "CIE1",      51.0, 100.0, arjun_id),
        (anjali, ai,   "CIE2",      45.0, 100.0, arjun_id),
        (anjali, ai,   "Internal1", 49.0, 100.0, arjun_id),
        (anjali, ai,   "Internal2", 52.0, 100.0, arjun_id),

        # ── Karan Mehta  (Sem1, Section B) ────────────────────────────────────
        (karan, dbms, "CIE1",      69.0, 100.0, arjun_id),
        (karan, dbms, "CIE2",      71.0, 100.0, arjun_id),
        (karan, dbms, "Internal1", 71.0, 100.0, arjun_id),
        (karan, dbms, "Internal2", 67.0, 100.0, arjun_id),
        (karan, os_,  "CIE1",      75.0, 100.0, rajesh_id),
        (karan, os_,  "CIE2",      76.0, 100.0, rajesh_id),
        (karan, os_,  "Internal1", 73.0, 100.0, rajesh_id),
        (karan, os_,  "Internal2", 75.0, 100.0, rajesh_id),
        (karan, ds,   "CIE1",      71.0, 100.0, meena_id),
        (karan, ds,   "CIE2",      71.0, 100.0, meena_id),
        (karan, ds,   "Internal1", 67.0, 100.0, meena_id),
        (karan, ds,   "Internal2", 70.0, 100.0, meena_id),
        (karan, cn,   "CIE1",      86.0, 100.0, meena_id),
        (karan, cn,   "CIE2",      77.0, 100.0, meena_id),
        (karan, cn,   "Internal1", 82.0, 100.0, meena_id),
        (karan, cn,   "Internal2", 79.0, 100.0, meena_id),
        (karan, ai,   "CIE1",      78.0, 100.0, arjun_id),
        (karan, ai,   "CIE2",      80.0, 100.0, arjun_id),
        (karan, ai,   "Internal1", 79.0, 100.0, arjun_id),
        (karan, ai,   "Internal2", 76.0, 100.0, arjun_id),

        # ── Neha Sharma  (Sem1, Section B) ────────────────────────────────────
        (neha, dbms, "CIE1",      80.0, 100.0, arjun_id),
        (neha, dbms, "CIE2",      81.0, 100.0, arjun_id),
        (neha, dbms, "Internal1", 77.0, 100.0, arjun_id),
        (neha, dbms, "Internal2", 77.0, 100.0, arjun_id),
        (neha, os_,  "CIE1",      89.0, 100.0, rajesh_id),
        (neha, os_,  "CIE2",      81.0, 100.0, rajesh_id),
        (neha, os_,  "Internal1", 80.0, 100.0, rajesh_id),
        (neha, os_,  "Internal2", 85.0, 100.0, rajesh_id),
        (neha, ds,   "CIE1",      83.0, 100.0, meena_id),
        (neha, ds,   "CIE2",      82.0, 100.0, meena_id),
        (neha, ds,   "Internal1", 81.0, 100.0, meena_id),
        (neha, ds,   "Internal2", 83.0, 100.0, meena_id),
        (neha, cn,   "CIE1",      87.0, 100.0, meena_id),
        (neha, cn,   "CIE2",      86.0, 100.0, meena_id),
        (neha, cn,   "Internal1", 84.0, 100.0, meena_id),
        (neha, cn,   "Internal2", 85.0, 100.0, meena_id),
        (neha, ai,   "CIE1",      88.0, 100.0, arjun_id),
        (neha, ai,   "CIE2",      80.0, 100.0, arjun_id),
        (neha, ai,   "Internal1", 86.0, 100.0, arjun_id),
        (neha, ai,   "Internal2", 84.0, 100.0, arjun_id),

        # ── Rohit Jain  (Sem1, Section B) ─────────────────────────────────────
        (rohit, dbms, "CIE1",      57.0, 100.0, arjun_id),
        (rohit, dbms, "CIE2",      51.0, 100.0, arjun_id),
        (rohit, dbms, "Internal1", 50.0, 100.0, arjun_id),
        (rohit, dbms, "Internal2", 52.0, 100.0, arjun_id),
        (rohit, os_,  "CIE1",      62.0, 100.0, rajesh_id),
        (rohit, os_,  "CIE2",      57.0, 100.0, rajesh_id),
        (rohit, os_,  "Internal1", 54.0, 100.0, rajesh_id),
        (rohit, os_,  "Internal2", 62.0, 100.0, rajesh_id),
        (rohit, ds,   "CIE1",      57.0, 100.0, meena_id),
        (rohit, ds,   "CIE2",      61.0, 100.0, meena_id),
        (rohit, ds,   "Internal1", 54.0, 100.0, meena_id),
        (rohit, ds,   "Internal2", 58.0, 100.0, meena_id),
        (rohit, cn,   "CIE1",      71.0, 100.0, meena_id),
        (rohit, cn,   "CIE2",      64.0, 100.0, meena_id),
        (rohit, cn,   "Internal1", 67.0, 100.0, meena_id),
        (rohit, cn,   "Internal2", 64.0, 100.0, meena_id),
        (rohit, ai,   "CIE1",      68.0, 100.0, arjun_id),
        (rohit, ai,   "CIE2",      61.0, 100.0, arjun_id),
        (rohit, ai,   "Internal1", 63.0, 100.0, arjun_id),
        (rohit, ai,   "Internal2", 65.0, 100.0, arjun_id),
    ]
    c.executemany(
        """INSERT OR IGNORE INTO marks
           (student_id, subject_id, exam_type, marks, max_marks, entered_by)
           VALUES (?,?,?,?,?,?)""",
        marks_data
    )

    # =========================================================================
    # 5. ANNOUNCEMENTS
    # =========================================================================
    announcements = [
        ("CIE1 Results Published",
         "CIE1 Results have been uploaded for MCA Semester 1. Please check your result in the Student Dashboard.",
         "Results", "MCA", "Sem1", "All Subjects", "All", rajesh_id),

        ("Important Notice",
         "All faculty must submit updated marks within 3 working days. Delays will affect student reports.",
         "Notice", "MCA", "Sem1", "OS", "A", rajesh_id),

        ("CIE2 Exam Schedule",
         "CIE2 examinations will be held from next week. Time tables have been shared with respective sections.",
         "Schedule", "MCA", "Sem1", "All Subjects", "All", rajesh_id),

        ("Lab Submissions Due",
         "Data Structures lab submissions are due by end of this week. Incomplete submissions will not be graded.",
         "Notice", "MCA", "Sem1", "DS", "B", rajesh_id),

        ("Project Guidelines",
         "AI project guidelines and rubric have been uploaded. Please review before the submission deadline.",
         "Notice", "MCA", "Sem1", "AI", "All", rajesh_id),
    ]
    c.executemany(
        """INSERT OR IGNORE INTO announcements
           (title, message, type, course, semester, subject, class, posted_by)
           VALUES (?,?,?,?,?,?,?,?)""",
        announcements
    )

    # =========================================================================
    # 6. SAMPLE QUERY (student concern)
    # =========================================================================
    c.execute(
        """INSERT OR IGNORE INTO queries
           (student_id, student_name, roll_no, subject, exam_type,
            marks_obtained, description, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
        (riya, "Riya Sharma", "22101",
         "Database Management Systems", "CIE1", "78",
         "I believe my answer for Question 4 was correct but marks were not awarded. Please review.",
         "Pending")
    )

    conn.commit()
    conn.close()
    print("✅  Seed data inserted successfully")
    print("   Admin   : admin@jims.edu   / Admin@123")
    print("   Faculty : rajesh@jims.edu  / Faculty@123")
    print("   Faculty : meena@jims.edu   / Faculty@123")
    print("   Faculty : arjun@jims.edu   / Faculty@123")
    print("   Students: riya/amit/priya/rahul/sneha/vikram/anjali/karan/neha/rohit @jims.edu / Student@123")