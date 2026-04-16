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

/* COURSE + SESSION FILTER */

const [course,setCourse] = useState("MCA");
const [session,setSession] = useState("2024-25");
const [darkMode, setDarkMode] = useState(true);

const [profile, setProfile] = useState({
  name: "Admin",
  profileImage: "",
});

const [stats, setStats] = useState(null);
const [leaderboard, setLeaderboard] = useState([]);
const [analytics, setAnalytics] = useState([]);
const [fetchError, setFetchError] = useState(null);

// Handle image upload for admin profile
const handleImageUpload = (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      const updatedProfile = { ...profile, profileImage: event.target.result };
      setProfile(updatedProfile);
      localStorage.setItem(ADMIN_PROFILE_KEY, JSON.stringify(updatedProfile));
      window.dispatchEvent(new CustomEvent('adminProfileUpdated', { detail: updatedProfile }));
    };
    reader.readAsDataURL(file);
  }
};

/* ANNOUNCEMENTS */

const [newAnnouncement, setNewAnnouncement] = useState({
  title: "",
  message: "",
  course: "MCA",
  semester: "1",
  subject: "DBMS",
  class: "All",
});
const [announcementFile, setAnnouncementFile] = useState(null);
const [announcements,setAnnouncements] = useState([]);

/* FETCH DATA */

const loadDashboardData = async () => {
  try {
    const statsRes = await adminAPI.getStats({ course });
    setStats(statsRes);

    const leaderboardRes = await adminAPI.getLeaderboard({ course });
    setLeaderboard(leaderboardRes || []);

    const analyticsRes = await adminAPI.getAnalytics({ course });
    setAnalytics(analyticsRes || []);

    const annRes = await adminAPI.getAnnouncements();
    setAnnouncements(annRes || []);

    setFetchError(null);
  } catch (err) {
    console.error('AdminDashboard fetch error', err);
    setFetchError(err.message || 'Failed to load admin data');
  }
};

useEffect(() => {
  loadDashboardData();
}, [course]);

/* CHART DATA */

const passCount = (leaderboard || []).filter((student) => Number(student.marks) >= 40).length;
const totalCount = (leaderboard || []).length;
const failCount = Math.max(0, totalCount - passCount);
const passPercentageComputed = totalCount > 0 ? Math.round((passCount / totalCount) * 100) : 0;

const passFailData = {
  labels: ["Pass","Fail"],
  datasets: [{
    data: [passCount, failCount],
    backgroundColor: ["#2ecc71","#e74c3c"]
  }]
};

const subjectData = {
  labels: analytics.map(a => a.name),
  datasets: [{
    label: "Average Marks",
    data: analytics.map(a => a.avg_marks),
    backgroundColor: "#3498db"
  }]
};

/* PROFILE EVENT */

useEffect(()=>{
  const handler=()=>{ if(setPage) setPage("profile") }
  window.addEventListener("openProfile",handler)
  return()=>window.removeEventListener("openProfile",handler)
},[setPage])

/* LOAD PROFILE (for sidebar + navbar) */
useEffect(() => {
  const load = () => {
    try {
        const stored = JSON.parse(localStorage.getItem(ADMIN_PROFILE_KEY));
        if (stored && typeof stored === "object") {
          setProfile((prev) => ({ ...prev, ...stored }));
        }
      } catch (e) {
        // ignore
      }
    };
    load();

    const onUpdate = (e) => {
      if (e && e.detail) {
        setProfile((prev) => ({ ...prev, ...e.detail }));
      } else {
        load();
      }
    };

    window.addEventListener("adminProfileUpdated", onUpdate);
    window.addEventListener("storage", load);
    return () => {
      window.removeEventListener("adminProfileUpdated", onUpdate);
      window.removeEventListener("storage", load);
    };
  }, []);

useEffect(() => {
  document.body.className = darkMode ? "admin-dark-body sd-dark-body" : "admin-light-body sd-light-body";
  return () => { document.body.className = ""; };
}, [darkMode]);

/* LOGOUT */

const logout=()=>{
setDashboard(null)
setPage("dashboard")
}

/* ANNOUNCEMENT POST */

const postAnnouncement = () => {
  if (!newAnnouncement.message) return;

  adminAPI.postAnnouncement(newAnnouncement)
    .then(() => adminAPI.getAnnouncements())
    .then(res => {
      setAnnouncements(res || []);
      setNewAnnouncement({
        title: "",
        message: "",
        course: "MCA",
        semester: "1",
        subject: "DBMS",
        class: "All",
      });
      setAnnouncementFile(null);
    })
    .catch(err => console.log(err));
};

/* SIDEBAR MENU */

const menuItems=[
  { key:"profile",label:"Admin Profile" },
  { key:"dashboard",label:"Dashboard" },
  { key:"students",label:"Manage Students" },
  { key:"teachers",label:"Manage Teachers" },
  { key:"upload",label:"Upload Results" },
  { key:"leaderboard",label:"Leaderboard" },
  { key:"announcements",label:"Announcements" },
  { key:"reports",label:"Reports" }
]

const isActive=(key)=>page===key

/* PAGE RENDER */

const renderContent=()=>{

let filteredData = [];

switch(page){

case "students":
return(
<div>
<div className="page-header">
<h2>Manage Students</h2>
<div className="subtitle">Add or remove student records</div>
</div>
<Students/>
</div>
)

case "teachers":
return(
<div>
<div className="page-header">
<h2>Manage Teachers</h2>
<div className="subtitle">View and update teacher profiles</div>
</div>
<Teacher/>
</div>
)

case "upload":
return(
<div>
<div className="page-header">
<h2>Upload Results</h2>
<div className="subtitle">Upload CSV exam results</div>
</div>
<UploadResults onUploadSuccess={loadDashboardData} />
</div>
)

case "leaderboard": {
  return (
    <div>
      <div className="page-header">
        <h2>Leaderboard</h2>
      </div>

      <RankList data={leaderboard} />
    </div>
  );
}

case "announcements":
return(
  <>
    <div className="page-header">
      <h2>Announcements</h2>
      <div className="subtitle">Post updates and notices to students</div>
    </div>

    <div className="admin-announcement-page">
      <div className="admin-announcement-card glass-card">
        <div className="admin-announcement-card-header">
          <div>
            <h3>Post New Announcement</h3>
            <p>Share announcements by course, semester, subject and class.</p>
          </div>
        </div>

        <div className="admin-announcement-grid">
          <div className="admin-announcement-field">
            <label>Course</label>
            <select value={newAnnouncement.course} onChange={(e) => setNewAnnouncement({ ...newAnnouncement, course: e.target.value })}>
              <option>MCA</option>
              <option>BCA</option>
            </select>
          </div>
          <div className="admin-announcement-field">
            <label>Semester</label>
            <select value={newAnnouncement.semester} onChange={(e) => setNewAnnouncement({ ...newAnnouncement, semester: e.target.value })}>
              <option>1</option>
              <option>2</option>
              <option>3</option>
              <option>4</option>
            </select>
          </div>
          <div className="admin-announcement-field">
            <label>Subject</label>
            <select value={newAnnouncement.subject} onChange={(e) => setNewAnnouncement({ ...newAnnouncement, subject: e.target.value })}>
              <option>DBMS</option>
              <option>OS</option>
              <option>DS</option>
              <option>Algo</option>
            </select>
          </div>
          <div className="admin-announcement-field">
            <label>Class</label>
            <select value={newAnnouncement.class} onChange={(e) => setNewAnnouncement({ ...newAnnouncement, class: e.target.value })}>
              <option>A</option>
              <option>B</option>
              <option>C</option>
              <option>All</option>
            </select>
          </div>
        </div>

        <div className="admin-announcement-row">
          <label>Title</label>
          <input
            type="text"
            placeholder="Announcement title"
            value={newAnnouncement.title}
            onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
          />
        </div>

        <div className="admin-announcement-row">
          <label>Message</label>
          <textarea
            placeholder="Write your message..."
            value={newAnnouncement.message}
            onChange={(e) => setNewAnnouncement({ ...newAnnouncement, message: e.target.value })}
          />
        </div>

        <div className="admin-announcement-row">
          <label>Attachment (Optional)</label>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <input
              type="file"
              id="adminAnnouncementFileInput"
              style={{ display: "none" }}
              onChange={(e) => setAnnouncementFile(e.target.files?.[0] || null)}
            />
            <button
              type="button"
              className="admin-announcement-file-btn"
              onClick={() => document.getElementById('adminAnnouncementFileInput').click()}
            >
              📎 Add File
            </button>
            {announcementFile && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", backgroundColor: "rgba(79, 142, 247, 0.15)", borderRadius: "8px", flex: 1 }}>
                <span style={{ fontSize: "12px" }}>📄</span>
                <span style={{ fontSize: "12px", color: "#e2e8f0" }}>{announcementFile.name}</span>
                <button
                  type="button"
                  style={{ marginLeft: "auto", background: "transparent", border: "none", color: "#4f8ef7", cursor: "pointer", fontSize: "14px" }}
                  onClick={() => setAnnouncementFile(null)}
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        </div>

        <button className="admin-announcement-submit" onClick={postAnnouncement}>
          Post Announcement
        </button>
      </div>

      <div className="admin-announcement-list">
        {announcements.length === 0 ? (
          <div className="admin-announcement-empty glass-card">
            <p>No announcements yet. Create your first notice.</p>
          </div>
        ) : (
          (announcements || []).map((ann) => (
            <div key={ann.id} className="admin-announcement-item glass-card">
              <div className="admin-announcement-item-header">
                <h4>{ann.title}</h4>
                <span className="admin-announcement-date">{ann.date}</span>
              </div>
              <p>{ann.message}</p>
              <div className="admin-announcement-tags">
                <span className="admin-announcement-pill">{ann.course}</span>
                <span className="admin-announcement-pill">Sem {ann.semester}</span>
                <span className="admin-announcement-pill">{ann.subject}</span>
                <span className="admin-announcement-pill">Class {ann.class}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  </>
)

case "reports":
return(
<div>
<div className="page-header">
<h2>Reports</h2>
<div className="subtitle">Generate and view detailed reports</div>
</div>
<Reports data={leaderboard} analytics={analytics} />
</div>
)

case "profile":
return(
<div>
<div className="page-header">
<h2>Admin Profile</h2>
</div>
<AdminProfile/>
</div>
)

default:
return(
<>

<div className="page-header">
<h2>Admin Dashboard</h2>
<div className="subtitle">
Overview analytics for {course} ({session})
</div>
{fetchError && (
  <div className="error-message" style={{ color: '#ff6b6b', marginTop: 10 }}>
    {fetchError}
  </div>
)}
</div>

{/* FILTERS */}

<div className="filters">

<select value={course} onChange={(e)=>setCourse(e.target.value)}>
<option>MCA</option>
<option>BCA</option>
<option>BBA</option>
</select>

<select value={session} onChange={(e)=>setSession(e.target.value)}>
<option>2024-25</option>
<option>2023-24</option>
<option>2022-23</option>
</select>

</div>

{/* CARDS */}

<div className="cards">

<div className="card blue clickable-card" onClick={() => setPage('students')} style={{cursor:'pointer'}}>
<h3>Total Students</h3>
<p>{stats?.total_students || 0}</p>
</div>

<div className="card green clickable-card" onClick={() => setPage('teachers')} style={{cursor:'pointer'}}>
<h3>Total Teachers</h3>
<p>{stats?.total_teachers || 0}</p>
</div>

<div className="card orange clickable-card" onClick={() => setPage('upload')} style={{cursor:'pointer'}}>
<h3>Results Uploaded</h3>
<p>{stats?.marks_entered || 0}</p>
</div>

<div className="card dark">
<h3>Pass Percentage</h3>
<p>{passPercentageComputed}%</p>
</div>

</div>

{/* CHARTS */}

<div className="charts">

<div className="chart-box">
<h3>Pass vs Fail</h3>
<Pie data={passFailData}/>
</div>

<div className="chart-box">
<h3>Subject Performance</h3>
<Bar data={subjectData}/>
</div>

</div>

</>

)

}

}

/* MAIN UI */

return(

<div className="dashboard">

<Navbar
title="Admin Dashboard"
logout={logout}
openProfile={()=>setPage("profile")}
onLogoClick={()=>setPage("dashboard")}
profileImage={profile.profileImage}
/>

<div className="dashboard-container">

<div className="sidebar">


<div className="profile-section" style={{textAlign:'center', borderBottom:'1px solid rgba(255,255,255,0.1)', marginBottom:'0', padding:'16px 16px 12px 16px'}}>
  {/* Profile Image Section */}
  <div style={{marginBottom:'12px', position:'relative'}}>
    {profile.profileImage ? (
      <div style={{width:85, height:85, display:'inline-block', borderRadius:'50%', background:'#fff', padding:3, boxShadow:'0 3px 6px rgba(0,0,0,0.15)'}}>
        <img src={profile.profileImage} alt="admin" style={{width:79, height:79, borderRadius:'50%', objectFit:'cover', display:'block'}} />
      </div>
    ) : (
      <div style={{width:85, height:85, background:'#fff', borderRadius:'50%', display:'inline-flex', alignItems:'center', justifyContent:'center', boxShadow:'0 3px 6px rgba(0,0,0,0.15)', marginBottom:'10px'}}>
        <div style={{width:77, height:77, background:'#e0e0e0', borderRadius:'50%', display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:'11px', color:'#999', fontWeight:'bold'}}>Admin</div>
      </div>
    )}
    {/* Upload Image Input */}
    <input type="file" accept="image/*" onChange={handleImageUpload} style={{display:'none'}} id="admin-image-input" />
    <label htmlFor="admin-image-input" style={{display:'block', marginTop:'8px', fontSize:'10px', fontWeight:'bold', color:'#1abcde', cursor:'pointer', backgroundColor:'rgba(26, 188, 222, 0.2)', padding:'5px 8px', borderRadius:'4px', textAlign:'center'}}>
      Upload Photo
    </label>
  </div>
  <h3 style={{fontWeight:700, marginBottom:'6px', fontSize:'16px'}}>{profile.name || "Admin"}</h3>
  <p style={{fontSize:'12px', color:'#b0b0b0', margin:0}}>ADM-2024-01</p>
</div>

<ul className="menu">

{menuItems.map(item=>(
<li
key={item.key}
className={`menu-item ${isActive(item.key)?"active":""}`}
onClick={()=>setPage(item.key)}
>
<span className="icon">{item.icon}</span>
{item.label}
</li>
))}

<li className="menu-item logout-item" onClick={logout}>
<span className="icon">⏻</span>
Logout
</li>

        <div style={{ margin: "0 16px 16px", background: "#1e1b4b", border: "1px solid #312e81", borderRadius: 10, padding: "10px 12px" }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#a78bfa", marginBottom: 3 }}>✦ AI Insights Active</div>
          <div style={{ fontSize: 10, color: "#94a3b8", lineHeight: 1.5 }}>Smart predictions & analysis enabled</div>
        </div>

</ul>

</div>

<div className="main-content">
  <div className="page-action-bar">
    <button className="theme-toggle" onClick={() => setDarkMode((prev) => !prev)}>
      {darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
    </button>
  </div>
  {renderContent()}
</div>

</div>

</div>

)

}

export default AdminDashboard