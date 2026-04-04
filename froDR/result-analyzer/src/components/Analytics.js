import React from "react";
import { Bar, Doughnut } from "react-chartjs-2";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

function Analytics({ data }) {
  const totalStudents = data.length;
  const averageMarks =
    totalStudents === 0
      ? 0
      : data.reduce((sum, d) => sum + Number(d.marks || 0), 0) / totalStudents;
  const passCount = data.filter((d) => Number(d.marks) >= 40).length;
  const failCount = totalStudents - passCount;
  const passRate = totalStudents === 0 ? 0 : (passCount / totalStudents) * 100;

  const sortedByMarks = [...data].sort((a, b) => Number(b.marks) - Number(a.marks));
  const topPerformers = sortedByMarks.slice(0, 3);

  const barChartData = {
    labels: data.map((d) => d.name),
    datasets: [
      {
        label: "Marks",
        data: data.map((d) => Number(d.marks) || 0),
        backgroundColor: "#4e79a7",
        borderRadius: 8,
      },
    ],
  };

  const doughnutData = {
    labels: ["Passed", "Failed"],
    datasets: [
      {
        data: [passCount, failCount],
        backgroundColor: ["#2ecc71", "#e74c3c"],
        hoverOffset: 6,
      },
    ],
  };

  return (
    <div className="analytics">
      <h2>Analytics Dashboard</h2>

      <div className="analytics-cards">
        <div className="analytics-card">
          <h3>Total Students</h3>
          <p>{totalStudents}</p>
        </div>
        <div className="analytics-card">
          <h3>Average Marks</h3>
          <p>{averageMarks.toFixed(1)}</p>
        </div>
        <div className="analytics-card">
          <h3>Pass Rate</h3>
          <p>{passRate.toFixed(1)}%</p>
        </div>
      </div>

      <div className="analytics-charts">
        <div className="analytics-chart">
          <h3>Marks Distribution</h3>
          <Bar data={barChartData} />
        </div>

        <div className="analytics-chart">
          <h3>Pass / Fail Breakdown</h3>
          <Doughnut data={doughnutData} />
        </div>
      </div>

      <div className="analytics-topper">
        <h3>Top Performers</h3>
        <ol>
          {topPerformers.map((student, idx) => (
            <li key={idx}>
              {student.name} — <strong>{student.marks}</strong>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

export default Analytics;
