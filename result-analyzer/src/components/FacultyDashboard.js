import React, { useState, useEffect } from "react";
import { Bar, Line, Pie } from "react-chartjs-2";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

function FacultyDashboard({ setDashboard, darkMode, setDarkMode }) {
  const [view, setView] = useState("dashboard");
  const [course, setCourse] = useState("MCA");
  const [semester, setSemester] = useState("1");
  const [subject, setSubject] = useState("DBMS");
  const [examType, setExamType] = useState("CIE1");
  const [editingId, setEditingId] = useState(null);
  const [facultyImage, setFacultyImage] = useState(null);

  // Faculty Details
  const facultyDetails = {
    name: "Dr. Rajesh Kumar",
    facultyId: "FAC-2021-001",
    department: "Computer Science & Engineering",
    email: "rajesh.kumar@jimsdelhi.ac.in",
    subjectsAssigned: ["Database Management Systems", "Operating Systems", "Data Structures", "Advanced Algorithms"]
  };

  // All Student Marks Data
  const [allMarksData, setAllMarksData] = useState([
    { id: 1, rollNo: "22101", name: "Riya", dbms: 78, os: 82, ds: 75, algo: 88 },
    { id: 2, rollNo: "22102", name: "Aman", dbms: 65, os: 70, ds: 60, algo: 75 },
    { id: 3, rollNo: "22103", name: "Kiran", dbms: 82, os: 85, ds: 88, algo: 92 },
    { id: 4, rollNo: "22104", name: "Neha", dbms: 32, os: 38, ds: 35, algo: 42 },
    { id: 5, rollNo: "22105", name: "Vikram", dbms: 90, os: 88, ds: 95, algo: 98 },
    { id: 6, rollNo: "22106", name: "Priya", dbms: 72, os: 75, ds: 78, algo: 80 },
    { id: 7, rollNo: "22107", name: "Arjun", dbms: 55, os: 60, ds: 58, algo: 65 },
    { id: 8, rollNo: "22108", name: "Divya", dbms: 88, os: 90, ds: 92, algo: 95 },
  ]);

  // Student Results View
  const [studentResultsData] = useState([
    { id: 1, rollNo: "22101", name: "Riya", totalMarks: 323, percentage: 80.75 },
    { id: 2, rollNo: "22102", name: "Aman", totalMarks: 270, percentage: 67.5 },
    { id: 3, rollNo: "22103", name: "Kiran", totalMarks: 347, percentage: 86.75 },
    { id: 4, rollNo: "22104", name: "Neha", totalMarks: 147, percentage: 36.75 },
    { id: 5, rollNo: "22105", name: "Vikram", totalMarks: 376, percentage: 94.0 },
    { id: 6, rollNo: "22106", name: "Priya", totalMarks: 305, percentage: 76.25 },
    { id: 7, rollNo: "22107", name: "Arjun", totalMarks: 238, percentage: 59.5 },
    { id: 8, rollNo: "22108", name: "Divya", totalMarks: 355, percentage: 88.75 },
  ]);

  // Announcements
  const [announcements, setAnnouncements] = useState([
    { id: 1, title: "CIE1 Results Published", message: "CIE1 Results uploaded for MCA Sem 1.", date: "2024-02-15", type: "Results" },
    { id: 2, title: "Important Notice", message: "Please submit updated marks within 3 days.", date: "2024-02-14", type: "Notice" },
    { id: 3, title: "Exam Schedule", message: "CIE2 examinations will be held next week.", date: "2024-02-13", type: "Schedule" },
  ]);

  const [newAnnouncement, setNewAnnouncement] = useState({ title: "", message: "" });

  // Student Queries
  const [queries, setQueries] = useState([
    { id: 1, student: "Riya", subject: "DBMS", query: "Marks calculation seems incorrect", status: "Pending", date: "2024-02-15" },
    { id: 2, student: "Aman", subject: "OS", query: "Can I challenge my marks?", status: "Resolved", date: "2024-02-14" },
    { id: 3, student: "Neha", subject: "DS", query: "Request for recheck", status: "Pending", date: "2024-02-13" },
  ]);

  // Marks for current filter
  const currentMarks = allMarksData.map(student => ({
    ...student,
    marks: student[subject.toLowerCase()] || 0
  }));

  // Weak students
  const weakStudents = currentMarks.filter(s => s.marks < 40);

  // Performance Analysis Data
  const subjectMarks = {
    dbms: allMarksData.map(s => s.dbms),
    os: allMarksData.map(s => s.os),
    ds: allMarksData.map(s => s.ds),
    algo: allMarksData.map(s => s.algo)
  };

  const calculateStats = (marks) => {
    const avg = (marks.reduce((a, b) => a + b, 0) / marks.length).toFixed(2);
    const highest = Math.max(...marks);
    const lowest = Math.min(...marks);
    const passCount = marks.filter(m => m >= 40).length;
    const passPercentage = ((passCount / marks.length) * 100).toFixed(2);
    return { avg, highest, lowest, passPercentage };
  };

  const stats = calculateStats(currentMarks.map(s => s.marks));

  const chartData = {
    labels: ["DBMS", "Operating Systems", "Data Structures", "Algorithms"],
    datasets: [
      {
        label: "Subject wise Average Marks",
        data: [
          (subjectMarks.dbms.reduce((a, b) => a + b, 0) / subjectMarks.dbms.length).toFixed(2),
          (subjectMarks.os.reduce((a, b) => a + b, 0) / subjectMarks.os.length).toFixed(2),
          (subjectMarks.ds.reduce((a, b) => a + b, 0) / subjectMarks.ds.length).toFixed(2),
          (subjectMarks.algo.reduce((a, b) => a + b, 0) / subjectMarks.algo.length).toFixed(2),
        ],
        backgroundColor: "#1abcde"
      }
    ]
  };

  const passFailData = {
    labels: ["Pass (≥40)", "Fail (<40)"],
    datasets: [
      {
        data: [
          currentMarks.filter(s => s.marks >= 40).length,
          currentMarks.filter(s => s.marks < 40).length
        ],
        backgroundColor: ["#4caf50", "#f44336"]
      }
    ]
  };

  const logout = () => {
    setDashboard(null);
  };

  const handleSaveMarks = () => {
    alert("Marks saved successfully for " + subject + " - " + examType);
  };

  const handleUpdateMarks = (id, newMarks) => {
    const updated = allMarksData.map(student =>
      student.id === id ? { ...student, [subject.toLowerCase()]: newMarks } : student
    );
    setAllMarksData(updated);
    setEditingId(null);
    alert("Marks updated successfully");
  };

  const handleAddAnnouncement = () => {
    if (newAnnouncement.title && newAnnouncement.message) {
      setAnnouncements([
        { id: announcements.length + 1, ...newAnnouncement, date: new Date().toISOString().split('T')[0], type: "Notice" },
        ...announcements
      ]);
      setNewAnnouncement({ title: "", message: "" });
      alert("Announcement posted successfully");
    }
  };

  const handleReplyQuery = (id) => {
    const updated = queries.map(q => q.id === id ? { ...q, status: "Resolved" } : q);
    setQueries(updated);
    alert("Response sent to student");
  };

  const downloadPDF = async () => {
    const input = document.getElementById("resultsSection");
    if (!input) {
      alert("Results section not available.");
      return;
    }
    const canvas = await html2canvas(input);
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF();
    pdf.addImage(imgData, "PNG", 0, 0, 210, 120);
    pdf.save("results-report.pdf");
  };

  const downloadCSV = () => {
    const rows = [["Roll No", "Name", "Marks", "Status"]];
    currentMarks.forEach((s) => {
      rows.push([s.rollNo, s.name, s.marks, s.marks < 40 ? "Weak" : "Good"]);
    });
    const csvContent = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `marks-${subject}-${examType}.csv`;
    link.click();
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFacultyImage(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    const handler = () => {
      // Handle profile open if needed
    };
    window.addEventListener("openProfile", handler);
    return () => window.removeEventListener("openProfile", handler);
  }, []);

  return (
    <div className="dashboard">
      {/* NAVBAR */}
      <Navbar
        title="Faculty Dashboard"
        logout={logout}
        onLogoClick={() => setView("dashboard")}
        profileImage={facultyImage}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />

      <div className="dashboard-body" style={{display:'flex', minHeight:`calc(100vh - 60px)`}}>
        {/* SIDEBAR - Custom for Faculty */}
        <div className="sidebar" style={{position:'sticky', top: 60, width:260, flex:'0 0 260px', background:'#2f4250', color:'#fff', height:`calc(100vh - 60px)`, paddingBottom:20, overflow:'auto', zIndex:10}}>
          <div style={{padding:'20px', textAlign:'center', borderBottom:'1px solid rgba(255,255,255,0.1)', marginBottom:'20px'}}>
            {/* Profile Image Section */}
            <div style={{marginBottom:'15px', position:'relative'}}>
              {facultyImage ? (
                <div style={{width:120, height:120, display:'inline-block', borderRadius:'50%', background:'#fff', padding:4, boxShadow:'0 4px 8px rgba(0,0,0,0.2)'}}>
                  <img src={facultyImage} alt="faculty" style={{width:112, height:112, borderRadius:'50%', objectFit:'cover', display:'block'}} />
                </div>
              ) : (
                <div style={{width:120, height:120, background:'#fff', borderRadius:'50%', display:'inline-flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 8px rgba(0,0,0,0.2)', marginBottom:'10px'}}>
                  <div style={{width:100, height:100, background:'#e0e0e0', borderRadius:'50%', display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:'12px', color:'#999', fontWeight:'bold'}}>Faculty</div>
                </div>
              )}
              {/* Upload Image Input */}
              <input type="file" accept="image/*" onChange={handleImageUpload} style={{display:'none'}} id="faculty-image-input" />
              <label htmlFor="faculty-image-input" style={{display:'block', marginTop:'10px', fontSize:'11px', fontWeight:'bold', color:'#1abcde', cursor:'pointer', backgroundColor:'rgba(26, 188, 222, 0.2)', padding:'6px 10px', borderRadius:'4px', textAlign:'center'}}>
                Upload Photo
              </label>
            </div>

            <div style={{fontSize:18, fontWeight:700, marginBottom:'8px'}}>{facultyDetails.name}</div>
            <div style={{fontSize:12, color:'#bfc9cd'}}>{facultyDetails.facultyId}</div>
          </div>

          <div style={{padding:'0 18px'}}>
            <h3 style={{color:'#fff', fontSize:18, marginTop:8, marginBottom:12}}>Menu</h3>
            <ul style={{listStyle:'none', padding:0, margin:0}}>
              {[
                {key:'dashboard', label:'Dashboard'},
                {key:'upload', label:'Upload Marks'},
                {key:'results', label:'View Results'},
                {key:'analysis', label:'Performance Analysis'},
                {key:'announcements', label:'Announcements'},
                {key:'queries', label:'Student Queries'},
                {key:'profile', label:'Profile'},
              ].map(it => (
                <li key={it.key}
                  onClick={() => setView(it.key)}
                  style={{padding:'14px 8px 14px 12px', borderTop:'1px solid rgba(255,255,255,0.06)', cursor:'pointer', color:view === it.key? '#fff':'#e6f0f5', fontSize:15, fontWeight:view === it.key?700:400}}
                >
                  {it.label}
                </li>
              ))}
              <li onClick={() => logout()} style={{padding:'14px 8px 14px 12px', borderTop:'1px solid rgba(255,255,255,0.06)', marginTop:12, cursor:'pointer', color:'#e6f0f5', fontSize:15}}>
                Logout
              </li>
            </ul>
          </div>
        </div>

        {/* CONTENT */}
        <div className="content" style={{flex:1, marginLeft:'20px', overflowY:'auto', maxHeight:`calc(100vh - 60px)`}}>
          {/* DASHBOARD - Main View */}
          {view === "dashboard" && (
            <>
              <div className="filters">
                <select value={course} onChange={(e) => setCourse(e.target.value)}>
                  <option>MCA</option>
                  <option>BCA</option>
                </select>
                <select value={semester} onChange={(e) => setSemester(e.target.value)}>
                  <option value="1">Sem 1</option>
                  <option value="2">Sem 2</option>
                  <option value="3">Sem 3</option>
                  <option value="4">Sem 4</option>
                </select>
                <button>Apply</button>
              </div>

              <div className="stats">
                <div className="card blue">
                  <h3>Total Students</h3>
                  <h2>{allMarksData.length}</h2>
                </div>
                <div className="card orange">
                  <h3>Avg Marks</h3>
                  <h2>{stats.avg}%</h2>
                </div>
                <div className="card dark">
                  <h3>Pass Rate</h3>
                  <h2>{stats.passPercentage}%</h2>
                </div>
              </div>

              <div className="charts">
                <div className="chart">
                  <h3>Subject-wise Average Marks</h3>
                  <Bar data={chartData} />
                </div>
                <div className="chart">
                  <h3>Pass vs Fail Distribution</h3>
                  <Pie data={passFailData} />
                </div>
              </div>
            </>
          )}

          {/* UPLOAD - Upload Student Marks */}
          {view === "upload" && (
            <div style={{padding:'20px'}}>
              <h2 style={{marginBottom:'25px'}}>Upload / Enter Student Marks</h2>
              
              <div style={{background:'#fff', padding:'25px', borderRadius:'8px', boxShadow:'0 2px 8px rgba(0,0,0,0.1)', marginBottom:'30px'}}>
                <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'15px', marginBottom:'20px'}}>
                  <div>
                    <label style={{fontSize:'12px', fontWeight:'bold', color:'#666', display:'block', marginBottom:'8px'}}>Course</label>
                    <select value={course} onChange={(e) => setCourse(e.target.value)} style={{width:'100%', padding:'10px', border:'1px solid #ddd', borderRadius:'4px', fontSize:'14px'}}>
                      <option>MCA</option>
                      <option>BCA</option>
                    </select>
                  </div>
                  <div>
                    <label style={{fontSize:'12px', fontWeight:'bold', color:'#666', display:'block', marginBottom:'8px'}}>Semester</label>
                    <select value={semester} onChange={(e) => setSemester(e.target.value)} style={{width:'100%', padding:'10px', border:'1px solid #ddd', borderRadius:'4px', fontSize:'14px'}}>
                      <option value="1">Sem 1</option>
                      <option value="2">Sem 2</option>
                      <option value="3">Sem 3</option>
                      <option value="4">Sem 4</option>
                    </select>
                  </div>
                  <div>
                    <label style={{fontSize:'12px', fontWeight:'bold', color:'#666', display:'block', marginBottom:'8px'}}>Subject</label>
                    <select value={subject} onChange={(e) => setSubject(e.target.value)} style={{width:'100%', padding:'10px', border:'1px solid #ddd', borderRadius:'4px', fontSize:'14px'}}>
                      <option value="DBMS">DBMS</option>
                      <option value="OS">Operating Systems</option>
                      <option value="DS">Data Structures</option>
                      <option value="ALGO">Algorithms</option>
                    </select>
                  </div>
                  <div>
                    <label style={{fontSize:'12px', fontWeight:'bold', color:'#666', display:'block', marginBottom:'8px'}}>Exam Type</label>
                    <select value={examType} onChange={(e) => setExamType(e.target.value)} style={{width:'100%', padding:'10px', border:'1px solid #ddd', borderRadius:'4px', fontSize:'14px'}}>
                      <option>CIE1</option>
                      <option>CIE2</option>
                      <option>SEE</option>
                    </select>
                  </div>
                </div>

                <h3 style={{marginTop:'25px', marginBottom:'15px'}}>Enter Marks for {subject} - {examType} ({course} - Sem {semester})</h3>
                <table className="table" style={{width:'100%', borderCollapse:'collapse', marginBottom:'20px'}}>
                  <thead>
                    <tr style={{background:'#f5f5f5'}}>
                      <th style={{padding:'12px', textAlign:'left', borderBottom:'2px solid #ddd'}}>Roll No</th>
                      <th style={{padding:'12px', textAlign:'left', borderBottom:'2px solid #ddd'}}>Student Name</th>
                      <th style={{padding:'12px', textAlign:'left', borderBottom:'2px solid #ddd'}}>Marks</th>
                      <th style={{padding:'12px', textAlign:'left', borderBottom:'2px solid #ddd'}}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentMarks.map((student) => (
                      <tr key={student.id} style={{borderBottom:'1px solid #ddd'}}>
                        <td style={{padding:'12px'}}>{student.rollNo}</td>
                        <td style={{padding:'12px'}}>{student.name}</td>
                        <td style={{padding:'12px'}}>
                          {editingId === student.id ? (
                            <input type="number" defaultValue={student.marks} id={`mark-${student.id}`} style={{width:'80px', padding:'6px', border:'1px solid #1abcde', borderRadius:'4px'}} />
                          ) : (
                            <span>{student.marks}</span>
                          )}
                        </td>
                        <td style={{padding:'12px'}}>
                          {editingId === student.id ? (
                            <>
                              <button onClick={() => handleUpdateMarks(student.id, parseInt(document.getElementById(`mark-${student.id}`).value))} style={{padding:'6px 12px', backgroundColor:'#4caf50', color:'#fff', border:'none', borderRadius:'4px', cursor:'pointer', marginRight:'5px', fontSize:'12px'}}>Save</button>
                              <button onClick={() => setEditingId(null)} style={{padding:'6px 12px', backgroundColor:'#f44336', color:'#fff', border:'none', borderRadius:'4px', cursor:'pointer', fontSize:'12px'}}>Cancel</button>
                            </>
                          ) : (
                            <button onClick={() => setEditingId(student.id)} style={{padding:'6px 12px', backgroundColor:'#2196f3', color:'#fff', border:'none', borderRadius:'4px', cursor:'pointer', fontSize:'12px'}}>Edit</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div style={{display:'flex', gap:'10px'}}>
                  <button onClick={handleSaveMarks} style={{padding:'12px 24px', backgroundColor:'#1abcde', color:'#fff', border:'none', borderRadius:'4px', cursor:'pointer', fontWeight:'bold'}}>Save Marks</button>
                  <button onClick={handleSaveMarks} style={{padding:'12px 24px', backgroundColor:'#f39c12', color:'#fff', border:'none', borderRadius:'4px', cursor:'pointer', fontWeight:'bold'}}>Update Marks</button>
                </div>
              </div>
            </div>
          )}

          {/* RESULTS - View Student Results */}
          {view === "results" && (
            <div style={{padding:'20px'}}>
              <h2 style={{marginBottom:'25px'}}>View Student Results</h2>

              <div style={{background:'#fff', padding:'20px', borderRadius:'8px', boxShadow:'0 2px 8px rgba(0,0,0,0.1)', marginBottom:'20px'}}>
                <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(150px, 1fr))', gap:'10px', marginBottom:'20px'}}>
                  <div>
                    <label style={{fontSize:'12px', fontWeight:'bold', color:'#666'}}>Filter by Semester</label>
                    <select style={{width:'100%', padding:'8px', border:'1px solid #ddd', borderRadius:'4px'}}>
                      <option>All</option>
                      <option>Sem 1</option>
                      <option>Sem 2</option>
                      <option>Sem 3</option>
                      <option>Sem 4</option>
                    </select>
                  </div>
                  <div>
                    <label style={{fontSize:'12px', fontWeight:'bold', color:'#666'}}>Filter by Subject</label>
                    <select style={{width:'100%', padding:'8px', border:'1px solid #ddd', borderRadius:'4px'}}>
                      <option>All</option>
                      <option>DBMS</option>
                      <option>Operating Systems</option>
                      <option>Data Structures</option>
                      <option>Algorithms</option>
                    </select>
                  </div>
                </div>
              </div>

              <div style={{background:'#fff', padding:'20px', borderRadius:'8px', boxShadow:'0 2px 8px rgba(0,0,0,0.1)', overflowX:'auto'}} id="resultsSection">
                <table className="table" style={{width:'100%', borderCollapse:'collapse'}}>
                  <thead>
                    <tr style={{background:'#f5f5f5'}}>
                      <th style={{padding:'12px', textAlign:'left', borderBottom:'2px solid #ddd'}}>Roll No</th>
                      <th style={{padding:'12px', textAlign:'left', borderBottom:'2px solid #ddd'}}>Student Name</th>
                      <th style={{padding:'12px', textAlign:'left', borderBottom:'2px solid #ddd'}}>Total Marks</th>
                      <th style={{padding:'12px', textAlign:'left', borderBottom:'2px solid #ddd'}}>Percentage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentResultsData.map((student) => (
                      <tr key={student.id} style={{borderBottom:'1px solid #ddd'}}>
                        <td style={{padding:'12px'}}>{student.rollNo}</td>
                        <td style={{padding:'12px'}}>{student.name}</td>
                        <td style={{padding:'12px'}}>{student.totalMarks}</td>
                        <td style={{padding:'12px', fontWeight:'bold', color: student.percentage >= 40 ? '#4caf50' : '#f44336'}}>{student.percentage}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ANALYSIS - Performance Analysis */}
          {view === "analysis" && (
            <div style={{padding:'20px'}}>
              <h2 style={{marginBottom:'25px'}}>Performance Analysis</h2>

              <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'20px', marginBottom:'30px'}}>
                <div style={{background:'#e3f2fd', padding:'20px', borderRadius:'8px', borderLeft:'4px solid #1976d2'}}>
                  <div style={{fontSize:'12px', color:'#666', fontWeight:'bold', marginBottom:'8px'}}>Class Average</div>
                  <div style={{fontSize:'32px', fontWeight:'bold', color:'#1976d2'}}>{stats.avg}</div>
                </div>
                <div style={{background:'#f3e5f5', padding:'20px', borderRadius:'8px', borderLeft:'4px solid #9c27b0'}}>
                  <div style={{fontSize:'12px', color:'#666', fontWeight:'bold', marginBottom:'8px'}}>Highest Marks</div>
                  <div style={{fontSize:'32px', fontWeight:'bold', color:'#9c27b0'}}>{stats.highest}</div>
                </div>
                <div style={{background:'#ffe0b2', padding:'20px', borderRadius:'8px', borderLeft:'4px solid #ff9800'}}>
                  <div style={{fontSize:'12px', color:'#666', fontWeight:'bold', marginBottom:'8px'}}>Lowest Marks</div>
                  <div style={{fontSize:'32px', fontWeight:'bold', color:'#ff9800'}}>{stats.lowest}</div>
                </div>
                <div style={{background:'#c8e6c9', padding:'20px', borderRadius:'8px', borderLeft:'4px solid #4caf50'}}>
                  <div style={{fontSize:'12px', color:'#666', fontWeight:'bold', marginBottom:'8px'}}>Pass Percentage</div>
                  <div style={{fontSize:'32px', fontWeight:'bold', color:'#4caf50'}}>{stats.passPercentage}%</div>
                </div>
              </div>

              <div className="charts" style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(400px, 1fr))', gap:'20px', marginBottom:'30px'}}>
                <div className="chart" style={{background:'#fff', padding:'20px', borderRadius:'8px', boxShadow:'0 2px 8px rgba(0,0,0,0.1)'}}>
                  <h3 style={{marginBottom:'15px'}}>Subject-wise Average Marks</h3>
                  <Bar data={chartData} />
                </div>
                <div className="chart" style={{background:'#fff', padding:'20px', borderRadius:'8px', boxShadow:'0 2px 8px rgba(0,0,0,0.1)'}}>
                  <h3 style={{marginBottom:'15px'}}>Pass vs Fail Distribution</h3>
                  <Pie data={passFailData} />
                </div>
              </div>
            </div>
          )}

          {/* WEAK STUDENTS - Weak Student Identification */}
          {weakStudents.length > 0 && view !== "dashboard" && view !== "upload" && view !== "profile" && view !== "announcements" && view !== "queries" && (
            <div style={{marginTop:'30px', padding:'20px', background:'#fff3cd', borderLeft:'4px solid #ffc107', borderRadius:'4px'}}>
              <h3 style={{color:'#856404', marginBottom:'15px'}}>Warning: Students Needing Improvement (Marks &lt; 40)</h3>
              <table className="table" style={{width:'100%', borderCollapse:'collapse'}}>
                <thead>
                  <tr style={{background:'#fff9e6'}}>
                    <th style={{padding:'10px', textAlign:'left', borderBottom:'2px solid #ffc107'}}>Roll No</th>
                    <th style={{padding:'10px', textAlign:'left', borderBottom:'2px solid #ffc107'}}>Student Name</th>
                    <th style={{padding:'10px', textAlign:'left', borderBottom:'2px solid #ffc107'}}>Subject</th>
                    <th style={{padding:'10px', textAlign:'left', borderBottom:'2px solid #ffc107'}}>Marks</th>
                    <th style={{padding:'10px', textAlign:'left', borderBottom:'2px solid #ffc107'}}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {weakStudents.map((student) => (
                    <tr key={student.id} style={{borderBottom:'1px solid #ffc107'}}>
                      <td style={{padding:'10px'}}>{student.rollNo}</td>
                      <td style={{padding:'10px'}}>{student.name}</td>
                      <td style={{padding:'10px'}}>{subject}</td>
                      <td style={{padding:'10px', fontWeight:'bold', color:'#f44336'}}>{student.marks}</td>
                      <td style={{padding:'10px'}}><span style={{background:'#f44336', color:'#fff', padding:'4px 8px', borderRadius:'4px', fontSize:'12px'}}>Weak</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ANNOUNCEMENTS - Post Announcements */}
          {view === "announcements" && (
            <div style={{padding:'20px'}}>
              <h2 style={{marginBottom:'25px'}}>Announcements & Notifications</h2>

              <div style={{background:'#fff', padding:'25px', borderRadius:'8px', boxShadow:'0 2px 8px rgba(0,0,0,0.1)', marginBottom:'30px'}}>
                <h3 style={{marginBottom:'15px'}}>Post New Announcement</h3>
                <div style={{marginBottom:'15px'}}>
                  <label style={{fontSize:'12px', fontWeight:'bold', color:'#666', display:'block', marginBottom:'8px'}}>Title</label>
                  <input type="text" placeholder="Announcement title" value={newAnnouncement.title} onChange={(e) => setNewAnnouncement({...newAnnouncement, title: e.target.value})} style={{width:'100%', padding:'10px', border:'1px solid #ddd', borderRadius:'4px', fontSize:'14px'}} />
                </div>
                <div style={{marginBottom:'15px'}}>
                  <label style={{fontSize:'12px', fontWeight:'bold', color:'#666', display:'block', marginBottom:'8px'}}>Message</label>
                  <textarea placeholder="Write your announcement message here..." value={newAnnouncement.message} onChange={(e) => setNewAnnouncement({...newAnnouncement, message: e.target.value})} style={{width:'100%', padding:'10px', border:'1px solid #ddd', borderRadius:'4px', fontSize:'14px', minHeight:'100px', fontFamily:'Arial'}} />
                </div>
                <button onClick={handleAddAnnouncement} style={{padding:'12px 24px', backgroundColor:'#1abcde', color:'#fff', border:'none', borderRadius:'4px', cursor:'pointer', fontWeight:'bold'}}>Post Announcement</button>
              </div>

              <h3 style={{marginBottom:'15px'}}>Recent Announcements</h3>
              {announcements.map((ann) => (
                <div key={ann.id} style={{background:'#fff', padding:'20px', borderRadius:'8px', boxShadow:'0 2px 8px rgba(0,0,0,0.1)', marginBottom:'15px', borderLeft:'4px solid #1abcde'}}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'start', marginBottom:'10px'}}>
                    <div>
                      <h4 style={{margin:'0 0 5px 0', color:'#2f4250'}}>{ann.title}</h4>
                      <span style={{fontSize:'12px', color:'#999', display:'inline-block', backgroundColor:'#e0f7fa', padding:'4px 8px', borderRadius:'4px', marginRight:'10px'}}>{ann.type}</span>
                      <span style={{fontSize:'12px', color:'#999'}}>{ann.date}</span>
                    </div>
                  </div>
                  <p style={{margin:'0', color:'#555', lineHeight:'1.6'}}>{ann.message}</p>
                </div>
              ))}
            </div>
          )}

          {/* QUERIES - Student Queries */}
          {view === "queries" && (
            <div style={{padding:'20px'}}>
              <h2 style={{marginBottom:'25px'}}>Student Queries & Complaints</h2>

              <div style={{background:'#fff', padding:'20px', borderRadius:'8px', boxShadow:'0 2px 8px rgba(0,0,0,0.1)'}}>
                <div style={{marginBottom:'20px'}}>
                  <h4>Pending Queries</h4>
                </div>

                {queries.map((q) => (
                  <div key={q.id} style={{background:q.status === 'Pending' ? '#fff3cd' : '#d4edda', padding:'15px', borderRadius:'6px', marginBottom:'15px', borderLeft:'4px solid ' + (q.status === 'Pending' ? '#ffc107' : '#28a745')}}>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'start', marginBottom:'10px'}}>
                      <div>
                        <h5 style={{margin:'0 0 5px 0'}}>{q.student} - {q.subject}</h5>
                        <p style={{margin:'0', fontSize:'14px', color:'#555'}}>{q.query}</p>
                      </div>
                      <span style={{fontSize:'12px', fontWeight:'bold', color: q.status === 'Pending' ? '#856404' : '#155724', backgroundColor: q.status === 'Pending' ? '#fff3cd' : '#d4edda', padding:'6px 12px', borderRadius:'4px'}}>{q.status}</span>
                    </div>
                    <div style={{fontSize:'12px', color:'#666', marginBottom:'10px'}}>Posted on: {q.date}</div>
                    {q.status === 'Pending' && (
                      <button onClick={() => handleReplyQuery(q.id)} style={{padding:'8px 16px', backgroundColor:'#1abcde', color:'#fff', border:'none', borderRadius:'4px', cursor:'pointer', fontSize:'12px', fontWeight:'bold'}}>Mark as Resolved</button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PROFILE - Faculty Profile */}
          {view === "profile" && (
            <div style={{padding:'20px'}}>
              <div style={{maxWidth:'800px', margin:'0 auto'}}>
                <h2 style={{marginBottom:'30px', fontSize:'28px', color:'#2f4250'}}>Faculty Profile</h2>

                <div style={{background:'#fff', borderRadius:'10px', padding:'30px', boxShadow:'0 2px 8px rgba(0,0,0,0.1)'}}>
                  <div style={{marginBottom:'25px', paddingBottom:'20px', borderBottom:'1px solid #e0e0e0'}}>
                    <label style={{display:'block', color:'#666', fontSize:'12px', fontWeight:'bold', marginBottom:'8px', textTransform:'uppercase'}}>Faculty Name</label>
                    <div style={{fontSize:'18px', color:'#333', fontWeight:'500'}}>{facultyDetails.name}</div>
                  </div>

                  <div style={{marginBottom:'25px', paddingBottom:'20px', borderBottom:'1px solid #e0e0e0'}}>
                    <label style={{display:'block', color:'#666', fontSize:'12px', fontWeight:'bold', marginBottom:'8px', textTransform:'uppercase'}}>Faculty ID</label>
                    <div style={{fontSize:'18px', color:'#333', fontWeight:'500'}}>{facultyDetails.facultyId}</div>
                  </div>

                  <div style={{marginBottom:'25px', paddingBottom:'20px', borderBottom:'1px solid #e0e0e0'}}>
                    <label style={{display:'block', color:'#666', fontSize:'12px', fontWeight:'bold', marginBottom:'8px', textTransform:'uppercase'}}>Department</label>
                    <div style={{fontSize:'18px', color:'#333', fontWeight:'500'}}>{facultyDetails.department}</div>
                  </div>

                  <div style={{marginBottom:'25px', paddingBottom:'20px', borderBottom:'1px solid #e0e0e0'}}>
                    <label style={{display:'block', color:'#666', fontSize:'12px', fontWeight:'bold', marginBottom:'8px', textTransform:'uppercase'}}>Email</label>
                    <div style={{fontSize:'18px', color:'#333', fontWeight:'500'}}>{facultyDetails.email}</div>
                  </div>

                  <div style={{marginBottom:'0'}}>
                    <label style={{display:'block', color:'#666', fontSize:'12px', fontWeight:'bold', marginBottom:'12px', textTransform:'uppercase'}}>Subjects Assigned</label>
                    <div style={{display:'flex', flexWrap:'wrap', gap:'10px'}}>
                      {facultyDetails.subjectsAssigned.map((subj, index) => (
                        <div key={index} style={{background:'#e3f2fd', color:'#1976d2', padding:'8px 14px', borderRadius:'20px', fontSize:'14px', fontWeight:'500'}}>
                          {subj}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default FacultyDashboard;