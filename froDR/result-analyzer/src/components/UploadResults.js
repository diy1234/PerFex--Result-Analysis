import React, { useState, useEffect } from "react";
import { facultyAPI } from "../api";

function UploadResults({ onUploadSuccess }) {

  const [results, setResults] = useState([]);
  const [existingMarks, setExistingMarks] = useState([]);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [course, setCourse] = useState("MCA");
  const [session, setSession] = useState("2024-25");
  const [examType, setExamType] = useState("FULLRESULT");
  const [semester, setSemester] = useState("1");
  const [status, setStatus] = useState("");
  const [classResults, setClassResults] = useState({ students: [], subjects: [] });

  const loadMarks = async () => {
    try {
      const marksData = await facultyAPI.getMarks({
        course,
        semester: `Sem${semester}`,
        exam_type: examType,
      });
      const filtered = (marksData || []).filter((r) => r.mark_id);
      setExistingMarks(filtered);
    } catch (err) {
      console.error('UploadResults load marks error', err);
    }
  };

  const loadClassResults = async () => {
    try {
      const data = await facultyAPI.getClassResults({
        course,
        semester: `Sem${semester}`,
        exam_type: examType,
      });
      if (data && data.students) {
        setClassResults({
          students: data.students || [],
          subjects: data.subjects || [],
        });
      } else {
        setClassResults({ students: [], subjects: [] });
      }
    } catch (err) {
      console.error('UploadResults load class results error', err);
    }
  };

  useEffect(() => {
    const loadMasterData = async () => {
      try {
        const studentList = await facultyAPI.getStudents({ course, semester: `Sem${semester}` });
        const subjectList = await facultyAPI.getSubjects({ course, semester: `Sem${semester}` });
        setStudents(studentList || []);
        setSubjects(subjectList || []);
      } catch (err) {
        console.error('UploadResults load error', err);
      }
    };
    loadMasterData();
    loadMarks();
    loadClassResults();
  }, [course, semester, examType]);

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

  const processResults = async () => {
    if (results.length === 0) {
      setStatus("⚠️ Please upload a CSV file first.");
      return;
    }

    const studentMap = new Map(
      students.map((s) => [String(s.enroll || "").toLowerCase(), s.id])
    );

    const subjectMap = new Map();
    subjects.forEach((sub) => {
      const lowName = String(sub.name || "").toLowerCase();
      subjectMap.set(lowName, sub.id);
      if (sub.code) {
        subjectMap.set(String(sub.code).toLowerCase(), sub.id);
      }
    });

    const entries = [];
    const errors = [];

    results.forEach((row, index) => {
      const enroll = String(row.enroll || "").trim().toLowerCase();
      const subjectName = String(row.subject || "").trim().toLowerCase();
      const marks = Number(row.marks);

      const studentId = studentMap.get(enroll);
      const subjectId = subjectMap.get(subjectName);

      if (!studentId) {
        errors.push(`Row ${index + 1}: Student with enroll '${row.enroll}' not found`);
        return;
      }
      if (!subjectId) {
        errors.push(`Row ${index + 1}: Subject '${row.subject}' not found`);
        return;
      }
      if (Number.isNaN(marks)) {
        errors.push(`Row ${index + 1}: Invalid marks '${row.marks}'`);
        return;
      }

      entries.push({
        student_id: studentId,
        subject_id: subjectId,
        exam_type: examType,
        marks,
        max_marks: 100,
      });
    });

    if (entries.length === 0) {
      setStatus(`⚠️ No valid rows to process. ${errors.length} issue(s).`);
      console.warn('UploadResults processing errors', errors);
      return;
    }

    try {
      await facultyAPI.enterMarksBulk(entries);
      setStatus(`✔ ${entries.length} records saved. ${errors.length} error(s).`);
      setResults([]);
      await loadMarks();
      if (onUploadSuccess) onUploadSuccess();

      if (errors.length > 0) {
        console.warn('UploadResults processing errors', errors);
      }
      await loadClassResults();
    } catch (err) {
      console.error('UploadResults submit error', err);
      setStatus(`❌ Failed to save results: ${err.message || err}`);
    }
  };

  const deleteMark = async (markId) => {
    try {
      await facultyAPI.deleteMark(markId);
      setStatus('✔ Mark deleted');
      await loadMarks();
      if (onUploadSuccess) onUploadSuccess();
    } catch (err) {
      console.error('UploadResults delete mark error', err);
      setStatus(`❌ Failed to delete mark: ${err.message || err}`);
    }
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
          <option>FULLRESULT</option>
          <option>CIE1</option>
          <option>CIE2</option>
          <option>Internal1</option>
          <option>Internal2</option>
        </select>

        <select value={semester} onChange={(e)=>setSemester(e.target.value)}>
          <option value="1">Semester 1</option>
          <option value="2">Semester 2</option>
          <option value="3">Semester 3</option>
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

      {/* EXISTING MARKS FROM DATABASE */}
      <div className="existing-marks">
        <h3>Existing Marks (DB)</h3>
        {existingMarks.length === 0 ? (
          <p>No marks found for selected course/semester/exam.</p>
        ) : (
          <table className="results-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Enroll</th>
                <th>Subject</th>
                <th>Exam</th>
                <th>Marks</th>
                <th>%</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {existingMarks.map((row) => (
                <tr key={row.mark_id || `${row.student_id}-${row.subject}-${row.exam_type}`}>
                  <td>{row.name}</td>
                  <td>{row.enroll}</td>
                  <td>{row.subject || 'N/A'}</td>
                  <td>{row.exam_type}</td>
                  <td>{row.marks}</td>
                  <td>{row.pct || '0'}</td>
                  <td>
                    <button className="delete-btn" onClick={() => deleteMark(row.mark_id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* CLASS RESULT GRID */}
      <div className="class-results">
        <h3>Class Result Table</h3>
        <div className="class-results-table-wrapper" style={{ overflowX: 'auto' }}>
          <table className="results-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Enroll</th>
                {classResults.subjects.map((sub) => (
                  <th key={sub.id}>{sub.code || sub.name}</th>
                ))}
                <th>Total</th>
                <th>%</th>
              </tr>
            </thead>
            <tbody>
              {classResults.students.length === 0 ? (
                <tr>
                  <td colSpan={classResults.subjects.length + 4} style={{ textAlign: 'center' }}>
                    No class results found for selected course/semester/exam.
                  </td>
                </tr>
              ) : (
                classResults.students.map((st) => (
                  <tr key={st.id}>
                    <td>{st.name}</td>
                    <td>{st.enroll}</td>
                    {classResults.subjects.map((sub) => (
                      <td key={sub.id}>{st[sub.code?.toLowerCase()] ?? st[sub.name?.toLowerCase()] ?? '-'}</td>
                    ))}
                    <td>{st.total ?? '-'}</td>
                    <td>{st.pct ?? '-'}%</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

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