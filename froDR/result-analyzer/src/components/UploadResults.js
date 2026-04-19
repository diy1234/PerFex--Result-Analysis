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
  const [selectedSubject, setSelectedSubject] = useState("");
  const [status, setStatus] = useState("");
  const [editingMarkId, setEditingMarkId] = useState(null);
  const [editingMarks, setEditingMarks] = useState({});
  const [editingStudentId, setEditingStudentId] = useState(null);
  const [editingStudentData, setEditingStudentData] = useState({});
  const [classResults, setClassResults] = useState({ students: [], subjects: [] });

  const loadMarks = async () => {
    try {
      const filters = {
        course,
        semester: `Sem${semester}`,
        exam_type: examType,
      };
      if (selectedSubject) {
        filters.subject_id = selectedSubject;
      }
      const marksData = await facultyAPI.getMarks(filters);
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
  }, [course, semester, examType, selectedSubject]);

  const parseCSV = (text) => {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length === 0) return [];

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    console.log('CSV Headers:', headers);

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
      console.log('Parsed CSV Data:', parsed);

      setResults(parsed);

      setStatus(`✔ File uploaded successfully. ${parsed.length} records loaded.`);

    };

    reader.readAsText(file);

  };

  const mapExamType = (examTypeFromCSV) => {
    const csvExamType = String(examTypeFromCSV || "").trim().toLowerCase();
    
    // Map common variations
    if (csvExamType.includes('final') || csvExamType.includes('result')) {
      return 'FULLRESULT';
    }
    if (csvExamType.includes('cie1') || csvExamType === 'cie1') {
      return 'CIE1';
    }
    if (csvExamType.includes('cie2') || csvExamType === 'cie2') {
      return 'CIE2';
    }
    if (csvExamType.includes('internal1') || csvExamType === 'internal1') {
      return 'Internal1';
    }
    if (csvExamType.includes('internal2') || csvExamType === 'internal2') {
      return 'Internal2';
    }
    
    // If no mapping found, try to normalize it
    const normalized = csvExamType.replace(/\s+/g, '').toUpperCase();
    console.log('mapExamType:', csvExamType, '=>', normalized);
    return normalized;
  };

  const processResults = async () => {
    if (results.length === 0) {
      setStatus("⚠️ Please upload a CSV file first.");
      return;
    }

    const entries = [];
    const errors = [];

    results.forEach((row, index) => {
      // Handle both formats: student_id directly, OR enroll lookup
      let studentId = row.student_id;
      let subjectId = row.subject_id;
      let marksVal = row.marks;
      let examTypeVal = row.exam_type ? mapExamType(row.exam_type) : examType;

      // If student_id not in CSV, try lookup by enroll
      if (!studentId && row.enroll) {
        const student = students.find(s => String(s.enroll || "").toLowerCase() === String(row.enroll || "").toLowerCase());
        studentId = student?.id;
      }

      // If subject_id not in CSV, try lookup by subject name
      if (!subjectId && row.subject) {
        const subjectName = String(row.subject || "").toLowerCase();
        const subject = subjects.find(s => 
          String(s.name || "").toLowerCase() === subjectName || 
          String(s.code || "").toLowerCase() === subjectName
        );
        subjectId = subject?.id;
      }

      // Validate required fields
      studentId = Number(studentId);
      subjectId = Number(subjectId);
      marksVal = Number(marksVal);

      console.log(`Row ${index + 1}:`, { studentId, subjectId, examTypeVal, marksVal, rawRow: row });

      if (!studentId || Number.isNaN(studentId)) {
        errors.push(`Row ${index + 1}: Invalid or missing student_id`);
        return;
      }
      if (!subjectId || Number.isNaN(subjectId)) {
        errors.push(`Row ${index + 1}: Invalid or missing subject_id`);
        return;
      }
      if (Number.isNaN(marksVal)) {
        errors.push(`Row ${index + 1}: Invalid marks value`);
        return;
      }

      entries.push({
        student_id: studentId,
        subject_id: subjectId,
        exam_type: examTypeVal,
        marks: marksVal,
        max_marks: row.max_marks || 100,
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

  const handleEditMark = (mark) => {
    setEditingMarkId(mark.mark_id);
    setEditingMarks({ ...mark });
  };

  const handleSaveEdit = async () => {
    try {
      await facultyAPI.updateMark(editingMarkId, { marks: editingMarks.marks });
      setStatus('✔ Mark updated successfully');
      setEditingMarkId(null);
      await loadMarks();
      if (onUploadSuccess) onUploadSuccess();
    } catch (err) {
      console.error('UploadResults update mark error', err);
      setStatus(`❌ Failed to update mark: ${err.message || err}`);
    }
  };

  const handleFinalSubmit = () => {
    alert('Results finalized! All marks have been submitted.');
  };

  const handleLaunch = () => {
    alert('Results launched! Students can now view their marks.');
  };

  const handleEditStudent = (student) => {
    setEditingStudentId(student.id);
    setEditingStudentData({ ...student });
  };

  const handleSaveStudent = async () => {
    try {
      // Get the original student data
      const originalStudent = classResults.students.find(s => s.id === editingStudentId);
      
      if (!originalStudent) {
        setStatus('❌ Student not found');
        return;
      }
      
      // Update each subject mark that has changed
      let updateCount = 0;
      for (const subject of classResults.subjects) {
        const subjectKey = subject.code?.toLowerCase() || subject.name?.toLowerCase();
        const originalMarks = originalStudent[subjectKey];
        const newMarks = editingStudentData[subjectKey];
        
        // Only update if marks have changed
        if (newMarks !== undefined && newMarks !== originalMarks) {
          await facultyAPI.updateMark(editingStudentId, {
            marks: newMarks,
            subject_id: subject.id,
            student_id: editingStudentId,
            exam_type: examType
          });
          updateCount++;
        }
      }
      
      if (updateCount === 0) {
        setStatus('ℹ️ No changes made to marks');
      } else {
        setStatus(`✔ ${updateCount} mark(s) updated successfully`);
      }
      
      setEditingStudentId(null);
      setEditingStudentData({});
      await loadClassResults();
      if (onUploadSuccess) onUploadSuccess();
    } catch (err) {
      console.error('UploadResults update student marks error', err);
      setStatus(`❌ Failed to update student marks: ${err.message || err}`);
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
          <option value="FULLRESULT">Final Result</option>
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

        <select value={selectedSubject} onChange={(e)=>setSelectedSubject(e.target.value)}>
          <option value="">All Subjects</option>
          {subjects.map(sub => (
            <option key={sub.id} value={sub.id}>{sub.name || sub.code}</option>
          ))}
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
        {(() => {
          // Filter marks by selected subject if any
          const filteredMarks = selectedSubject
            ? existingMarks.filter(row => String(row.subject_id) === String(selectedSubject))
            : existingMarks;
          if (filteredMarks.length === 0) {
            return <p>No marks found for selected course/semester/exam/subject.</p>;
          }
          // If a subject is selected, show a minimal table
          if (selectedSubject) {
            return (
              <table className="results-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Enroll</th>
                    <th>Subject ID</th>
                    <th>Marks</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMarks.map((row) => (
                    <tr key={row.mark_id || `${row.student_id}-${row.subject_id}`}>
                      <td>{row.name}</td>
                      <td>{row.enroll}</td>
                      <td>{row.subject_id}</td>
                      <td>
                        {editingMarkId === row.mark_id ? (
                          <input
                            type="number"
                            value={editingMarks.marks}
                            onChange={e => setEditingMarks({...editingMarks, marks: e.target.value})}
                            style={{width: '60px', padding: '4px'}} 
                          />
                        ) : (
                          row.marks
                        )}
                      </td>
                      <td>
                        {editingMarkId === row.mark_id ? (
                          <>
                            <button className="edit-btn" onClick={handleSaveEdit} style={{background: '#10b981', marginRight: '5px'}}>Save</button>
                            <button className="delete-btn" onClick={() => setEditingMarkId(null)}>Cancel</button>
                          </>
                        ) : (
                          <>
                            <button className="edit-btn" onClick={() => handleEditMark(row)} style={{marginRight: '5px'}}>✎ Edit</button>
                            <button className="delete-btn" onClick={() => deleteMark(row.mark_id)}>Delete</button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            );
          }
          // Otherwise, show the default table
          return (
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
                {filteredMarks.map((row) => (
                  <tr key={row.mark_id || `${row.student_id}-${row.subject}-${row.exam_type}`}>
                    <td>{row.name}</td>
                    <td>{row.enroll}</td>
                    <td>{row.subject || 'N/A'}</td>
                    <td>{row.exam_type}</td>
                    <td>
                      {editingMarkId === row.mark_id ? (
                        <input
                          type="number"
                          value={editingMarks.marks}
                          onChange={e => setEditingMarks({...editingMarks, marks: e.target.value})}
                          style={{width: '60px', padding: '4px'}} 
                        />
                      ) : (
                        row.marks
                      )}
                    </td>
                    <td>{row.pct || '0'}</td>
                    <td>
                      {editingMarkId === row.mark_id ? (
                        <>
                          <button className="edit-btn" onClick={handleSaveEdit} style={{background: '#10b981', marginRight: '5px'}}>Save</button>
                          <button className="delete-btn" onClick={() => setEditingMarkId(null)}>Cancel</button>
                        </>
                      ) : (
                        <>
                          <button className="edit-btn" onClick={() => handleEditMark(row)} style={{marginRight: '5px'}}>✎ Edit</button>
                          <button className="delete-btn" onClick={() => deleteMark(row.mark_id)}>Delete</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          );
        })()}
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
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {classResults.students.length === 0 ? (
                <tr>
                  <td colSpan={classResults.subjects.length + 5} style={{ textAlign: 'center' }}>
                    No class results found for selected course/semester/exam.
                  </td>
                </tr>
              ) : (
                classResults.students.map((st) => (
                  <tr key={st.id}>
                    <td>{st.name}</td>
                    <td>{st.enroll}</td>
                    {classResults.subjects.map((sub) => {
                      const subjectKey = sub.code?.toLowerCase() || sub.name?.toLowerCase();
                      const cellValue = editingStudentId === st.id 
                        ? editingStudentData[subjectKey] ?? st[subjectKey] ?? '-'
                        : st[subjectKey] ?? st[sub.code?.toLowerCase()] ?? st[sub.name?.toLowerCase()] ?? '-';
                      
                      return (
                        <td key={sub.id}>
                          {editingStudentId === st.id ? (
                            <input
                              type="number"
                              value={cellValue}
                              onChange={e => setEditingStudentData({...editingStudentData, [subjectKey]: e.target.value})}
                              style={{width: '100%', padding: '4px', border: '1px solid #3b82f6', borderRadius: '4px'}}
                            />
                          ) : (
                            cellValue
                          )}
                        </td>
                      );
                    })}
                    <td>{editingStudentId === st.id ? editingStudentData.total ?? st.total ?? '-' : st.total ?? '-'}</td>
                    <td>{editingStudentId === st.id ? editingStudentData.pct ?? st.pct ?? '-' : st.pct ?? '-'}%</td>
                    <td>
                      {editingStudentId === st.id ? (
                        <>
                          <button 
                            onClick={handleSaveStudent}
                            style={{padding: '6px 12px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', marginRight: '5px'}}
                          >
                            Save
                          </button>
                          <button 
                            onClick={() => setEditingStudentId(null)}
                            style={{padding: '6px 12px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600'}}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button 
                          onClick={() => handleEditStudent(st)}
                          style={{padding: '6px 12px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600'}}
                        >
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FINAL AND LAUNCH BUTTONS */}
      <div style={{ display: 'flex', gap: '12px', marginTop: '20px', justifyContent: 'flex-end' }}>
        <button
          onClick={handleFinalSubmit}
          style={{
            padding: '10px 24px',
            background: '#f59e0b',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontWeight: '600',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Final
        </button>
        <button
          onClick={handleLaunch}
          style={{
            padding: '10px 24px',
            background: '#10b981',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontWeight: '600',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Launch
        </button>
      </div>

    </div>

  )

}

export default UploadResults;