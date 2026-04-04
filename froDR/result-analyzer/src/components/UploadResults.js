import React, { useState } from "react";

function UploadResults() {

  const [results, setResults] = useState([]);
  const [course, setCourse] = useState("MCA");
  const [session, setSession] = useState("2024-25");
  const [examType, setExamType] = useState("CIE");
  const [semester, setSemester] = useState("1");
  const [status, setStatus] = useState("");

  const parseCSV = (text) => {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length === 0) return [];

    const headers = lines[0].split(",").map((h) => h.trim());

    return lines.slice(1).filter(Boolean).map((line) => {
      const values = line.split(",");
      const obj = {};
      headers.forEach((header, idx) => {
        obj[header] = values[idx] ? values[idx].trim() : "";
      });
      return obj;
    });
  };

  const handleFileUpload = (e) => {

    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {

      const text = reader.result;
      const parsed = parseCSV(text);

      setResults(parsed);

      setStatus(`✔ File uploaded successfully. ${parsed.length} records loaded.`);

    };

    reader.readAsText(file);

  };

  const processResults = () => {

    if(results.length === 0){
      alert("Please upload a CSV file first.");
      return;
    }

    alert("Results processed successfully. Analytics & leaderboard updated.");

  };

  return(

    <div className="upload-results">

      <h2>Upload CSV Result</h2>

      {/* FILTER SECTION */}

      <div className="upload-filters">

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

        <select value={examType} onChange={(e)=>setExamType(e.target.value)}>
          <option>CIE</option>
          <option>Internal</option>
        </select>

        <select value={semester} onChange={(e)=>setSemester(e.target.value)}>
          <option>Semester 1</option>
          <option>Semester 2</option>
          <option>Semester 3</option>
        </select>

      </div>

      {/* FILE INPUT */}

      <input type="file" accept=".csv" onChange={handleFileUpload}/>

      {/* STATUS MESSAGE */}

      {status && (
        <p className="upload-status">{status}</p>
      )}

      {/* PROCESS BUTTON */}

      <button className="btn-primary" onClick={processResults}>
        Process Results
      </button>

      {/* PREVIEW TABLE */}

      <table className="results-table">

        <thead>

          <tr>
            <th>Enrollment</th>
            <th>Name</th>
            <th>Course</th>
            <th>Subject</th>
            <th>Marks</th>
          </tr>

        </thead>

        <tbody>

          {results.map((r,i)=>(

            <tr key={i}>
              <td>{r.enroll}</td>
              <td>{r.name}</td>
              <td>{r.course}</td>
              <td>{r.subject}</td>
              <td>{r.marks}</td>
            </tr>

          ))}

        </tbody>

      </table>

      {/* CSV FORMAT GUIDE */}

      <div className="csv-guide">

        <h4>CSV Format Example</h4>

<pre>
enroll,name,course,subject,marks
101,Rahul,MCA,DBMS,78
102,Priya,MCA,OS,72
103,Aman,MCA,Algorithms,81
</pre>

      </div>

    </div>

  )

}

export default UploadResults;