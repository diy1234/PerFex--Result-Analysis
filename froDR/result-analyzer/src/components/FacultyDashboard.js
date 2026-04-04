import React, { useState } from "react";
import { Bar, Pie } from "react-chartjs-2";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import logo2 from "../logo2.png";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";

ChartJS.register(
  CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend, ArcElement
);

/* ─── Design tokens ──────────────────────────────────────────────────────── */
const DARK_T = {
  bg:       "#0f1117",
  surface:  "#161b27",
  card:     "#1c2333",
  border:   "#2a3348",
  accent:   "#4f8ef7",
  accentSoft:"#1e3a6e",
  success:  "#22c55e",
  danger:   "#ef4444",
  warning:  "#f59e0b",
  muted:    "#64748b",
  text:     "#e2e8f0",
  textSub:  "#94a3b8",
  sidebar:  "#111827",
};

const LIGHT_T = {
  bg:       "#f8fafc",
  surface:  "#f1f5f9",
  card:     "#ffffff",
  border:   "#e2e8f0",
  accent:   "#2563eb",
  accentSoft:"#dbeafe",
  success:  "#16a34a",
  danger:   "#dc2626",
  warning:  "#ea580c",
  muted:    "#94a3b8",
  text:     "#1e293b",
  textSub:  "#475569",
  sidebar:  "#f0f4f8",
};

/* ─── Inline styles (no external CSS needed) ─────────────────────────────── */
const getStyles = (T) => ({
  root: {
    display: "flex", height: "100vh", background: T.bg,
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    color: T.text, overflow: "hidden",
  },

  /* Sidebar */
  sidebar: {
    width: 240, background: T.sidebar, display: "flex",
    flexDirection: "column", borderRight: `1px solid ${T.border}`,
    flexShrink: 0, height: "100vh", overflowY: "auto",
  },
  sidebarLogo: {
    padding: "12px 12px", borderBottom: `1px solid ${T.border}`,
    cursor: "pointer", display: "flex", alignItems: "center", gap: 12,
    transition: "all 0.2s",
    borderRadius: "8px",
    margin: "8px 8px",
  },
  sidebarBrand: { fontSize: 10, fontWeight: 600, color: T.muted, letterSpacing: "0.12em", textTransform: "uppercase" },
  sidebarTitle: { fontSize: 15, fontWeight: 600, color: T.text, marginTop: 3 },
  logoIcon: {
    width: 36, height: 36, borderRadius: "8px", background: T.accentSoft,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 20, color: T.accent, fontWeight: 700, flexShrink: 0,
  },
  avatarWrap: { padding: "20px 20px 16px", borderBottom: `1px solid ${T.border}` },
  avatarCircle: (img) => ({
    width: 56, height: 56, borderRadius: "50%",
    background: img ? "transparent" : "#1e3a6e",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 18, fontWeight: 700, color: T.accent,
    border: `2px solid ${T.accentSoft}`, marginBottom: 10, overflow: "hidden",
  }),
  navSection: {
    fontSize: 10, fontWeight: 600, color: T.muted,
    letterSpacing: "0.1em", textTransform: "uppercase",
    padding: "16px 20px 6px",
  },
  navItem: (active) => ({
    display: "flex", alignItems: "center", gap: 10,
    padding: "10px 20px", cursor: "pointer", fontSize: 13, fontWeight: 500,
    color: active ? "#fff" : T.textSub,
    background: active ? T.accentSoft : "transparent",
    borderLeft: `3px solid ${active ? T.accent : "transparent"}`,
    transition: "all 0.15s",
  }),

  /* Main */
  main: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" },
  topbar: {
    height: 56, background: T.surface, borderBottom: `1px solid ${T.border}`,
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "0 28px", flexShrink: 0,
  },
  content: { flex: 1, overflowY: "auto", padding: "24px 28px" },

  /* Cards */
  card: {
    background: T.card, border: `1px solid ${T.border}`,
    borderRadius: 12, padding: "20px 22px",
  },
  statCard: (color) => ({
    background: T.card, border: `1px solid ${T.border}`,
    borderRadius: 12, padding: "18px 20px",
    borderTop: `3px solid ${color}`, position: "relative",
  }),

  /* Table */
  th: {
    padding: "10px 14px", fontSize: 11, fontWeight: 600,
    color: T.muted, textTransform: "uppercase", letterSpacing: "0.07em",
    textAlign: "left", borderBottom: `1px solid ${T.border}`, whiteSpace: "nowrap",
  },
  td: {
    padding: "11px 14px", fontSize: 13, color: T.text,
    borderBottom: `1px solid ${T.border}`,
  },

  /* Inputs */
  input: {
    width: "100%", padding: "9px 12px", background: T.surface,
    border: `1px solid ${T.border}`, borderRadius: 8, color: T.text,
    fontSize: 13, outline: "none", boxSizing: "border-box",
  },
  select: {
    padding: "8px 12px", background: T.surface,
    border: `1px solid ${T.border}`, borderRadius: 8,
    color: T.text, fontSize: 13, cursor: "pointer", outline: "none",
  },
  textarea: {
    width: "100%", padding: "9px 12px", background: T.surface,
    border: `1px solid ${T.border}`, borderRadius: 8, color: T.text,
    fontSize: 13, outline: "none", minHeight: 100, resize: "vertical",
    fontFamily: "inherit", boxSizing: "border-box",
  },

  /* Buttons */
  btnPrimary: {
    padding: "9px 20px", background: T.accent, color: "#fff",
    border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600,
    cursor: "pointer", letterSpacing: "0.02em",
  },
  btnSecondary: {
    padding: "9px 20px", background: "transparent", color: T.textSub,
    border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 13,
    fontWeight: 500, cursor: "pointer",
  },
  btnDanger: {
    padding: "7px 14px", background: "transparent", color: T.danger,
    border: `1px solid #3b1c1c`, borderRadius: 7, fontSize: 12,
    fontWeight: 500, cursor: "pointer",
  },
  btnSuccess: {
    padding: "7px 14px", background: "transparent", color: T.success,
    border: `1px solid #1a3a2a`, borderRadius: 7, fontSize: 12,
    fontWeight: 500, cursor: "pointer",
  },
  btnSmall: {
    padding: "6px 14px", background: T.accentSoft, color: T.accent,
    border: `1px solid #1e3a6e`, borderRadius: 7, fontSize: 12,
    fontWeight: 500, cursor: "pointer",
  },

  /* Badges */
  badge: (type) => {
    const m = {
      pass:    { bg: "#14532d22", color: T.success, border: "#14532d" },
      fail:    { bg: "#450a0a22", color: T.danger,  border: "#450a0a" },
      risk:    { bg: "#78350f22", color: T.warning, border: "#78350f" },
      pending: { bg: "#78350f22", color: T.warning, border: "#78350f" },
      resolved:{ bg: "#14532d22", color: T.success, border: "#14532d" },
      info:    { bg: "#1e3a6e22", color: T.accent,  border: "#1e3a6e" },
    };
    const c = m[type] || m.info;
    return {
      display: "inline-block", padding: "3px 10px", borderRadius: 20,
      fontSize: 11, fontWeight: 600, background: c.bg,
      color: c.color, border: `1px solid ${c.border}`,
    };
  },

  label: {
    fontSize: 11, fontWeight: 600, color: T.muted,
    textTransform: "uppercase", letterSpacing: "0.07em",
    display: "block", marginBottom: 7,
  },
});

/* ─── Chart defaults ─────────────────────────────────────────────────────── */
const chartDefaults = {
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: "#1c2333", borderColor: "#2a3348", borderWidth: 1,
      titleColor: "#e2e8f0", bodyColor: "#94a3b8", padding: 10,
    },
  },
  scales: {
    x: { grid: { color: "#2a3348" }, ticks: { color: "#64748b", font: { size: 11 } } },
    y: { grid: { color: "#2a3348" }, ticks: { color: "#64748b", font: { size: 11 } } },
  },
  maintainAspectRatio: false,
};

/* ─── Nav items ──────────────────────────────────────────────────────────── */
const NAV = [
  { key: "dashboard",     label: "Dashboard",         icon: "▦" },
  { key: "upload",        label: "Upload Marks",      icon: "⬆" },
  { key: "results",       label: "View Results",      icon: "≡" },
  { key: "analysis",      label: "Performance",       icon: "↗" },
  { key: "announcements", label: "Announcements",     icon: "✉" },
  { key: "queries",       label: "Student Queries",   icon: "?" },
  { key: "profile",       label: "Profile",           icon: "◎" },
];

/* ════════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════════════════ */
export default function FacultyDashboard({ setDashboard, announcements, setAnnouncements }) {
  const [view, setView]         = useState("dashboard");
  const [course, setCourse]     = useState("MCA");
  const [semester, setSemester] = useState("1");
  const [subject, setSubject]   = useState("DBMS");
  const [examType, setExamType] = useState("CIE1");
  const [editingId, setEditingId] = useState(null);
  const [editVal, setEditVal]   = useState("");
  const [facultyImage, setFacultyImage] = useState(null);
  const [newAnnouncement, setNewAnnouncement] = useState({ title: "", message: "", course: "MCA", semester: "1", subject: "DBMS", class: "All" });
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [classSection, setClassSection] = useState("A");
  const [filterApplied, setFilterApplied] = useState(false);
  const [uploadApplyClicked, setUploadApplyClicked] = useState(false);
  const [uploadFiltersApplied, setUploadFiltersApplied] = useState(false);
  const [uploadLoadingMessage, setUploadLoadingMessage] = useState("");
  const [resultsSemesterFilter, setResultsSemesterFilter] = useState("All");
  const [resultsSubjectFilter, setResultsSubjectFilter] = useState("All");
  const [resultsApplyClicked, setResultsApplyClicked] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editProfileData, setEditProfileData] = useState({
    name: "Dr. Rajesh Kumar",
    email: "rajesh.kumar@university.edu",
    department: "Computer Science",
    facultyId: "FAC-2021-001",
  });

  // Get current theme and styles
  const T = isDarkMode ? DARK_T : LIGHT_T;
  const S = getStyles(T);

  // Handle Apply button click
  const handleApplyFilters = () => {
    setFilterApplied(true);
    console.log(`Filters Applied: Course=${course}, Semester=${semester}, Subject=${subject}, ExamType=${examType}, Class=${classSection}`);
  };

  // Handle Apply button click in Upload Marks
  const handleApplyUploadFilters = () => {
    setUploadApplyClicked(true);
    console.log(`Upload Filters Applied: Course=${course}, Semester=${semester}, Subject=${subject}, ExamType=${examType}, Class=${classSection}`);
  };

  // Handle Load button click in Upload Marks
  const handleLoadUploadFilters = () => {
    setUploadFiltersApplied(true);
    setUploadLoadingMessage(`✓ Loaded: ${course} · Sem ${semester} · ${subject} · ${examType} · Class ${classSection}`);
    console.log(`Upload Data Loaded: Course=${course}, Semester=${semester}, Subject=${subject}, ExamType=${examType}, Class=${classSection}`);
    
    // Reset message after 3 seconds
    setTimeout(() => setUploadLoadingMessage(""), 3000);
  };

  // Handle Apply button click in View Results
  const handleApplyResultsFilters = () => {
    setResultsApplyClicked(true);
    console.log(`Results Filters Applied: Semester=${resultsSemesterFilter}, Subject=${resultsSubjectFilter}`);
  };

  const facultyDetails = {
    name: "Dr. Rajesh Kumar",
    facultyId: "FAC-2021-001",
    department: "Computer Science & Engineering",
    email: "rajesh.kumar@jimsdelhi.ac.in",
    subjectsAssigned: ["Database Management Systems", "Operating Systems", "Data Structures", "Advanced Algorithms"],
  };

  const [allMarksData, setAllMarksData] = useState([
    { id: 1, rollNo: "22101", name: "Riya",   dbms: 78, os: 82, ds: 75, algo: 88 },
    { id: 2, rollNo: "22102", name: "Aman",   dbms: 65, os: 70, ds: 60, algo: 75 },
    { id: 3, rollNo: "22103", name: "Kiran",  dbms: 82, os: 85, ds: 88, algo: 92 },
    { id: 4, rollNo: "22104", name: "Neha",   dbms: 32, os: 38, ds: 35, algo: 42 },
    { id: 5, rollNo: "22105", name: "Vikram", dbms: 90, os: 88, ds: 95, algo: 98 },
    { id: 6, rollNo: "22106", name: "Priya",  dbms: 72, os: 75, ds: 78, algo: 80 },
    { id: 7, rollNo: "22107", name: "Arjun",  dbms: 55, os: 60, ds: 58, algo: 65 },
    { id: 8, rollNo: "22108", name: "Divya",  dbms: 88, os: 90, ds: 92, algo: 95 },
  ]);

  const todayDate = new Date().toISOString().split("T")[0];
  const yesterdayDate = new Date(Date.now() - 1*24*60*60*1000).toISOString().split("T")[0];
  const twoDaysAgoDate = new Date(Date.now() - 2*24*60*60*1000).toISOString().split("T")[0];

  const [queries, setQueries] = useState([
    { id: 1, student: "Riya",  subject: "DBMS", query: "Marks calculation seems incorrect", status: "Pending",  date: todayDate },
    { id: 2, student: "Aman",  subject: "OS",   query: "Can I challenge my marks?",          status: "Resolved", date: yesterdayDate },
    { id: 3, student: "Neha",  subject: "DS",   query: "Request for recheck",                status: "Pending",  date: twoDaysAgoDate },
  ]);

  /* ── Derived data ───────────────────────────────────────────────────────── */
  const subKey = subject.toLowerCase() === "algo" ? "algo"
               : subject.toLowerCase() === "os"   ? "os"
               : subject.toLowerCase() === "ds"   ? "ds" : "dbms";

  const currentMarks = allMarksData.map(s => ({ ...s, marks: s[subKey] || 0 }));
  const weakStudents = currentMarks.filter(s => s.marks < 40);

  const avg = m => (m.reduce((a, b) => a + b, 0) / m.length).toFixed(1);
  const calcStats = marks => ({
    avg:        avg(marks),
    highest:    Math.max(...marks),
    lowest:     Math.min(...marks),
    passRate:   ((marks.filter(m => m >= 40).length / marks.length) * 100).toFixed(1),
    passCount:  marks.filter(m => m >= 40).length,
    failCount:  marks.filter(m => m < 40).length,
  });
  const stats = calcStats(currentMarks.map(s => s.marks));

  const subjectAvgs = {
    dbms: avg(allMarksData.map(s => s.dbms)),
    os:   avg(allMarksData.map(s => s.os)),
    ds:   avg(allMarksData.map(s => s.ds)),
    algo: avg(allMarksData.map(s => s.algo)),
  };

  const studentResultsData = allMarksData.map(s => {
    const total = s.dbms + s.os + s.ds + s.algo;
    return { ...s, totalMarks: total, percentage: ((total / 400) * 100).toFixed(2) };
  });

  /* ── Chart data ─────────────────────────────────────────────────────────── */
  const barData = {
    labels: ["DBMS", "Operating Systems", "Data Structures", "Algorithms"],
    datasets: [{
      label: "Average Marks",
      data: [subjectAvgs.dbms, subjectAvgs.os, subjectAvgs.ds, subjectAvgs.algo],
      backgroundColor: ["#4f8ef7cc", "#22c55ecc", "#f59e0bcc", "#a855f7cc"],
      borderRadius: 6, barThickness: 36,
    }],
  };

  const pieData = {
    labels: ["Pass (≥40)", "Fail (<40)"],
    datasets: [{
      data: [stats.passCount, stats.failCount],
      backgroundColor: ["#22c55e99", "#ef444499"],
      borderColor: ["#22c55e", "#ef4444"],
      borderWidth: 1,
    }],
  };

  const pieOptions = {
    maintainAspectRatio: false, cutout: "62%",
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#1c2333", borderColor: "#2a3348", borderWidth: 1,
        titleColor: "#e2e8f0", bodyColor: "#94a3b8",
      },
    },
  };

  /* ── Handlers ───────────────────────────────────────────────────────────── */
  const handleUpdateMarks = (id) => {
    const val = parseInt(editVal);
    if (isNaN(val) || val < 0 || val > 100) { alert("Enter valid marks (0-100)"); return; }
    setAllMarksData(prev => prev.map(s => s.id === id ? { ...s, [subKey]: val } : s));
    setEditingId(null); setEditVal("");
  };

  const handleAddAnnouncement = () => {
    if (!newAnnouncement.title || !newAnnouncement.message) return;
    setAnnouncements(prev => [
      { id: prev.length + 1, ...newAnnouncement, date: new Date().toISOString().split("T")[0], type: "Notice" },
      ...prev,
    ]);
    setNewAnnouncement({ title: "", message: "", course: "MCA", semester: "1", subject: "DBMS", class: "All" });
    console.log(`Announcement posted - Course: ${newAnnouncement.course}, Sem: ${newAnnouncement.semester}, Subject: ${newAnnouncement.subject}, Class: ${newAnnouncement.class}`);
  };

  const handleReplyQuery = (id) =>
    setQueries(prev => prev.map(q => q.id === id ? { ...q, status: "Resolved" } : q));

  const handleSaveProfile = () => {
    setIsEditingProfile(false);
    console.log("Profile saved:", editProfileData);
  };

  const handleCancelEdit = () => {
    setIsEditingProfile(false);
    setEditProfileData({
      name: "Dr. Rajesh Kumar",
      email: "rajesh.kumar@university.edu",
      department: "Computer Science",
      facultyId: "FAC-2021-001",
    });
  };

  const downloadCSV = () => {
    const rows = [["Roll No", "Name", "Marks", "Status"],
      ...currentMarks.map(s => [s.rollNo, s.name, s.marks, s.marks < 40 ? "Fail" : "Pass"])];
    const blob = new Blob([rows.map(r => r.join(",")).join("\n")], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `marks-${subject}-${examType}.csv`;
    link.click();
  };

  const downloadPDF = async () => {
    const el = document.getElementById("resultsSection");
    if (!el) return;
    const canvas = await html2canvas(el, { backgroundColor: "#1c2333" });
    const pdf = new jsPDF();
    pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, 210, 120);
    pdf.save("results-report.pdf");
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = ev => setFacultyImage(ev.target.result);
      reader.readAsDataURL(file);
    }
  };

  /* ── Shared section header ──────────────────────────────────────────────── */
  const SectionHeader = ({ title, subtitle, actions }) => (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: T.text, margin: 0 }}>{title}</h2>
        {subtitle && <p style={{ fontSize: 13, color: T.muted, marginTop: 4 }}>{subtitle}</p>}
      </div>
      {actions && <div style={{ display: "flex", gap: 8 }}>{actions}</div>}
    </div>
  );

  /* ── Stat card ──────────────────────────────────────────────────────────── */
  const StatCard = ({ label, value, sub, color, trend }) => (
    <div style={S.statCard(color)}>
      <div style={{ fontSize: 11, fontWeight: 600, color: T.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: T.text, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: T.muted, marginTop: 6 }}>{sub}</div>}
      {trend && (
        <div style={{ marginTop: 8, fontSize: 11, fontWeight: 600,
          color: trend.up ? T.success : T.danger,
          background: trend.up ? "#14532d22" : "#450a0a22",
          display: "inline-block", padding: "2px 8px", borderRadius: 20,
        }}>
          {trend.up ? "▲" : "▼"} {trend.label}
        </div>
      )}
    </div>
  );

  /* ─────────────────────────────────────────────────────────────────────────
     VIEWS
  ───────────────────────────────────────────────────────────────────────── */

  /* Dashboard */
  const ViewDashboard = () => (
    <>
      {/* Filters */}
      <div style={{ display: "flex", gap: 14, marginBottom: 28, alignItems: "center", flexWrap: "wrap" }}>
        {/* Course Filter */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <select 
            style={{ ...S.select, minWidth: 140, padding: "10px 14px", fontSize: 14, fontWeight: 500 }} 
            value={course} 
            onChange={e => setCourse(e.target.value)}
          >
            <option value="MCA">MCA</option>
            <option value="BCA">BCA</option>
          </select>
        </div>

        {/* Semester Filter */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <select 
            style={{ ...S.select, minWidth: 140, padding: "10px 14px", fontSize: 14, fontWeight: 500 }} 
            value={semester} 
            onChange={e => setSemester(e.target.value)}
          >
            {["1","2","3","4"].map(s => <option key={s} value={s}>Sem {s}</option>)}
          </select>
        </div>

        {/* Subject Filter */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <select 
            style={{ ...S.select, minWidth: 180, padding: "10px 14px", fontSize: 14, fontWeight: 500 }} 
            value={subject} 
            onChange={e => setSubject(e.target.value)}
          >
            <option value="DBMS">DBMS</option>
            <option value="OS">Operating Systems</option>
            <option value="DS">Data Structures</option>
            <option value="ALGO">Algorithms</option>
          </select>
        </div>

        {/* Exam Type Filter */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <select 
            style={{ ...S.select, minWidth: 160, padding: "10px 14px", fontSize: 14, fontWeight: 500 }} 
            value={examType} 
            onChange={e => setExamType(e.target.value)}
          >
            <option value="CIE1">CIE 1</option>
            <option value="CIE2">CIE 2</option>
            <option value="INTERNAL1">Internal 1</option>
            <option value="INTERNAL2">Internal 2</option>
            <option value="FULLRESULT">Full Result</option>
          </select>
        </div>

        {/* Class Filter */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <select 
            style={{ ...S.select, minWidth: 120, padding: "10px 14px", fontSize: 14, fontWeight: 500 }} 
            value={classSection} 
            onChange={e => setClassSection(e.target.value)}
          >
            <option value="A">Class A</option>
            <option value="B">Class B</option>
            <option value="C">Class C</option>
            <option value="All">All Classes</option>
          </select>
        </div>

        {/* Apply Button */}
        <button 
          onClick={handleApplyFilters}
          style={{ 
            ...S.btnPrimary, 
            padding: "10px 32px", 
            fontSize: 15, 
            fontWeight: 600,
            minWidth: 120,
            cursor: "pointer",
            transition: "all 0.2s",
            boxShadow: "0 4px 12px rgba(79, 142, 247, 0.3)"
          }}
          onMouseEnter={e => e.target.style.transform = "translateY(-2px)"}
          onMouseLeave={e => e.target.style.transform = "translateY(0)"}
        >
          Apply
        </button>

        {filterApplied && (
          <div style={{ 
            fontSize: 12, 
            color: T.success, 
            fontWeight: 600, 
            display: "flex", 
            alignItems: "center", 
            gap: 6,
            background: T.border,
            padding: "8px 12px",
            borderRadius: "6px",
            justifyContent: "center"
          }}>
            ✓ Filters Applied: {course} · Sem {semester} · {subject} · {examType} · Class {classSection}
          </div>
        )}
      </div>

      {/* Filter Summary Card */}
      {filterApplied && (
        <div style={{ 
          ...S.card, 
          marginBottom: 20, 
          background: T.accentSoft,
          borderLeft: `4px solid ${T.accent}`,
          padding: "16px 20px"
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>📊 Current Data View</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12 }}>
            <div style={{ fontSize: 11, color: T.text }}>
              <span style={{ color: T.muted }}>Course:</span> <strong>{course}</strong>
            </div>
            <div style={{ fontSize: 11, color: T.text }}>
              <span style={{ color: T.muted }}>Semester:</span> <strong>{semester}</strong>
            </div>
            <div style={{ fontSize: 11, color: T.text }}>
              <span style={{ color: T.muted }}>Subject:</span> <strong>{subject}</strong>
            </div>
            <div style={{ fontSize: 11, color: T.text }}>
              <span style={{ color: T.muted }}>Exam Type:</span> <strong>{examType}</strong>
            </div>
            <div style={{ fontSize: 11, color: T.text }}>
              <span style={{ color: T.muted }}>Class:</span> <strong>{classSection}</strong>
            </div>
            <div style={{ fontSize: 11, color: T.text }}>
              <span style={{ color: T.muted }}>Total Records:</span> <strong>{allMarksData.length}</strong>
            </div>
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        <StatCard label="Total Students" value={allMarksData.length} sub={`${course} · Sem ${semester}`} color={T.accent} trend={{ up: true, label: "+2 this batch" }} />
        <StatCard label="Class Average" value={`${stats.avg}%`} sub="Selected subject" color={T.warning} trend={{ up: false, label: "-1.2% vs last" }} />
        <StatCard label="Pass Rate" value={`${stats.passRate}%`} sub={`${stats.passCount} of ${allMarksData.length} passed`} color={T.success} trend={{ up: true, label: "+3% improved" }} />
        <StatCard label="At-Risk Students" value={weakStudents.length} sub="Scored below 40" color={T.danger} trend={weakStudents.length > 0 ? { up: false, label: "Needs attention" } : null} />
      </div>

      {/* Charts row */}
      <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 16, marginBottom: 24 }}>
        <div style={S.card}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>Subject-wise Average Marks</div>
            <div style={{ fontSize: 12, color: T.muted, marginTop: 3 }}>All subjects this semester</div>
          </div>
          <div style={{ height: 240, position: "relative" }}>
            <Bar data={barData} options={chartDefaults} />
          </div>
        </div>

        <div style={S.card}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>Pass / Fail Distribution</div>
            <div style={{ fontSize: 12, color: T.muted, marginTop: 3 }}>{subject} · {examType}</div>
          </div>
          <div style={{ height: 160, position: "relative", marginBottom: 16 }}>
            <Pie data={pieData} options={pieOptions} />
          </div>
          {[
            { label: "Passed", count: stats.passCount, pct: stats.passRate, color: T.success },
            { label: "Failed", count: stats.failCount, pct: (100 - parseFloat(stats.passRate)).toFixed(1), color: T.danger },
          ].map(row => (
            <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: row.color }} />
                <span style={{ fontSize: 12, color: T.muted }}>{row.label}</span>
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{row.count} students ({row.pct}%)</span>
            </div>
          ))}
        </div>
      </div>

      {/* Student table */}
      <div style={S.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>Student Overview</div>
            <div style={{ fontSize: 12, color: T.muted, marginTop: 3 }}>All students · {subject}</div>
          </div>
          <button style={S.btnSmall} onClick={downloadCSV}>Export CSV</button>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Roll No","Name","DBMS","OS","DS","Algo","Total","Status"].map(h => (
                  <th key={h} style={S.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {studentResultsData.map(s => {
                const pct = parseFloat(s.percentage);
                const status = pct >= 75 ? "pass" : pct >= 40 ? "risk" : "fail";
                const label  = pct >= 75 ? "Good" : pct >= 40 ? "At Risk" : "Fail";
                return (
                  <tr key={s.id} style={{ transition: "background 0.1s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#ffffff08"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <td style={S.td}><span style={{ color: T.muted, fontFamily: "monospace", fontSize: 12 }}>{s.rollNo}</span></td>
                    <td style={{ ...S.td, fontWeight: 600 }}>{s.name}</td>
                    <td style={S.td}>{s.dbms}</td>
                    <td style={S.td}>{s.os}</td>
                    <td style={S.td}>{s.ds}</td>
                    <td style={S.td}>{s.algo}</td>
                    <td style={{ ...S.td, fontWeight: 600, color: T.accent }}>{s.totalMarks}/400</td>
                    <td style={S.td}><span style={S.badge(status)}>{label}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );

  /* Upload Marks */
  const ViewUpload = () => (
    <>
      <SectionHeader title="Upload Marks" subtitle="Enter or update student marks by subject and exam" />

      {/* Filters */}
      <div style={{ display: "flex", gap: 14, marginBottom: 28, alignItems: "center", flexWrap: "wrap" }}>
        {/* Course Filter */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <select 
            style={{ ...S.select, minWidth: 140, padding: "10px 14px", fontSize: 14, fontWeight: 500 }} 
            value={course} 
            onChange={e => setCourse(e.target.value)}
          >
            <option value="MCA">MCA</option>
            <option value="BCA">BCA</option>
          </select>
        </div>

        {/* Semester Filter */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <select 
            style={{ ...S.select, minWidth: 140, padding: "10px 14px", fontSize: 14, fontWeight: 500 }} 
            value={semester} 
            onChange={e => setSemester(e.target.value)}
          >
            {["1","2","3","4"].map(s => <option key={s} value={s}>Sem {s}</option>)}
          </select>
        </div>

        {/* Subject Filter */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <select 
            style={{ ...S.select, minWidth: 180, padding: "10px 14px", fontSize: 14, fontWeight: 500 }} 
            value={subject} 
            onChange={e => setSubject(e.target.value)}
          >
            <option value="DBMS">DBMS</option>
            <option value="OS">Operating Systems</option>
            <option value="DS">Data Structures</option>
            <option value="ALGO">Algorithms</option>
          </select>
        </div>

        {/* Exam Type Filter */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <select 
            style={{ ...S.select, minWidth: 160, padding: "10px 14px", fontSize: 14, fontWeight: 500 }} 
            value={examType} 
            onChange={e => setExamType(e.target.value)}
          >
            <option value="CIE1">CIE 1</option>
            <option value="CIE2">CIE 2</option>
            <option value="INTERNAL1">Internal 1</option>
            <option value="INTERNAL2">Internal 2</option>
            <option value="FULLRESULT">Full Result</option>
          </select>
        </div>

        {/* Class Filter */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <select 
            style={{ ...S.select, minWidth: 120, padding: "10px 14px", fontSize: 14, fontWeight: 500 }} 
            value={classSection} 
            onChange={e => setClassSection(e.target.value)}
          >
            <option value="A">Class A</option>
            <option value="B">Class B</option>
            <option value="C">Class C</option>
            <option value="All">All Classes</option>
          </select>
        </div>

        {/* Apply Button */}
        <button 
          onClick={handleApplyUploadFilters}
          style={{ 
            ...S.btnPrimary, 
            padding: "10px 32px", 
            fontSize: 15, 
            fontWeight: 600,
            minWidth: 120,
            cursor: "pointer",
            transition: "all 0.2s",
            boxShadow: "0 4px 12px rgba(79, 142, 247, 0.3)"
          }}
          onMouseEnter={e => e.target.style.transform = "translateY(-2px)"}
          onMouseLeave={e => e.target.style.transform = "translateY(0)"}
        >
          Apply
        </button>
      </div>

      {/* Confirmation Card - Shows after Apply is clicked */}
      {uploadApplyClicked && (
        <div style={{ ...S.card, marginBottom: 24, border: `2px solid ${T.accent}`, background: `${T.card}dd` }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: T.text, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: T.accent }}>📋</span> Confirm Filter Selection
            </div>
          </div>

          {/* Selected Filters Display */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 20 }}>
            <div style={{ padding: 12, background: T.surface, borderRadius: 8, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 10, color: T.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Course</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{course}</div>
            </div>
            <div style={{ padding: 12, background: T.surface, borderRadius: 8, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 10, color: T.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Semester</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>Sem {semester}</div>
            </div>
            <div style={{ padding: 12, background: T.surface, borderRadius: 8, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 10, color: T.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Subject</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{subject}</div>
            </div>
            <div style={{ padding: 12, background: T.surface, borderRadius: 8, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 10, color: T.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Exam Type</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{examType}</div>
            </div>
            <div style={{ padding: 12, background: T.surface, borderRadius: 8, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 10, color: T.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Class</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>Class {classSection}</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button 
              onClick={() => setUploadApplyClicked(false)}
              style={{ ...S.btnSecondary, padding: "10px 24px" }}
            >
              Back
            </button>
            <button 
              onClick={handleLoadUploadFilters}
              style={{ 
                ...S.btnPrimary, 
                padding: "10px 32px", 
                fontSize: 14, 
                fontWeight: 600,
                transition: "all 0.2s",
                boxShadow: "0 4px 12px rgba(79, 142, 247, 0.4)"
              }}
              onMouseEnter={e => e.target.style.transform = "translateY(-2px)"}
              onMouseLeave={e => e.target.style.transform = "translateY(0)"}
            >
              Load Data
            </button>
          </div>
        </div>
      )}

      {uploadLoadingMessage && (
        <div style={{ fontSize: 12, color: T.success, fontWeight: 600, display: "flex", alignItems: "center", gap: 6, marginBottom: 20, padding: 12, background: `${T.success}15`, borderRadius: 8, border: `1px solid ${T.success}40` }}>
          {uploadLoadingMessage}
        </div>
      )}

      {/* Marks Table - Only visible after Load is clicked */}
      {uploadFiltersApplied && (
        <>
      <div style={S.card}>
        <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>
                {subject} · {examType} · {course} Sem {semester} · Class {classSection}
              </div>
              {uploadFiltersApplied && (
                <div style={{ fontSize: 11, color: T.success, marginTop: 4, fontWeight: 600 }}>
                  ✓ Data Loaded - Ready to Edit
                </div>
              )}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={S.btnPrimary} onClick={() => alert("Marks saved successfully!")}>Save All</button>
            <button style={S.btnSecondary} onClick={downloadCSV}>Export CSV</button>
          </div>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>{["Roll No","Student Name","Current Marks","Edit","Action"].map(h => <th key={h} style={S.th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {currentMarks.map(student => (
              <tr key={student.id}
                onMouseEnter={e => e.currentTarget.style.background = "#ffffff06"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <td style={S.td}><span style={{ color: T.muted, fontFamily: "monospace", fontSize: 12 }}>{student.rollNo}</span></td>
                <td style={{ ...S.td, fontWeight: 600 }}>{student.name}</td>
                <td style={S.td}>
                  <span style={{ fontWeight: 700, color: student.marks < 40 ? T.danger : T.success }}>{student.marks}</span>
                  <span style={{ color: T.muted, fontSize: 12 }}>/100</span>
                </td>
                <td style={S.td}>
                  {editingId === student.id ? (
                    <input type="number" min={0} max={100} value={editVal}
                      onChange={e => setEditVal(e.target.value)}
                      style={{ ...S.input, width: 80, padding: "6px 10px" }} />
                  ) : (
                    <span style={{ color: T.muted, fontSize: 12 }}>—</span>
                  )}
                </td>
                <td style={S.td}>
                  {editingId === student.id ? (
                    <div style={{ display: "flex", gap: 6 }}>
                      <button style={S.btnSuccess} onClick={() => handleUpdateMarks(student.id)}>Save</button>
                      <button style={S.btnDanger} onClick={() => { setEditingId(null); setEditVal(""); }}>Cancel</button>
                    </div>
                  ) : (
                    <button style={S.btnSmall} onClick={() => { setEditingId(student.id); setEditVal(student.marks); }}>Edit</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {weakStudents.length > 0 && (
        <div style={{ ...S.card, marginTop: 20, borderLeft: `3px solid ${T.danger}` }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.danger, marginBottom: 12 }}>
            ⚠ {weakStudents.length} student{weakStudents.length > 1 ? "s" : ""} scoring below 40
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {weakStudents.map(s => (
              <span key={s.id} style={{ fontSize: 12, background: "#450a0a33", color: T.danger, border: "1px solid #450a0a", padding: "4px 12px", borderRadius: 20 }}>
                {s.name} · {s.marks}
              </span>
            ))}
          </div>
        </div>
      )}
      </>
      )}
    </>
  );

  /* Results */
  const ViewResults = () => (
    <>
      <SectionHeader title="View Results" subtitle="Complete student result overview"
        actions={[
          <button key="pdf" style={S.btnSecondary} onClick={downloadPDF}>Export PDF</button>,
          <button key="csv" style={S.btnPrimary} onClick={downloadCSV}>Export CSV</button>,
        ]} />

      {/* Filters */}
      <div style={{ display: "flex", gap: 14, marginBottom: 28, alignItems: "center", flexWrap: "wrap" }}>
        {/* Semester Filter */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <label style={S.label}>Filter by Semester</label>
          <select 
            style={{ ...S.select, minWidth: 160, padding: "10px 14px", fontSize: 14, fontWeight: 500 }} 
            value={resultsSemesterFilter}
            onChange={e => setResultsSemesterFilter(e.target.value)}
          >
            <option value="All">All Semesters</option>
            <option value="Sem 1">Sem 1</option>
            <option value="Sem 2">Sem 2</option>
            <option value="Sem 3">Sem 3</option>
            <option value="Sem 4">Sem 4</option>
          </select>
        </div>

        {/* Subject Filter */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <label style={S.label}>Filter by Subject</label>
          <select 
            style={{ ...S.select, minWidth: 180, padding: "10px 14px", fontSize: 14, fontWeight: 500 }} 
            value={resultsSubjectFilter}
            onChange={e => setResultsSubjectFilter(e.target.value)}
          >
            <option value="All">All Subjects</option>
            <option value="DBMS">DBMS</option>
            <option value="Operating Systems">Operating Systems</option>
            <option value="Data Structures">Data Structures</option>
            <option value="Algorithms">Algorithms</option>
          </select>
        </div>

        {/* Apply Button */}
        <button 
          onClick={handleApplyResultsFilters}
          style={{ 
            ...S.btnPrimary, 
            padding: "10px 32px", 
            fontSize: 15, 
            fontWeight: 600,
            minWidth: 120,
            cursor: "pointer",
            transition: "all 0.2s",
            boxShadow: "0 4px 12px rgba(79, 142, 247, 0.3)",
            marginTop: 20
          }}
          onMouseEnter={e => e.target.style.transform = "translateY(-2px)"}
          onMouseLeave={e => e.target.style.transform = "translateY(0)"}
        >
          Apply
        </button>
      </div>

      {/* Confirmation Card - Shows after Apply is clicked */}
      {resultsApplyClicked && (
        <div style={{ ...S.card, marginBottom: 24, border: `2px solid ${T.accent}`, background: `${T.card}dd` }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: T.text, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: T.accent }}>📋</span> Filter Summary
            </div>
          </div>

          {/* Selected Filters Display */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16, marginBottom: 20 }}>
            <div style={{ padding: 16, background: T.surface, borderRadius: 8, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 10, color: T.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Semester</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>{resultsSemesterFilter}</div>
            </div>
            <div style={{ padding: 16, background: T.surface, borderRadius: 8, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 10, color: T.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Subject</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>{resultsSubjectFilter}</div>
            </div>
          </div>

          {/* Info Message */}
          <div style={{ padding: 12, marginBottom: 16, background: `${T.accent}15`, border: `1px solid ${T.accent}40`, borderRadius: 8, fontSize: 13, color: T.text }}>
            ℹ️ Showing results filtered by {resultsSemesterFilter} and {resultsSubjectFilter}
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button 
              onClick={() => setResultsApplyClicked(false)}
              style={{ ...S.btnSecondary, padding: "10px 24px" }}
            >
              Back
            </button>
            <button 
              onClick={() => {
                console.log(`Results Confirmed: Semester=${resultsSemesterFilter}, Subject=${resultsSubjectFilter}`);
              }}
              style={{ 
                ...S.btnPrimary, 
                padding: "10px 32px", 
                fontSize: 14, 
                fontWeight: 600,
                transition: "all 0.2s",
                boxShadow: "0 4px 12px rgba(79, 142, 247, 0.4)"
              }}
              onMouseEnter={e => e.target.style.transform = "translateY(-2px)"}
              onMouseLeave={e => e.target.style.transform = "translateY(0)"}
            >
              Confirm & View
            </button>
          </div>
        </div>
      )}

      {/* Results Table - Shows after Confirm is clicked */}
      {resultsApplyClicked && (
        <>
      <div style={S.card} id="resultsSection">
        <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>Results</div>
            <div style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>
              {resultsSemesterFilter} · {resultsSubjectFilter}
            </div>
          </div>
        </div>
        
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>{["Roll No","Name","DBMS","OS","DS","Algo","Total","Percentage","Grade"].map(h => <th key={h} style={S.th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {studentResultsData.sort((a,b) => b.percentage - a.percentage).map(s => {
              const pct = parseFloat(s.percentage);
              const grade = pct >= 90 ? "A+" : pct >= 75 ? "A" : pct >= 60 ? "B" : pct >= 45 ? "C" : "F";
              const status = pct >= 75 ? "pass" : pct >= 45 ? "risk" : "fail";
              return (
                <tr key={s.id}
                  onMouseEnter={e => e.currentTarget.style.background = "#ffffff06"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={S.td}><span style={{ color: T.muted, fontFamily: "monospace", fontSize: 12 }}>{s.rollNo}</span></td>
                  <td style={{ ...S.td, fontWeight: 600 }}>{s.name}</td>
                  <td style={S.td}>{s.dbms}</td>
                  <td style={S.td}>{s.os}</td>
                  <td style={S.td}>{s.ds}</td>
                  <td style={S.td}>{s.algo}</td>
                  <td style={{ ...S.td, fontWeight: 700 }}>{s.totalMarks}</td>
                  <td style={{ ...S.td, fontWeight: 700, color: pct >= 40 ? T.success : T.danger }}>{pct}%</td>
                  <td style={S.td}><span style={S.badge(status)}>{grade}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
        </>
      )}
    </>
  );

  /* Performance Analysis */
  const ViewAnalysis = () => {
    const allStats = calcStats(currentMarks.map(s => s.marks));
    return (
      <>
        <SectionHeader title="Performance Analysis" subtitle="Detailed analytics for the selected subject and semester" />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
          <StatCard label="Class Average" value={allStats.avg} color={T.accent} />
          <StatCard label="Highest Marks" value={allStats.highest} color={T.success} />
          <StatCard label="Lowest Marks" value={allStats.lowest} color={T.danger} />
          <StatCard label="Pass Rate" value={`${allStats.passRate}%`} color={T.warning} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
          <div style={S.card}>
            <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 16 }}>Subject-wise Average</div>
            <div style={{ height: 260, position: "relative" }}>
              <Bar data={barData} options={chartDefaults} />
            </div>
          </div>
          <div style={S.card}>
            <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 16 }}>Pass vs Fail</div>
            <div style={{ height: 260, position: "relative" }}>
              <Pie data={pieData} options={pieOptions} />
            </div>
          </div>
        </div>

        {/* Per-student bar */}
        <div style={S.card}>
          <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 16 }}>Individual Student Scores · {subject}</div>
          <div style={{ height: 220, position: "relative" }}>
            <Bar
              data={{
                labels: currentMarks.map(s => s.name),
                datasets: [{
                  label: subject,
                  data: currentMarks.map(s => s.marks),
                  backgroundColor: currentMarks.map(s => s.marks < 40 ? "#ef444499" : s.marks >= 75 ? "#22c55e99" : "#4f8ef799"),
                  borderRadius: 5, barThickness: 28,
                }],
              }}
              options={{ ...chartDefaults, plugins: { ...chartDefaults.plugins, legend: { display: false } } }}
            />
          </div>
        </div>
      </>
    );
  };

  /* Announcements */
  const ViewAnnouncements = () => (
    <>
      <SectionHeader title="Announcements" subtitle="Post updates and notices to students" />

      <div style={{ ...S.card, marginBottom: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 16 }}>Post New Announcement</div>
        
        {/* Filters Row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
          <div>
            <label style={S.label}>Course</label>
            <select style={S.input} value={newAnnouncement.course}
              onChange={e => setNewAnnouncement({ ...newAnnouncement, course: e.target.value })}>
              <option>MCA</option>
              <option>BCA</option>
            </select>
          </div>
          <div>
            <label style={S.label}>Semester</label>
            <select style={S.input} value={newAnnouncement.semester}
              onChange={e => setNewAnnouncement({ ...newAnnouncement, semester: e.target.value })}>
              <option>1</option>
              <option>2</option>
              <option>3</option>
              <option>4</option>
            </select>
          </div>
          <div>
            <label style={S.label}>Subject</label>
            <select style={S.input} value={newAnnouncement.subject}
              onChange={e => setNewAnnouncement({ ...newAnnouncement, subject: e.target.value })}>
              <option>DBMS</option>
              <option>OS</option>
              <option>DS</option>
              <option>Algo</option>
            </select>
          </div>
          <div>
            <label style={S.label}>Class</label>
            <select style={S.input} value={newAnnouncement.class}
              onChange={e => setNewAnnouncement({ ...newAnnouncement, class: e.target.value })}>
              <option>A</option>
              <option>B</option>
              <option>C</option>
              <option>All</option>
            </select>
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={S.label}>Title</label>
          <input style={S.input} placeholder="Announcement title" value={newAnnouncement.title}
            onChange={e => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={S.label}>Message</label>
          <textarea style={S.textarea} placeholder="Write your message…" value={newAnnouncement.message}
            onChange={e => setNewAnnouncement({ ...newAnnouncement, message: e.target.value })} />
        </div>
        <button style={S.btnPrimary} onClick={handleAddAnnouncement}>Post Announcement</button>
      </div>

      {announcements.map(ann => (
        <div key={ann.id} style={{ ...S.card, marginBottom: 12, borderLeft: `3px solid ${T.accent}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{ann.title}</div>
            <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
              <span style={S.badge("info")}>{ann.course}</span>
              <span style={S.badge("info")}>Sem {ann.semester}</span>
              <span style={S.badge("info")}>{ann.subject}</span>
              <span style={S.badge("info")}>Class {ann.class}</span>
              <span style={{ fontSize: 11, color: T.muted }}>{ann.date}</span>
            </div>
          </div>
          <p style={{ fontSize: 13, color: T.textSub, lineHeight: 1.6, margin: 0 }}>{ann.message}</p>
        </div>
      ))}
    </>
  );

  /* Queries */
  const ViewQueries = () => (
    <>
      <SectionHeader title="Student Queries" subtitle="Review and respond to student mark-related queries"
        actions={[
          <div key="badges" style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={S.badge("pending")}>{queries.filter(q => q.status === "Pending").length} Pending</span>
            <span style={S.badge("resolved")}>{queries.filter(q => q.status === "Resolved").length} Resolved</span>
          </div>
        ]} />

      {queries.map(q => (
        <div key={q.id} style={{ ...S.card, marginBottom: 12, borderLeft: `3px solid ${q.status === "Pending" ? T.warning : T.success}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <div style={{ width: 34, height: 34, borderRadius: "50%", background: T.accentSoft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: T.accent }}>
                {q.student[0]}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{q.student}</div>
                <div style={{ fontSize: 11, color: T.muted }}>Subject: {q.subject} · {q.date}</div>
              </div>
            </div>
            <span style={S.badge(q.status === "Pending" ? "pending" : "resolved")}>{q.status}</span>
          </div>
          <p style={{ fontSize: 13, color: T.textSub, margin: "10px 0", lineHeight: 1.6, paddingLeft: 44 }}>{q.query}</p>
          {q.status === "Pending" && (
            <div style={{ paddingLeft: 44 }}>
              <button style={S.btnPrimary} onClick={() => handleReplyQuery(q.id)}>Mark as Resolved</button>
            </div>
          )}
        </div>
      ))}
    </>
  );

  /* Profile */
  const ViewProfile = () => (
    <>
      <SectionHeader title="Faculty Profile" />
      <div style={{ maxWidth: 700 }}>
        <div style={{ ...S.card, marginBottom: 16, display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ ...S.avatarCircle(facultyImage), width: 72, height: 72, fontSize: 24, flexShrink: 0 }}>
            {facultyImage ? <img src={facultyImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "RK"}
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: T.text }}>{editProfileData.name}</div>
            <div style={{ fontSize: 13, color: T.muted, marginTop: 4 }}>{editProfileData.department}</div>
            <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
              <span style={S.badge("info")}>{editProfileData.facultyId}</span>
              <span style={S.badge("info")}>Faculty</span>
            </div>
          </div>
          <div style={{ marginLeft: "auto" }}>
            <input type="file" accept="image/*" onChange={handleImageUpload} id="fac-img" style={{ display: "none" }} />
            <label htmlFor="fac-img" style={{ ...S.btnSmall, display: "inline-block" }}>Change Photo</label>
          </div>
        </div>

        <div style={S.card}>
          {isEditingProfile ? (
            <>
              {[
                { label: "Full Name", key: "name" },
                { label: "Faculty ID", key: "facultyId" },
                { label: "Department", key: "department" },
                { label: "Email", key: "email" },
              ].map(({ label, key }) => (
                <div key={key} style={{ padding: "14px 0", borderBottom: `1px solid ${T.border}`, display: "flex", gap: 16, alignItems: "center" }}>
                  <div style={{ width: 160, fontSize: 11, fontWeight: 600, color: T.muted, textTransform: "uppercase", letterSpacing: "0.07em", paddingTop: 2 }}>{label}</div>
                  <input 
                    type="text"
                    value={editProfileData[key]}
                    onChange={(e) => setEditProfileData({ ...editProfileData, [key]: e.target.value })}
                    disabled={key === "facultyId"}
                    style={{
                      flex: 1,
                      padding: "8px 12px",
                      fontSize: "14px",
                      color: key === "facultyId" ? T.muted : T.text,
                      background: key === "facultyId" ? T.border : T.surface,
                      border: `1px solid ${T.border}`,
                      borderRadius: "6px",
                      fontFamily: "inherit",
                      opacity: key === "facultyId" ? 0.6 : 1,
                      cursor: key === "facultyId" ? "not-allowed" : "text",
                    }}
                  />
                </div>
              ))}
              <div style={{ padding: "20px 0", display: "flex", gap: 12 }}>
                <button onClick={handleSaveProfile} style={{ ...S.btnPrimary }}>✓ Save Profile</button>
                <button onClick={handleCancelEdit} style={{ ...S.btnSecondary }}>✕ Cancel</button>
              </div>
            </>
          ) : (
            <>
              {[
                { label: "Full Name", value: editProfileData.name },
                { label: "Faculty ID", value: editProfileData.facultyId },
                { label: "Department", value: editProfileData.department },
                { label: "Email", value: editProfileData.email },
              ].map(({ label, value }) => (
                <div key={label} style={{ padding: "14px 0", borderBottom: `1px solid ${T.border}`, display: "flex", gap: 16 }}>
                  <div style={{ width: 160, fontSize: 11, fontWeight: 600, color: T.muted, textTransform: "uppercase", letterSpacing: "0.07em", paddingTop: 2 }}>{label}</div>
                  <div style={{ fontSize: 14, color: T.text, fontWeight: 500 }}>{value}</div>
                </div>
              ))}
              <div style={{ padding: "14px 0", display: "flex", gap: 16 }}>
                <div style={{ width: 160, fontSize: 11, fontWeight: 600, color: T.muted, textTransform: "uppercase", letterSpacing: "0.07em", paddingTop: 2 }}>Subjects</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {facultyDetails.subjectsAssigned.map(s => (
                    <span key={s} style={S.badge("info")}>{s}</span>
                  ))}
                </div>
              </div>
              <div style={{ padding: "20px 0" }}>
                <button onClick={() => setIsEditingProfile(true)} style={{ ...S.btnPrimary }}>✎ Edit Profile</button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );

  /* ─────────────────────────────────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────────────────────────────────── */
  return (
    <div style={S.root}>
      {/* ── Sidebar ───────────────────────────────────────────────────────── */}
      <aside style={S.sidebar}>
        <div 
          style={S.sidebarLogo}
          onClick={() => setView("dashboard")}
          onMouseEnter={e => e.currentTarget.style.background = T.border}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          title="Click to go to Dashboard"
        >
          <img src={logo2} alt="Result Analysis Logo" style={{ width: 36, height: 36, borderRadius: "8px", flexShrink: 0, objectFit: "contain" }} />
          <div>
            <div style={S.sidebarBrand}>Result Analysis</div>
            <div style={S.sidebarTitle}>Faculty Portal</div>
          </div>
        </div>

        {/* Avatar */}
        <div style={S.avatarWrap}>
          <div style={S.avatarCircle(facultyImage)}>
            {facultyImage
              ? <img src={facultyImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : "RK"}
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{facultyDetails.name}</div>
          <div style={{ fontSize: 11, color: T.muted, marginTop: 3 }}>{facultyDetails.facultyId}</div>
          <div style={{ marginTop: 8 }}>
            <span style={{ ...S.badge("info"), fontSize: 10 }}>MCA Dept.</span>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "8px 0" }}>
          <div style={S.navSection}>Main</div>
          {NAV.slice(0, 4).map(item => (
            <div key={item.key} style={S.navItem(view === item.key)} onClick={() => setView(item.key)}>
              <span style={{ fontSize: 14, opacity: 0.8 }}>{item.icon}</span>
              {item.label}
            </div>
          ))}
          <div style={S.navSection}>Communication</div>
          {NAV.slice(4).map(item => (
            <div key={item.key} style={S.navItem(view === item.key)} onClick={() => setView(item.key)}>
              <span style={{ fontSize: 14, opacity: 0.8 }}>{item.icon}</span>
              {item.label}
            </div>
          ))}
          <div style={{ borderTop: `1px solid ${T.border}`, margin: "12px 0" }} />
          <div style={{ ...S.navItem(false), color: T.danger }} onClick={() => setDashboard(null)}>
            <span style={{ fontSize: 14 }}>⏻</span> Logout
          </div>
        </nav>

        {/* AI badge */}
        <div style={{ margin: "0 16px 16px", background: "#1e1b4b", border: "1px solid #312e81", borderRadius: 10, padding: "10px 12px" }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#a78bfa", marginBottom: 3 }}>✦ AI Insights Active</div>
          <div style={{ fontSize: 10, color: T.muted, lineHeight: 1.5 }}>Smart predictions & analysis enabled</div>
        </div>
      </aside>

      {/* ── Main ──────────────────────────────────────────────────────────── */}
      <main style={S.main}>
        {/* Topbar */}
        <header style={S.topbar}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: T.text }}>
              {NAV.find(n => n.key === view)?.label || "Dashboard"}
            </div>
            <div style={{ fontSize: 11, color: T.muted }}>Academic Year 2024–25 · {course} Sem {semester}</div>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ fontSize: 12, color: T.muted }}>
              {new Date().toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
            </div>
            {/* Theme Toggle Button */}
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              style={{
                width: 34, height: 34, borderRadius: "50%", 
                background: T.accentSoft, border: `1px solid ${T.accent}40`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16, cursor: "pointer", color: T.accent,
                transition: "all 0.3s",
              }}
              title={isDarkMode ? "Light Mode" : "Dark Mode"}
            >
              {isDarkMode ? "☀️" : "🌙"}
            </button>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: T.accentSoft, border: `1px solid ${T.accent}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: T.accent }}>
              RK
            </div>
          </div>
        </header>

        {/* Content */}
        <div style={S.content}>
          {view === "dashboard"     && <ViewDashboard />}
          {view === "upload"        && <ViewUpload />}
          {view === "results"       && <ViewResults />}
          {view === "analysis"      && <ViewAnalysis />}
          {view === "announcements" && <ViewAnnouncements />}
          {view === "queries"       && <ViewQueries />}
          {view === "profile"       && <ViewProfile />}
        </div>
      </main>
    </div>
  );
}
