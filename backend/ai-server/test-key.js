require("dotenv").config();
const Groq = require("groq-sdk");

console.log("🔍 Testing Groq API Key...\n");

const apiKey = process.env.GROQ_API_KEY;

if (!apiKey) {
  console.error("❌ GROQ_API_KEY not found in .env file!");
  console.error("\n🔧 Fix: Add this line to your .env file:");
  console.error("   GROQ_API_KEY=gsk_...your_key_here");
  console.error("\n📎 Get a FREE key at: https://console.groq.com");
  process.exit(1);
}

console.log("✓ API Key found:", apiKey.substring(0, 12) + "...\n");

const groq = new Groq({ apiKey });

async function test() {
  try {
    console.log("📤 Sending test request to Groq...");

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant", // ✅ FIXED: llama3-8b-8192 was decommissioned
      messages: [{ role: "user", content: "Say exactly: Hello from PREFEX Result Analyzer!" }],
      max_tokens: 50,
    });

    const text = completion.choices[0].message.content;

    console.log("✅ SUCCESS! Groq API is working!\n");
    console.log("Response:", text);
    console.log("\n🎉 Your AI Server is ready! Run:  node server.js");

  } catch (error) {
    console.error("❌ ERROR:", error.message);
    console.error("\n🔧 Possible fixes:");
    console.error("1. Check your API key at: https://console.groq.com");
    console.error("2. Make sure your .env file has:  GROQ_API_KEY=gsk_...your_key_here");
    console.error("3. Make sure you are connected to the internet");
  }
}

test();