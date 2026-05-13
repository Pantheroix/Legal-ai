import { OLLAMA_BASE_URL, OLLAMA_EMBED_MODEL } from "../config/index.js";
import { fetchJson } from "../utils/http.js";

export async function embedTexts(texts) {
  if (!Array.isArray(texts) || texts.length === 0) return [];

  const batchSize = 20;
  const vectors = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const response = await fetchJson(`${OLLAMA_BASE_URL}/api/embed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_EMBED_MODEL,
        input: batch,
        truncate: true,
      }),
    });

    const embeddings = response?.embeddings;
    if (!Array.isArray(embeddings) || embeddings.length !== batch.length) {
      throw new Error(
        "Embedding generation failed. Ensure Ollama embedding model is available .",
      );
    }

    vectors.push(...embeddings);
  }

  return vectors;
}

export async function embedSingle(text) {
  const [vector] = await embedTexts([text]);
  return vector;
}
