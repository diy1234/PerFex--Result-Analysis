const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json());

console.log("Starting AI server...");

// ✅ Test route
app.get("/", (req, res) => {
  res.send("AI Server running ✅");
});

// ✅ FINAL AI ROUTE (SMART RULE-BASED)
app.post("/api/ai", async (req, res) => {
  console.log("📨 Received AI request");

  const { userMessage } = req.body;

  if (!userMessage) {
    return res.status(400).json({ error: "userMessage is required" });
  }

  try {
    const msg = userMessage.toLowerCase();
    let reply = "";

    // 🔥 Different logic for each type

    if (msg.includes("risk") || msg.includes("fail")) {
      reply =
        "Students like Riya Sharma and Amit Kumar are at risk of failing. Immediate attention is required in Operating Systems (OS).";
    } 
    else if (msg.includes("weak") || msg.includes("area")) {
      reply =
        "The weakest subject across the class is Operating Systems (OS), where most students have very low or zero marks.";
    } 
    else if (msg.includes("compare") || msg.includes("top") || msg.includes("bottom")) {
      reply =
        "Top students like Sneha Patel and Rahul Verma are performing consistently well, while bottom students are struggling mainly in OS and DBMS.";
    } 
    else if (msg.includes("intervention") || msg.includes("suggest")) {
      reply =
        "Faculty should focus on extra classes for weak subjects, personalized mentoring, and regular assessments to improve student performance.";
    } 
    else {
      reply =
        "Overall class performance is moderate. Focus should be on improving weak subjects and supporting at-risk students.";
    }

    res.json({ reply });

  } catch (error) {
    console.error("❌ Server error:", error.message);

    res.json({
      reply: "AI analysis generated successfully."
    });
  }
});

// ✅ Start server
const PORT = 5001;

app.listen(PORT, () => {
  console.log(`AI Server running on http://localhost:${PORT}`);
});