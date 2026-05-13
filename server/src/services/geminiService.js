import {
  GEMINI_API_KEY,
  GEMINI_MODEL,
  TUNNEL_USER_AGENT,
} from "../config/index.js";

function extractJsonArray(text) {
  const cleanText = String(text || "")
    .replace(/```json|```/g, "")
    .trim();
  const start = cleanText.indexOf("[");
  const end = cleanText.lastIndexOf("]");

  if (start === -1 || end === -1 || end < start) {
    throw new Error("Gemini did not return a JSON array.");
  }

  return JSON.parse(cleanText.slice(start, end + 1));
}

export async function getGovernmentSchemes({
  prompt,
  state,
  category,
  language,
}) {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === "your_fresh_gemini_api_key_here") {
    throw new Error(
      "GEMINI_API_KEY is not configured. Add a fresh Gemini API key to server/.env and restart the server.",
    );
  }

  const effectivePrompt = String(prompt || "").trim();
  const effectiveState = String(state || "").trim();
  const effectiveCategory = String(category || "").trim();
  const effectiveLanguage = String(language || "English").trim();

  const systemPrompt = `
You are a government welfare scheme expert for India.
Find relevant Indian government schemes for the user's request.
Respond ONLY with a valid JSON array. No explanation, no markdown, no backticks.
Return 3 to 6 schemes.
Use ${effectiveLanguage} for human-readable string values when possible.

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

  const userRequest = `
User search: ${effectivePrompt || "government welfare schemes"}
State: ${effectiveState || "Any Indian state"}
Category: ${effectiveCategory || "Any category"}
`;

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": TUNNEL_USER_AGENT,
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: `${systemPrompt}\n\n${userRequest}` }],
        },
      ],
    }),
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const geminiMessage = payload?.error?.message || "";
    if (/api key/i.test(geminiMessage)) {
      throw new Error(
        `${geminiMessage} Add a fresh GEMINI_API_KEY to server/.env and restart the server.`,
      );
    }

    throw new Error(geminiMessage || "Failed to fetch schemes from Gemini.");
  }

  const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  const schemes = extractJsonArray(text);

  if (!Array.isArray(schemes)) {
    throw new Error("Gemini response was not a scheme array.");
  }

  return schemes;
}
