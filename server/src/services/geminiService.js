const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI("AIzaSyD7sd9X7DNssh529CKFAhRzTncZEOFKIdQ");

async function getFoodWelfareSchemes(prompt) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const systemPrompt = `
You are a government welfare scheme expert for India.
The user will ask about food or welfare schemes.
Respond ONLY with a valid JSON array. No explanation, no markdown, no backticks.

Each scheme object must follow this exact structure:
{
  "id": number,
  "name": "string",
  "ministry": "string",
  "category": "string",
  "description": "string",
  "eligibility": ["string"],
  "benefits": ["string"],
  "how_to_apply": "string",
  "official_url": "string",
  "languages": ["string"]
}
`;

  const result = await model.generateContent(
    `${systemPrompt}\n\nUser request: ${prompt}`,
  );
  const text = result.response.text();

  // Strip markdown fences if present
  const clean = text.replace(/```json|```/g, "").trim();

  const schemes = JSON.parse(clean);
  return schemes;
}

// --- Run ---
const userPrompt = "List 3 food welfare schemes in India";

getFoodWelfareSchemes(userPrompt)
  .then((schemes) => {
    console.log(JSON.stringify(schemes, null, 2));
  })
  .catch((err) => {
    console.error("Error:", err.message);
  });
