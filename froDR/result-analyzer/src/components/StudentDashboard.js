import React, { useState, useEffect, useRef } from "react";
import { Bar, Line, Doughnut } from "react-chartjs-2";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import Sidebar from "./Sidebar";
import AIInsight from "./AIInsight";
import { studentAPI } from "../api";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend
);

/* ════════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════════════════ */
function StudentDashboard({ setDashboard, setPage, announcements: initialAnnouncements = [] }) {

  /* ── State ─────────────────────────────────────────────────────────────── */
  const [view, setView]     = useState("dashboard");
  const [dark, setDark]     = useState(true);
  const [course, setCourse] = useState("MCA");
  const [semester, setSem]  = useState("Sem1");
  const [exam, setExam]     = useState("CIE1");

  // Filters (pending vs applied)
  const [pendingCourse, setPendingCourse] = useState("MCA");
  const [pendingSem,    setPendingSem]    = useState("Sem1");
  const [pendingExam,   setPendingExam]   = useState("CIE1");
  const [appliedCourse, setAppliedCourse] = useState("MCA");
  const [appliedSem,    setAppliedSem]    = useState("Sem1");
  const [appliedExam,   setAppliedExam]   = useState("CIE1");

  // Concerns — from backend
  const [concerns,    setConcerns]    = useState([]);
  const [concernForm, setConcernForm] = useState({ subject:"", examType:"CIE1", description:"", marksObtained:"" });
  const [concernSent, setConcernSent] = useState(false);

  // Summary from backend
  const [summary, setSummary] = useState({ overall_pct: 0, subjects: [] });

  // Notifications — from backend
  const [announcements, setAnnouncements] = useState(initialAnnouncements);
  const [notifOpen, setNotifOpen]         = useState(false);
  const notifRef = useRef(null);

  useEffect(() => {
    setAnnouncements(initialAnnouncements);
  }, [initialAnnouncements]);

  // Subjects — from backend
  const [subjects,       setSubjects]       = useState([]);
  const [loadedExamType, setLoadedExamType] = useState("CIE1");

  /* ── fetchWithAuth helper (same as doc 9) ──────────────────────────────── */
  const fetchWithAuth = async (path, options = {}) => {
    const token = localStorage.getItem('token');
    const url = path.startsWith('http') ? path : `http://localhost:5000${path}`;
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : undefined,
        ...(options.headers || {}),
      },
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Request failed');
    }
    return res.json().catch(() => ({}));
  };

  const downloadAnnouncementFile = async (announcement) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('You must be logged in to download files.');

      const response = await fetch(`http://localhost:5000/api/student/announcements/${announcement.id}/download`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Download failed');
      }

      const blob = await response.blob();
      const filename = announcement.attachment
        ? announcement.attachment.split('/').pop().split('\\').pop()
        : `announcement-${announcement.id}`;
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
      alert(err.message || 'Unable to download attachment.');
    }
  };

  /* ── Effects ───────────────────────────────────────────────────────────── */
  useEffect(() => {
    document.body.className = dark ? "sd-dark-body" : "sd-light-body";
    return () => { document.body.className = ""; };
  }, [dark]);

  useEffect(() => {
    const handler = () => { if (setPage) setPage("profile"); };
    window.addEventListener("openProfile", handler);
    return () => window.removeEventListener("openProfile", handler);
  }, [setPage]);

  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  /* ── Load concerns, announcements, summary, profile from backend ──────── */
  useEffect(() => {
    studentAPI.getConcerns().then(setConcerns).catch(console.error);
  }, []);

  useEffect(() => {
    studentAPI.getAnnouncements().then(setAnnouncements).catch(console.error);
  }, []);

  useEffect(() => {
    studentAPI.getMarksSummary()
      .then(setSummary)
      .catch(console.error);

    studentAPI.getProfile()
      .then(profile => {
        const courseValue   = profile.course   || "MCA";
        const semesterValue = profile.semester || "Sem1";
        setCourse(courseValue);
        setPendingCourse(courseValue);
        setAppliedCourse(courseValue);
        setSem(semesterValue);
        setPendingSem(semesterValue);
        setAppliedSem(semesterValue);
      })
      .catch(console.error);
  }, []);

  /* ── Load subject marks from backend ──────────────────────────────────── */
  const loadSubjectMarks = async (semesterValue, examValue) => {
    try {
      let rows = await studentAPI.getMarks({ semester: semesterValue, exam_type: examValue });
      let type = examValue;
      if (!rows.length && examValue !== "FULLRESULT") {
        rows = await studentAPI.getMarks({ semester: semesterValue, exam_type: "FULLRESULT" });
        type = "FULLRESULT";
      }
      setSubjects(rows.map(r => ({ name: r.subject, marks: r.marks })));
      setLoadedExamType(type);
    } catch (error) {
      console.error(error);
      setSubjects([]);
      setLoadedExamType(examValue);
    }
  };

  useEffect(() => {
    loadSubjectMarks(appliedSem, appliedExam);
  }, [appliedSem, appliedExam]);

  /* ── Notification helpers — backend ───────────────────────────────────── */
  const allNotifs   = announcements || [];
  const unreadCount = allNotifs.filter(a => !a.read).length;

  const markAllRead = async () => {
    try {
      await fetchWithAuth('/api/student/announcements/read-all', { method: 'POST' });
      setAnnouncements(prev => prev.map(a => ({ ...a, read: 1 })));
    } catch (err) {
      console.error(err);
    }
  };

  const markOneRead = async (id) => {
    const announcement = announcements.find(a => a.id === id);
    if (!announcement || announcement.read) return;
    try {
      await fetchWithAuth(`/api/student/announcements/${id}/read`, { method: 'POST' });
      setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, read: 1 } : a));
    } catch (err) {
      console.error(err);
    }
  };

  /* ── Concern submit — backend ──────────────────────────────────────────── */
  const submitConcern = async () => {
    if (!concernForm.subject.trim() || !concernForm.description.trim()) return;
    try {
      await studentAPI.postConcern(concernForm);
      // Refresh concerns list from backend
      const updated = await studentAPI.getConcerns();
      setConcerns(updated);
      setConcernForm({ subject:"", examType:"CIE1", description:"", marksObtained:"" });
      setConcernSent(true);
      setTimeout(() => setConcernSent(false), 3500);
    } catch (err) {
      alert(err.message);
    }
  };

  /* ── Filters ───────────────────────────────────────────────────────────── */
  const applyFilters = () => {
    setAppliedCourse(pendingCourse);
    setAppliedSem(pendingSem);
    setAppliedExam(pendingExam);
    setCourse(pendingCourse);
    setSem(pendingSem);
    setExam(pendingExam);
  };

  /* ── Derived stats from backend subjects ──────────────────────────────── */
  const semesterAverages = summary.subjects.reduce((acc, subject) => {
    const sem = subject.semester;
    if (!sem) return acc;
    if (!acc[sem]) acc[sem] = { sum: 0, count: 0 };
    acc[sem].sum   += subject.avg_pct || 0;
    acc[sem].count += 1;
    return acc;
  }, {});

  const semesterMarks = Object.entries(semesterAverages)
    .map(([sem, { sum, count }]) => ({ sem, cgpa: count ? Number((sum / count).toFixed(2)) : 0 }))
    .sort((a, b) => Number(a.sem.replace(/\D/g, '')) - Number(b.sem.replace(/\D/g, '')));

  const weakSubjects = subjects.filter(s => s.marks < 40);
  const avgMarks     = subjects.length ? subjects.reduce((a, s) => a + s.marks, 0) / subjects.length : 0;
  const passCount    = subjects.filter(s => s.marks >= 40).length;
  const failCount    = subjects.length ? subjects.length - passCount : 0;
  const cgpaTrend    = semesterMarks.map(s => s.cgpa);
  const loadedExamLabel = loadedExamType === "FULLRESULT" ? "Final Result" : loadedExamType;

  /* ── Charts ────────────────────────────────────────────────────────────── */
  const gridColor   = dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.07)";
  const tickColor   = dark ? "#94a3b8" : "#64748b";
  const legendColor = dark ? "#94a3b8" : "#475569";

  const chartDefaults = {
    responsive:true, maintainAspectRatio:true,
    plugins:{
      legend:{ labels:{ color:legendColor, font:{size:12} } },
      tooltip:{ backgroundColor:dark?"#1e293b":"#fff", titleColor:dark?"#e2e8f0":"#1e293b", bodyColor:dark?"#94a3b8":"#475569", borderColor:dark?"#334155":"#e2e8f0", borderWidth:1 },
    },
    scales:{
      x:{ grid:{color:gridColor}, ticks:{color:tickColor} },
      y:{ grid:{color:gridColor}, ticks:{color:tickColor} },
    },
  };

  const barColors = ["#3b82f6","#22c55e","#f59e0b","#a855f7","#06b6d4"];
  const barData   = { labels:subjects.map(s=>s.name), datasets:subjects.map((subject,index)=>({ label:subject.name, data:subjects.map(s=>s.name===subject.name?s.marks:null), backgroundColor:barColors[index%barColors.length], borderRadius:6, borderSkipped:false })) };
  const lineData  = { labels:semesterMarks.map(s=>s.sem), datasets:[{ label:"CGPA", data:semesterMarks.map(s=>s.cgpa), borderColor:"#f59e0b", backgroundColor:"rgba(245,158,11,0.1)", tension:0.4, pointBackgroundColor:"#f59e0b", pointRadius:5, fill:true }] };
  const donutData = { labels:["Passed","Failed"], datasets:[{ data:[passCount,failCount], backgroundColor:["#22c55e","#ef4444"], borderWidth:0, hoverOffset:4 }] };
  const donutOptions = { responsive:true, cutout:"70%", plugins:{ legend:{ position:"bottom", labels:{ color:legendColor, padding:16, font:{size:12} } }, tooltip:{ backgroundColor:dark?"#1e293b":"#fff", titleColor:dark?"#e2e8f0":"#1e293b", bodyColor:dark?"#94a3b8":"#475569", borderColor:dark?"#334155":"#e2e8f0", borderWidth:1 } } };

  /* ── AI messages ───────────────────────────────────────────────────────── */
  const aiMessage       = avgMarks>=80?"Excellent performance! You are performing at a top academic level.":avgMarks>=60?"Good performance overall, but there is room for improvement.":"Your performance is below average. Focus on improving weak subjects.";
  const progressMessage = cgpaTrend.length > 1
    ? cgpaTrend[cgpaTrend.length-1] > cgpaTrend[0]
      ? "Your CGPA trend shows improvement across semesters."
      : cgpaTrend[cgpaTrend.length-1] === cgpaTrend[0]
        ? "Your CGPA trend is stable."
        : "Your CGPA trend is declining. Focus on academics."
    : "Not enough semester data to show trend yet.";
  const studyPlan = weakSubjects.length > 0
    ? `Spend more time studying ${weakSubjects.map(s=>s.name).join(", ")}. Practice previous year questions.`
    : "No weak subjects detected. Maintain your consistency.";

  /* ── AI data context — built from real backend data ───────────────────── */
  const aiDataContext = [
    `Student: ${appliedCourse} · ${appliedSem} · ${loadedExamLabel}`,
    `Subjects: ${subjects.map(s => s.name+'='+s.marks+'%').join(', ') || 'No data loaded'}`,
    `Avg marks: ${avgMarks.toFixed(1)} | Pass: ${passCount} | Fail: ${failCount}`,
    `Weak subjects (below 40): ${weakSubjects.length > 0 ? weakSubjects.map(s=>s.name).join(', ') : 'None'}`,
    `Semester trend: ${semesterMarks.map(s=>s.sem+'='+s.cgpa).join(', ') || 'No trend data'}`,
    `Overall %: ${summary.overall_pct || 0}`,
  ].join('\n');

  /* ── Downloads ─────────────────────────────────────────────────────────── */
  const downloadResult = async () => {
    const input = document.getElementById("resultSection");
    if (!input) { alert("Result section not available."); return; }
    const canvas = await html2canvas(input);
    const pdf = new jsPDF();
    pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, 210, 120);
    pdf.save("result.pdf");
  };
  const downloadCSV = () => {
    const rows = [["Subject","Marks","Status"]];
    subjects.forEach(s => rows.push([s.name,s.marks,s.marks<40?"Weak":"Good"]));
    const blob = new Blob([rows.map(r=>r.join(",")).join("\n")],{type:"text/csv"});
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "results.csv";
    link.click();
  };

  /* ── Theme ─────────────────────────────────────────────────────────────── */
  const t = dark
    ? { bg:"#0f172a", surface:"#1e293b", surface2:"#162032", border:"#2a3348", text:"#e2e8f0", textSub:"#94a3b8", inputBg:"#0f172a" }
    : { bg:"#f1f5f9", surface:"#ffffff", surface2:"#f8fafc", border:"#e2e8f0", text:"#1e293b", textSub:"#64748b", inputBg:"#ffffff" };

  const s = {
    wrap:        { display:"flex", minHeight:"100vh", background:t.bg, fontFamily:"'DM Sans','Segoe UI',sans-serif", color:t.text, transition:"background 0.3s,color 0.3s" },
    main:        { flex:1, display:"flex", flexDirection:"column", overflow:"hidden" },
    topbar:      { display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 28px", background:t.surface, borderBottom:`1px solid ${t.border}` },
    topTitle:    { fontSize:20, fontWeight:700, color:t.text },
    topSub:      { fontSize:12, color:t.textSub, marginTop:2 },
    toggle:      { display:"flex", alignItems:"center", gap:8, background:t.surface2, border:`1px solid ${t.border}`, borderRadius:24, padding:"6px 14px", cursor:"pointer", fontSize:13, color:t.textSub },
    content:     { flex:1, padding:28, overflowY:"auto" },
    filtersRow:  { display:"flex", gap:10, alignItems:"center", marginBottom:24, flexWrap:"wrap" },
    select:      { background:t.inputBg, border:`1px solid ${t.border}`, color:t.text, borderRadius:8, padding:"8px 14px", fontSize:13, outline:"none", cursor:"pointer" },
    applyBtn:    { background:"#3b82f6", color:"#fff", border:"none", borderRadius:8, padding:"8px 20px", fontWeight:600, fontSize:13, cursor:"pointer" },
    statsRow:    { display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:16, marginBottom:24 },
    chartsRow:   { display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:24 },
    chartsRow3:  { display:"grid", gridTemplateColumns:"2fr 1fr", gap:16, marginBottom:24 },
    card:(a)=>  ({ background:t.surface, border:`1px solid ${t.border}`, borderTop:`3px solid ${a}`, borderRadius:12, padding:"20px 24px", transition:"all 0.2s" }),
    chartBox:    { background:t.surface, border:`1px solid ${t.border}`, borderRadius:12, padding:"20px 24px" },
    cardLabel:   { fontSize:12, color:t.textSub, fontWeight:600, letterSpacing:"0.05em", textTransform:"uppercase", marginBottom:8 },
    cardValue:   { fontSize:30, fontWeight:700, color:t.text },
    cardSub:     { fontSize:12, color:t.textSub, marginTop:4 },
    sectionTitle:{ fontSize:16, fontWeight:600, color:t.text, marginBottom:4 },
    sectionSub:  { fontSize:12, color:t.textSub, marginBottom:16 },
    table:       { width:"100%", borderCollapse:"collapse" },
    th:          { padding:"10px 14px", textAlign:"left", fontSize:11, fontWeight:600, color:t.textSub, textTransform:"uppercase", letterSpacing:"0.05em", borderBottom:`1px solid ${t.border}` },
    td:          { padding:"12px 14px", fontSize:13, color:t.text, borderBottom:`1px solid ${t.border}` },
    aiCard:      { background:t.surface, border:`1px solid ${t.border}`, borderLeft:"3px solid #3b82f6", borderRadius:10, padding:"16px 20px", marginBottom:12 },
    aiTitle:     { fontSize:13, fontWeight:600, color:"#3b82f6", marginBottom:6 },
    aiText:      { fontSize:13, color:t.textSub, lineHeight:1.6 },
    dlBtn:       { background:"#3b82f6", color:"#fff", border:"none", borderRadius:8, padding:"10px 22px", fontWeight:600, fontSize:13, cursor:"pointer" },
    dlBtnAlt:    { background:t.surface2, color:t.text, border:`1px solid ${t.border}`, borderRadius:8, padding:"10px 22px", fontWeight:600, fontSize:13, cursor:"pointer" },
    annCard:     { background:t.surface, border:`1px solid ${t.border}`, borderLeft:"4px solid #3b82f6", borderRadius:10, padding:"16px 20px", marginBottom:14 },
    filterBar:   { display:"flex", gap:10, alignItems:"center", marginBottom:16, flexWrap:"wrap" },
    input:       { width:"100%", padding:"10px 14px", background:t.inputBg, border:`1px solid ${t.border}`, borderRadius:8, color:t.text, fontSize:13, outline:"none", boxSizing:"border-box", fontFamily:"inherit" },
    textarea:    { width:"100%", padding:"10px 14px", background:t.inputBg, border:`1px solid ${t.border}`, borderRadius:8, color:t.text, fontSize:13, outline:"none", boxSizing:"border-box", fontFamily:"inherit", minHeight:110, resize:"vertical" },
    label:       { fontSize:11, fontWeight:600, color:t.textSub, textTransform:"uppercase", letterSpacing:"0.07em", display:"block", marginBottom:6 },
  };

  const viewTitles = { dashboard:"Dashboard", results:"Results", analysis:"Analysis", announcements:"Announcements", progress:"Progress", download:"Download", concerns:"Raise a Concern" };

  /* ══════════════════════════════════════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════════════════════════════════════ */
  return (
    <div style={s.wrap}>

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <Sidebar
        setDashboard={setDashboard}
        setView={setView}
        setPage={setPage}
        activeView={view}
        downloadCSV={downloadCSV}
        downloadPDF={downloadResult}
      />

      {/* ── Main ────────────────────────────────────────────────────────── */}
      <div style={s.main}>

        {/* ── Topbar ──────────────────────────────────────────────────── */}
        <div style={s.topbar}>
          <div>
            <div style={s.topTitle}>{viewTitles[view] || "Dashboard"}</div>
            <div style={s.topSub}>Academic Year 2024–25 · {course} {semester}</div>
          </div>

          <div style={{ display:"flex", alignItems:"center", gap:12 }}>

            {/* ── Bell icon ─────────────────────────────────────────────── */}
            <div ref={notifRef} style={{ position:"relative" }}>
              <button
                onClick={() => setNotifOpen(o => !o)}
                style={{
                  position:"relative", background:t.surface2,
                  border:`1px solid ${unreadCount>0?"rgba(245,158,11,0.5)":t.border}`,
                  borderRadius:10, width:40, height:40, cursor:"pointer",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:18, color: unreadCount>0?"#f59e0b":t.textSub,
                  boxShadow: unreadCount>0?"0 0 0 3px rgba(245,158,11,0.1)":"none",
                  transition:"all 0.2s",
                }}
              >
                🔔
                {unreadCount > 0 && (
                  <span style={{
                    position:"absolute", top:-6, right:-6,
                    background:"#ef4444", color:"#fff",
                    fontSize:10, fontWeight:800,
                    minWidth:18, height:18, borderRadius:9,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    padding:"0 4px",
                    border:`2px solid ${t.bg}`,
                  }}>
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification dropdown */}
              {notifOpen && (
                <div style={{
                  position:"absolute", top:48, right:0, zIndex:999,
                  width:370, maxHeight:500,
                  background:t.surface, border:`1px solid ${t.border}`,
                  borderRadius:14, boxShadow:"0 24px 56px rgba(0,0,0,0.4)",
                  overflow:"hidden", display:"flex", flexDirection:"column",
                }}>
                  <div style={{ padding:"14px 18px 12px", borderBottom:`1px solid ${t.border}`, display:"flex", justifyContent:"space-between", alignItems:"center", background:t.surface }}>
                    <div>
                      <div style={{ fontSize:14, fontWeight:700, color:t.text }}>🔔 Notifications</div>
                      <div style={{ fontSize:11, color:t.textSub, marginTop:2 }}>
                        {unreadCount > 0 ? `${unreadCount} unread message${unreadCount>1?"s":""}` : "All caught up!"}
                      </div>
                    </div>
                    {unreadCount > 0 && (
                      <button onClick={markAllRead}
                        style={{ fontSize:11, fontWeight:600, color:"#3b82f6", background:"rgba(59,130,246,0.1)", border:"1px solid rgba(59,130,246,0.2)", borderRadius:6, padding:"5px 10px", cursor:"pointer" }}>
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div style={{ overflowY:"auto", flex:1 }}>
                    {allNotifs.length === 0 ? (
                      <div style={{ padding:"48px 20px", textAlign:"center", color:t.textSub }}>
                        <div style={{ fontSize:36, marginBottom:10 }}>📭</div>
                        <div style={{ fontSize:13 }}>No notifications yet</div>
                      </div>
                    ) : allNotifs.map(ann => {
                      const isUnread = !ann.read;
                      return (
                        <div key={ann.id}
                          onClick={() => { markOneRead(ann.id); setNotifOpen(false); setView("announcements"); }}
                          style={{
                            padding:"13px 18px", cursor:"pointer",
                            borderBottom:`1px solid ${t.border}`,
                            background: isUnread ? (dark?"rgba(59,130,246,0.07)":"rgba(59,130,246,0.04)") : "transparent",
                            display:"flex", gap:12, alignItems:"flex-start",
                          }}
                          onMouseEnter={e => e.currentTarget.style.background=dark?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.02)"}
                          onMouseLeave={e => e.currentTarget.style.background=isUnread?(dark?"rgba(59,130,246,0.07)":"rgba(59,130,246,0.04)"):"transparent"}
                        >
                          <div style={{ marginTop:5, flexShrink:0, width:8, height:8, borderRadius:"50%", background:isUnread?"#3b82f6":"transparent", border:isUnread?"none":`1px solid ${t.border}` }} />
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontSize:13, fontWeight:isUnread?600:400, color:t.text, marginBottom:3, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                              {ann.title}
                            </div>
                            <div style={{ fontSize:12, color:t.textSub, lineHeight:1.5, marginBottom:6, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>
                              {ann.message}
                            </div>
                            <div style={{ display:"flex", gap:5, alignItems:"center", flexWrap:"wrap" }}>
                              {[ann.subject, `Sem ${ann.semester}`].map((tag,i)=>(
                                <span key={i} style={{ fontSize:10, fontWeight:600, background:dark?"#1e3a6e33":"#eff6ff", color:"#3b82f6", border:`1px solid ${dark?"#1e3a6e":"#bfdbfe"}`, padding:"2px 6px", borderRadius:20 }}>{tag}</span>
                              ))}
                              <span style={{ fontSize:10, color:t.textSub, marginLeft:"auto" }}>{ann.date}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ padding:"10px 18px", borderTop:`1px solid ${t.border}`, textAlign:"center" }}>
                    <button onClick={() => { setNotifOpen(false); setView("announcements"); }}
                      style={{ fontSize:12, fontWeight:600, color:"#3b82f6", background:"none", border:"none", cursor:"pointer" }}>
                      View all announcements →
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ── Dark/Light toggle ──────────────────────────────────────── */}
            <button style={s.toggle} onClick={() => setDark(d => !d)}>
              <span style={{ fontSize:16 }}>{dark?"☀️":"🌙"}</span>
              {dark?"Light Mode":"Dark Mode"}
            </button>
          </div>
        </div>

        {/* ── Content area ────────────────────────────────────────────── */}
        <div style={s.content}>

          {/* ═══ DASHBOARD ══════════════════════════════════════════════ */}
          {view === "dashboard" && (
            <>
              <div style={s.filtersRow}>
                <select style={s.select} value={pendingCourse} onChange={e=>setPendingCourse(e.target.value)}><option>MCA</option></select>
                <select style={s.select} value={pendingSem} onChange={e=>setPendingSem(e.target.value)}>
                  <option>Sem1</option><option>Sem2</option><option>Sem3</option><option>Sem4</option>
                </select>
                <select style={s.select} value={pendingExam} onChange={e=>setPendingExam(e.target.value)}>
                  <option value="CIE1">CIE1</option><option value="CIE2">CIE2</option><option value="Internal1">Internal1</option><option value="Internal2">Internal2</option><option value="FULLRESULT">Final Result</option>
                </select>
                <button style={s.applyBtn} onClick={applyFilters}>Apply</button>
              </div>

              <div style={s.statsRow}>
                {[
                  { label:"Average %",     value:`${subjects.length ? avgMarks.toFixed(1) : 0}%`, sub:`${appliedCourse} · ${appliedSem} · ${loadedExamLabel}`, accent:"#3b82f6", badge:"Based on selected exam", bc:"#22c55e" },
                  { label:"Subjects",      value:subjects.length || 0,                             sub:"Current exam records",   accent:"#f59e0b", badge:`${passCount} passed`, bc:"#22c55e" },
                  { label:"Pass Rate",     value:`${subjects.length ? Math.round((passCount/subjects.length)*100) : 0}%`, sub:"For selected exam", accent:"#22c55e", badge:`${failCount} fail`, bc:"#22c55e" },
                  { label:"Weak Subjects", value:weakSubjects.length || 0,                         sub:"Needs attention",        accent:"#a855f7", badge:"Review these", bc:"#f59e0b" },
                ].map((c,i)=>(
                  <div key={i} style={s.card(c.accent)}>
                    <div style={s.cardLabel}>{c.label}</div>
                    <div style={s.cardValue}>{c.value}</div>
                    <div style={{ ...s.cardSub, display:"flex", justifyContent:"space-between", marginTop:8 }}>
                      <span>{c.sub}</span>
                      <span style={{ color:c.bc, fontWeight:600, fontSize:11 }}>{c.badge}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div style={s.chartsRow3}>
                <div style={s.chartBox}>
                  <div style={s.sectionTitle}>Subject-wise Marks</div>
                  <div style={s.sectionSub}>All subjects this semester</div>
                  {subjects.length > 0
                    ? <Bar data={barData} options={chartDefaults} />
                    : <div style={{ textAlign:"center", padding:"40px 0", color:t.textSub, fontSize:13 }}>No marks data loaded yet.</div>
                  }
                </div>
                <div style={s.chartBox}>
                  <div style={s.sectionTitle}>Pass / Fail Distribution</div>
                  <div style={s.sectionSub}>{loadedExamLabel}</div>
                  {subjects.length > 0
                    ? <Doughnut data={donutData} options={donutOptions} />
                    : <div style={{ textAlign:"center", padding:"40px 0", color:t.textSub, fontSize:13 }}>No data.</div>
                  }
                  <div style={{ marginTop:16, display:"flex", justifyContent:"space-between", fontSize:12 }}>
                    <span style={{color:"#22c55e"}}>● Passed <strong>{passCount} ({subjects.length ? Math.round(passCount/subjects.length*100) : 0}%)</strong></span>
                    <span style={{color:"#ef4444"}}>● Failed <strong>{failCount} ({subjects.length ? Math.round(failCount/subjects.length*100) : 0}%)</strong></span>
                  </div>
                </div>
              </div>

              <div style={s.chartsRow}>
                <div style={s.chartBox}>
                  <div style={s.sectionTitle}>CGPA Progress</div>
                  <div style={s.sectionSub}>Semester-wise trend</div>
                  {semesterMarks.length > 0
                    ? <Line data={lineData} options={chartDefaults} />
                    : <div style={{ textAlign:"center", padding:"40px 0", color:t.textSub, fontSize:13 }}>No semester data available.</div>
                  }
                </div>
                <div style={s.chartBox}>
                  <div style={s.sectionTitle}>Quick Analysis</div>
                  <div style={s.sectionSub}>AI-powered insights</div>
                  {[
                    { label:"Performance", text:aiMessage,       color:"#3b82f6" },
                    { label:"Progress",    text:progressMessage, color:"#22c55e" },
                    { label:"Study Plan",  text:studyPlan,       color:"#f59e0b" },
                  ].map((item,i)=>(
                    <div key={i} style={{ ...s.aiCard, borderLeftColor:item.color, marginBottom:10 }}>
                      <div style={{ ...s.aiTitle, color:item.color }}>{item.label}</div>
                      <div style={s.aiText}>{item.text}</div>
                    </div>
                  ))}
                </div>
              </div>
              <AIInsight role="student" dataContext={aiDataContext} dark={dark} />
            </>
          )}

          {/* ═══ RESULTS ════════════════════════════════════════════════ */}
          {view === "results" && (
            <div>
              <div style={s.filterBar}>
                <FilterSelect value={pendingCourse} onChange={setPendingCourse} options={["MCA"]} dark={dark} t={t} />
                <FilterSelect value={pendingSem}    onChange={setPendingSem}    options={["Sem1","Sem2","Sem3","Sem4"]} dark={dark} t={t} />
                <FilterSelect value={pendingExam}   onChange={setPendingExam}   options={["CIE1","CIE2","Internal1","Internal2","FULLRESULT"]} dark={dark} t={t} />
                <button style={s.applyBtn} onClick={applyFilters}>Apply</button>
              </div>

              <div id="resultSection" style={s.chartBox}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
                  <div>
                    <div style={s.sectionTitle}>Results</div>
                    <div style={s.sectionSub}>{appliedCourse} · {appliedSem} · {loadedExamLabel}</div>
                  </div>
                  <div style={{ display:"flex", gap:8 }}>
                    <button style={s.dlBtnAlt} onClick={downloadCSV}>Export CSV</button>
                    <button style={s.dlBtn}    onClick={downloadResult}>Export PDF</button>
                  </div>
                </div>
                {subjects.length === 0 ? (
                  <div style={{ textAlign:"center", padding:"40px 0", color:t.textSub, fontSize:13 }}>
                    No results found for {appliedSem} · {appliedExam}. Try a different filter.
                  </div>
                ) : (
                  <table style={s.table}>
                    <thead>
                      <tr>
                        {["#","Subject","Marks","Max","Status","Action"].map(h=><th key={h} style={s.th}>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {subjects.map((sub,i)=>(
                        <tr key={i}
                          onMouseEnter={e=>e.currentTarget.style.background=dark?"rgba(255,255,255,0.03)":"rgba(0,0,0,0.02)"}
                          onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                          <td style={s.td}>{i+1}</td>
                          <td style={s.td}>{sub.name}</td>
                          <td style={{ ...s.td, fontWeight:600 }}>{sub.marks}</td>
                          <td style={{ ...s.td, color:t.textSub }}>100</td>
                          <td style={s.td}>
                            <span style={{ padding:"3px 12px", borderRadius:20, fontSize:11, fontWeight:600, background:sub.marks<40?"rgba(239,68,68,0.12)":"rgba(34,197,94,0.12)", color:sub.marks<40?"#ef4444":"#22c55e", border:`1px solid ${sub.marks<40?"rgba(239,68,68,0.25)":"rgba(34,197,94,0.25)"}` }}>
                              {sub.marks<40?"Fail":"Pass"}
                            </span>
                          </td>
                          <td style={s.td}>
                            <button
                              onClick={() => {
                                setConcernForm(f=>({ ...f, subject:sub.name, examType:appliedExam, marksObtained:String(sub.marks) }));
                                setView("concerns");
                              }}
                              style={{ fontSize:11, fontWeight:600, color:"#f59e0b", background:"rgba(245,158,11,0.08)", border:"1px solid rgba(245,158,11,0.25)", borderRadius:6, padding:"5px 12px", cursor:"pointer", whiteSpace:"nowrap" }}>
                              ⚠ Raise Concern
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                <div style={{ marginTop:16, paddingTop:16, borderTop:`1px solid ${t.border}`, display:"flex", gap:24, fontSize:13 }}>
                  <span style={{color:t.textSub}}>Total: <strong style={{color:t.text}}>{subjects.length}</strong></span>
                  <span style={{color:"#22c55e"}}>Passed: <strong>{passCount}</strong></span>
                  <span style={{color:"#ef4444"}}>Failed: <strong>{failCount}</strong></span>
                  <span style={{color:t.textSub}}>Avg: <strong style={{color:t.text}}>{avgMarks.toFixed(1)}</strong></span>
                </div>
              </div>
            </div>
          )}

          {/* ═══ RAISE A CONCERN ════════════════════════════════════════ */}
          {view === "concerns" && (
            <div>
              <div style={{ ...s.chartBox, marginBottom:20 }}>
                <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:22 }}>
                  <div style={{ width:44, height:44, borderRadius:12, background:"rgba(245,158,11,0.12)", border:"1px solid rgba(245,158,11,0.2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>⚠️</div>
                  <div>
                    <div style={s.sectionTitle}>Raise a Concern</div>
                    <div style={s.sectionSub}>Your concern will be sent directly to your faculty's Student Queries inbox</div>
                  </div>
                </div>

                {concernSent && (
                  <div style={{ marginBottom:20, padding:"13px 18px", background:"rgba(34,197,94,0.1)", border:"1px solid rgba(34,197,94,0.3)", borderRadius:10, display:"flex", alignItems:"center", gap:10, fontSize:13, color:"#22c55e", fontWeight:600 }}>
                    <span style={{ fontSize:20 }}>✓</span>
                    Concern submitted successfully! Your faculty will review it shortly.
                  </div>
                )}

                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14, marginBottom:16 }}>
                  <div>
                    <label style={s.label}>Subject *</label>
                    <input style={s.input} placeholder="e.g. DBMS, Operating Systems"
                      value={concernForm.subject}
                      onChange={e=>setConcernForm(f=>({...f, subject:e.target.value}))} />
                  </div>
                  <div>
                    <label style={s.label}>Exam Type *</label>
                    <select style={{ ...s.input, cursor:"pointer" }} value={concernForm.examType}
                      onChange={e=>setConcernForm(f=>({...f, examType:e.target.value}))}>
                      <option value="CIE1">CIE1</option><option value="CIE2">CIE2</option><option value="Internal1">Internal1</option><option value="Internal2">Internal2</option><option value="FULLRESULT">Final Result</option>
                    </select>
                  </div>
                  <div>
                    <label style={s.label}>Marks Obtained</label>
                    <input style={s.input} type="number" min="0" max="100" placeholder="e.g. 35"
                      value={concernForm.marksObtained}
                      onChange={e=>setConcernForm(f=>({...f, marksObtained:e.target.value}))} />
                  </div>
                </div>

                <div style={{ marginBottom:20 }}>
                  <label style={s.label}>Description *</label>
                  <textarea style={s.textarea}
                    placeholder="Describe your concern clearly."
                    value={concernForm.description}
                    onChange={e=>setConcernForm(f=>({...f, description:e.target.value}))} />
                </div>

                <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                  <button onClick={submitConcern}
                    disabled={!concernForm.subject.trim()||!concernForm.description.trim()}
                    style={{ ...s.dlBtn, opacity:(!concernForm.subject.trim()||!concernForm.description.trim())?0.45:1, cursor:(!concernForm.subject.trim()||!concernForm.description.trim())?"not-allowed":"pointer" }}>
                    Submit Concern
                  </button>
                  <button onClick={()=>setConcernForm({subject:"",examType:"CIE1",description:"",marksObtained:""})} style={s.dlBtnAlt}>
                    Clear
                  </button>
                  <span style={{ fontSize:12, color:t.textSub }}>* Required fields</span>
                </div>
              </div>

              <div style={s.chartBox}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
                  <div>
                    <div style={s.sectionTitle}>My Submitted Concerns</div>
                    <div style={s.sectionSub}>Track the status of all your concerns</div>
                  </div>
                  <div style={{ display:"flex", gap:8 }}>
                    <span style={{ fontSize:11, fontWeight:600, padding:"4px 12px", borderRadius:20, background:"rgba(245,158,11,0.1)", color:"#f59e0b", border:"1px solid rgba(245,158,11,0.25)" }}>
                      {concerns.filter(c=>c.status==="Pending").length} Pending
                    </span>
                    <span style={{ fontSize:11, fontWeight:600, padding:"4px 12px", borderRadius:20, background:"rgba(34,197,94,0.1)", color:"#22c55e", border:"1px solid rgba(34,197,94,0.25)" }}>
                      {concerns.filter(c=>c.status==="Resolved").length} Resolved
                    </span>
                  </div>
                </div>

                {concerns.length === 0 ? (
                  <div style={{ textAlign:"center", padding:"48px 20px", color:t.textSub }}>
                    <div style={{ fontSize:40, marginBottom:10 }}>📋</div>
                    <div style={{ fontSize:14 }}>No concerns submitted yet.</div>
                    <div style={{ fontSize:12, marginTop:6 }}>Use the form above to raise a concern about your marks.</div>
                  </div>
                ) : concerns.map(c=>(
                  <div key={c.id} style={{ ...s.annCard, borderLeftColor:c.status==="Resolved"?"#22c55e":"#f59e0b", marginBottom:12 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                      <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
                        <span style={{ fontSize:14, fontWeight:700, color:t.text }}>{c.subject}</span>
                        <span style={{ fontSize:11, fontWeight:600, padding:"2px 8px", borderRadius:20, background:dark?"#1e3a6e22":"#eff6ff", color:"#3b82f6", border:`1px solid ${dark?"#1e3a6e":"#bfdbfe"}` }}>{c.examType}</span>
                        {c.marksObtained && <span style={{ fontSize:12, color:t.textSub }}>Marks: <strong style={{color:t.text}}>{c.marksObtained}/100</strong></span>}
                      </div>
                      <div style={{ display:"flex", gap:8, alignItems:"center", flexShrink:0 }}>
                        <span style={{ fontSize:11, color:t.textSub }}>{c.date}</span>
                        <span style={{ fontSize:11, fontWeight:600, padding:"3px 10px", borderRadius:20,
                          background:c.status==="Resolved"?"rgba(34,197,94,0.1)":"rgba(245,158,11,0.1)",
                          color:c.status==="Resolved"?"#22c55e":"#f59e0b",
                          border:`1px solid ${c.status==="Resolved"?"rgba(34,197,94,0.25)":"rgba(245,158,11,0.25)"}`,
                        }}>
                          {c.status==="Resolved"?"✓ Resolved":"⏳ Pending"}
                        </span>
                      </div>
                    </div>
                    <p style={{ fontSize:13, color:t.textSub, margin:0, lineHeight:1.6 }}>{c.query}</p>
                    {c.reply_message && (
                      <div style={{ marginTop:12, padding:12, borderRadius:10, background:dark?"rgba(34,197,94,0.12)":"rgba(34,197,94,0.12)", border:`1px solid ${dark?"rgba(34,197,94,0.25)":"rgba(34,197,94,0.25)"}` }}>
                        <div style={{ fontSize:12, fontWeight:700, color:t.text }}>Faculty Reply</div>
                        <div style={{ fontSize:13, color:t.textSub, marginTop:6, lineHeight:1.6 }}>{c.reply_message}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══ ANALYSIS ═══════════════════════════════════════════════ */}
          {view === "analysis" && (
            <div>
              <div style={{ marginBottom:20 }}>
                <div style={s.sectionTitle}>AI Performance Analysis</div>
                <div style={s.sectionSub}>Powered by smart academic insights</div>
              </div>
              {[
                { title:"🎯 Overall Performance",     text:aiMessage,       color:"#3b82f6" },
                { title:"⚠️ Weak Subject Detection",  text:weakSubjects.length>0?weakSubjects.map(s=>s.name).join(", "):"No weak subjects detected.", color:"#f59e0b" },
                { title:"📈 CGPA Progress Insight",   text:progressMessage, color:"#22c55e" },
                { title:"📚 AI Study Recommendation", text:studyPlan,       color:"#a855f7" },
              ].map((item,i)=>(
                <div key={i} style={{ ...s.aiCard, borderLeftColor:item.color, padding:"20px 24px", marginBottom:14 }}>
                  <div style={{ ...s.aiTitle, fontSize:14, color:item.color }}>{item.title}</div>
                  <div style={{ ...s.aiText, fontSize:14 }}>{item.text}</div>
                </div>
              ))}
              <AIInsight role="student" dataContext={aiDataContext} dark={dark} />
            </div>
          )}

          {/* ═══ ANNOUNCEMENTS ══════════════════════════════════════════ */}
          {view === "announcements" && (
            <div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
                <div>
                  <div style={s.sectionTitle}>Announcements</div>
                  <div style={s.sectionSub}>Latest updates from faculty</div>
                </div>
                {unreadCount > 0 && (
                  <button onClick={markAllRead}
                    style={{ fontSize:12, fontWeight:600, color:"#3b82f6", background:"rgba(59,130,246,0.08)", border:"1px solid rgba(59,130,246,0.2)", borderRadius:8, padding:"6px 14px", cursor:"pointer" }}>
                    Mark all as read
                  </button>
                )}
              </div>
              {announcements && announcements.length > 0 ? announcements.map(ann => {
                const isUnread = !ann.read;
                return (
                  <div key={ann.id} onClick={()=>markOneRead(ann.id)}
                    style={{ ...s.annCard, cursor:"pointer",
                      background:isUnread?(dark?"rgba(59,130,246,0.05)":"rgba(59,130,246,0.03)"):t.surface,
                      borderLeftColor:isUnread?"#3b82f6":t.border }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                      <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                        {isUnread && <div style={{ width:8, height:8, borderRadius:"50%", background:"#3b82f6", flexShrink:0 }} />}
                        <div style={{ fontSize:15, fontWeight:600, color:t.text }}>{ann.title}</div>
                      </div>
                      <span style={{ fontSize:11, color:t.textSub, whiteSpace:"nowrap" }}>{ann.date}</span>
                    </div>
                    <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:10 }}>
                      {[ann.course, `Sem ${ann.semester}`, ann.subject, `Class ${ann.section || ann.class}`].map((tag,i)=>(
                        <span key={i} style={{ fontSize:11, fontWeight:600, background:dark?"#1e3a6e33":"#eff6ff", color:"#3b82f6", border:`1px solid ${dark?"#1e3a6e":"#bfdbfe"}`, padding:"3px 8px", borderRadius:20 }}>{tag}</span>
                      ))}
                    </div>
                    <p style={{ fontSize:13, color:t.textSub, lineHeight:1.6, margin:0, marginBottom:ann.attachment?10:0 }}>{ann.message}</p>
                    {ann.attachment && (
                      <div style={{ marginTop:10, display:"flex", alignItems:"center", gap:8, padding:"10px 12px", background:dark?"#1e3a6e33":"#eff6ff", borderRadius:8, width:"fit-content" }}>
                        <span style={{ fontSize:13, color:"#3b82f6" }}>📎</span>
                        <button
                          type="button"
                          onClick={e => { e.stopPropagation(); downloadAnnouncementFile(ann); }}
                          style={{ fontSize:12, color:"#3b82f6", background:"transparent", border:"none", padding:0, textDecoration:"underline", cursor:"pointer", fontWeight:500 }}
                        >
                          Download File
                        </button>
                      </div>
                    )}
                  </div>
                );
              }) : (
                <div style={{ textAlign:"center", padding:"60px 20px", color:t.textSub }}>
                  <div style={{ fontSize:40, marginBottom:12 }}>📭</div>
                  <div style={{ fontSize:14 }}>No announcements at this time.</div>
                </div>
              )}
            </div>
          )}

          {/* ═══ PROGRESS ═══════════════════════════════════════════════ */}
          {view === "progress" && (
            <div>
              <div style={{ marginBottom:20 }}>
                <div style={s.sectionTitle}>Academic Progress</div>
                <div style={s.sectionSub}>Semester-wise CGPA trend</div>
              </div>
              <div style={{ ...s.chartBox, marginBottom:16 }}>
                {semesterMarks.length > 0
                  ? <Line data={lineData} options={chartDefaults} />
                  : <div style={{ textAlign:"center", padding:"40px 0", color:t.textSub, fontSize:13 }}>No semester data available yet.</div>
                }
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:12 }}>
                {semesterMarks.map((sm,i)=>(
                  <div key={i} style={s.card("#3b82f6")}>
                    <div style={s.cardLabel}>{sm.sem}</div>
                    <div style={s.cardValue}>{sm.cgpa}</div>
                    <div style={s.cardSub}>Avg %</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══ DOWNLOAD ════════════════════════════════════════════════ */}
          {view === "download" && (
            <div>
              <div style={s.filterBar}>
                <FilterSelect value={pendingCourse} onChange={setPendingCourse} options={["MCA"]} dark={dark} t={t} />
                <FilterSelect value={pendingSem}    onChange={setPendingSem}    options={["Sem1","Sem2","Sem3","Sem4"]} dark={dark} t={t} />
                <FilterSelect value={pendingExam}   onChange={setPendingExam}   options={["CIE1","CIE2","Internal1","Internal2","FULLRESULT"]} dark={dark} t={t} />
                <button style={s.applyBtn} onClick={applyFilters}>Apply</button>
              </div>
              <div style={s.chartBox}>
                <div style={{ marginBottom:20 }}>
                  <div style={s.sectionTitle}>Download Results</div>
                  <div style={s.sectionSub}>{appliedCourse} · {appliedSem} · {loadedExamLabel} — {subjects.length} subjects</div>
                </div>
                <div style={{ display:"flex", gap:12 }}>
                  <button style={s.dlBtnAlt} onClick={downloadCSV}>⬇ Download CSV</button>
                  <button style={s.dlBtn}    onClick={downloadResult}>⬇ Download PDF</button>
                </div>
              </div>
            </div>
          )}

        </div>{/* /content */}
      </div>{/* /main */}
    </div>
  );
}

/* ─── FilterSelect ───────────────────────────────────────────────────────── */
function FilterSelect({ value, onChange, options, dark, t }) {
  return (
    <div style={{ position:"relative", display:"inline-flex", alignItems:"center" }}>
      <select value={value} onChange={e=>onChange(e.target.value)}
        style={{
          appearance:"none", WebkitAppearance:"none",
          background:dark?"#1e293b":"#ffffff",
          border:`1px solid ${dark?"#334155":"#e2e8f0"}`,
          color:dark?"#e2e8f0":"#1e293b",
          borderRadius:10, padding:"9px 38px 9px 16px",
          fontSize:14, fontWeight:500,
          fontFamily:"'DM Sans','Segoe UI',sans-serif",
          cursor:"pointer", outline:"none", minWidth:110,
          boxShadow:dark?"0 1px 3px rgba(0,0,0,0.3)":"0 1px 3px rgba(0,0,0,0.08)",
          transition:"border-color 0.2s,box-shadow 0.2s",
        }}
        onFocus={e=>{e.target.style.borderColor="#3b82f6";e.target.style.boxShadow="0 0 0 2px rgba(59,130,246,0.2)";}}
        onBlur={e=> {e.target.style.borderColor=dark?"#334155":"#e2e8f0";e.target.style.boxShadow=dark?"0 1px 3px rgba(0,0,0,0.3)":"0 1px 3px rgba(0,0,0,0.08)";}}
      >
        {options.map(o=><option key={o} value={o}>{o}</option>)}
      </select>
      <span style={{ position:"absolute", right:12, pointerEvents:"none", color:dark?"#64748b":"#94a3b8", fontSize:11 }}>▾</span>
    </div>
  );
}

export default StudentDashboard;