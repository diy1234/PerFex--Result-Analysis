import React, { useState, useEffect } from "react";
import "./App.css";

import AuthForm from "./components/AuthForm";
import StudentDashboard from "./components/StudentDashboard";
import FacultyDashboard from "./components/FacultyDashboard";
import AdminDashboard from "./components/AdminDashboard";
import ProfilePage from "./components/ProfilePage";

function App() {

  // Dark mode state
  const [darkMode, setDarkMode] = useState(true);

  // Which dashboard (student / faculty / admin)
  const [dashboard, setDashboard] = useState(null);

  // Which page inside dashboard
  const [page, setPage] = useState("dashboard");

  // Apply theme to document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }, [darkMode]);


  /* ============================= */
  /* STUDENT AREA */
  /* ============================= */

  if (dashboard === "student") {

    if (page === "profile") {
      return (
        <ProfilePage
          setDashboard={setDashboard}
          setPage={setPage}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
        />
      );
    }

    return (
      <StudentDashboard
        setDashboard={setDashboard}
        setPage={setPage}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
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
        darkMode={darkMode}
        setDarkMode={setDarkMode}
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
        darkMode={darkMode}
        setDarkMode={setDarkMode}
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
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />

    </div>
  );

}

export default App;