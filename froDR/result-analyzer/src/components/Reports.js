import React, { useState, useMemo } from "react";
import { Bar, Line, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement,
  LineElement, PointElement, ArcElement,
  Tooltip, Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale, LinearScale, BarElement,
  LineElement, PointElement, ArcElement,
  Tooltip, Legend
);

/* ── Design tokens (matches FacultyDashboard + Sidebar) ─────────────────── */
const T = {
  bg:        "#0f1117",
  surface:   "#161b27",
  card:      "#1c2333",
  border:    "#2a3348",
  accent:    "#4f8ef7",
  accentSoft:"#1e3a6e",
  success:   "#22c55e",
  danger:    "#ef4444",
  warning:   "#f59e0b",
  purple:    "#a855f7",
  teal:      "#14b8a6",
  muted:     "#64748b",
  text:      "#e2e8f0",
  textSub:   "#94a3b8",
};

/* ── Shared style helpers ────────────────────────────────────────────────── */
const card   = (extra = {}) => ({ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "20px 22px", ...extra });
const label  = { fontSize: 11, fontWeight: 600, color: T.muted, textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 7 };
const sel    = { padding: "8px 12px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, fontSize: 13, cursor: "pointer", outline: "none" };
const th     = { padding: "10px 14px", fontSize: 11, fontWeight: 600, color: T.muted, textTransform: "uppercase", letterSpacing: "0.07em", textAlign: "left", borderBottom: `1px solid ${T.border}`, whiteSpace: "nowrap" };
const td     = { padding: "11px 14px", fontSize: 13, color: T.text, borderBottom: `1px solid ${T.border}` };

const badge = (type) => {
  const m = {
    pass:    { bg: "#14532d22", color: T.success,  border: "#14532d" },
    fail:    { bg: "#450a0a22", color: T.danger,   border: "#450a0a" },
    risk:    { bg: "#78350f22", color: T.warning,  border: "#78350f" },
    info:    { bg: "#1e3a6e22", color: T.accent,   border: "#1e3a6e" },
    purple:  { bg: "#581c8722", color: T.purple,   border: "#581c87" },
    teal:    { bg: "#13424022", color: T.teal,     border: "#134240" },
  };
  const c = m[type] || m.info;
  return { display: "inline-block", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: c.bg, color: c.color, border: `1px solid ${c.border}` };
};

const chartTooltip = {
  backgroundColor: "#1c2333", borderColor: "#2a3348", borderWidth: 1,
  titleColor: "#e2e8f0", bodyColor: "#94a3b8", padding: 10,
};

/* ── Grade helpers ───────────────────────────────────────────────────────── */
const getGrade  = m => m >= 90 ? "A+" : m >= 80 ? "A" : m >= 70 ? "B+" : m >= 60 ? "B" : m >= 50 ? "C" : m >= 40 ? "D" : "F";
const getStatus = m => m >= 75 ? "pass" : m >= 40 ? "risk" : "fail";

/* ════════════════════════════════════════════════════════════════════════════
   REPORTS COMPONENT
══════════════════════════════════════════════════════════════════════════════ */
export default function Reports({ data = [], analytics = [] }) {
  const [tab,            setTab]            = useState("overview");
  const [selectedCourse, setSelectedCourse] = useState("all");
  const [selectedSubject,setSelectedSubject]= useState("all");

  /* ── Filtered data ─────────────────────────────────────────────────────── */
  const courseFiltered = useMemo(() => {
    if (selectedCourse === "all") return data;
    return data.filter((s) => String(s.course || "").toLowerCase() === String(selectedCourse).toLowerCase());
  }, [data, selectedCourse]);

  const subjectSource = analytics && analytics.length > 0 ? analytics : courseFiltered;

  const availableSubjects = useMemo(() => {
    if (analytics && analytics.length > 0) {
      return analytics.map((a) => a.name).filter(Boolean).sort();
    }
    const subjectSet = new Set(courseFiltered.map((s) => s.subject).filter(Boolean));
    return Array.from(subjectSet).sort();
  }, [analytics, courseFiltered]);

  const subjectFiltered = useMemo(() => {
    if (selectedSubject === "all") return subjectSource;
    if (analytics && analytics.length > 0) {
      return subjectSource.filter((a) => String(a.name || "").toLowerCase() === String(selectedSubject).toLowerCase());
    }
    return subjectSource.filter((s) => String(s.subject || "").toLowerCase() === String(selectedSubject).toLowerCase());
  }, [subjectSource, selectedSubject, analytics]);

  /* ── Statistics ────────────────────────────────────────────────────────── */
  const stats = useMemo(() => {
    const n     = courseFiltered.length;
    const total = courseFiltered.reduce((s, x) => s + Number(x.marks || 0), 0);
    const avg   = n > 0 ? total / n : 0;
    const pass  = courseFiltered.filter(s => Number(s.marks) >= 40).length;
    const fail  = n - pass;
    const pRate = n > 0 ? (pass / n) * 100 : 0;
    const grades = {
      "A+ (90–100)": courseFiltered.filter(s => Number(s.marks) >= 90).length,
      "A (80–89)":   courseFiltered.filter(s => Number(s.marks) >= 80 && Number(s.marks) < 90).length,
      "B+ (70–79)":  courseFiltered.filter(s => Number(s.marks) >= 70 && Number(s.marks) < 80).length,
      "B (60–69)":   courseFiltered.filter(s => Number(s.marks) >= 60 && Number(s.marks) < 70).length,
      "C (50–59)":   courseFiltered.filter(s => Number(s.marks) >= 50 && Number(s.marks) < 60).length,
      "D (40–49)":   courseFiltered.filter(s => Number(s.marks) >= 40 && Number(s.marks) < 50).length,
      "F (<40)":     courseFiltered.filter(s => Number(s.marks) < 40).length,
    };
    return { n, avg, pass, fail, pRate, grades };
  }, [courseFiltered]);

  /* ── Chart datasets ────────────────────────────────────────────────────── */
  const gradeBarData = {
    labels: Object.keys(stats.grades),
    datasets: [{
      label: "Students",
      data: Object.values(stats.grades),
      backgroundColor: ["#22c55e99","#16a34a99","#15803d99","#166534aa","#f59e0b99","#d97706aa","#ef444499"],
      borderRadius: 5, barThickness: 28,
    }],
  };

  const pieData = {
    labels: ["Passed", "Failed"],
    datasets: [{
      data: [stats.pass, stats.fail],
      backgroundColor: ["#22c55e99","#ef444499"],
      borderColor: ["#22c55e","#ef4444"],
      borderWidth: 1,
    }],
  };

  const trendData = {
    labels: ["Jan","Feb","Mar","Apr","May","Jun"],
    datasets: [{
      label: "Avg Marks",
      data: [75, 78, 82, 79, 85, 88],
      borderColor: T.accent,
      backgroundColor: "#4f8ef712",
      pointBackgroundColor: T.accent,
      pointRadius: 4,
      tension: 0.4, fill: true,
    }],
  };

  const baseOpts = (hasScales = true) => ({
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: chartTooltip },
    ...(hasScales ? {
      scales: {
        x: { grid: { color: "#2a3348" }, ticks: { color: T.muted, font: { size: 11 } } },
        y: { grid: { color: "#2a3348" }, ticks: { color: T.muted, font: { size: 11 } } },
      }
    } : {}),
  });

  const pieOpts = { maintainAspectRatio: false, cutout: "62%", plugins: { legend: { display: false }, tooltip: chartTooltip } };

  /* ── Export ────────────────────────────────────────────────────────────── */
  const exportReport = (fmt) => alert(`Exporting as ${fmt.toUpperCase()}…`);

  /* ── Stat card ─────────────────────────────────────────────────────────── */
  const StatCard = ({ label: lbl, value, color, sub }) => (
    <div style={{ ...card(), borderTop: `3px solid ${color}` }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: T.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>{lbl}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: T.text, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: T.muted, marginTop: 6 }}>{sub}</div>}
    </div>
  );

  /* ── Tab button ────────────────────────────────────────────────────────── */
  const TabBtn = ({ id, children }) => (
    <button
      onClick={() => setTab(id)}
      style={{
        padding: "8px 18px", fontSize: 13, fontWeight: 500,
        background: tab === id ? T.accentSoft : "transparent",
        color: tab === id ? T.accent : T.muted,
        border: `1px solid ${tab === id ? T.accent + "55" : T.border}`,
        borderRadius: 8, cursor: "pointer",
        transition: "all 0.15s",
      }}
    >{children}</button>
  );

  /* ════════════════════════════════════════════════════════════════════════
     TAB CONTENT
  ════════════════════════════════════════════════════════════════════════ */

  /* Overview */
  const TabOverview = () => (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
        <StatCard label="Total Students" value={stats.n}                           color={T.accent}   sub={`Course: ${selectedCourse === "all" ? "All" : selectedCourse}`} />
        <StatCard label="Average Marks"  value={stats.avg.toFixed(1)}              color={T.warning}  sub="Out of 100" />
        <StatCard label="Pass Rate"      value={`${stats.pRate.toFixed(1)}%`}      color={T.success}  sub={`${stats.pass} passed`} />
        <StatCard label="Fail Count"     value={stats.fail}                        color={T.danger}   sub="Scored below 40" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 16 }}>
        {/* Donut */}
        <div style={card()}>
          <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 16 }}>Pass / Fail Split</div>
          <div style={{ height: 180, position: "relative", marginBottom: 16 }}>
            <Pie data={pieData} options={pieOpts} />
          </div>
          {[
            { label: "Passed", count: stats.pass,  pct: stats.pRate.toFixed(1), color: T.success },
            { label: "Failed", count: stats.fail,   pct: (100 - stats.pRate).toFixed(1), color: T.danger },
          ].map(r => (
            <div key={r.label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: r.color }} />
                <span style={{ fontSize: 12, color: T.muted }}>{r.label}</span>
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{r.count} ({r.pct}%)</span>
            </div>
          ))}
        </div>

        {/* Grade distribution bar */}
        <div style={card()}>
          <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 16 }}>Grade Distribution</div>
          <div style={{ height: 260, position: "relative" }}>
            <Bar data={gradeBarData} options={baseOpts()} />
          </div>
        </div>
      </div>
    </>
  );

  const hasTrendData = courseFiltered.length > 0;

  /* Performance */
  const TabPerformance = () => (
    <>
      <div style={{ ...card(), marginBottom: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 16 }}>Performance Trend — Last 6 Months</div>
        {hasTrendData ? (
          <div style={{ height: 240, position: "relative" }}>
            <Line data={trendData} options={baseOpts()} />
          </div>
        ) : (
          <div style={{ height: 240, display: "flex", alignItems: "center", justifyContent: "center", color: T.muted, fontSize: 13, textAlign: "center", padding: 20 }}>
            No performance trend available yet. Upload marks to generate trend data.
          </div>
        )}
      </div>

      <div style={card()}>
        <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 16 }}>Student Performance Details</div>
        <div style={{ overflowX: "auto" }}>
          {courseFiltered.length === 0 ? (
            <div style={{ padding: "40px 0", textAlign: "center", color: T.muted, fontSize: 13 }}>
              No student data available. Upload marks to see results here.
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>{["Name","Course","Marks","Grade","Status"].map(h => <th key={h} style={th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {courseFiltered.map((s, i) => {
                  const m = Number(s.marks || 0);
                  return (
                    <tr key={i}
                      onMouseEnter={e => e.currentTarget.style.background = "#ffffff06"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <td style={{ ...td, fontWeight: 600 }}>{s.name}</td>
                      <td style={td}><span style={badge("info")}>{s.course}</span></td>
                      <td style={{ ...td, fontWeight: 700, color: m >= 40 ? T.success : T.danger }}>{m}</td>
                      <td style={td}><span style={badge(getStatus(m))}>{getGrade(m)}</span></td>
                      <td style={td}><span style={badge(m >= 40 ? "pass" : "fail")}>{m >= 40 ? "Pass" : "Fail"}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );

  /* Subject Analysis */
  const subjectColors = [T.accent, T.success, T.warning, T.purple, T.teal];
  const subjectBadges = ["info", "pass", "risk", "purple", "teal"];

  const subjectStats = useMemo(() => {
    if (analytics && analytics.length > 0) {
      const selected = selectedSubject === "all"
        ? analytics
        : analytics.filter((a) => String(a.name || "").toLowerCase() === String(selectedSubject).toLowerCase());

      return selected.map((a) => ({
        subject: a.name,
        avg: Math.round(Number(a.avg_marks || a.avg || 0)),
        passRate: Math.round(Number(a.pass_rate || 0)),
      }));
    }

    const source = selectedSubject === "all" ? courseFiltered : subjectFiltered;
    const subjectsToShow = selectedSubject === "all" ? availableSubjects : [selectedSubject];

    return subjectsToShow.map((subj) => {
      const rows = source.filter((s) => String(s.subject || "").toLowerCase() === String(subj).toLowerCase());
      const count = rows.length;
      const avg = count > 0 ? rows.reduce((sum, x) => sum + Number(x.marks || 0), 0) / count : 0;
      const pass = rows.filter((s) => Number(s.marks) >= 40).length;
      const rate = count > 0 ? (pass / count) * 100 : 0;
      return { subject: subj, avg: Math.round(avg), passRate: Math.round(rate) };
    });
  }, [analytics, courseFiltered, subjectFiltered, availableSubjects, selectedSubject]);

  const TabSubjects = () => (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
        <div>
          <span style={label}>Filter Subject</span>
          <select style={sel} value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}>
            <option value="all">All Subjects</option>
            {availableSubjects.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {subjectStats.length === 0 ? (
        <div style={{ ...card(), textAlign: "center", color: T.muted, padding: 40 }}>
          No subject data available for the selected course.
        </div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14, marginBottom: 24 }}>
            {subjectStats.map((entry, i) => (
              <div key={entry.subject} style={{ ...card(), borderTop: `3px solid ${subjectColors[i % subjectColors.length]}` }}>
                <div style={{ marginBottom: 12 }}>
                  <span style={badge(subjectBadges[i % subjectBadges.length])}>{entry.subject}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: T.muted }}>Average</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{entry.avg}%</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                  <span style={{ fontSize: 12, color: T.muted }}>Pass Rate</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: T.success }}>{entry.passRate}%</span>
                </div>
                <div style={{ height: 4, background: T.border, borderRadius: 4 }}>
                  <div style={{ height: 4, background: subjectColors[i % subjectColors.length], borderRadius: 4, width: `${entry.passRate}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div style={card()}>
            <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 16 }}>Subject Average Comparison</div>
            <div style={{ height: 240, position: "relative" }}>
              <Bar
                data={{
                  labels: subjectStats.map(s => s.subject),
                  datasets: [{
                    label: "Average %",
                    data: subjectStats.map(s => s.avg),
                    backgroundColor: subjectStats.map((_, i) => subjectColors[i % subjectColors.length] + "99"),
                    borderRadius: 5, barThickness: 36,
                  }],
                }}
                options={baseOpts()}
              />
            </div>
          </div>
        </>
      )}
    </>
  );

  /* ─────────────────────────────────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────────────────────────────────── */
  return (
    <div style={{ fontFamily: "'DM Sans','Segoe UI',sans-serif", color: T.text }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: T.text, margin: 0 }}>Reports</h2>
          <p style={{ fontSize: 13, color: T.muted, marginTop: 4 }}>Analytics and performance summaries</p>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          {/* Course filter */}
          <div>
            <span style={{ ...label, display: "inline-block", marginBottom: 0, marginRight: 8 }}>Course</span>
            <select style={sel} value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}>
              <option value="all">All Courses</option>
              <option value="MCA">MCA</option>
              <option value="BCA">BCA</option>
              <option value="BBA">BBA</option>
            </select>
          </div>

          {/* Export */}
          <button
            onClick={() => exportReport("pdf")}
            style={{ padding: "8px 16px", background: "transparent", color: T.textSub, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 13, cursor: "pointer" }}
            onMouseEnter={e => e.currentTarget.style.borderColor = T.accent}
            onMouseLeave={e => e.currentTarget.style.borderColor = T.border}
          >
            Export PDF
          </button>
          <button
            onClick={() => exportReport("excel")}
            style={{ padding: "8px 16px", background: T.accent, color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
          >
            Export Excel
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24, borderBottom: `1px solid ${T.border}`, paddingBottom: 16 }}>
        <TabBtn id="overview">Overview</TabBtn>
        <TabBtn id="performance">Performance</TabBtn>
        <TabBtn id="subjects">Subject Analysis</TabBtn>
      </div>

      {/* Content */}
      {tab === "overview"     && <TabOverview />}
      {tab === "performance"  && <TabPerformance />}
      {tab === "subjects"     && <TabSubjects />}
    </div>
  );
}
