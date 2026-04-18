import React, { useState, useEffect } from "react";
import "./Students.css";
import { adminAPI } from "../api";

function Students() {

  // ✅ Updated: Empty initial state
  const [students, setStudents] = useState([]);

  const [search, setSearch] = useState("");
  const [uploadStatus, setUploadStatus] = useState("");

  // ✅ NEW: Fetch students from backend
  useEffect(() => {
    adminAPI.getUsers({ role: "student" }).then(setStudents);
  }, []);

  // ✅ Updated: Delete using API
  const deleteStudent = async (id) => {
    await adminAPI.deleteUser(id);
    setStudents(students.filter(s => s.id !== id));
  };

  // ✅ NEW: Handle file upload for bulk students
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const lines = reader.result.trim().split('\n');
        if (lines.length === 0) {
          setUploadStatus('❌ Empty file');
          return;
        }

        // Parse CSV (first line is header)
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const enrollIdx = headers.indexOf('enroll');
        const nameIdx = headers.indexOf('name');
        const courseIdx = headers.indexOf('course');
        const semesterIdx = headers.indexOf('semester');

        if (enrollIdx === -1 || nameIdx === -1) {
          setUploadStatus('❌ CSV must have enroll and name columns');
          return;
        }

        const studentsList = [];
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map(c => c.trim());
          if (cols[0]) {
            studentsList.push({
              enroll: cols[enrollIdx],
              name: cols[nameIdx],
              course: cols[courseIdx] || 'N/A',
              semester: cols[semesterIdx] || '1',
              role: 'student'
            });
          }
        }

        // Bulk upload
        for (const student of studentsList) {
          await adminAPI.createUser(student);
        }

        const updated = await adminAPI.getUsers({ role: "student" });
        setStudents(updated);
        setUploadStatus(`✔ ${studentsList.length} students uploaded successfully`);
        setTimeout(() => setUploadStatus(''), 3000);
      } catch (err) {
        console.error('File upload error:', err);
        setUploadStatus('❌ Error uploading file');
      }
    };
    reader.readAsText(file);
  };

  // Search filter
  const filteredStudents = students.filter((student) =>
    student.name?.toLowerCase().includes(search.toLowerCase()) ||
    student.enroll?.includes(search)
  );

  return (
    <div className="students-page">

      <h2>Manage Students</h2>

      {/* File Upload */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', alignItems: 'center' }}>
        <input
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
          id="student-file-input"
        />
        <label
          htmlFor="student-file-input"
          style={{
            padding: '10px 20px',
            background: '#3b82f6',
            color: '#fff',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '14px',
            border: 'none'
          }}
        >
          📁 Choose File
        </label>
        {uploadStatus && (
          <span style={{ fontSize: '14px', fontWeight: '500' }}>
            {uploadStatus}
          </span>
        )}
      </div>

      {/* Search Bar */}
      <div className="search-box">

        <input
          type="text"
          placeholder="Search student..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

      </div>

      {/* Student Table */}
      <table className="student-table">

        <thead>
          <tr>
            <th>Enrollment</th>
            <th>Name</th>
            <th>Course</th>
            <th>Semester</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>

          {filteredStudents.map((student) => (

            <tr key={student.id}>

              <td>{student.enroll}</td>
              <td>{student.name}</td>
              <td>{student.course}</td>
              <td>{student.semester}</td>

              <td>
                <button
                  className="delete-btn"
                  onClick={() => deleteStudent(student.id)}
                >
                  Delete
                </button>
              </td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>
  );
}

export default Students;