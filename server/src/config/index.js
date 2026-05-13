import os from "node:os";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SERVER_ROOT = path.resolve(__dirname, "../..");

function loadDotEnv() {
  const envPath = path.join(SERVER_ROOT, ".env");
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/^["']|["']$/g, "");

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadDotEnv();

export const PORT = Number(process.env.PORT || 8787);
export const OLLAMA_BASE_URL =
  process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";
export const OLLAMA_CHAT_MODEL =
  process.env.OLLAMA_CHAT_MODEL || "leagal-qa-model";
export const OLLAMA_EMBED_MODEL =
  process.env.OLLAMA_EMBED_MODEL || "nomic-embed-text";
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
export const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";

export let STORAGE_DIR = path.join(SERVER_ROOT, "storage");
export let UPLOAD_DIR = path.join(STORAGE_DIR, "uploads");
export let VECTOR_DB_DIR = path.join(STORAGE_DIR, "vector-db");

export function useTempStorage() {
  STORAGE_DIR = path.join(os.tmpdir(), "legal-ai-storage");
  UPLOAD_DIR = path.join(STORAGE_DIR, "uploads");
  VECTOR_DB_DIR = path.join(STORAGE_DIR, "vector-db");
}

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
