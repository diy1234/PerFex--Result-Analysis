import React, { useState, useEffect } from "react";
import "./Students.css";
import { adminAPI } from "../api";

function Students() {

  // ✅ Updated: Empty initial state
  const [students, setStudents] = useState([]);

  const [formData, setFormData] = useState({
    enroll: "",
    name: "",
    course: "",
    semester: ""
  });

  const [search, setSearch] = useState("");

  // ✅ NEW: Fetch students from backend
  useEffect(() => {
    adminAPI.getUsers({ role: "student" }).then(setStudents);
  }, []);

  // Handle form input change
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // ✅ Updated: Add student using API
  const addStudent = async () => {

    if (!formData.enroll || !formData.name) {
      alert("Please fill all fields");
      return;
    }

    await adminAPI.createUser({ ...formData, role: "student" });

    const updated = await adminAPI.getUsers({ role: "student" });
    setStudents(updated);

    setFormData({
      enroll: "",
      name: "",
      course: "",
      semester: ""
    });
  };

  // ✅ Updated: Delete using API
  const deleteStudent = async (id) => {
    await adminAPI.deleteUser(id);
    setStudents(students.filter(s => s.id !== id));
  };

  // Search filter
  const filteredStudents = students.filter((student) =>
    student.name?.toLowerCase().includes(search.toLowerCase()) ||
    student.enroll?.includes(search)
  );

  return (
    <div className="students-page">

      <h2>Manage Students</h2>

      {/* Add Student Form */}
      <div className="student-form">

        <input
          type="text"
          name="enroll"
          placeholder="Enrollment Number"
          value={formData.enroll}
          onChange={handleChange}
        />

        <input
          type="text"
          name="name"
          placeholder="Student Name"
          value={formData.name}
          onChange={handleChange}
        />

        <input
          type="text"
          name="course"
          placeholder="Course"
          value={formData.course}
          onChange={handleChange}
        />

        <input
          type="text"
          name="semester"
          placeholder="Semester"
          value={formData.semester}
          onChange={handleChange}
        />

        <button onClick={addStudent}>Add Student</button>

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