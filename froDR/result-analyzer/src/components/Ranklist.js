import React from "react";
import { FiUsers, FiTrendingUp, FiAward } from "react-icons/fi";
import "./AdminDashboard.css";

function RankList({ data }) {

  // ✅ SAFETY FIX
  const safeData = Array.isArray(data) ? data : [];

  // Sort safely
  const sortedData = [...safeData].sort((a, b) => (b.marks || 0) - (a.marks || 0));

  // ✅ SAFE CALCULATIONS
  const totalStudents = safeData.length;

  const totalMarks = safeData.reduce((sum, s) => sum + (s.marks || 0), 0);

  const avgCGPA =
    totalStudents > 0
      ? (totalMarks / totalStudents / 10).toFixed(2)
      : "0.00";

  const highestMarks =
    totalStudents > 0
      ? Math.max(...safeData.map((s) => s.marks || 0))
      : 0;

  const highestCGPA = (highestMarks / 10).toFixed(2);

  const statCards = [
    {
      label: "Total Students",
      value: totalStudents,
      icon: <FiUsers className="stat-icon" />,
    },
    {
      label: "Average CGPA",
      value: avgCGPA,
      icon: <FiTrendingUp className="stat-icon" />,
    },
    {
      label: "Highest CGPA",
      value: highestCGPA,
      icon: <FiAward className="stat-icon" />,
    },
  ];

  return (
    <div className="leaderboard-page">
      <div className="leaderboard-header">
        <div>
          <h2>Leaderboard</h2>
          <p>Top performing students with rich rank styling and CGPA badges.</p>
        </div>
      </div>

      <div className="leaderboard-stats">
        {statCards.map((card) => (
          <div key={card.label} className="stat-card stat-card-glass">
            <div className="stat-card-top">
              {card.icon}
              <span>{card.label}</span>
            </div>
            <div className="stat-card-value">{card.value}</div>
          </div>
        ))}
      </div>

      <div className="leaderboard-list">
        {sortedData.length === 0 ? (
          <p style={{ textAlign: "center", opacity: 0.7 }}>
            No data available
          </p>
        ) : (
          sortedData.map((student, index) => (
            <div key={index} className={`leaderboard-item rank-${index + 1}`}>
              <div className="leaderboard-rank">
                <span className="rank-badge">
                  {index === 0
                    ? "🥇"
                    : index === 1
                    ? "🥈"
                    : index === 2
                    ? "🥉"
                    : `#${index + 1}`}
                </span>
              </div>

              <div className="student-info">
                <div className="student-name">{student.name || "Unknown"}</div>
                <div className="student-course">{student.course || "N/A"}</div>
              </div>

              <div className="student-meta">
                <span className="cgpa-pill">
                  CGPA {((student.marks || 0) / 10).toFixed(2)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default RankList;