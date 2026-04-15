import React, { useState, useEffect } from "react";
import "./AdminDashboard.css";
import { adminAPI } from "../api";

function Teacher() {

  // ✅ Updated: Empty state
  const [teachers, setTeachers] = useState([]);

  const [formData, setFormData] = useState({
    faculty_id: "",
    teacherId: "",
    name: "",
    course: "",
    subject: "",
    department: ""
  });

  const [search, setSearch] = useState("");

  // ✅ NEW: Fetch teachers from backend
  useEffect(() => {
    adminAPI.getUsers({ role: "faculty" }).then(setTeachers);
  }, []);

  /* Handle input change */
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  /* ✅ Updated: Add teacher using API */
  const addTeacher = async () => {

    if (!formData.faculty_id || !formData.name || !formData.course) {
      alert("Please fill all required fields");
      return;
    }

    await adminAPI.createUser({ ...formData, role: "faculty", faculty_id: formData.faculty_id });

    const updated = await adminAPI.getUsers({ role: "faculty" });
    setTeachers(updated);

    setFormData({
      teacherId: "",
      name: "",
      course: "",
      subject: "",
      department: ""
    });
  };

  /* ✅ Updated: Delete teacher using API */
  const deleteTeacher = async (id) => {
    await adminAPI.deleteUser(id);
    setTeachers(teachers.filter(t => t.id !== id));
  };

  /* Search filter */
  const filteredTeachers = teachers.filter((teacher) =>
    teacher.name?.toLowerCase().includes(search.toLowerCase()) ||
    teacher.faculty_id?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="teachers-page">

      <h2>Manage Teachers</h2>

      {/* Add Teacher Form */}
      <div className="teacher-form">

        <input
          type="text"
          name="faculty_id"
          placeholder="Teacher ID"
          value={formData.faculty_id}
          onChange={handleChange}
        />

        <input
          type="text"
          name="name"
          placeholder="Teacher Name"
          value={formData.name}
          onChange={handleChange}
        />

        {/* Course Dropdown */}
        <select
          name="course"
          value={formData.course}
          onChange={handleChange}
        >
          <option value="">Select Course</option>
          <option value="MCA">MCA</option>
          <option value="BCA">BCA</option>
          <option value="BBA">BBA</option>
        </select>

        <input
          type="text"
          name="subject"
          placeholder="Subject"
          value={formData.subject}
          onChange={handleChange}
        />

        <input
          type="text"
          name="department"
          placeholder="Department"
          value={formData.department}
          onChange={handleChange}
        />

        <button onClick={addTeacher}>Add Teacher</button>

      </div>

      {/* Search */}
      <div className="search-box">

        <input
          type="text"
          placeholder="Search teacher..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

      </div>

      {/* Teacher Table */}
      <table className="teacher-table">

        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Course</th>
            <th>Subject</th>
            <th>Department</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>

          {filteredTeachers.map((teacher) => (

            <tr key={teacher.id}>

              <td>{teacher.faculty_id || "-"}</td>
              <td>{teacher.name || "-"}</td>
              <td>{teacher.course || "-"}</td>
              <td>{teacher.subject || "-"}</td>
              <td>{teacher.department || "-"}</td>

              <td>
                <button
                  className="delete-btn"
                  onClick={() => deleteTeacher(teacher.id)}
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

export default Teacher;