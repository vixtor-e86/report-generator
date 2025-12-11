const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: '.env.local' }); // correctly loading .env.local

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function testConnection() {
  // We are using a model confirmed to be in your list
  const modelName = "gemini-flash-latest"; 
  
  console.log(`Testing connection with '${modelName}'...`);

  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    const prompt = "Explain how AI helps in engineering in one sentence.";

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log("✅ SUCCESS! The API is working.");
    console.log("Response:", text);
  } catch (error) {
    console.error("❌ Failed.");
    console.error(error);
  }
}

testConnection();