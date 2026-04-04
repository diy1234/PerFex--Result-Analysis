import React, { useState } from "react";
import "./Students.css";

function Students() {

  const [students, setStudents] = useState([
    { id: 1, enroll: "101", name: "Rahul", course: "MCA", semester: "2" },
    { id: 2, enroll: "102", name: "Priya", course: "MCA", semester: "2" }
  ]);

  const [formData, setFormData] = useState({
    enroll: "",
    name: "",
    course: "",
    semester: ""
  });

  const [search, setSearch] = useState("");

  // Handle form input change
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Add new student
  const addStudent = () => {

    if (!formData.enroll || !formData.name) {
      alert("Please fill all fields");
      return;
    }

    const newStudent = {
      id: students.length + 1,
      ...formData
    };

    setStudents([...students, newStudent]);

    setFormData({
      enroll: "",
      name: "",
      course: "",
      semester: ""
    });
  };

  // Delete student
  const deleteStudent = (id) => {
    setStudents(students.filter((student) => student.id !== id));
  };

  // Search filter
  const filteredStudents = students.filter((student) =>
    student.name.toLowerCase().includes(search.toLowerCase()) ||
    student.enroll.includes(search)
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