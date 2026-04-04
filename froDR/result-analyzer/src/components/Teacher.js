import React, { useState } from "react";
import "./AdminDashboard.css";

function Teacher() {

  const [teachers, setTeachers] = useState([
    {
      id: 1,
      teacherId: "T01",
      name: "Dr. Sharma",
      course: "MCA",
      subject: "DBMS",
      department: "Computer Science"
    },
    {
      id: 2,
      teacherId: "T02",
      name: "Dr. Mehta",
      course: "MCA",
      subject: "Algorithms",
      department: "Computer Science"
    }
  ]);

  const [formData, setFormData] = useState({
    teacherId: "",
    name: "",
    course: "",
    subject: "",
    department: ""
  });

  const [search, setSearch] = useState("");

  /* Handle input change */

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  /* Add teacher */

  const addTeacher = () => {

    if (!formData.teacherId || !formData.name || !formData.course) {
      alert("Please fill all required fields");
      return;
    }

    const newTeacher = {
      id: teachers.length + 1,
      ...formData
    };

    setTeachers([...teachers, newTeacher]);

    setFormData({
      teacherId: "",
      name: "",
      course: "",
      subject: "",
      department: ""
    });
  };

  /* Delete teacher */

  const deleteTeacher = (id) => {
    setTeachers(teachers.filter((teacher) => teacher.id !== id));
  };

  /* Search filter */

  const filteredTeachers = teachers.filter((teacher) =>
    teacher.name.toLowerCase().includes(search.toLowerCase()) ||
    teacher.teacherId.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="teachers-page">

      <h2>Manage Teachers</h2>

      {/* Add Teacher Form */}

      <div className="teacher-form">

        <input
          type="text"
          name="teacherId"
          placeholder="Teacher ID"
          value={formData.teacherId}
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

              <td>{teacher.teacherId}</td>
              <td>{teacher.name}</td>
              <td>{teacher.course}</td>
              <td>{teacher.subject}</td>
              <td>{teacher.department}</td>

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