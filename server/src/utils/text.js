export function sanitizeText(text) {
  return String(text || "")
    .replace(/\u0000/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function splitIntoChunks(text, chunkSize, overlap) {
  const normalized = sanitizeText(text);
  if (!normalized) return [];

  const chunks = [];
  let start = 0;

  while (start < normalized.length) {
    let end = Math.min(start + chunkSize, normalized.length);

    if (end < normalized.length) {
      const sentenceBoundary = normalized.lastIndexOf(".", end);
      if (sentenceBoundary > start + Math.floor(chunkSize * 0.55)) {
        end = sentenceBoundary + 1;
      }
    }

    const chunkText = normalized.slice(start, end).trim();
    if (chunkText) {
      chunks.push({
        id: `chunk-${chunks.length + 1}`,
        text: chunkText,
        start,
        end,
      });
    }

    if (end >= normalized.length) break;
    start = Math.max(0, end - overlap);
  }

  return chunks;
}

export function arrayOrEmpty(value) {
  return Array.isArray(value) ? value : [];
}

export function shorten(text, maxLen) {
  const value = String(text || "").trim();
  if (value.length <= maxLen) return value;
  return `${value.slice(0, maxLen - 3)}...`;
}

export function parseModelJson(rawText) {
  if (!rawText) return {};

  try {
    return JSON.parse(rawText);
  } catch (_error) {
    const fenceMatch = rawText.match(/```json\s*([\s\S]*?)\s*```/i);
    if (fenceMatch?.[1]) {
      try {
        return JSON.parse(fenceMatch[1]);
      } catch (_error2) {
        return {};
      }
    }

    const firstBrace = rawText.indexOf("{");
    const lastBrace = rawText.lastIndexOf("}");
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      try {
        return JSON.parse(rawText.slice(firstBrace, lastBrace + 1));
      } catch (_error3) {
        return {};
      }
    }

    return {};
  }
}
