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

        // Parse CSV (first line is header) - case insensitive
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const enrollIdx = headers.indexOf('enroll');
        const nameIdx = headers.indexOf('name');
        const courseIdx = headers.indexOf('course');
        const semesterIdx = headers.indexOf('semester');
        const emailIdx = headers.findIndex(h => h === 'mail' || h === 'email');
        const sectionIdx = headers.indexOf('section');

        console.log('CSV Headers:', headers);
        console.log('Index positions:', { enrollIdx, nameIdx, courseIdx, semesterIdx, emailIdx, sectionIdx });

        if (enrollIdx === -1 || nameIdx === -1 || emailIdx === -1) {
          setUploadStatus('❌ CSV must have enroll, name, and email (or mail) columns');
          return;
        }

        const studentsList = [];
        const errors = [];

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue; // Skip empty lines
          
          const cols = line.split(',').map(c => c.trim());
          if (!cols[0]) continue; // Skip rows with no enrollment number
          
          const enroll = cols[enrollIdx];
          const name = cols[nameIdx];
          const email = cols[emailIdx];
          const course = cols[courseIdx] || 'MCA';
          const semester = cols[semesterIdx] || '1';
          const section = cols[sectionIdx] || 'A';

          if (!email) {
            errors.push(`Row ${i}: Missing email for student ${enroll}`);
            continue;
          }

          studentsList.push({
            enroll,
            name,
            email,
            course,
            semester: `Sem${semester}`,
            section,
            password: '12345',
            role: 'student'
          });
        }

        if (errors.length > 0) {
          console.warn('CSV parsing errors:', errors);
        }

        // Bulk upload
        let uploadedCount = 0;
        for (const student of studentsList) {
          try {
            console.log('Uploading student:', student);
            await adminAPI.createUser(student);
            uploadedCount++;
          } catch (err) {
            console.error('Error uploading student:', student.enroll, err);
            errors.push(`Row: ${student.enroll} - ${err.message || err}`);
          }
        }

        const updated = await adminAPI.getUsers({ role: "student" });
        setStudents(updated);
        
        let statusMsg = `✔ ${uploadedCount} students uploaded successfully`;
        if (errors.length > 0) {
          statusMsg += ` (${errors.length} errors: ${errors.slice(0, 3).join('; ')})`;
          if (errors.length > 3) {
            statusMsg += `, ...`;
          }
        }
        setUploadStatus(statusMsg);
        console.log('Upload complete:', { uploadedCount, errors });
        setTimeout(() => setUploadStatus(''), 8000);
      } catch (err) {
        console.error('File upload error:', err);
        setUploadStatus(`❌ Error uploading file: ${err.message || err}`);
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