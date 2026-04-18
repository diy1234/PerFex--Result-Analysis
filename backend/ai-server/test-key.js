require("dotenv").config();
const OpenAI = require("openai");

console.log("🔍 Testing OpenAI API Key...\n");

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.error("❌ OPENAI_API_KEY not found in .env file!");
  process.exit(1);
}

console.log("✓ API Key found:", apiKey.substring(0, 20) + "...\n");

const openai = new OpenAI({ apiKey });

async function test() {
  try {
    console.log("📤 Sending test request to OpenAI...");
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: "Say 'Hello from PERFEX!' in exactly 5 words." },
      ],
      max_tokens: 50,
    });

    console.log("✅ SUCCESS! OpenAI API is working!\n");
    console.log("Response:", response.choices[0].message.content);
    console.log("\n🎉 Your AI Server should work now!");
    
  } catch (error) {
    console.error("❌ ERROR:", error.message);
    console.error("\n🔧 Possible fixes:");
    console.error("1. Check API Key is valid: https://platform.openai.com/account/api-keys");
    console.error("2. Check OpenAI account has credits");
    console.error("3. Try a different model: gpt-4, gpt-3.5-turbo");
  }
}

test();
