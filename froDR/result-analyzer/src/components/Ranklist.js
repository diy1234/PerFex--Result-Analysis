import React from "react";
import { FiUsers, FiTrendingUp, FiAward } from "react-icons/fi";
import "./AdminDashboard.css";

function RankList({ data }) {
  // Sort data by marks descending
  const sortedData = [...data].sort((a, b) => b.marks - a.marks);

  const statCards = [
    {
      label: "Total Students",
      value: data.length,
      icon: <FiUsers className="stat-icon" />,
    },
    {
      label: "Average CGPA",
      value: ((data.reduce((sum, s) => sum + s.marks, 0) / data.length) / 10).toFixed(2),
      icon: <FiTrendingUp className="stat-icon" />,
    },
    {
      label: "Highest CGPA",
      value: (Math.max(...data.map(s => s.marks)) / 10).toFixed(2),
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
        {sortedData.map((student, index) => (
          <div key={student.name} className={`leaderboard-item rank-${index + 1}`}>
            <div className="leaderboard-rank">
              <span className="rank-badge">
                {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`}
              </span>
            </div>

            <div className="student-info">
              <div className="student-name">{student.name}</div>
              <div className="student-course">{student.course}</div>
            </div>

            <div className="student-meta">
              <span className="cgpa-pill">CGPA {(student.marks / 10).toFixed(2)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default RankList;