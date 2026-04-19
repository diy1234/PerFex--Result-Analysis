import React, { useState, useEffect } from "react";
import { Bar, Pie } from "react-chartjs-2";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import logo2 from "../logo2.png";
import AIInsight from "./AIInsight";
import { facultyAPI } from '../api';
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

const getStyles = (T) => ({
  root: { display:"flex", height:"100vh", background:T.bg, fontFamily:"'DM Sans','Segoe UI',sans-serif", color:T.text, overflow:"hidden" },
  sidebar: { width:240, background:T.sidebar, display:"flex", flexDirection:"column", borderRight:`1px solid ${T.border}`, flexShrink:0, height:"100vh", overflowY:"auto" },
  sidebarLogo: { padding:"12px 12px", borderBottom:`1px solid ${T.border}`, cursor:"pointer", display:"flex", alignItems:"center", gap:12, transition:"all 0.2s", borderRadius:"8px", margin:"8px 8px" },
  sidebarBrand: { fontSize:10, fontWeight:600, color:T.muted, letterSpacing:"0.12em", textTransform:"uppercase" },
  sidebarTitle: { fontSize:15, fontWeight:600, color:T.text, marginTop:3 },
  logoIcon: { width:36, height:36, borderRadius:"8px", background:T.accentSoft, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, color:T.accent, fontWeight:700, flexShrink:0 },
  avatarWrap: { padding:"20px 20px 16px", borderBottom:`1px solid ${T.border}` },
  avatarCircle: (img) => ({ width:56, height:56, borderRadius:"50%", background:img?"transparent":"#1e3a6e", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, fontWeight:700, color:T.accent, border:`2px solid ${T.accentSoft}`, marginBottom:10, overflow:"hidden" }),
  navSection: { fontSize:10, fontWeight:600, color:T.muted, letterSpacing:"0.1em", textTransform:"uppercase", padding:"16px 20px 6px" },
  navItem: (active) => ({ display:"flex", alignItems:"center", gap:10, padding:"10px 20px", cursor:"pointer", fontSize:13, fontWeight:500, color:active?"#fff":T.textSub, background:active?T.accentSoft:"transparent", borderLeft:`3px solid ${active?T.accent:"transparent"}`, transition:"all 0.15s" }),
  main: { flex:1, display:"flex", flexDirection:"column", overflow:"hidden" },
  topbar: { height:56, background:T.surface, borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 28px", flexShrink:0 },
  content: { flex:1, overflowY:"auto", padding:"24px 28px" },
  card: { background:T.card, border:`1px solid ${T.border}`, borderRadius:12, padding:"20px 22px" },
  statCard: (color) => ({ background:T.card, border:`1px solid ${T.border}`, borderRadius:12, padding:"18px 20px", borderTop:`3px solid ${color}`, position:"relative" }),
  th: { padding:"10px 14px", fontSize:11, fontWeight:600, color:T.muted, textTransform:"uppercase", letterSpacing:"0.07em", textAlign:"left", borderBottom:`1px solid ${T.border}`, whiteSpace:"nowrap" },
  td: { padding:"11px 14px", fontSize:13, color:T.text, borderBottom:`1px solid ${T.border}` },
  input: { width:"100%", padding:"9px 12px", background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, color:T.text, fontSize:13, outline:"none", boxSizing:"border-box" },
  select: { padding:"8px 12px", background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, color:T.text, fontSize:13, cursor:"pointer", outline:"none" },
  textarea: { width:"100%", padding:"9px 12px", background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, color:T.text, fontSize:13, outline:"none", minHeight:100, resize:"vertical", fontFamily:"inherit", boxSizing:"border-box" },
  btnPrimary: { padding:"9px 20px", background:T.accent, color:"#fff", border:"none", borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer", letterSpacing:"0.02em" },
  btnSecondary: { padding:"9px 20px", background:"transparent", color:T.textSub, border:`1px solid ${T.border}`, borderRadius:8, fontSize:13, fontWeight:500, cursor:"pointer" },
  btnDanger: { padding:"7px 14px", background:"transparent", color:T.danger, border:`1px solid #3b1c1c`, borderRadius:7, fontSize:12, fontWeight:500, cursor:"pointer" },
  btnSuccess: { padding:"7px 14px", background:"transparent", color:T.success, border:`1px solid #1a3a2a`, borderRadius:7, fontSize:12, fontWeight:500, cursor:"pointer" },
  btnSmall: { padding:"6px 14px", background:T.accentSoft, color:T.accent, border:`1px solid #1e3a6e`, borderRadius:7, fontSize:12, fontWeight:500, cursor:"pointer" },
  badge: (type) => {
    const m = { pass:{bg:"#14532d22",color:T.success,border:"#14532d"}, fail:{bg:"#450a0a22",color:T.danger,border:"#450a0a"}, risk:{bg:"#78350f22",color:T.warning,border:"#78350f"}, pending:{bg:"#78350f22",color:T.warning,border:"#78350f"}, resolved:{bg:"#14532d22",color:T.success,border:"#14532d"}, info:{bg:"#1e3a6e22",color:T.accent,border:"#1e3a6e"} };
    const c = m[type] || m.info;
    return { display:"inline-block", padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:600, background:c.bg, color:c.color, border:`1px solid ${c.border}` };
  },
  label: { fontSize:11, fontWeight:600, color:T.muted, textTransform:"uppercase", letterSpacing:"0.07em", display:"block", marginBottom:7 },
});

const chartDefaults = {
  plugins: { legend:{ display:false }, tooltip:{ backgroundColor:"#1c2333", borderColor:"#2a3348", borderWidth:1, titleColor:"#e2e8f0", bodyColor:"#94a3b8", padding:10 } },
  scales: { x:{ grid:{ color:"#2a3348" }, ticks:{ color:"#64748b", font:{ size:11 } } }, y:{ grid:{ color:"#2a3348" }, ticks:{ color:"#64748b", font:{ size:11 } } } },
  maintainAspectRatio: false,
};

const NAV = [
  { key:"dashboard",     label:"Dashboard",       icon:"▦" },
  { key:"upload",        label:"Upload Marks",    icon:"⬆" },
  { key:"results",       label:"View Results",    icon:"≡" },
  { key:"analysis",      label:"Performance",     icon:"↗" },
  { key:"announcements", label:"Announcements",   icon:"✉" },
  { key:"queries",       label:"Student Queries", icon:"?" },
  { key:"profile",       label:"Profile",         icon:"◎" },
];

export default function FacultyDashboard({ setDashboard, announcements, setAnnouncements }) {
  const [view,        setView]        = useState("dashboard");
  const [course,      setCourse]      = useState("MCA");
  const [semester,    setSemester]    = useState("Sem1");
  const [subject,     setSubject]     = useState("DBMS");
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);
  const [examType,    setExamType]    = useState("CIE1");
  const [editingId,   setEditingId]   = useState(null);
  const [editVal,     setEditVal]     = useState("");
  const [facultyImage, setFacultyImage] = useState(null);
  const [newAnnouncement, setNewAnnouncement] = useState({ title:"", message:"", course:"MCA", semester:"Sem1", subject:"DBMS", class:"All" });
  const [announcementFile, setAnnouncementFile] = useState(null);
  const [isDarkMode,  setIsDarkMode]  = useState(true);
  const [classSection, setClassSection] = useState("All");
  const [filterApplied, setFilterApplied] = useState(false);
  const [uploadApplyClicked,   setUploadApplyClicked]   = useState(false);
  const [uploadFiltersApplied, setUploadFiltersApplied] = useState(false);
  const [uploadLoadingMessage, setUploadLoadingMessage] = useState("");
  const [resultsSemesterFilter, setResultsSemesterFilter] = useState("All");
  const [resultsSubjectFilter,  setResultsSubjectFilter]  = useState("All");
  const [resultsApplyClicked,   setResultsApplyClicked]   = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editProfileData, setEditProfileData] = useState({
    name:"Dr. Rajesh Kumar", email:"rajesh.kumar@university.edu",
    department:"Computer Science", facultyId:"FAC-2021-001",
  });

  // ── NEW: State for faculty allocations ──
  const [facultyAllocations, setFacultyAllocations] = useState([]);

  // ── State for query replies ──
  const [queryReplies, setQueryReplies] = useState({});

  const T = isDarkMode ? DARK_T : LIGHT_T;
  const S = getStyles(T);

  /* ── allMarksData — starts empty, filled by backend ──────────────────── */
  const [allMarksData, setAllMarksData] = useState([]);
  const [queries,      setQueries]      = useState([]);
  const [subjectsList, setSubjectsList] = useState([]);

  /* ── Helper: normalise subject name to short key ─────────────────────── */
  function normaliseSubjectKey(name) {
    const n = (name || '').toLowerCase();
    if (n.includes('algo'))                             return 'algo';
    if (n.includes('os') || n.includes('operat'))       return 'os';
    if (n.includes('data str') || n === 'ds')           return 'ds';
    if (n.includes('dbms') || n.includes('database'))   return 'dbms';
    if (n.includes('network'))                          return 'cn';
    if (n.includes('artificial') || n === 'ai')         return 'ai';
    if (n.includes('java'))                             return 'java';
    if (n.includes('software'))                         return 'se';
    if (n.includes('web'))                              return 'wt';
    return n.split(' ')[0].replace(/[^a-z0-9]/g, '');
  }

  /* ── Load profile, allocations, queries, announcements on mount ───────── */
  useEffect(() => {
    facultyAPI.getProfile()
      .then(profile => {
        if (profile) {
          setEditProfileData({
            name:       profile.name       || "Dr. Rajesh Kumar",
            email:      profile.email      || "",
            department: profile.department || "Computer Science",
            facultyId:  profile.faculty_id || "",
            phone:      profile.phone      || "",
          });
          if (profile.profileImage) setFacultyImage(profile.profileImage);
        }
      })
      .catch(() => {});

    // Load faculty allocations
    facultyAPI.getAllocations()
      .then(allocations => {
        setFacultyAllocations(allocations || []);
        // Set initial course/semester from first allocation
        if (allocations && allocations.length > 0) {
          setCourse(allocations[0].course);
          setSemester(allocations[0].semester);
          setSubject(allocations[0].subject_name);
          setSelectedSubjectId(allocations[0].subject_id);
          if (allocations[0].section) setClassSection(allocations[0].section);
        }
      })
      .catch(() => {});

    facultyAPI.getQueries()
      .then(rows => setQueries(rows || []))
      .catch(() => {});

    facultyAPI.getAnnouncements()
      .then(rows => setAnnouncements(rows || []))
      .catch(() => {}); // eslint-disable-line react-hooks/exhaustive-deps
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived: Available options from allocations ─────────────────────────
  const availableCourses = [...new Set(facultyAllocations.map(a => a.course))].sort();
  const availableSemesters = [...new Set(
    facultyAllocations.filter(a => a.course === course).map(a => a.semester)
  )].sort();
  const availableSubjects = [...new Set(
    facultyAllocations.filter(a => a.course === course && a.semester === semester)
      .map(a => a.subject_name)
  )].sort();
  const availableSections = [...new Set(
    facultyAllocations.filter(a => a.course === course && a.semester === semester)
      .map(a => a.section).filter(s => s)
  )].sort();
  availableSections.unshift("All"); // Add "All" option

  /* ── Load subjects list + marks from backend when filters change ──────── */
  useEffect(() => {
    facultyAPI.getSubjects({ course, semester })
      .then(rows => setSubjectsList(rows || []))
      .catch(() => {});

    const markFilters = { course, semester, exam_type: examType };
    if (selectedSubjectId) markFilters.subject_id = selectedSubjectId;
    if (classSection !== "All") markFilters.section = classSection;

    facultyAPI.getMarks(markFilters)
      .then(rows => {
        const studentMap = {};
        (rows || []).forEach(r => {
          const sid = r.student_id;
          if (!studentMap[sid]) {
            studentMap[sid] = { id:sid, name:r.name, enroll:r.enroll, rollNo:r.enroll };
          }
          const key = normaliseSubjectKey(r.subject || '');
          studentMap[sid][key]                     = r.marks ?? 0;
          studentMap[sid][`${key}_mark_id`]        = r.mark_id;
          studentMap[sid][`${key}_subject_id`]     = r.subject_id;
        });
        setAllMarksData(Object.values(studentMap));
      })
      .catch(() => {});
  }, [course, semester, subject, selectedSubjectId, examType, classSection]);

  /* ── Validate announcement form fields when allocations change ────────── */
  useEffect(() => {
    if (facultyAllocations.length === 0) return;
    
    // Get valid subjects for current course/semester
    const validSubjects = [...new Set(
      facultyAllocations
        .filter(a => a.course === newAnnouncement.course && a.semester === newAnnouncement.semester)
        .map(a => a.subject_name)
    )];
    
    // Get valid sections for current course/semester
    const validSections = [...new Set(
      facultyAllocations
        .filter(a => a.course === newAnnouncement.course && a.semester === newAnnouncement.semester)
        .map(a => a.section)
        .filter(s => s)
    )];
    
    // Reset subject if not valid
    if (validSubjects.length > 0 && !validSubjects.includes(newAnnouncement.subject)) {
      setNewAnnouncement(prev => ({ ...prev, subject: validSubjects[0] }));
    }
    
    // Reset class if not valid
    if (newAnnouncement.class !== "All" && validSections.length > 0 && !validSections.includes(newAnnouncement.class)) {
      setNewAnnouncement(prev => ({ ...prev, class: "All" }));
    }
  }, [facultyAllocations, newAnnouncement.course, newAnnouncement.semester]);

  /* ── Derived data ────────────────────────────────────────────────────── */
  const selectedSubjectKey = selectedSubjectId ? normaliseSubjectKey(subject) : null;

  const uniqueSubjectKeys = [...new Set(
    allMarksData.flatMap(s =>
      Object.keys(s).filter(k => !['id','name','enroll','rollNo'].includes(k) && !k.includes('_id'))
    )
  )];

  const chartSubjects = subjectsList.length
    ? subjectsList.map(s => ({ label:s.code, key:normaliseSubjectKey(s.name) }))
    : uniqueSubjectKeys.length
      ? uniqueSubjectKeys.map(k => ({ label:k.toUpperCase(), key:k }))
      : [
          { label:"DBMS", key:"dbms" }, { label:"OS",   key:"os"   },
          { label:"DS",   key:"ds"   }, { label:"Algo", key:"algo" },
        ];

  const currentMarks = allMarksData.map(s => {
    if (selectedSubjectKey) {
      return { ...s, marks: s[selectedSubjectKey] ?? 0 };
    }
    const subjectMarks = chartSubjects.map(cs => s[cs.key] ?? 0);
    const total = subjectMarks.reduce((a,b) => a + b, 0);
    const maxTotal = (chartSubjects.length || 1) * 100;
    const pct = maxTotal ? (total / maxTotal) * 100 : 0;
    return { ...s, marks: Number(pct.toFixed(1)), totalMarks: total, percentage: pct.toFixed(2) };
  });
  const weakStudents  = currentMarks.filter(s => s.marks < 40);

  const safeAvg = arr => {
    const valid = arr.filter(v => v !== undefined && v !== null);
    if (!valid.length) return "0.0";
    return (valid.reduce((a,b) => a+b, 0) / valid.length).toFixed(1);
  };

  const calcStats = marks => {
    if (!marks.length) return { avg:"0.0", highest:0, lowest:0, passRate:"0.0", passCount:0, failCount:0 };
    return {
      avg:       safeAvg(marks),
      highest:   Math.max(...marks),
      lowest:    Math.min(...marks),
      passRate:  ((marks.filter(m => m >= 40).length / marks.length)*100).toFixed(1),
      passCount: marks.filter(m => m >= 40).length,
      failCount: marks.filter(m => m < 40).length,
    };
  };
  const stats = calcStats(currentMarks.map(s => s.marks));

  const subjectAvgs = Object.fromEntries(
    uniqueSubjectKeys.map(k => [k, safeAvg(allMarksData.map(s => s[k]))])
  );

  const studentResultsData = allMarksData.map(s => {
    const subjectMarks = chartSubjects.map(cs => s[cs.key] ?? 0);
    const total    = subjectMarks.reduce((a,b) => a+b, 0);
    const maxTotal = chartSubjects.length * 100 || 100;
    return { ...s, totalMarks:total, percentage:((total/maxTotal)*100).toFixed(2) };
  });

  /* ── AI context — built from real backend data ───────────────────────── */
  const facultyAIContext = [
    `Faculty view: ${course} · Sem ${semester} · ${subject} · ${examType} · Class ${classSection}`,
    `Class avg: ${stats.avg}% | Pass rate: ${stats.passRate}% | Highest: ${stats.highest} | Lowest: ${stats.lowest}`,
    `Pass: ${stats.passCount} students | Fail: ${stats.failCount} students`,
    `At-risk (below 40): ${weakStudents.map(s => s.name+'('+s.marks+')').join(', ') || 'None'}`,
    `Subject averages — ${uniqueSubjectKeys.map(k => k.toUpperCase()+':'+subjectAvgs[k]).join(' ') || 'No data'}`,
    `All students: ${allMarksData.map(s => s.name+'='+ (selectedSubjectKey ? s[selectedSubjectKey] : s.percentage)).join(', ') || 'No data'}`,
  ].join('\n');

  /* ── Chart data ──────────────────────────────────────────────────────── */
  const barColors = ["#4f8ef7cc","#22c55ecc","#f59e0bcc","#a855f7cc","#ec4899cc","#06b6d4cc"];
  const barData = {
    labels: chartSubjects.map(cs => cs.label),
    datasets: [{ label:"Average Marks", data:chartSubjects.map(cs => parseFloat(subjectAvgs[cs.key] || 0)), backgroundColor:chartSubjects.map((_,i) => barColors[i%barColors.length]), borderRadius:6, barThickness:36 }],
  };
  const pieData = {
    labels: ["Pass (≥40)","Fail (<40)"],
    datasets: [{ data:[stats.passCount,stats.failCount], backgroundColor:["#22c55e99","#ef444499"], borderColor:["#22c55e","#ef4444"], borderWidth:1 }],
  };
  const pieOptions = {
    maintainAspectRatio:false, cutout:"62%",
    plugins:{ legend:{ display:false }, tooltip:{ backgroundColor:"#1c2333", borderColor:"#2a3348", borderWidth:1, titleColor:"#e2e8f0", bodyColor:"#94a3b8" } },
  };

  /* ── Handlers ────────────────────────────────────────────────────────── */
  const handleApplyFilters = () => {
    setFilterApplied(true);
  };

  const handleApplyUploadFilters = () => {
    setUploadApplyClicked(true);
  };

  const handleLoadUploadFilters = () => {
    setUploadFiltersApplied(true);
    setUploadLoadingMessage(`✓ Loaded: ${course} · ${semester} · ${subject} · ${examType} · Class ${classSection}`);

    const filters = { course, semester, exam_type: examType };
    if (selectedSubjectId) filters.subject_id = selectedSubjectId;
    if (classSection !== "All") filters.section = classSection;

    facultyAPI.getMarks(filters)
      .then(rows => {
        const studentMap = {};
        (rows || []).forEach(r => {
          const sid = r.student_id;
          if (!studentMap[sid]) studentMap[sid] = { id:sid, name:r.name, enroll:r.enroll, rollNo:r.enroll };
          const key = normaliseSubjectKey(r.subject || '');
          studentMap[sid][key]                 = r.marks ?? 0;
          studentMap[sid][`${key}_mark_id`]    = r.mark_id;
          studentMap[sid][`${key}_subject_id`] = r.subject_id;
          if ((r.subject || '').toLowerCase().includes(subject.toLowerCase())) {
            studentMap[sid].marks = r.marks ?? 0;
          }
        });
        setAllMarksData(Object.values(studentMap));
      })
      .catch(err => console.error('Failed to load marks:', err));

    setTimeout(() => setUploadLoadingMessage(""), 3000);
  };

  const handleApplyResultsFilters = () => {
    setResultsApplyClicked(true);
  };

  const handleUpdateMarks = async (studentId) => {
    const val = parseInt(editVal);
    if (isNaN(val) || val < 0 || val > 100) { alert("Enter valid marks (0-100)"); return; }

    const studentRow = allMarksData.find(s => s.id === studentId);
    const subjectId  = studentRow && selectedSubjectKey ? studentRow[`${selectedSubjectKey}_subject_id`] || selectedSubjectId : selectedSubjectId;
    if (!subjectId) { alert("Could not determine subject ID. Please re-load data."); return; }

    await facultyAPI.enterMarks({ student_id:studentId, subject_id:subjectId, exam_type:examType, marks:val });

    setAllMarksData(prev => prev.map(s => s.id === studentId ? { ...s, [selectedSubjectKey]:val } : s));
    setEditingId(null);
    setEditVal('');
  };

  const handleAddAnnouncement = async () => {
    if (!newAnnouncement.title || !newAnnouncement.message) {
      alert("Please fill in title and message");
      return;
    }
    if (!newAnnouncement.subject || !newAnnouncement.class) {
      alert("Please select subject and class from your allocated assignments");
      return;
    }
    
    try {
      console.log("Posting announcement:", newAnnouncement, "File:", announcementFile);
      await facultyAPI.postAnnouncement({ ...newAnnouncement, type:'Notice' }, announcementFile);
      console.log("Announcement posted successfully");
      
      const updated = await facultyAPI.getAnnouncements();
      setAnnouncements(updated);
      
      // Reset to first available allocation
      if (availableCourses.length > 0) {
        const firstAllocation = facultyAllocations.find(a => a.course === availableCourses[0]);
        setNewAnnouncement({ 
          title:"", 
          message:"", 
          course: availableCourses[0],
          semester: firstAllocation?.semester || "Sem1",
          subject: firstAllocation?.subject_name || "DBMS",
          class: firstAllocation?.section || "All"
        });
      } else {
        setNewAnnouncement({ title:"", message:"", course:"MCA", semester:"Sem1", subject:"DBMS", class:"All" });
      }
      setAnnouncementFile(null);
      alert("✓ Announcement posted successfully!");
    } catch (error) {
      console.error("Failed to post announcement:", error);
      alert(`Error posting announcement: ${error.message || 'Unknown error'}`);
    }
  };

  const handleReplyQuery = async (id) => {
    await facultyAPI.resolveQuery(id);
    setQueries(prev => prev.map(q => q.id === id ? { ...q, status:"Resolved" } : q));
  };

  const handleSendReply = async (qId, replyText, studentName) => {
    if (!replyText.trim()) {
      alert("Please write a reply message");
      return;
    }
    try {
      await facultyAPI.replyQuery(qId, replyText);
      setQueries(prev => prev.map(q => q.id === qId ? { ...q, status:"Resolved", reply_message: replyText } : q));
      setQueryReplies(prev => ({ ...prev, [qId]: "" }));
      alert(`✓ Reply sent to ${studentName}!\n\n"${replyText}"\n\nStudent has been notified via the system.`);
    } catch (error) {
      console.error('Failed to send reply:', error);
      alert(`Failed to send reply: ${error.message || 'Unknown error'}`);
    }
  };

  const handleSaveProfile = async () => {
    try {
      await facultyAPI.updateProfile({
        name:       editProfileData.name,
        department: editProfileData.department,
        phone:      editProfileData.phone || '',
        profileImage: facultyImage || null,
      });
    } catch(e) { console.error('Profile update failed', e); }
    setIsEditingProfile(false);
  };

  const handleCancelEdit = () => {
    setIsEditingProfile(false);
    facultyAPI.getProfile().then(profile => {
      if (profile) {
        setEditProfileData({
          name:       profile.name       || '',
          email:      profile.email      || '',
          department: profile.department || '',
          facultyId:  profile.faculty_id || '',
          phone:      profile.phone      || '',
        });
      }
    }).catch(() => {});
  };

  const downloadCSV = () => {
    const rows = [["Roll No","Name","Marks","Status"], ...currentMarks.map(s => [s.rollNo,s.name,s.marks,s.marks<40?"Fail":"Pass"])];
    const blob = new Blob([rows.map(r => r.join(",")).join("\n")], { type:"text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `marks-${subject}-${examType}.csv`;
    link.click();
  };

  const downloadPDF = async () => {
    const el = document.getElementById("resultsSection");
    if (!el) return;
    const canvas = await html2canvas(el, { backgroundColor:"#1c2333" });
    const pdf = new jsPDF();
    pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, 210, 120);
    pdf.save("results-report.pdf");
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) { const reader = new FileReader(); reader.onload = ev => setFacultyImage(ev.target.result); reader.readAsDataURL(file); }
  };

  const facultyDetails = {
    name:"Dr. Rajesh Kumar", facultyId:"FAC-2021-001",
    department:"Computer Science & Engineering", email:"rajesh.kumar@jimsdelhi.ac.in",
    subjectsAssigned:["Database Management Systems","Operating Systems","Data Structures","Advanced Algorithms"],
  };

  /* ── Sub-components ──────────────────────────────────────────────────── */
  const SectionHeader = ({ title, subtitle, actions }) => (
    <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:24 }}>
      <div>
        <h2 style={{ fontSize:20, fontWeight:700, color:T.text, margin:0 }}>{title}</h2>
        {subtitle && <p style={{ fontSize:13, color:T.muted, marginTop:4 }}>{subtitle}</p>}
      </div>
      {actions && <div style={{ display:"flex", gap:8 }}>{actions}</div>}
    </div>
  );

  const StatCard = ({ label, value, sub, color, trend }) => (
    <div style={S.statCard(color)}>
      <div style={{ fontSize:11, fontWeight:600, color:T.muted, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:10 }}>{label}</div>
      <div style={{ fontSize:28, fontWeight:700, color:T.text, lineHeight:1 }}>{value}</div>
      {sub && <div style={{ fontSize:12, color:T.muted, marginTop:6 }}>{sub}</div>}
      {trend && (
        <div style={{ marginTop:8, fontSize:11, fontWeight:600, color:trend.up?T.success:T.danger, background:trend.up?"#14532d22":"#450a0a22", display:"inline-block", padding:"2px 8px", borderRadius:20 }}>
          {trend.up?"▲":"▼"} {trend.label}
        </div>
      )}
    </div>
  );

  /* ── Filter bar (shared across views) ───────────────────────────────── */
  const FilterBar = ({ onApply }) => (
    <div style={{ display:"flex", gap:14, marginBottom:28, alignItems:"center", flexWrap:"wrap" }}>
      <select style={{ ...S.select, minWidth:140, padding:"10px 14px", fontSize:14, fontWeight:500 }} value={course} onChange={e => { setCourse(e.target.value); setSemester(""); setSubject(""); setSelectedSubjectId(null); }}>
        <option value="">Select Course</option>
        {availableCourses.map(c => <option key={c} value={c}>{c}</option>)}
      </select>
      <select style={{ ...S.select, minWidth:140, padding:"10px 14px", fontSize:14, fontWeight:500 }} value={semester} onChange={e => { setSemester(e.target.value); setSubject(""); setSelectedSubjectId(null); }}>
        <option value="">Select Semester</option>
        {availableSemesters.map(s => <option key={s} value={s}>{s}</option>)}
      </select>
      <select style={{ ...S.select, minWidth:180, padding:"10px 14px", fontSize:14, fontWeight:500 }} value={subject} onChange={e => {
        const value = e.target.value;
        setSubject(value);
        const allocation = facultyAllocations.find(a => a.subject_name === value && a.course === course && a.semester === semester);
        setSelectedSubjectId(allocation ? allocation.subject_id : null);
      }}>
        <option value="">Select Subject</option>
        {availableSubjects.length > 0
          ? availableSubjects.map(s => <option key={s} value={s}>{s}</option>)
          : [<option key="DBMS" value="DBMS">DBMS</option>, <option key="OS" value="OS">Operating Systems</option>]
        }
      </select>
      <select style={{ ...S.select, minWidth:160, padding:"10px 14px", fontSize:14, fontWeight:500 }} value={examType} onChange={e => setExamType(e.target.value)}>
        <option value="CIE1">CIE 1</option><option value="CIE2">CIE 2</option>
        <option value="INTERNAL1">Internal 1</option><option value="INTERNAL2">Internal 2</option>
        <option value="FULLRESULT">Final Result</option>
      </select>
      <select style={{ ...S.select, minWidth:120, padding:"10px 14px", fontSize:14, fontWeight:500 }} value={classSection} onChange={e => setClassSection(e.target.value)}>
        {availableSections.map(sec => <option key={sec} value={sec}>{sec === "All" ? "All Classes" : `Class ${sec}`}</option>)}
      </select>
      <button onClick={onApply} style={{ ...S.btnPrimary, padding:"10px 32px", fontSize:15, fontWeight:600, minWidth:120, cursor:"pointer", boxShadow:"0 4px 12px rgba(79,142,247,0.3)" }}
        onMouseEnter={e => e.target.style.transform="translateY(-2px)"}
        onMouseLeave={e => e.target.style.transform="translateY(0)"}>
        Apply
      </button>
    </div>
  );

  /* ── VIEWS ───────────────────────────────────────────────────────────── */

  const ViewDashboard = () => (
    <>
      <FilterBar onApply={handleApplyFilters} />

      {filterApplied && (
        <div style={{ ...S.card, marginBottom:20, background:T.accentSoft, borderLeft:`4px solid ${T.accent}`, padding:"16px 20px" }}>
          <div style={{ fontSize:12, fontWeight:600, color:T.text, marginBottom:8 }}>📊 Current Data View</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:12 }}>
            {[["Course",course],["Semester",semester],["Subject",subject],["Exam Type",examType],["Class",classSection],["Total Records",allMarksData.length]].map(([l,v]) => (
              <div key={l} style={{ fontSize:11, color:T.text }}><span style={{ color:T.muted }}>{l}:</span> <strong>{v}</strong></div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:24 }}>
        <StatCard label="Total Students"  value={allMarksData.length} sub={`${course} · Sem ${semester}`} color={T.accent}   trend={{ up:true,  label:"+2 this batch" }} />
        <StatCard label="Class Average"   value={`${stats.avg}%`}     sub={selectedSubjectId ? "Selected subject" : "Overall semester"} color={T.warning}  trend={{ up:false, label:"-1.2% vs last" }} />
        <StatCard label="Pass Rate"       value={`${stats.passRate}%`} sub={`${stats.passCount} of ${allMarksData.length} passed`} color={T.success} trend={{ up:true, label:"+3% improved" }} />
        <StatCard label="At-Risk Students" value={weakStudents.length} sub="Scored below 40"              color={T.danger}   trend={weakStudents.length>0?{ up:false, label:"Needs attention" }:null} />
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"3fr 2fr", gap:16, marginBottom:24 }}>
        <div style={S.card}>
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:14, fontWeight:600, color:T.text }}>Subject-wise Average Marks</div>
            <div style={{ fontSize:12, color:T.muted, marginTop:3 }}>All subjects this semester</div>
          </div>
          <div style={{ height:240, position:"relative" }}>
            {allMarksData.length > 0 ? <Bar data={barData} options={chartDefaults} /> : <div style={{ textAlign:"center", paddingTop:80, color:T.muted, fontSize:13 }}>No data loaded yet.</div>}
          </div>
        </div>
        <div style={S.card}>
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:14, fontWeight:600, color:T.text }}>Pass / Fail Distribution</div>
            <div style={{ fontSize:12, color:T.muted, marginTop:3 }}>{subject} · {examType}</div>
          </div>
          <div style={{ height:160, position:"relative", marginBottom:16 }}>
            {allMarksData.length > 0 ? <Pie data={pieData} options={pieOptions} /> : <div style={{ textAlign:"center", paddingTop:40, color:T.muted, fontSize:13 }}>No data.</div>}
          </div>
          {[
            { label:"Passed", count:stats.passCount, pct:stats.passRate,                               color:T.success },
            { label:"Failed", count:stats.failCount, pct:(100-parseFloat(stats.passRate)).toFixed(1), color:T.danger  },
          ].map(row => (
            <div key={row.label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
              <div style={{ display:"flex", alignItems:"center", gap:6 }}><div style={{ width:8, height:8, borderRadius:2, background:row.color }} /><span style={{ fontSize:12, color:T.muted }}>{row.label}</span></div>
              <span style={{ fontSize:12, fontWeight:600, color:T.text }}>{row.count} students ({row.pct}%)</span>
            </div>
          ))}
        </div>
      </div>

      <div style={S.card}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
          <div><div style={{ fontSize:14, fontWeight:600, color:T.text }}>Student Overview</div><div style={{ fontSize:12, color:T.muted, marginTop:3 }}>All students · {subject}</div></div>
          <button style={S.btnSmall} onClick={downloadCSV}>Export CSV</button>
        </div>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr>
                <th style={S.th}>Roll No</th><th style={S.th}>Name</th>
                {chartSubjects.map(cs => <th key={cs.key} style={S.th}>{cs.label}</th>)}
                <th style={S.th}>Total</th><th style={S.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {studentResultsData.map(s => {
                const pct = parseFloat(s.percentage);
                const status = pct >= 75 ? "pass" : pct >= 40 ? "risk" : "fail";
                const label  = pct >= 75 ? "Good" : pct >= 40 ? "At Risk" : "Fail";
                const maxTotal = chartSubjects.length * 100 || 400;
                return (
                  <tr key={s.id} onMouseEnter={e => e.currentTarget.style.background="#ffffff08"} onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                    <td style={S.td}><span style={{ color:T.muted, fontFamily:"monospace", fontSize:12 }}>{s.rollNo}</span></td>
                    <td style={{ ...S.td, fontWeight:600 }}>{s.name}</td>
                    {chartSubjects.map(cs => <td key={cs.key} style={S.td}>{s[cs.key] ?? 0}</td>)}
                    <td style={{ ...S.td, fontWeight:600, color:T.accent }}>{s.totalMarks}/{maxTotal}</td>
                    <td style={S.td}><span style={S.badge(status)}>{label}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <AIInsight role="faculty" dataContext={facultyAIContext} dark={isDarkMode} />
    </>
  );

  const ViewUpload = () => (
    <>
      <SectionHeader title="Upload Marks" subtitle="Enter or update student marks by subject and exam" />
      <FilterBar onApply={handleApplyUploadFilters} />

      {uploadApplyClicked && (
        <div style={{ ...S.card, marginBottom:24, border:`2px solid ${T.accent}`, background:`${T.card}dd` }}>
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:15, fontWeight:600, color:T.text, display:"flex", alignItems:"center", gap:8 }}><span style={{ color:T.accent }}>📋</span> Confirm Filter Selection</div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:12, marginBottom:20 }}>
            {[["Course",course],["Semester",semester],["Subject",subject],["Exam Type",examType],["Class",classSection]].map(([l,v]) => (
              <div key={l} style={{ padding:12, background:T.surface, borderRadius:8, border:`1px solid ${T.border}` }}>
                <div style={{ fontSize:10, color:T.muted, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:6 }}>{l}</div>
                <div style={{ fontSize:14, fontWeight:700, color:T.text }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
            <button onClick={() => setUploadApplyClicked(false)} style={{ ...S.btnSecondary, padding:"10px 24px" }}>Back</button>
            <button onClick={handleLoadUploadFilters} style={{ ...S.btnPrimary, padding:"10px 32px", fontSize:14, fontWeight:600, boxShadow:"0 4px 12px rgba(79,142,247,0.4)" }}
              onMouseEnter={e => e.target.style.transform="translateY(-2px)"} onMouseLeave={e => e.target.style.transform="translateY(0)"}>
              Load Data
            </button>
          </div>
        </div>
      )}

      {uploadLoadingMessage && (
        <div style={{ fontSize:12, color:T.success, fontWeight:600, display:"flex", alignItems:"center", gap:6, marginBottom:20, padding:12, background:`${T.success}15`, borderRadius:8, border:`1px solid ${T.success}40` }}>
          {uploadLoadingMessage}
        </div>
      )}

      {uploadFiltersApplied && (
        <>
          <div style={S.card}>
            <div style={{ marginBottom:16, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <div style={{ fontSize:14, fontWeight:600, color:T.text }}>{subject} · {examType} · {course} {semester} · Class {classSection}</div>
                <div style={{ fontSize:11, color:T.success, marginTop:4, fontWeight:600 }}>✓ Data Loaded - Ready to Edit</div>
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <button style={S.btnPrimary} onClick={() => alert("Marks saved!")}>Save All</button>
                <button style={S.btnSecondary} onClick={downloadCSV}>Export CSV</button>
              </div>
            </div>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead><tr>{["Roll No","Student Name","Current Marks","Edit","Action"].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
              <tbody>
                {currentMarks.map(student => (
                  <tr key={student.id} onMouseEnter={e => e.currentTarget.style.background="#ffffff06"} onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                    <td style={S.td}><span style={{ color:T.muted, fontFamily:"monospace", fontSize:12 }}>{student.rollNo}</span></td>
                    <td style={{ ...S.td, fontWeight:600 }}>{student.name}</td>
                    <td style={S.td}><span style={{ fontWeight:700, color:student.marks<40?T.danger:T.success }}>{student.marks}</span><span style={{ color:T.muted, fontSize:12 }}>/100</span></td>
                    <td style={S.td}>
                      {editingId === student.id
                        ? <input type="number" min={0} max={100} value={editVal} onChange={e => setEditVal(e.target.value)} style={{ ...S.input, width:80, padding:"6px 10px" }} />
                        : <span style={{ color:T.muted, fontSize:12 }}>—</span>}
                    </td>
                    <td style={S.td}>
                      {editingId === student.id
                        ? <div style={{ display:"flex", gap:6 }}><button style={S.btnSuccess} onClick={() => handleUpdateMarks(student.id)}>Save</button><button style={S.btnDanger} onClick={() => { setEditingId(null); setEditVal(""); }}>Cancel</button></div>
                        : <button style={S.btnSmall} onClick={() => { setEditingId(student.id); setEditVal(student.marks); }}>Edit</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {weakStudents.length > 0 && (
            <div style={{ ...S.card, marginTop:20, borderLeft:`3px solid ${T.danger}` }}>
              <div style={{ fontSize:13, fontWeight:600, color:T.danger, marginBottom:12 }}>⚠ {weakStudents.length} student{weakStudents.length>1?"s":""} scoring below 40</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                {weakStudents.map(s => <span key={s.id} style={{ fontSize:12, background:"#450a0a33", color:T.danger, border:"1px solid #450a0a", padding:"4px 12px", borderRadius:20 }}>{s.name} · {s.marks}</span>)}
              </div>
            </div>
          )}
        </>
      )}
    </>
  );

  const ViewResults = () => (
    <>
      <SectionHeader title="View Results" subtitle="Complete student result overview"
        actions={[<button key="pdf" style={S.btnSecondary} onClick={downloadPDF}>Export PDF</button>, <button key="csv" style={S.btnPrimary} onClick={downloadCSV}>Export CSV</button>]} />

      <div style={{ display:"flex", gap:14, marginBottom:28, alignItems:"center", flexWrap:"wrap" }}>
        <div style={{ display:"flex", flexDirection:"column" }}>
          <label style={S.label}>Filter by Semester</label>
          <select style={{ ...S.select, minWidth:160, padding:"10px 14px", fontSize:14, fontWeight:500 }} value={resultsSemesterFilter} onChange={e => setResultsSemesterFilter(e.target.value)}>
            <option value="All">All Semesters</option>
            {["Sem1","Sem2","Sem3","Sem4"].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div style={{ display:"flex", flexDirection:"column" }}>
          <label style={S.label}>Filter by Subject</label>
          <select style={{ ...S.select, minWidth:180, padding:"10px 14px", fontSize:14, fontWeight:500 }} value={resultsSubjectFilter} onChange={e => setResultsSubjectFilter(e.target.value)}>
            <option value="All">All Subjects</option>
            {subjectsList.length > 0
              ? subjectsList.map(s => <option key={s.id} value={s.name}>{s.name}</option>)
              : [<option key="DBMS" value="DBMS">DBMS</option>, <option key="OS" value="OS">Operating Systems</option>, <option key="DS" value="DS">Data Structures</option>, <option key="Algo" value="Algorithms">Algorithms</option>]}
          </select>
        </div>
        <button onClick={handleApplyResultsFilters} style={{ ...S.btnPrimary, padding:"10px 32px", fontSize:15, fontWeight:600, minWidth:120, cursor:"pointer", boxShadow:"0 4px 12px rgba(79,142,247,0.3)", marginTop:20 }}
          onMouseEnter={e => e.target.style.transform="translateY(-2px)"} onMouseLeave={e => e.target.style.transform="translateY(0)"}>
          Apply
        </button>
      </div>

      {resultsApplyClicked && (
        <>
          <div style={{ ...S.card, marginBottom:24, border:`2px solid ${T.accent}`, background:`${T.card}dd` }}>
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:15, fontWeight:600, color:T.text, display:"flex", alignItems:"center", gap:8 }}><span style={{ color:T.accent }}>📋</span> Filter Summary</div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:16, marginBottom:20 }}>
              {[["Semester",resultsSemesterFilter],["Subject",resultsSubjectFilter]].map(([l,v]) => (
                <div key={l} style={{ padding:16, background:T.surface, borderRadius:8, border:`1px solid ${T.border}` }}>
                  <div style={{ fontSize:10, color:T.muted, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:8 }}>{l}</div>
                  <div style={{ fontSize:16, fontWeight:700, color:T.text }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ padding:12, marginBottom:16, background:`${T.accent}15`, border:`1px solid ${T.accent}40`, borderRadius:8, fontSize:13, color:T.text }}>
              ℹ️ Showing results filtered by {resultsSemesterFilter} and {resultsSubjectFilter}
            </div>
            <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
              <button onClick={() => setResultsApplyClicked(false)} style={{ ...S.btnSecondary, padding:"10px 24px" }}>Back</button>
              <button style={{ ...S.btnPrimary, padding:"10px 32px", fontSize:14, fontWeight:600 }}>Confirm & View</button>
            </div>
          </div>

          <div style={S.card} id="resultsSection">
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:14, fontWeight:600, color:T.text }}>Results</div>
              <div style={{ fontSize:12, color:T.muted, marginTop:4 }}>{resultsSemesterFilter} · {resultsSubjectFilter}</div>
            </div>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead>
                <tr>
                  <th style={S.th}>Roll No</th><th style={S.th}>Name</th>
                  {chartSubjects.map(cs => <th key={cs.key} style={S.th}>{cs.label}</th>)}
                  <th style={S.th}>Total</th><th style={S.th}>Percentage</th><th style={S.th}>Grade</th>
                </tr>
              </thead>
              <tbody>
                {studentResultsData.sort((a,b) => b.percentage - a.percentage).map(s => {
                  const pct = parseFloat(s.percentage);
                  const grade  = pct>=90?"A+":pct>=75?"A":pct>=60?"B":pct>=45?"C":"F";
                  const status = pct>=75?"pass":pct>=45?"risk":"fail";
                  return (
                    <tr key={s.id} onMouseEnter={e => e.currentTarget.style.background="#ffffff06"} onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                      <td style={S.td}><span style={{ color:T.muted, fontFamily:"monospace", fontSize:12 }}>{s.rollNo}</span></td>
                      <td style={{ ...S.td, fontWeight:600 }}>{s.name}</td>
                      {chartSubjects.map(cs => <td key={cs.key} style={S.td}>{s[cs.key] ?? 0}</td>)}
                      <td style={{ ...S.td, fontWeight:700 }}>{s.totalMarks}</td>
                      <td style={{ ...S.td, fontWeight:700, color:pct>=40?T.success:T.danger }}>{pct}%</td>
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

  const exportChartsAsPDF = async () => {
    try {
      const element = document.getElementById("analysisChartsSection");
      if (!element) { alert("Charts section not found"); return; }
      const canvas = await html2canvas(element, { backgroundColor:isDarkMode?"#161b27":"#ffffff", scale:2 });
      const pdf = new jsPDF({ orientation:"landscape", unit:"mm", format:"a4" });
      const imgData = canvas.toDataURL("image/png");
      pdf.addImage(imgData, "PNG", 10, 10, 280, 180);
      pdf.save(`performance-analysis-${subject}-${examType}.pdf`);
    } catch (err) { console.error("Export failed:", err); alert("Failed to export PDF"); }
  };

  const exportChartsAsImage = async () => {
    try {
      const element = document.getElementById("analysisChartsSection");
      if (!element) { alert("Charts section not found"); return; }
      const canvas = await html2canvas(element, { backgroundColor:isDarkMode?"#161b27":"#ffffff", scale:2 });
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `performance-analysis-${subject}-${examType}.png`;
      link.click();
    } catch (err) { console.error("Export failed:", err); alert("Failed to export image"); }
  };

  const ViewAnalysis = () => {
    const allStats = calcStats(currentMarks.map(s => s.marks));
    return (
      <>
        <SectionHeader 
          title="Performance Analysis" 
          subtitle="Detailed analytics for the selected subject and semester"
          actions={[
            <button key="export-pdf" onClick={exportChartsAsPDF} style={{ ...S.btnSecondary, display:"flex", alignItems:"center", gap:8, padding:"10px 18px", fontSize:14, fontWeight:600 }}>
              📥 Export PDF
            </button>,
            <button key="export-image" onClick={exportChartsAsImage} style={{ ...S.btnPrimary, display:"flex", alignItems:"center", gap:8, padding:"10px 18px", fontSize:14, fontWeight:600 }}>
              🖼 Export Image
            </button>
          ]}
        />
        
        <FilterBar onApply={handleApplyFilters} />

        <div id="analysisChartsSection" style={{ padding:"16px", borderRadius:8, background:isDarkMode?"#0f1117":"#f8fafc" }}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:24 }}>
            <StatCard label="Class Average" value={allStats.avg}             color={T.accent}  />
            <StatCard label="Highest Marks" value={allStats.highest}         color={T.success} />
            <StatCard label="Lowest Marks"  value={allStats.lowest}          color={T.danger}  />
            <StatCard label="Pass Rate"     value={`${allStats.passRate}%`}  color={T.warning} />
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:24 }}>
            <div style={S.card}>
              <div style={{ fontSize:14, fontWeight:600, color:T.text, marginBottom:16 }}>Subject-wise Average</div>
              <div style={{ height:260, position:"relative" }}><Bar data={barData} options={chartDefaults} /></div>
            </div>
            <div style={S.card}>
              <div style={{ fontSize:14, fontWeight:600, color:T.text, marginBottom:16 }}>Pass vs Fail</div>
              <div style={{ height:260, position:"relative" }}><Pie data={pieData} options={pieOptions} /></div>
            </div>
          </div>
          <div style={S.card}>
            <div style={{ fontSize:14, fontWeight:600, color:T.text, marginBottom:16 }}>Individual Student Scores · {subject}</div>
            <div style={{ height:220, position:"relative" }}>
              <Bar
                data={{ labels:currentMarks.map(s=>s.name), datasets:[{ label:subject, data:currentMarks.map(s=>s.marks), backgroundColor:currentMarks.map(s=>s.marks<40?"#ef444499":s.marks>=75?"#22c55e99":"#4f8ef799"), borderRadius:5, barThickness:28 }] }}
                options={{ ...chartDefaults, plugins:{ ...chartDefaults.plugins, legend:{ display:false } } }}
              />
            </div>
          </div>
        </div>
        
        <AIInsight role="faculty" dataContext={facultyAIContext} dark={isDarkMode} />
      </>
    );
  };

  const ViewAnnouncements = () => {
    // Dynamic options based on faculty's allocations
    const annSubjects = [...new Set(
      facultyAllocations
        .filter(a => a.course === newAnnouncement.course && a.semester === newAnnouncement.semester)
        .map(a => a.subject_name)
    )].sort();
    
    const annSections = [...new Set(
      facultyAllocations
        .filter(a => a.course === newAnnouncement.course && a.semester === newAnnouncement.semester)
        .map(a => a.section)
        .filter(s => s)
    )].sort();
    annSections.unshift("All");
    
    return (
    <>
      <SectionHeader title="Announcements" subtitle="Post updates and notices to students" />
      <div style={{ ...S.card, marginBottom:20 }}>
        <div style={{ fontSize:14, fontWeight:600, color:T.text, marginBottom:16 }}>Post New Announcement</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:12, marginBottom:14 }}>
          {[
            { label:"Course",   field:"course",   options:availableCourses },
            { label:"Semester", field:"semester", options:availableSemesters },
            { label:"Subject",  field:"subject",  options:annSubjects },
            { label:"Class",    field:"class",    options:annSections },
          ].map(({ label, field, options }) => (
            <div key={field}>
              <label style={S.label}>{label}</label>
              <select style={S.input} value={newAnnouncement[field]} onChange={e => {
                const newVal = e.target.value;
                setNewAnnouncement({ ...newAnnouncement, [field]:newVal });
              }}>
                {options.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          ))}
        </div>
        <div style={{ marginBottom:14 }}>
          <label style={S.label}>Title</label>
          <input style={S.input} placeholder="Announcement title" value={newAnnouncement.title} onChange={e => setNewAnnouncement({ ...newAnnouncement, title:e.target.value })} />
        </div>
        <div style={{ marginBottom:16 }}>
          <label style={S.label}>Message</label>
          <textarea style={S.textarea} placeholder="Write your message…" value={newAnnouncement.message} onChange={e => setNewAnnouncement({ ...newAnnouncement, message:e.target.value })} />
        </div>
        <div style={{ marginBottom:16 }}>
          <label style={S.label}>Attachment (Optional)</label>
          <div style={{ display:"flex", gap:10, alignItems:"center" }}>
            <input 
              type="file" 
              id="announcementFileInput"
              style={{ display:"none" }}
              onChange={e => setAnnouncementFile(e.target.files?.[0] || null)}
            />
            <button 
              type="button"
              style={{ ...S.btnSecondary, display:"flex", alignItems:"center", gap:6 }}
              onClick={() => document.getElementById('announcementFileInput').click()}
            >
              📎 Add File
            </button>
            {announcementFile && (
              <div style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 12px", background:T.accentSoft, borderRadius:8, flex:1 }}>
                <span style={{ fontSize:12, color:T.accent, fontWeight:500 }}>📄</span>
                <span style={{ fontSize:12, color:T.text }}>{announcementFile.name}</span>
                <button
                  type="button"
                  style={{ marginLeft:"auto", background:"transparent", border:"none", color:T.accent, cursor:"pointer", fontSize:14 }}
                  onClick={() => setAnnouncementFile(null)}
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        </div>
        <button style={S.btnPrimary} onClick={handleAddAnnouncement}>Post Announcement</button>
      </div>
      {(announcements || []).map(ann => (
        <div key={ann.id} style={{ ...S.card, marginBottom:12, borderLeft:`3px solid ${T.accent}` }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
            <div style={{ fontSize:14, fontWeight:600, color:T.text }}>{ann.title}</div>
            <div style={{ display:"flex", gap:6, alignItems:"center", flexWrap:"wrap", justifyContent:"flex-end" }}>
              {[ann.course, `Sem ${ann.semester}`, ann.subject, `Class ${ann.section || ann.class}`].map((tag,i) => <span key={i} style={S.badge("info")}>{tag}</span>)}
              <span style={{ fontSize:11, color:T.muted }}>{ann.date}</span>
            </div>
          </div>
          <p style={{ fontSize:13, color:T.textSub, lineHeight:1.6, margin:0, marginBottom:ann.file_path?10:0 }}>{ann.message}</p>
          {ann.file_path && (
            <div style={{ marginTop:10, display:"flex", alignItems:"center", gap:8, padding:"10px 12px", background:T.accentSoft, borderRadius:8, width:"fit-content" }}>
              <span style={{ fontSize:13, color:T.accent }}>📎</span>
              <a href={`http://localhost:5000/api/faculty/announcements/${ann.id}/download`} style={{ fontSize:12, color:T.accent, textDecoration:"none", fontWeight:500, cursor:"pointer" }} download>
                Download File
              </a>
            </div>
          )}
        </div>
      ))}
    </>
  );
  };

  const ViewQueries = () => (
    <>
      <SectionHeader title="Student Queries" subtitle="Review and respond to student mark-related queries"
        actions={[<div key="badges" style={{ display:"flex", gap:8, alignItems:"center" }}><span style={S.badge("pending")}>{queries.filter(q=>q.status==="Pending").length} Pending</span><span style={S.badge("resolved")}>{queries.filter(q=>q.status==="Resolved").length} Resolved</span></div>]} />
      {queries.map(q => (
        <div key={q.id} style={{ ...S.card, marginBottom:12, borderLeft:`3px solid ${q.status==="Pending"?T.warning:T.success}` }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
            <div style={{ display:"flex", gap:10, alignItems:"center" }}>
              <div style={{ width:34, height:34, borderRadius:"50%", background:T.accentSoft, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, color:T.accent }}>
                {(q.student_name_db || q.student_name || q.student || "S")[0]}
              </div>
              <div>
                <div style={{ fontSize:13, fontWeight:600, color:T.text }}>{q.student_name_db || q.student_name || q.student || "Unknown Student"}</div>
                <div style={{ fontSize:11, color:T.muted }}>Subject: {q.subject} · {q.date}</div>
              </div>
            </div>
            <span style={S.badge(q.status==="Pending"?"pending":"resolved")}>{q.status}</span>
          </div>
          <p style={{ fontSize:13, color:T.textSub, margin:"10px 0", lineHeight:1.6, paddingLeft:44 }}>{q.description || q.query}</p>
          {q.reply_message && (
            <div style={{ marginTop:12, marginLeft:44, padding:12, borderRadius:10, background:"rgba(16,185,129,0.12)", border:`1px solid ${T.success}` }}>
              <div style={{ fontSize:12, fontWeight:700, color:T.success }}>Reply sent</div>
              <div style={{ fontSize:13, color:T.textSub, marginTop:6, lineHeight:1.6 }}>{q.reply_message}</div>
            </div>
          )}
          
          {q.status === "Pending" && (
            <>
              <div style={{ paddingLeft:44, marginTop:16 }}>
                <label style={S.label}>Reply to Student</label>
                <textarea 
                  style={{ ...S.textarea, minHeight:80, marginBottom:12 }}
                  placeholder="Write your reply message here..." 
                  value={queryReplies[q.id] || ""}
                  onChange={e => setQueryReplies(prev => ({ ...prev, [q.id]: e.target.value }))}
                />
                <div style={{ display:"flex", gap:10 }}>
                  <button 
                    style={{ ...S.btnPrimary }}
                    onClick={() => handleSendReply(q.id, queryReplies[q.id] || "", q.student_name_db || q.student_name || q.student || "Student")}
                  >
                    ✉ Send Reply & Notify
                  </button>
                  <button 
                    style={{ ...S.btnSecondary }}
                    onClick={() => handleReplyQuery(q.id)}
                  >
                    Mark as Resolved
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      ))}
    </>
  );

  const ViewProfile = () => (
    <>
      <SectionHeader title="Faculty Profile" />
      <div style={{ maxWidth:700 }}>
        <div style={{ ...S.card, marginBottom:16, display:"flex", alignItems:"center", gap:20 }}>
          <div style={{ ...S.avatarCircle(facultyImage), width:72, height:72, fontSize:24, flexShrink:0 }}>
            {facultyImage ? <img src={facultyImage} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} /> : "RK"}
          </div>
          <div>
            <div style={{ fontSize:20, fontWeight:700, color:T.text }}>{editProfileData.name}</div>
            <div style={{ fontSize:13, color:T.muted, marginTop:4 }}>{editProfileData.department}</div>
            <div style={{ marginTop:8, display:"flex", gap:8 }}>
              <span style={S.badge("info")}>{editProfileData.facultyId}</span>
              <span style={S.badge("info")}>Faculty</span>
            </div>
          </div>
          <div style={{ marginLeft:"auto" }}>
            <input type="file" accept="image/*" onChange={handleImageUpload} id="fac-img" style={{ display:"none" }} />
            <label htmlFor="fac-img" style={{ ...S.btnSmall, display:"inline-block" }}>Change Photo</label>
          </div>
        </div>
        <div style={S.card}>
          {isEditingProfile ? (
            <>
              {[["Full Name","name"],["Faculty ID","facultyId"],["Department","department"],["Email","email"]].map(([label, key]) => (
                <div key={key} style={{ padding:"14px 0", borderBottom:`1px solid ${T.border}`, display:"flex", gap:16, alignItems:"center" }}>
                  <div style={{ width:160, fontSize:11, fontWeight:600, color:T.muted, textTransform:"uppercase", letterSpacing:"0.07em", paddingTop:2 }}>{label}</div>
                  <input type="text" value={editProfileData[key]} onChange={e => setEditProfileData({ ...editProfileData, [key]:e.target.value })} disabled={key==="facultyId"}
                    style={{ flex:1, padding:"8px 12px", fontSize:14, color:key==="facultyId"?T.muted:T.text, background:key==="facultyId"?T.border:T.surface, border:`1px solid ${T.border}`, borderRadius:6, fontFamily:"inherit", opacity:key==="facultyId"?0.6:1, cursor:key==="facultyId"?"not-allowed":"text" }} />
                </div>
              ))}
              <div style={{ padding:"20px 0", display:"flex", gap:12 }}>
                <button onClick={handleSaveProfile} style={S.btnPrimary}>✓ Save Profile</button>
                <button onClick={handleCancelEdit}  style={S.btnSecondary}>✕ Cancel</button>
              </div>
            </>
          ) : (
            <>
              {[["Full Name",editProfileData.name],["Faculty ID",editProfileData.facultyId],["Department",editProfileData.department],["Email",editProfileData.email]].map(([label,value]) => (
                <div key={label} style={{ padding:"14px 0", borderBottom:`1px solid ${T.border}`, display:"flex", gap:16 }}>
                  <div style={{ width:160, fontSize:11, fontWeight:600, color:T.muted, textTransform:"uppercase", letterSpacing:"0.07em", paddingTop:2 }}>{label}</div>
                  <div style={{ fontSize:14, color:T.text, fontWeight:500 }}>{value}</div>
                </div>
              ))}
              <div style={{ padding:"14px 0", display:"flex", gap:16 }}>
                <div style={{ width:160, fontSize:11, fontWeight:600, color:T.muted, textTransform:"uppercase", letterSpacing:"0.07em", paddingTop:2 }}>Subjects</div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                  {facultyDetails.subjectsAssigned.map(s => <span key={s} style={S.badge("info")}>{s}</span>)}
                </div>
              </div>
              <div style={{ padding:"20px 0" }}>
                <button onClick={() => setIsEditingProfile(true)} style={S.btnPrimary}>✎ Edit Profile</button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );

  /* ── RENDER ──────────────────────────────────────────────────────────── */
  return (
    <div style={S.root}>
      <aside style={S.sidebar}>
        <div style={S.sidebarLogo} onClick={() => setView("dashboard")}
          onMouseEnter={e => e.currentTarget.style.background=T.border}
          onMouseLeave={e => e.currentTarget.style.background="transparent"}
          title="Click to go to Dashboard">
          <img src={logo2} alt="Result Analysis Logo" style={{ width:36, height:36, borderRadius:"8px", flexShrink:0, objectFit:"contain" }} />
          <div><div style={S.sidebarBrand}>Result Analysis</div><div style={S.sidebarTitle}>Faculty Portal</div></div>
        </div>

        <div style={S.avatarWrap}>
          <div style={S.avatarCircle(facultyImage)}>
            {facultyImage ? <img src={facultyImage} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} /> : "RK"}
          </div>
          <div style={{ fontSize:14, fontWeight:600, color:T.text }}>{editProfileData.name}</div>
          <div style={{ fontSize:11, color:T.muted, marginTop:3 }}>{editProfileData.facultyId}</div>
          <div style={{ marginTop:8 }}><span style={{ ...S.badge("info"), fontSize:10 }}>MCA Dept.</span></div>
        </div>

        <nav style={{ flex:1, padding:"8px 0" }}>
          <div style={S.navSection}>Main</div>
          {NAV.slice(0,4).map(item => (
            <div key={item.key} style={S.navItem(view===item.key)} onClick={() => setView(item.key)}>
              <span style={{ fontSize:14, opacity:0.8 }}>{item.icon}</span>{item.label}
            </div>
          ))}
          <div style={S.navSection}>Communication</div>
          {NAV.slice(4).map(item => (
            <div key={item.key} style={S.navItem(view===item.key)} onClick={() => setView(item.key)}>
              <span style={{ fontSize:14, opacity:0.8 }}>{item.icon}</span>{item.label}
            </div>
          ))}
          <div style={{ borderTop:`1px solid ${T.border}`, margin:"12px 0" }} />
          <div style={{ ...S.navItem(false), color:T.danger }} onClick={() => setDashboard(null)}>
            <span style={{ fontSize:14 }}>⏻</span> Logout
          </div>
        </nav>

        <div style={{ margin:"0 16px 16px", background:"#1e1b4b", border:"1px solid #312e81", borderRadius:10, padding:"10px 12px" }}>
          <div style={{ fontSize:11, fontWeight:600, color:"#a78bfa", marginBottom:3 }}>✦ AI Insights Active</div>
          <div style={{ fontSize:10, color:T.muted, lineHeight:1.5 }}>Smart predictions & analysis enabled</div>
        </div>
      </aside>

      <main style={S.main}>
        <header style={S.topbar}>
          <div>
            <div style={{ fontSize:15, fontWeight:600, color:T.text }}>{NAV.find(n=>n.key===view)?.label||"Dashboard"}</div>
            <div style={{ fontSize:11, color:T.muted }}>Academic Year 2024–25 · {course} {semester}</div>
          </div>
          <div style={{ display:"flex", gap:12, alignItems:"center" }}>
            <div style={{ fontSize:12, color:T.muted }}>{new Date().toLocaleDateString("en-IN",{ weekday:"short", day:"numeric", month:"short", year:"numeric" })}</div>
            <button onClick={() => setIsDarkMode(!isDarkMode)}
              style={{ width:34, height:34, borderRadius:"50%", background:T.accentSoft, border:`1px solid ${T.accent}40`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, cursor:"pointer", color:T.accent, transition:"all 0.3s" }}
              title={isDarkMode?"Light Mode":"Dark Mode"}>
              {isDarkMode?"☀️":"🌙"}
            </button>
            <div style={{ width:34, height:34, borderRadius:"50%", background:T.accentSoft, border:`1px solid ${T.accent}40`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, color:T.accent }}>
              {editProfileData.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}
            </div>
          </div>
        </header>

        <div style={S.content}>
          {view==="dashboard"     && <ViewDashboard />}
          {view==="upload"        && <ViewUpload />}
          {view==="results"       && <ViewResults />}
          {view==="analysis"      && <ViewAnalysis />}
          {view==="announcements" && <ViewAnnouncements />}
          {view==="queries"       && <ViewQueries />}
          {view==="profile"       && <ViewProfile />}
        </div>
      </main>
    </div>
  );
}