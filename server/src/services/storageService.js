import fs from "node:fs/promises";
import path from "node:path";

import { UPLOAD_DIR, VECTOR_DB_DIR } from "../config/index.js";

export async function ensureStorage() {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  await fs.mkdir(VECTOR_DB_DIR, { recursive: true });
}

export async function saveVectorRecord(documentId, record) {
  const filePath = path.join(VECTOR_DB_DIR, `${documentId}.json`);
  await fs.writeFile(filePath, JSON.stringify(record), "utf8");
}

export async function loadVectorRecord(documentId) {
  try {
    const filePath = path.join(VECTOR_DB_DIR, `${documentId}.json`);
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw);
  } catch (_error) {
    return null;
  }
}
