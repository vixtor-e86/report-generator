const https = require('https');
require('dotenv').config({ path: '.env.local' });

const key = process.env.GEMINI_API_KEY;
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;

console.log("Checking available models...");

https.get(url, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    if (res.statusCode === 200) {
        const json = JSON.parse(data);
        if (json.models) {
            console.log("✅ SUCCESS! Here are the models your key can access:");
            // Filter to just show the 'generateContent' capable models
            const chatModels = json.models.filter(m => m.supportedGenerationMethods.includes("generateContent"));
            chatModels.forEach(m => console.log(` - ${m.name.replace('models/', '')}`));
        } else {
            console.log("⚠️  Connected, but no models returned.");
            console.log(json);
        }
    } else {
        console.log(`❌ Error ${res.statusCode}:`);
        console.log(JSON.parse(data));
    }
  });
}).on('error', (e) => {
  console.error("Connection error:", e);
});