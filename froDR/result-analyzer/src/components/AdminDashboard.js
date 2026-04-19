import React, { useEffect, useMemo, useState } from "react";
import "./AdminDashboard.css";

import Navbar from "./Navbar";
import { adminAPI } from "../api";
import Students from "./student";
import Teacher from "./Teacher";
import UploadResults from "./UploadResults";
import RankList from "./Ranklist";
import AdminProfile from "./AdminProfile";
import Reports from "./Reports";
import AIInsight from "./AIInsight";

import { Bar, Pie } from "react-chartjs-2";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend
} from "chart.js";

const ADMIN_PROFILE_KEY = "adminProfile";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

function AdminDashboard({ setDashboard, setPage, page }) {

  /* ── Filters ─────────────────────────────────────────────────────── */
  // Pending filters (what user is selecting)
  const [pendingCourse,    setPendingCourse]    = useState("MCA");
  const [pendingSession,   setPendingSession]   = useState("2024-25");
  const [pendingSemester,  setPendingSemester]  = useState("1");
  const [pendingExamType,  setPendingExamType]  = useState("CIE1");
  
  // Applied filters (what's actually loaded)
  const [course,    setCourse]    = useState("MCA");
  const [session,   setSession]   = useState("2024-25");
  const [semester,  setSemester]  = useState("1");
  const [examType,  setExamType]  = useState("CIE1");
  
  const [darkMode,  setDarkMode]  = useState(true);

  /* ── Profile ─────────────────────────────────────────────────────── */
  const [profile, setProfile] = useState({ name:"Admin", profileImage:"" });

  /* ── Backend data ────────────────────────────────────────────────── */
  const [stats,      setStats]      = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [analytics,  setAnalytics]  = useState([]);
  const [fetchError, setFetchError] = useState(null);

  /* ── Announcements ───────────────────────────────────────────────── */
  const [announcements,    setAnnouncements]    = useState([]);
  const [announcementFile, setAnnouncementFile] = useState(null);
  const [newAnnouncement,  setNewAnnouncement]  = useState({
    title:"", message:"", course:"MCA", semester:"1", subject:"", class:"All",
  });
  const [subjects, setSubjects] = useState([]);

  useEffect(() => {
    adminAPI.getSubjects().then(setSubjects);
  }, []);

  // Normalize semester for comparison (DB uses 'Sem1', UI uses '1', etc.)
  const normalizeSemester = (val) => {
    if (!val) return '';
    if (val.toLowerCase().startsWith('sem')) return val.trim();
    return 'Sem' + String(val).replace(/[^0-9]/g, '');
  };
  const filteredSubjects = subjects.filter(
    s => s.course === newAnnouncement.course && normalizeSemester(s.semester) === normalizeSemester(newAnnouncement.semester)
  );

  /* ── Image upload ────────────────────────────────────────────────── */
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const updated = { ...profile, profileImage: event.target.result };
      setProfile(updated);
      localStorage.setItem(ADMIN_PROFILE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('adminProfileUpdated', { detail: updated }));
    };
    reader.readAsDataURL(file);
  };

  /* ── Load dashboard data ─────────────────────────────────────────── */
  const loadDashboardData = async () => {
    try {
      const [statsRes, leaderboardRes, analyticsRes, annRes] = await Promise.all([
        adminAPI.getStats({
        course,
        semester,
        exam_type: examType
      }),
        adminAPI.getLeaderboard({course,
        semester,
        exam_type: examType }),
        adminAPI.getAnalytics({ course,
        semester,
        exam_type: examType }),
        adminAPI.getAnnouncements(),
      ]);
      setStats(statsRes);
      setLeaderboard(leaderboardRes || []);
      setAnalytics(analyticsRes || []);
      setAnnouncements(annRes || []);
      setFetchError(null);
    } catch (err) {
      console.error('AdminDashboard fetch error', err);
      setFetchError(err.message || 'Failed to load admin data');
    }
  };

  const handleApplyFilters = () => {
    setCourse(pendingCourse);
    setSession(pendingSession);
    setSemester(pendingSemester);
    setExamType(pendingExamType);
  };

  useEffect(() => { loadDashboardData(); }, [course]); // eslint-disable-line

  /* ── Profile listeners ───────────────────────────────────────────── */
  useEffect(() => {
    const handler = () => { if (setPage) setPage("profile"); };
    window.addEventListener("openProfile", handler);
    return () => window.removeEventListener("openProfile", handler);
  }, [setPage]);

  useEffect(() => {
    const load = () => {
      try {
        const stored = JSON.parse(localStorage.getItem(ADMIN_PROFILE_KEY));
        if (stored && typeof stored === "object") setProfile(prev => ({ ...prev, ...stored }));
      } catch {}
    };
    load();
    const onUpdate = (e) => { if (e?.detail) setProfile(prev => ({ ...prev, ...e.detail })); else load(); };
    window.addEventListener("adminProfileUpdated", onUpdate);
    window.addEventListener("storage", load);
    return () => { window.removeEventListener("adminProfileUpdated", onUpdate); window.removeEventListener("storage", load); };
  }, []);

  useEffect(() => {
    document.body.className = darkMode ? "admin-dark-body sd-dark-body" : "admin-light-body sd-light-body";
    return () => { document.body.className = ""; };
  }, [darkMode]);

  /* ── Derived chart data ──────────────────────────────────────────── */
  const passCount   = (leaderboard || []).filter(s => Number(s.marks) >= 40).length;
  const totalCount  = (leaderboard || []).length;
  const failCount   = Math.max(0, totalCount - passCount);
  const passPercent = totalCount > 0 ? Math.round((passCount / totalCount) * 100) : 0;

  const passFailData = {
    labels: ["Pass", "Fail"],
    datasets: [{ data:[passCount, failCount], backgroundColor:["#22c55e","#ef4444"] }],
  };
  const subjectData = {
    labels: analytics.map(a => a.name),
    datasets: [{ label:"Average Marks", data:analytics.map(a => a.avg_marks), backgroundColor:"#4f8ef7", borderRadius:6 }],
  };

  /* ── AI context ──────────────────────────────────────────────────── */
  const adminAIContext = [
    `Admin view: Course=${course} | Session=${session} | Semester=${semester} | Exam=${examType}`,
    `Total students: ${stats?.total_students || 0} | Total teachers: ${stats?.total_teachers || 0}`,
    `Results uploaded: ${stats?.marks_entered || 0} | Pass percentage: ${passPercent}%`,
    `Pass count: ${passCount} | Fail count: ${failCount} | Total in leaderboard: ${totalCount}`,
    `Subject analytics: ${analytics.map(a => a.name+'='+a.avg_marks).join(', ') || 'No data'}`,
    `Top 3 students: ${(leaderboard || []).slice(0,3).map(s => s.name+'('+s.marks+')').join(', ') || 'No data'}`,
  ].join('\n');


  /* ── Actions ─────────────────────────────────────────────────────── */
  const logout = () => { setDashboard(null); setPage("dashboard"); };

  const postAnnouncement = () => {
    if (!newAnnouncement.message) return;
    adminAPI.postAnnouncement(newAnnouncement, announcementFile)
      .then(() => adminAPI.getAnnouncements())
      .then(res => {
        setAnnouncements(res || []);
        setNewAnnouncement({ title:"", message:"", course:"MCA", semester:"1", subject:"", class:"All" });
        setAnnouncementFile(null);
      })
      .catch(err => console.log(err));
  };

  /* ── Menu ────────────────────────────────────────────────────────── */
  const menuItems = [
    { key:"profile",      label:"Admin Profile",   icon:"◎" },
    { key:"dashboard",    label:"Dashboard",        icon:"▦" },
    { key:"students",     label:"Manage Students",  icon:"👤" },
    { key:"teachers",     label:"Manage Teachers",  icon:"🎓" },
    { key:"upload",       label:"Upload Results",   icon:"⬆" },
    { key:"leaderboard",  label:"Leaderboard",      icon:"🏆" },
    { key:"announcements",label:"Announcements",    icon:"✉" },
    { key:"reports",      label:"Reports",          icon:"📊" },
  ];

  const isActive = (key) => page === key;

  /* ── T tokens (dark/light) ───────────────────────────────────────── */
  const T = darkMode
    ? { bg:"#0f172a", surface:"#111827", card:"#1e293b", border:"#334155", text:"#e2e8f0", textSub:"#94a3b8", accent:"#4f8ef7", success:"#22c55e", danger:"#ef4444", warning:"#f59e0b" }
    : { bg:"#f8fafc",  surface:"#ffffff", card:"#ffffff", border:"#e2e8f0", text:"#1e293b", textSub:"#64748b", accent:"#2563eb", success:"#16a34a", danger:"#dc2626", warning:"#ea580c" };

  /* ── Filter bar component ────────────────────────────────────────── */
  const DashFilterBar = () => (
    <div style={{ display:"flex", gap:12, marginBottom:28, flexWrap:"wrap", alignItems:"center" }}>
      {/* Course */}
      <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
        <label style={{ fontSize:10, fontWeight:700, color:T.textSub, textTransform:"uppercase", letterSpacing:"0.1em" }}>Course</label>
        <select value={pendingCourse} onChange={e => setPendingCourse(e.target.value)} style={selStyle(T)}>
          <option>MCA</option><option>BCA</option><option>BBA</option>
        </select>
      </div>
      {/* Session */}
      <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
        <label style={{ fontSize:10, fontWeight:700, color:T.textSub, textTransform:"uppercase", letterSpacing:"0.1em" }}>Session</label>
        <select value={pendingSession} onChange={e => setPendingSession(e.target.value)} style={selStyle(T)}>
          <option>2024-25</option><option>2023-24</option><option>2022-23</option>
        </select>
      </div>
      {/* Semester */}
      <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
        <label style={{ fontSize:10, fontWeight:700, color:T.textSub, textTransform:"uppercase", letterSpacing:"0.1em" }}>Semester</label>
        <select value={pendingSemester} onChange={e => setPendingSemester(e.target.value)} style={selStyle(T)}>
          <option value="1">Semester 1</option>
          <option value="2">Semester 2</option>
          <option value="3">Semester 3</option>
          <option value="4">Semester 4</option>
        </select>
      </div>
      {/* Exam Type */}
      <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
        <label style={{ fontSize:10, fontWeight:700, color:T.textSub, textTransform:"uppercase", letterSpacing:"0.1em" }}>Exam Type</label>
        <select value={pendingExamType} onChange={e => setPendingExamType(e.target.value)} style={selStyle(T)}>
          <option value="Internal1">Internal 1</option>
          <option value="Internal2">Internal 2</option>
          <option value="CIE1">CIE 1</option>
          <option value="CIE2">CIE 2</option>
          <option value="CIE3">CIE 3</option>
          <option value="FULLRESULT">Final Result</option>
        </select>
      </div>
      {/* Apply Button */}
      <button
        onClick={handleApplyFilters}
        style={{
          marginTop: 20,
          padding: "8px 24px",
          background: T.accent,
          color: "#fff",
          border: "none",
          borderRadius: 8,
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
          transition: "all 0.2s",
          boxShadow: `0 2px 8px ${T.accent}40`
        }}
        onMouseEnter={e => { e.target.style.transform = "translateY(-2px)"; e.target.style.boxShadow = `0 4px 12px ${T.accent}60`; }}
        onMouseLeave={e => { e.target.style.transform = "translateY(0)"; e.target.style.boxShadow = `0 2px 8px ${T.accent}40`; }}
      >
        Apply
      </button>
      {/* Applied badge */}
      <div style={{ marginTop:20, fontSize:12, color:T.success, fontWeight:600, background: darkMode?"#14532d22":"#dcfce7", padding:"8px 14px", borderRadius:8, border:`1px solid ${T.success}40` }}>
        ✓ {course} · Sem {semester} · {examType}
      </div>
    </div>
  );

  /* ── Stat card ───────────────────────────────────────────────────── */
  const StatCard = ({ label, value, accent, sub, onClick }) => (
    <div onClick={onClick}
      style={{ background:T.card, border:`1px solid ${T.border}`, borderTop:`3px solid ${accent}`, borderRadius:12, padding:"20px 24px", cursor:onClick?"pointer":"default", transition:"all 0.2s" }}
      onMouseEnter={e => { if(onClick) e.currentTarget.style.transform="translateY(-3px)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform="translateY(0)"; }}>
      <div style={{ fontSize:11, fontWeight:700, color:T.textSub, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:10 }}>{label}</div>
      <div style={{ fontSize:32, fontWeight:800, color:T.text, lineHeight:1 }}>{value}</div>
      {sub && <div style={{ fontSize:12, color:T.textSub, marginTop:6 }}>{sub}</div>}
    </div>
  );

  /* ── Page content ────────────────────────────────────────────────── */
  const renderContent = () => {
    switch(page) {

      case "students":
        return (
          <div>
            <div className="page-header"><h2 style={{ color:T.text }}>Manage Students</h2><div className="subtitle">Add or remove student records</div></div>
            <Students />
          </div>
        );

      case "teachers":
        return (
          <div>
            <div className="page-header"><h2 style={{ color:T.text }}>Manage Teachers</h2><div className="subtitle">View and update teacher profiles</div></div>
            <Teacher />
          </div>
        );

      case "upload":
        return (
          <div>
            <div className="page-header"><h2 style={{ color:T.text }}>Upload Results</h2><div className="subtitle">Upload CSV exam results</div></div>
            <UploadResults onUploadSuccess={loadDashboardData} />
          </div>
        );

      case "leaderboard":
        return (
          <div>
            <div className="page-header"><h2 style={{ color:T.text }}>Leaderboard</h2></div>
            <RankList data={leaderboard} />
          </div>
        );

      case "announcements":
        return (
          <>
            <div className="page-header">
              <h2 style={{ color:T.text }}>Announcements</h2>
              <div className="subtitle">Post updates and notices to students</div>
            </div>
            <div className="admin-announcement-page">
              <div className="admin-announcement-card glass-card">
                <div className="admin-announcement-card-header">
                  <div><h3>Post New Announcement</h3><p>Share announcements by course, semester, subject and class.</p></div>
                </div>
                <div className="admin-announcement-grid">
                  {[
                    { label:"Course",   field:"course",   opts:["MCA","BCA"] },
                    { label:"Semester", field:"semester", opts:["1","2","3","4"] },
                    { label:"Subject",  field:"subject",  opts: filteredSubjects.length > 0 ? filteredSubjects.map(s => s.name) : ["No subjects"] },
                    { label:"Class",    field:"class",    opts:["A","B","C","All"] },
                  ].map(({ label, field, opts }) => (
                    <div className="admin-announcement-field" key={field}>
                      <label>{label}</label>
                      <select value={newAnnouncement[field]} onChange={e => setNewAnnouncement({ ...newAnnouncement, [field]:e.target.value })}>
                        {opts.map(o => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
                <div className="admin-announcement-row">
                  <label>Title</label>
                  <input type="text" placeholder="Announcement title" value={newAnnouncement.title} onChange={e => setNewAnnouncement({ ...newAnnouncement, title:e.target.value })} />
                </div>
                <div className="admin-announcement-row">
                  <label>Message</label>
                  <textarea placeholder="Write your message..." value={newAnnouncement.message} onChange={e => setNewAnnouncement({ ...newAnnouncement, message:e.target.value })} />
                </div>
                <div className="admin-announcement-row">
                  <label>Attachment (Optional)</label>
                  <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                    <input type="file" id="adminAnnouncementFileInput" style={{ display:"none" }} onChange={e => setAnnouncementFile(e.target.files?.[0] || null)} />
                    <button type="button" className="admin-announcement-file-btn" onClick={() => document.getElementById('adminAnnouncementFileInput').click()}>📎 Add File</button>
                    {announcementFile && (
                      <div style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 12px", backgroundColor:"rgba(79,142,247,0.15)", borderRadius:8, flex:1 }}>
                        <span style={{ fontSize:12 }}>📄</span>
                        <span style={{ fontSize:12, color:"#e2e8f0" }}>{announcementFile.name}</span>
                        <button type="button" style={{ marginLeft:"auto", background:"transparent", border:"none", color:"#4f8ef7", cursor:"pointer", fontSize:14 }} onClick={() => setAnnouncementFile(null)}>✕</button>
                      </div>
                    )}
                  </div>
                </div>
                <button className="admin-announcement-submit" onClick={postAnnouncement}>Post Announcement</button>
              </div>

              <div className="admin-announcement-list">
                {announcements.length === 0 ? (
                  <div className="admin-announcement-empty glass-card"><p>No announcements yet. Create your first notice.</p></div>
                ) : (announcements || []).map(ann => (
                  <div key={ann.id} className="admin-announcement-item glass-card">
                    <div className="admin-announcement-item-header">
                      <h4>{ann.title}</h4>
                      <span className="admin-announcement-date">{ann.date}</span>
                    </div>
                    <p>{ann.message}</p>
                    {ann.attachment && (
                      <div style={{ marginTop:8, display:"flex", alignItems:"center", gap:6 }}>
                        <span style={{ fontSize:12 }}>📎</span>
                        <span style={{ fontSize:12, color:T.accent }}>{ann.attachment.split('/').pop()}</span>
                      </div>
                    )}
                    <div className="admin-announcement-tags">
                      {[ann.course, `Sem ${ann.semester}`, ann.subject, `Class ${ann.class}`].map((t,i) => (
                        <span key={i} className="admin-announcement-pill">{t}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        );

      case "reports":
        return (
          <div>
            <div className="page-header"><h2 style={{ color:T.text }}>Reports</h2><div className="subtitle">Generate and view detailed reports</div></div>
            <Reports data={leaderboard} analytics={analytics} />
          </div>
        );

      case "profile":
        return (
          <div>
            <div className="page-header"><h2 style={{ color:T.text }}>Admin Profile</h2></div>
            <AdminProfile />
          </div>
        );

      default:
        return (
          <>
            {/* Header */}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:28, flexWrap:"wrap", gap:12 }}>
              <div>
                <h2 style={{ margin:0, fontSize:28, fontWeight:800, color:T.text, letterSpacing:"-0.02em" }}>Admin Dashboard</h2>
                <p style={{ margin:"6px 0 0", fontSize:14, color:T.textSub }}>Overview analytics for {course} · Session {session}</p>
              </div>
              {fetchError && (
                <div style={{ fontSize:13, color:"#f87171", background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.25)", padding:"8px 14px", borderRadius:8 }}>
                  ⚠ {fetchError}
                </div>
              )}
            </div>

            {/* Filter bar with new dropdowns */}
            <DashFilterBar />

            {/* Stat cards */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))", gap:16, marginBottom:28 }}>
              <StatCard label="Total Students"   value={stats?.total_students || 0} accent={T.accent}   sub={`${course} · ${session}`}   onClick={() => setPage('students')} />
              <StatCard label="Total Teachers"   value={stats?.total_teachers || 0} accent={T.success}  sub="Active faculty members"       onClick={() => setPage('teachers')} />
              <StatCard label="Results Uploaded" value={stats?.marks_entered  || 0} accent={T.warning}  sub="Marks entered in DB"          onClick={() => setPage('upload')} />
              <StatCard label="Pass Percentage"  value={`${passPercent}%`}           accent="#a855f7"   sub={`${passCount} passed · ${failCount} failed`} />
            </div>

            {/* Charts row */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, marginBottom:28 }}>
              {/* Pass vs Fail */}
              <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:12, padding:"22px 24px" }}>
                <div style={{ fontSize:15, fontWeight:700, color:T.text, marginBottom:4 }}>Pass vs Fail</div>
                <div style={{ fontSize:12, color:T.textSub, marginBottom:16 }}>{course} · Sem {semester} · {examType}</div>
                <div style={{ maxHeight:240, display:"flex", justifyContent:"center" }}>
                  <Pie data={passFailData} options={{ plugins:{ legend:{ labels:{ color:T.textSub } } } }} />
                </div>
                <div style={{ display:"flex", justifyContent:"space-around", marginTop:14, fontSize:13 }}>
                  <span style={{ color:T.success, fontWeight:600 }}>● Pass: {passCount} ({passPercent}%)</span>
                  <span style={{ color:T.danger,  fontWeight:600 }}>● Fail: {failCount} ({100-passPercent}%)</span>
                </div>
              </div>

              {/* Subject Performance */}
              <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:12, padding:"22px 24px" }}>
                <div style={{ fontSize:15, fontWeight:700, color:T.text, marginBottom:4 }}>Subject Performance</div>
                <div style={{ fontSize:12, color:T.textSub, marginBottom:16 }}>Average marks by subject</div>
                <div style={{ height:240 }}>
                  <Bar data={subjectData} options={{
                    maintainAspectRatio:false,
                    plugins:{ legend:{ display:false } },
                    scales:{
                      x:{ grid:{ color: darkMode?"rgba(255,255,255,0.06)":"rgba(0,0,0,0.06)" }, ticks:{ color:T.textSub } },
                      y:{ grid:{ color: darkMode?"rgba(255,255,255,0.06)":"rgba(0,0,0,0.06)" }, ticks:{ color:T.textSub } },
                    },
                  }} />
                </div>
              </div>
            </div>

            {/* AI Insight Panel */}
            <AIInsight role="admin" dataContext={adminAIContext} dark={darkMode} />
          </>
        );
    }
  };

  /* ── RENDER ──────────────────────────────────────────────────────── */
  return (
    <div className="dashboard" style={{ background:T.bg, minHeight:"100vh" }}>

      <Navbar
        title="Admin Dashboard"
        logout={logout}
        openProfile={() => setPage("profile")}
        onLogoClick={() => setPage("dashboard")}
        profileImage={profile.profileImage}
      />

      <div className="dashboard-container">

        {/* ── Sidebar ─────────────────────────────────────────────── */}
        <div className="sidebar">
          <div className="profile-section" style={{ textAlign:'center', borderBottom:'1px solid rgba(255,255,255,0.1)', padding:'16px 16px 12px' }}>
            <div style={{ marginBottom:12 }}>
              {profile.profileImage ? (
                <div style={{ width:80, height:80, display:'inline-block', borderRadius:'50%', background:'#fff', padding:2, boxShadow:'0 3px 8px rgba(0,0,0,0.2)' }}>
                  <img src={profile.profileImage} alt="admin" style={{ width:76, height:76, borderRadius:'50%', objectFit:'cover', display:'block' }} />
                </div>
              ) : (
                <div style={{ width:80, height:80, background:'linear-gradient(135deg,#3b82f6,#1d4ed8)', borderRadius:'50%', display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:28, fontWeight:800, color:'#fff', boxShadow:'0 4px 12px rgba(37,99,235,0.3)' }}>
                  {(profile.name || 'A')[0].toUpperCase()}
                </div>
              )}
              <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display:'none' }} id="admin-image-input" />
              <label htmlFor="admin-image-input" style={{ display:'block', marginTop:8, fontSize:10, fontWeight:700, color:'#60a5fa', cursor:'pointer', background:'rgba(96,165,250,0.15)', padding:'4px 8px', borderRadius:6, textAlign:'center', letterSpacing:'0.05em' }}>
                Upload Photo
              </label>
            </div>
            <h3 style={{ fontWeight:700, marginBottom:4, fontSize:15, color:'#f8fafc' }}>{profile.name || "Admin"}</h3>
            <p style={{ fontSize:11, color:'#94a3b8', margin:0 }}>ADM-2024-01</p>
          </div>

          <ul className="menu">
            {menuItems.map(item => (
              <li key={item.key} className={`menu-item ${isActive(item.key)?"active":""}`} onClick={() => setPage(item.key)}>
                <span className="icon" style={{ fontSize:14 }}>{item.icon}</span>
                {item.label}
              </li>
            ))}
            <li className="menu-item logout-item" onClick={logout}>
              <span className="icon">⏻</span>Logout
            </li>

            {/* AI badge */}
            <div style={{ margin:"12px 16px 16px", background:"#1e1b4b", border:"1px solid #312e81", borderRadius:10, padding:"10px 12px" }}>
              <div style={{ fontSize:11, fontWeight:700, color:"#a78bfa", marginBottom:3 }}>✦ AI Insights Active</div>
              <div style={{ fontSize:10, color:"#94a3b8", lineHeight:1.5 }}>Smart predictions & analysis enabled</div>
            </div>
          </ul>
        </div>

        {/* ── Main content ─────────────────────────────────────────── */}
        <div className="main-content" style={{ background:T.surface, color:T.text }}>
          <div className="page-action-bar">
            <button className="theme-toggle" onClick={() => setDarkMode(p => !p)}>
              {darkMode ? "☀ Light Mode" : "🌙 Dark Mode"}
            </button>
          </div>
          {renderContent()}
        </div>

      </div>
    </div>
  );
}

/* ── Helper: select style ────────────────────────────────────────────── */
function selStyle(T) {
  return {
    padding:"9px 14px",
    background: T.card,
    border:`1px solid ${T.border}`,
    borderRadius:8,
    color: T.text,
    fontSize:13,
    fontWeight:500,
    cursor:"pointer",
    outline:"none",
    minWidth:140,
    fontFamily:"inherit",
  };
}

export default AdminDashboard;
