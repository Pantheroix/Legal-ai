import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SERVER_ROOT = path.resolve(__dirname, "../..");

export const PORT = Number(process.env.PORT || 8787);
export const OLLAMA_BASE_URL =
  process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";
export const OLLAMA_CHAT_MODEL =
  process.env.OLLAMA_CHAT_MODEL || "leagal-qa-model";
export const OLLAMA_EMBED_MODEL =
  process.env.OLLAMA_EMBED_MODEL || "nomic-embed-text";

export const STORAGE_DIR = path.join(SERVER_ROOT, "storage");
export const UPLOAD_DIR = path.join(STORAGE_DIR, "uploads");
export const VECTOR_DB_DIR = path.join(STORAGE_DIR, "vector-db");

export const CHUNK_SIZE = Number(process.env.RAG_CHUNK_SIZE || 1400);
export const CHUNK_OVERLAP = Number(process.env.RAG_CHUNK_OVERLAP || 220);
export const TOP_K = Number(process.env.RAG_TOP_K || 8);
export const MAX_CHUNKS = Number(process.env.RAG_MAX_CHUNKS || 220);

export const LEGAL_OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    simplified_summary: { type: "string" },
    key_legal_points: { type: "array", items: { type: "string" } },
    important_clauses: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          explanation: { type: "string" },
          citation: { type: "string" },
        },
        required: ["title", "explanation", "citation"],
      },
    },
    obligations_and_rights: {
      type: "object",
      properties: {
        obligations: { type: "array", items: { type: "string" } },
        rights: { type: "array", items: { type: "string" } },
      },
      required: ["obligations", "rights"],
    },
    possible_risks_or_warnings: { type: "array", items: { type: "string" } },
    legal_procedure: {
      type: "object",
      properties: {
        overview: { type: "string" },
        stages: { type: "array", items: { type: "string" } },
      },
      required: ["overview", "stages"],
    },
    next_actions: { type: "array", items: { type: "string" } },
    citations: {
      type: "array",
      items: {
        type: "object",
        properties: {
          chunk_id: { type: "string" },
          quote: { type: "string" },
        },
        required: ["chunk_id", "quote"],
      },
    },
  },
  required: [
    "simplified_summary",
    "key_legal_points",
    "important_clauses",
    "obligations_and_rights",
    "possible_risks_or_warnings",
    "legal_procedure",
    "next_actions",
    "citations",
  ],
};
