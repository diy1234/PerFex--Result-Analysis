import React, { useState, useEffect } from "react";
import { Bar, Line } from "react-chartjs-2";
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
Legend
} from "chart.js";

ChartJS.register(
CategoryScale,
LinearScale,
BarElement,
LineElement,
PointElement,
Title,
Tooltip,
Legend
);

function StudentDashboard({ setDashboard, setPage, darkMode, setDarkMode }) {

const [view,setView] = useState("dashboard");

const [course,setCourse] = useState("MCA");
const [semester,setSemester] = useState("Sem1");
const [exam,setExam] = useState("CIE1");
const [showDownloadOpts, setShowDownloadOpts] = useState(false);

// Auto-open download dropdown when user navigates to the download view
useEffect(() => {
	if (view === 'download') setShowDownloadOpts(true);
	else setShowDownloadOpts(false);
}, [view]);

const subjects = [
{ name: "DBMS", marks: 78 },
{ name: "Operating Systems", marks: 35 },
{ name: "Data Structures", marks: 65 },
{ name: "Computer Networks", marks: 72 },
{ name: "AI", marks: 80 }
];

const semesterMarks = [
{ sem: "Sem1", cgpa: 7.8 },
{ sem: "Sem2", cgpa: 8.0 },
{ sem: "Sem3", cgpa: 8.1 },
{ sem: "Sem4", cgpa: 8.2 }
];

const weakSubjects = subjects.filter(s => s.marks < 40);

const chartData = {
labels: subjects.map(s => s.name),
datasets: [
{
label: "Marks",
data: subjects.map(s => s.marks),
backgroundColor: "#1abcde"
}
]
};

const cgpaData = {
labels: semesterMarks.map(s => s.sem),
datasets: [
{
label:"CGPA",
data: semesterMarks.map(s => s.cgpa),
borderColor:"#f39c12",
backgroundColor:"#f39c12",
tension:0.3
}
]
};

const logout = ()=>{
setDashboard(null);
};

const downloadResult = async ()=>{

const input = document.getElementById("resultSection");

if (!input) {
alert("Result section not available.");
return;
}

const canvas = await html2canvas(input);

const imgData = canvas.toDataURL("image/png");

const pdf = new jsPDF();

pdf.addImage(imgData,"PNG",0,0,210,120);

pdf.save("result.pdf");

};

const downloadCSV = ()=>{

const rows = [["Subject","Marks","Status"]];

subjects.forEach(s=>{
rows.push([s.name,s.marks,s.marks<40?"Weak":"Good"]);
});

const csvContent = rows.map(r=>r.join(",")).join("\n");

const blob = new Blob([csvContent],{type:"text/csv"});

const link = document.createElement("a");

link.href = URL.createObjectURL(blob);
link.download = "results.csv";

link.click();

};

const averageMarks =
subjects.reduce((acc,s)=>acc+s.marks,0)/subjects.length;

let aiMessage="";

if(averageMarks>=80){
aiMessage="Excellent performance! You are performing at a top academic level.";
}
else if(averageMarks>=60){
aiMessage="Good performance overall, but there is room for improvement.";
}
else{
aiMessage="Your performance is below average. Focus on improving weak subjects.";
}

const cgpaTrend = semesterMarks.map(s=>s.cgpa);

let progressMessage="";

if(cgpaTrend[cgpaTrend.length-1] > cgpaTrend[0]){
progressMessage =
"Your CGPA trend shows improvement across semesters.";
}
else if(cgpaTrend[cgpaTrend.length-1] === cgpaTrend[0]){
progressMessage =
"Your CGPA trend is stable.";
}
else{
progressMessage =
"Your CGPA trend is declining. Focus on academics.";
}

let studyPlan="";

if(weakSubjects.length>0){
studyPlan =
"Spend more time studying " +
weakSubjects.map(s=>s.name).join(", ") +
". Practice previous year questions.";
}
else{
studyPlan =
"No weak subjects detected. Maintain your consistency.";
}

useEffect(()=>{
const handler=()=>{
if(setPage) setPage("profile");
};
window.addEventListener("openProfile",handler);
return ()=>window.removeEventListener("openProfile",handler);
},[setPage]);

return (

<div className="dashboard">

{/* NAVBAR */}

<Navbar
title="Student Dashboard"
logout={logout}
openProfile={()=>setPage("profile")}
onLogoClick={()=>setView("dashboard")}
darkMode={darkMode}
setDarkMode={setDarkMode}
/>

<div className="dashboard-body">

{/* SIDEBAR */}

<Sidebar
setDashboard={setDashboard}
setView={setView}
activeView={view}
downloadCSV={downloadCSV}
downloadPDF={downloadResult}

/>

{/* CONTENT */}

<div className="content">

{/* DASHBOARD */}

{view==="dashboard" && (

<>

<div className="filters">

<select value={course} onChange={(e)=>setCourse(e.target.value)}>
<option>MCA</option>
</select>

<select value={semester} onChange={(e)=>setSemester(e.target.value)}>
<option>Sem1</option>
<option>Sem2</option>
<option>Sem3</option>
<option>Sem4</option>
</select>

<select value={exam} onChange={(e)=>setExam(e.target.value)}>
<option>CIE1</option>
<option>CIE2</option>
<option>Internal1</option>
<option>Internal2</option>
</select>

<button>Apply</button>

</div>

{/* STATS */}

<div className="stats">

<div className="card blue">
<h3>CGPA</h3>
<h2>8.5</h2>
</div>

<div className="card orange">
<h3>Percentage</h3>
<h2>82%</h2>
</div>

<div className="card dark">
<h3>Rank</h3>
<h2>3</h2>
</div>

</div>

{/* CHARTS */}

<div className="charts">

<div className="chart">
<h3>Subject Marks</h3>
<Bar data={chartData}/>
</div>

<div className="chart">
<h3>Semester Progress</h3>
<Line data={cgpaData}/>
</div>

</div>

</>

)}

{/* RESULTS */}

{view==="results" && (

<div className="results" id="resultSection">

<h2>Results</h2>

<table>

<thead>
<tr>
<th>Subject</th>
<th>Marks</th>
<th>Status</th>
</tr>
</thead>

<tbody>

{subjects.map((sub,i)=>(
<tr key={i}>
<td>{sub.name}</td>
<td>{sub.marks}</td>
<td style={{color:sub.marks<40?"red":"green"}}>
{sub.marks<40?"Weak":"Good"}
</td>
</tr>
))}

</tbody>

</table>

</div>

)}

{/* ANALYSIS */}

{view==="analysis" && (

<div>

<div className="ai">
<h3>AI Performance Analysis</h3>
<p>{aiMessage}</p>
</div>

<div className="ai">
<h3>Weak Subject Detection</h3>
<p>
{weakSubjects.length>0
? weakSubjects.map(s=>s.name).join(", ")
: "No weak subjects"}
</p>
</div>

<div className="ai">
<h3>AI Progress Insight</h3>
<p>{progressMessage}</p>
</div>

<div className="ai">
<h3>AI Study Recommendation</h3>
<p>{studyPlan}</p>
</div>

</div>

)}

{/* DOWNLOAD */}

{view==="download" && (

<div className="actions">

<h3>Download Results</h3>

<div className="download-filters" style={{display:'flex', gap:12, alignItems:'center'}}>

	<label>
		Course:
		<select value={course} onChange={(e)=>setCourse(e.target.value)} style={{marginLeft:8}}>
			<option>MCA</option>
		</select>
	</label>

	<label>
		Semester:
		<select value={semester} onChange={(e)=>setSemester(e.target.value)} style={{marginLeft:8}}>
			<option>Sem1</option>
			<option>Sem2</option>
			<option>Sem3</option>
			<option>Sem4</option>
		</select>
	</label>

	<label>
		Exam:
		<select value={exam} onChange={(e)=>setExam(e.target.value)} style={{marginLeft:8}}>
			<option>CIE1</option>
			<option>CIE2</option>
			<option>Internal1</option>
			<option>Internal2</option>
		</select>
	</label>

	<button onClick={() => {/* Apply filters - currently client-side state only */}} style={{padding:'8px 12px'}}>Apply</button>

</div>

<div style={{marginTop:12}}>
	<button onClick={downloadCSV}>Download Excel (CSV)</button>
	<button style={{marginLeft:8}} onClick={downloadResult}>Download PDF</button>
</div>

</div>

)}

</div>

</div>

</div>

);

}

export default StudentDashboard;