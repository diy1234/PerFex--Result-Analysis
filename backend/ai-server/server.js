const express = require("express");
const cors = require("cors");
const Groq = require("groq-sdk");
require("dotenv").config();

const app = express();

app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json());

console.log("Starting AI server with Groq...");

// Check API key on startup
if (!process.env.GROQ_API_KEY) {
  console.error("❌ GROQ_API_KEY not found in .env file!");
  console.error("   Add this to your .env file:  GROQ_API_KEY=gsk_...your_key_here");
  console.error("   Get a FREE key at: https://console.groq.com");
} else {
  console.log("✅ GROQ_API_KEY found");
}

// Initialize Groq
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || "",
});

// Test route
app.get("/", (req, res) => {
  res.send("AI Server running with Groq on port 5001 ✅");
});

// Main AI route
app.post("/api/ai", async (req, res) => {
  console.log("📨 Received AI request");

  const { system, userMessage } = req.body;

  if (!userMessage) {
    return res.status(400).json({ error: "userMessage is required" });
  }

  if (!process.env.GROQ_API_KEY) {
    return res.status(500).json({ error: "GROQ_API_KEY not configured in .env" });
  }

  try {
    const messages = [];

    if (system) {
      messages.push({ role: "system", content: system });
    }

    messages.push({ role: "user", content: userMessage });

    console.log("📤 Sending to Groq...");
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages,
      max_tokens: 1000,
    });

    const text = completion.choices[0].message.content;

    console.log("✅ Groq responded successfully");
    res.json({
      content: [{ type: "text", text }],
    });

  } catch (error) {
    console.error("❌ Groq error:", error.message);

    res.status(500).json({
      error: error.message,
      hint: "Check your GROQ_API_KEY in .env — get a free key at https://console.groq.com"
    });
  }
});

// Start server on port 5001 ✅ CHANGED from 5000
const PORT = 5001;
app.listen(PORT, () => {
  console.log(`✅ AI Server running on http://localhost:${PORT}`);
});