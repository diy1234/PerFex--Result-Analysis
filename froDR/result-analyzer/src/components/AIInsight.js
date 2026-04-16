import React, { useState } from "react";

/* ─────────────────────────────────────────────────────────────────────────────
   AIInsight  –  Drop-in Claude-powered analysis panel
   Props:
     role        "student" | "faculty" | "admin"
     dataContext  string describing the current data snapshot
     dark        boolean  (matches parent dashboard theme)
─────────────────────────────────────────────────────────────────────────────── */
function AIInsight({ role = "student", dataContext = "", dark = true }) {

  const [question, setQuestion] = useState("");
  const [answer,   setAnswer]   = useState("");
  const [loading,  setLoading]  = useState(false);
  const [asked,    setAsked]    = useState(false);

  /* ── theme tokens matching StudentDashboard / FacultyDashboard ─────────── */
  const T = dark
    ? { bg:"#0f172a", surface:"#1e293b", border:"#2a3348", text:"#e2e8f0",
        textSub:"#94a3b8", accent:"#3b82f6", accentSoft:"rgba(59,130,246,0.08)" }
    : { bg:"#f1f5f9", surface:"#ffffff", border:"#e2e8f0", text:"#1e293b",
        textSub:"#64748b", accent:"#2563eb", accentSoft:"rgba(37,99,235,0.06)" };

  /* ── role-specific quick chips ─────────────────────────────────────────── */
  const chips = {
    student: [
      "Which subjects do I need to focus on most?",
      "How am I performing vs class average?",
      "Give me a personalised study plan.",
      "Will my CGPA improve next semester?",
    ],
    faculty: [
      "Which students are at risk of failing?",
      "What is the weak area across the class?",
      "Compare top 5 vs bottom 5 students.",
      "Suggest teaching interventions for weak students.",
    ],
    admin: [
      "Which course has the lowest pass rate?",
      "Give a HOD-level summary report.",
      "Which batch needs urgent attention?",
      "Predict next semester performance trend.",
    ],
  };

  /* ── AI call ────────────────────────────────────────────────────────────── */
  const askAI = async (preset) => {
    const q = (preset || question).trim();
    if (!q) return;
    if (!preset) setQuestion(q);
    setLoading(true);
    setAsked(true);
    setAnswer("");

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: `You are an AI academic performance analyst for a college Result Analysis Dashboard (PREFEX Result Analyzer).
The viewer role is: ${role}.
Answer concisely in under 180 words. Use plain text only — no markdown, no bullet symbols, no asterisks.
Always reference the data provided. Give specific, actionable recommendations.`,
          messages: [
            {
              role: "user",
              content: `Current data snapshot:\n${dataContext || "No data provided."}\n\nQuestion: ${q}`,
            },
          ],
        }),
      });

      const data = await res.json();

      if (data.error) {
        setAnswer(`Error: ${data.error.message}`);
      } else {
        const text = data.content
          ?.filter((b) => b.type === "text")
          .map((b) => b.text)
          .join("\n") || "No response received.";
        setAnswer(text);
      }
    } catch (err) {
      setAnswer("Unable to connect to AI. Please check your internet connection.");
    }

    setLoading(false);
  };

  /* ── styles ────────────────────────────────────────────────────────────── */
  const wrap = {
    background: T.surface,
    border: `1px solid ${T.border}`,
    borderLeft: `3px solid ${T.accent}`,
    borderRadius: 12,
    padding: "20px 24px",
    marginTop: 24,
  };
  const header = {
    display: "flex", alignItems: "center", gap: 10, marginBottom: 14,
  };
  const titleStyle = {
    fontSize: 15, fontWeight: 700, color: T.text,
  };
  const badgeStyle = {
    fontSize: 11, fontWeight: 600,
    background: dark ? "#1e1b4b" : "#ede9fe",
    color: dark ? "#a78bfa" : "#6d28d9",
    border: `1px solid ${dark ? "#312e81" : "#c4b5fd"}`,
    padding: "3px 10px", borderRadius: 20,
  };
  const chipRow = {
    display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14,
  };
  const chipStyle = {
    fontSize: 12, padding: "6px 14px",
    background: T.accentSoft,
    border: `1px solid ${dark ? "#1e3a6e" : "#bfdbfe"}`,
    borderRadius: 20, color: dark ? "#93c5fd" : "#1d4ed8",
    cursor: "pointer", fontFamily: "inherit",
    transition: "all 0.15s",
  };
  const inputRow = {
    display: "flex", gap: 8, marginBottom: 14,
  };
  const inputStyle = {
    flex: 1, padding: "10px 14px",
    background: dark ? "#0f172a" : "#f8fafc",
    border: `1px solid ${T.border}`,
    borderRadius: 8, color: T.text, fontSize: 13,
    outline: "none", fontFamily: "inherit",
  };
  const btnStyle = {
    padding: "10px 20px",
    background: T.accent, color: "#fff",
    border: "none", borderRadius: 8,
    fontSize: 13, fontWeight: 600,
    cursor: "pointer", whiteSpace: "nowrap",
    fontFamily: "inherit",
  };
  const answerBox = {
    fontSize: 13, color: loading ? T.textSub : T.text,
    lineHeight: 1.8, whiteSpace: "pre-wrap",
    minHeight: 56,
    background: dark ? "#0f172a" : "#f8fafc",
    border: `1px solid ${T.border}`,
    borderRadius: 8, padding: "12px 16px",
    fontStyle: loading ? "italic" : "normal",
    transition: "all 0.2s",
  };

  return (
    <div style={wrap}>
      {/* Header */}
      <div style={header}>
        <span style={{ fontSize: 18 }}>✦</span>
        <span style={titleStyle}>AI Insight Engine</span>
        <span style={badgeStyle}>Claude-powered</span>
      </div>

      {/* Quick chips */}
      <div style={chipRow}>
        {chips[role]?.map((c, i) => (
          <button key={i} style={chipStyle} onClick={() => askAI(c)}
            onMouseEnter={e => { e.currentTarget.style.background = T.accent; e.currentTarget.style.color = "#fff"; }}
            onMouseLeave={e => { e.currentTarget.style.background = T.accentSoft; e.currentTarget.style.color = dark ? "#93c5fd" : "#1d4ed8"; }}>
            {c}
          </button>
        ))}
      </div>

      {/* Input */}
      <div style={inputRow}>
        <input
          style={inputStyle}
          type="text"
          placeholder={`Ask anything about this ${role === "student" ? "student's" : role === "faculty" ? "class"  : "institution's"} performance data…`}
          value={question}
          onChange={e => setQuestion(e.target.value)}
          onKeyDown={e => e.key === "Enter" && askAI()}
          onFocus={e  => { e.target.style.borderColor = T.accent; }}
          onBlur={e   => { e.target.style.borderColor = T.border; }}
        />
        <button style={btnStyle} onClick={() => askAI()}
          onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
          onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
          Ask AI →
        </button>
      </div>

      {/* Answer */}
      {(asked || loading) && (
        <div style={answerBox}>
          {loading ? "Analyzing data, please wait…" : answer}
        </div>
      )}

      {!asked && (
        <div style={{ fontSize: 12, color: T.textSub, textAlign: "center", padding: "8px 0" }}>
          Click a quick insight above or type your own question and press Enter.
        </div>
      )}
    </div>
  );
}

export default AIInsight;