import { OLLAMA_BASE_URL, OLLAMA_CHAT_MODEL } from "../config/index.js";
import { fetchJson } from "../utils/http.js";

const CHAT_SYSTEM_PROMPT =
  "You are a legal assistant. Provide clear and practical legal guidance. Mention that users should consult a licensed lawyer for final legal advice.";

export async function generateChatReply(chatHistory) {
  const messages = normalizeMessages(chatHistory);
  if (messages.length === 0) {
    throw new Error("At least one user message is required.");
  }

  const response = await fetchJson(`${OLLAMA_BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: OLLAMA_CHAT_MODEL,
      stream: false,
      options: { temperature: 0.2 },
      messages: [{ role: "system", content: CHAT_SYSTEM_PROMPT }, ...messages],
    }),
  });

  const reply = String(response?.message?.content || "").trim();
  if (!reply) {
    throw new Error("Chat model returned an empty response.");
  }

  return reply;
}

function normalizeMessages(chatHistory) {
  if (!Array.isArray(chatHistory)) return [];

  const allowedRoles = new Set(["user", "assistant"]);
  return chatHistory
    .map((message) => ({
      role: String(message?.role || "").toLowerCase(),
      content: String(message?.content || "").trim(),
    }))
    .filter((message) => allowedRoles.has(message.role) && message.content);
}
