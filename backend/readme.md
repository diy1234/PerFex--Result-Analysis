cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python app.py


| Role    | Email              | Password     |
|---------|--------------------|--------------|
| Admin   | admin@jims.edu     | Admin@123    |
| Faculty | rajesh@jims.edu    | Faculty@123  |
| Student | riya@jims.edu      | Student@123  |
rajesh@jims.edu / Faculty@123
meena@jims.edu / Faculty@123
arjun@jims.edu / Faculty@123

## All API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/signup` | Signup |
| GET/PUT | `/api/student/profile` | Student profile |
| GET | `/api/student/marks` | Marks by semester/exam |
| GET | `/api/student/marks/summary` | Summary for charts |
| GET | `/api/student/announcements` | Filtered announcements |
| GET/POST | `/api/student/concerns` | Student queries |
| GET/PUT | `/api/faculty/profile` | Faculty profile |
| GET | `/api/faculty/students` | Students list |
| GET | `/api/faculty/subjects` | Subjects list |
| GET/POST | `/api/faculty/marks` | View/enter marks |
| POST | `/api/faculty/marks/bulk` | Bulk save |
| GET | `/api/faculty/class-results` | Full results table |
| GET/POST/DELETE | `/api/faculty/announcements` | Announcements |
| GET | `/api/faculty/queries` | Student concerns |
| PUT | `/api/faculty/queries/:id/resolve` | Resolve query |
| GET | `/api/admin/stats` | Dashboard stats |
| GET/POST/DELETE | `/api/admin/users` | Manage users |
| GET/POST/DELETE | `/api/admin/subjects` | Manage subjects |
| GET | `/api/admin/leaderboard` | Leaderboard data |
| GET/POST | `/api/admin/announcements` | Announcements |