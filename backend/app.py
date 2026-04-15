from flask import Flask
from flask_cors import CORS
from database import init_db
from routes.auth import auth_bp
from routes.student import student_bp
from routes.faculty import faculty_bp
from routes.admin import admin_bp

app = Flask(__name__)
app.config['SECRET_KEY'] = 'perfex-jims-secret-2024'

# Allow React on localhost:3000
CORS(app, origins=["http://localhost:3000"], supports_credentials=True)

app.register_blueprint(auth_bp,    url_prefix='/api/auth')
app.register_blueprint(student_bp, url_prefix='/api/student')
app.register_blueprint(faculty_bp, url_prefix='/api/faculty')
app.register_blueprint(admin_bp,   url_prefix='/api/admin')

if __name__ == '__main__':
    init_db()
    app.run(debug=True, port=5000)
