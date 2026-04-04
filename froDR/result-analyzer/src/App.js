import React, { useState } from "react";
import "./App.css";

import AuthForm from "./components/AuthForm";
import StudentDashboard from "./components/StudentDashboard";
import FacultyDashboard from "./components/FacultyDashboard";
import AdminDashboard from "./components/AdminDashboard";
import ProfilePage from "./components/ProfilePage";

function App() {

  // Which dashboard (student / faculty / admin)
  const [dashboard, setDashboard] = useState(null);

  // Which page inside dashboard
  const [page, setPage] = useState("dashboard");

  // Shared announcements state
  const [announcements, setAnnouncements] = useState([
    { id: 1, title: "CIE1 Results Published", message: "CIE1 Results uploaded for MCA Sem 1.", date: new Date().toISOString().split("T")[0], type: "Results", course: "MCA", semester: "1", subject: "DBMS", class: "All" },
    { id: 2, title: "Important Notice", message: "Please submit updated marks within 3 days.", date: new Date(Date.now() - 1*24*60*60*1000).toISOString().split("T")[0], type: "Notice", course: "MCA", semester: "1", subject: "OS", class: "A" },
    { id: 3, title: "Exam Schedule", message: "CIE2 examinations will be held next week.", date: new Date(Date.now() - 2*24*60*60*1000).toISOString().split("T")[0], type: "Schedule", course: "BCA", semester: "2", subject: "DS", class: "B" },
  ]);


  /* ============================= */
  /* STUDENT AREA */
  /* ============================= */

  if (dashboard === "student") {

    if (page === "profile") {
      return (
        <ProfilePage
          setDashboard={setDashboard}
          setPage={setPage}
        />
      );
    }

    return (
      <StudentDashboard
        setDashboard={setDashboard}
        setPage={setPage}
        announcements={announcements}
      />
    );
  }


  /* ============================= */
  /* FACULTY AREA */
  /* ============================= */

  if (dashboard === "faculty") {
    return (
      <FacultyDashboard
        setDashboard={setDashboard}
        announcements={announcements}
        setAnnouncements={setAnnouncements}
      />
    );
  }


  /* ============================= */
  /* ADMIN AREA */
  /* ============================= */

  if (dashboard === "admin") {
    return (
      <AdminDashboard
        setDashboard={setDashboard}
        setPage={setPage}
        page={page}
      />
    );
  }


  /* ============================= */
  /* LOGIN / SIGNUP PAGE */
  /* ============================= */

  return (
    <div className="auth-page">

      <AuthForm
        setDashboard={setDashboard}
      />

    </div>
  );

}

export default App;

