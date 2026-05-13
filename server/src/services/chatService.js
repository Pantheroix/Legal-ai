import {
  OLLAMA_BASE_URL,
  OLLAMA_CHAT_MODEL,
  TUNNEL_USER_AGENT,
} from "../config/index.js";
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
    headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true",
    },
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

export async function streamChatReply(chatHistory, onDelta) {
  const messages = normalizeMessages(chatHistory);
  if (messages.length === 0) {
    throw new Error("At least one user message is required.");
  }

  const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": TUNNEL_USER_AGENT,
      "ngrok-skip-browser-warning": "true",
    },
    body: JSON.stringify({
      model: OLLAMA_CHAT_MODEL,
      stream: true,
      options: { temperature: 0.2 },
      messages: [{ role: "system", content: CHAT_SYSTEM_PROMPT }, ...messages],
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    const errorText =
      body || `Chat model request failed with status ${response.status}`;
    throw new Error(errorText);
  }

  if (!response.body) {
    throw new Error("Model did not return a readable stream.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop();

    for (const line of lines) {
      const chunk = parseModelStreamLine(line);
      if (chunk) {
        onDelta(chunk);
      }
    }
  }

  if (buffer.trim()) {
    const chunk = parseModelStreamLine(buffer);
    if (chunk) {
      onDelta(chunk);
    }
  }
}

function parseModelStreamLine(line) {
  const trimmed = String(line).trim();
  if (!trimmed) return "";

  const payload = trimmed.startsWith("data:")
    ? trimmed.slice(5).trim()
    : trimmed;

  if (!payload || payload === "[DONE]") {
    return "";
  }

  try {
    const parsed = JSON.parse(payload);
    return (
      parsed.response?.delta?.content ||
      parsed.delta?.content ||
      parsed.text ||
      parsed.output ||
      ""
    );
  } catch {
    return payload;
  }
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
