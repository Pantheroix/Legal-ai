import {
  LEGAL_OUTPUT_SCHEMA,
  OLLAMA_BASE_URL,
  OLLAMA_CHAT_MODEL,
  TOP_K,
} from "../config/index.js";
import { fetchJson } from "../utils/http.js";
import { arrayOrEmpty, parseModelJson, shorten } from "../utils/text.js";
import { embedSingle } from "./embeddingService.js";

export async function generateLegalAnalysis(vectorRecord) {
  const focusQuery =
    "summarize legal document key legal points important clauses obligations rights risks legal procedure stages and next actions";
  const topChunks = await retrieveRelevantChunks(
    vectorRecord,
    focusQuery,
    TOP_K,
  );

  const context = topChunks
    .map((chunk) => `${chunk.id}\n${chunk.text}`)
    .join("\n\n---\n\n");

  const prompt = [
    "You are a legal education assistant.",
    "Use only the provided chunk context from the uploaded legal PDF.",
    "Write in beginner-friendly plain English.",
    "Always include citations using provided chunk IDs.",
    "",
    "Return strictly valid JSON that follows the schema in `format`.",
    "",
    "Chunk context:",
    context,
  ].join("\n");

  const response = await fetchJson(`${OLLAMA_BASE_URL}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true",
    },
    body: JSON.stringify({
      model: OLLAMA_CHAT_MODEL,
      stream: false,
      format: LEGAL_OUTPUT_SCHEMA,
      options: { temperature: 0.2 },
      messages: [
        {
          role: "system",
          content:
            "You explain legal documents in educational form, not as final legal advice.",
        },
        { role: "user", content: prompt },
      ],
    }),
  });

  const raw = response?.message?.content || "";
  const parsed = parseModelJson(raw);
  return normalizeAnalysis(parsed, topChunks);
}

export async function streamLegalAnalysis(vectorRecord, onDelta) {
  const focusQuery =
    "summarize legal document key legal points important clauses obligations rights risks legal procedure stages and next actions";
  const topChunks = await retrieveRelevantChunks(
    vectorRecord,
    focusQuery,
    TOP_K,
  );

  const context = topChunks
    .map((chunk) => `${chunk.id}\n${chunk.text}`)
    .join("\n\n---\n\n");

  const prompt = [
    "You are a legal education assistant.",
    "Use only the provided chunk context from the uploaded legal PDF.",
    "Write in beginner-friendly plain English.",
    "Always include citations using provided chunk IDs.",
    "",
    "Return strictly valid JSON that follows the schema in `format`.",
    "",
    "Chunk context:",
    context,
  ].join("\n");

  const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true",
    },
    body: JSON.stringify({
      model: OLLAMA_CHAT_MODEL,
      stream: true,
      format: LEGAL_OUTPUT_SCHEMA,
      options: { temperature: 0.2 },
      messages: [
        {
          role: "system",
          content:
            "You explain legal documents in educational form, not as final legal advice.",
        },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(body || `Ollama responded with status ${response.status}`);
  }

  if (!response.body) {
    throw new Error("Ollama did not return a readable stream.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";
  let raw = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop();

    for (const line of lines) {
      const chunk = parseModelStreamLine(line);
      if (!chunk) continue;
      raw += chunk;
      onDelta(chunk);
    }
  }

  if (buffer.trim()) {
    const chunk = parseModelStreamLine(buffer);
    if (chunk) {
      raw += chunk;
      onDelta(chunk);
    }
  }

  const parsed = parseModelJson(raw);
  return normalizeAnalysis(parsed, topChunks);
}

function parseModelStreamLine(line) {
  const trimmed = String(line).trim();
  if (!trimmed || trimmed === "[DONE]") return "";

  const payload = trimmed.startsWith("data:")
    ? trimmed.slice(5).trim()
    : trimmed;

  if (!payload) return "";

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

export async function answerQuestionWithRag(vectorRecord, question) {
  const topChunks = await retrieveRelevantChunks(vectorRecord, question, TOP_K);
  const context = topChunks
    .map((chunk) => `${chunk.id}\n${chunk.text}`)
    .join("\n\n---\n\n");

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
      messages: [
        {
          role: "system",
          content:
            "You answer legal document questions clearly for beginners and include chunk citations like [chunk-3].",
        },
        {
          role: "user",
          content: `Question: ${question}\n\nContext chunks:\n${context}`,
        },
      ],
    }),
  });

  return {
    answer: response?.message?.content || "No answer generated.",
    citations: topChunks.map((chunk) => ({
      chunk_id: chunk.id,
      quote: shorten(chunk.text, 280),
    })),
  };
}

async function retrieveRelevantChunks(vectorRecord, query, limit) {
  const queryVector = await embedSingle(query);

  return vectorRecord.chunks
    .map((chunk) => ({
      ...chunk,
      score: cosineSimilarity(queryVector, chunk.embedding),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

function cosineSimilarity(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function normalizeAnalysis(modelOutput, retrievedChunks) {
  const fallbackCitations = retrievedChunks.slice(0, 4).map((chunk) => ({
    chunk_id: chunk.id,
    quote: shorten(chunk.text, 260),
  }));

  return {
    simplified_summary:
      modelOutput?.simplified_summary ||
      "Summary could not be generated. Please retry with a clearer PDF.",
    key_legal_points: arrayOrEmpty(modelOutput?.key_legal_points),
    important_clauses: arrayOrEmpty(modelOutput?.important_clauses).map(
      (item) => ({
        title: String(item?.title || "Clause"),
        explanation: String(item?.explanation || ""),
        citation: String(item?.citation || ""),
      }),
    ),
    obligations_and_rights: {
      obligations: arrayOrEmpty(
        modelOutput?.obligations_and_rights?.obligations,
      ),
      rights: arrayOrEmpty(modelOutput?.obligations_and_rights?.rights),
    },
    possible_risks_or_warnings: arrayOrEmpty(
      modelOutput?.possible_risks_or_warnings,
    ),
    legal_procedure: {
      overview: String(modelOutput?.legal_procedure?.overview || ""),
      stages: arrayOrEmpty(modelOutput?.legal_procedure?.stages),
    },
    next_actions: arrayOrEmpty(modelOutput?.next_actions),
    citations:
      arrayOrEmpty(modelOutput?.citations).length > 0
        ? arrayOrEmpty(modelOutput?.citations).map((citation) => ({
            chunk_id: String(citation?.chunk_id || ""),
            quote: String(citation?.quote || ""),
          }))
        : fallbackCitations,
  };
}
