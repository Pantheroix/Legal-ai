import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import pdfParse from "@cedrugs/pdf-parse";
import { Router } from "express";

import { CHUNK_OVERLAP, CHUNK_SIZE, MAX_CHUNKS } from "../config/index.js";
import { upload } from "../middleware/upload.js";
import { embedTexts } from "../services/embeddingService.js";
import {
  loadVectorRecord,
  saveVectorRecord,
} from "../services/storageService.js";
import {
  answerQuestionWithRag,
  generateLegalAnalysis,
  streamLegalAnalysis,
} from "../services/ragService.js";
import { sanitizeText, splitIntoChunks } from "../utils/text.js";

const documentRouter = Router();

documentRouter.post(
  "/docs/upload",
  upload.single("document"),
  async (req, res) => {
    try {
      if (!req.file) {
        res
          .status(400)
          .json({ error: "PDF file is required under field name 'document'." });
        return;
      }

      const fileBuffer = req.file.buffer ?? (await fs.readFile(req.file.path));
      const parsed = await pdfParse(fileBuffer);
      const extractedText = sanitizeText(parsed.text || "");

      if (!extractedText) {
        res.status(400).json({
          error:
            "Could not extract text from this PDF. Please upload a text-based legal PDF.",
        });
        return;
      }

      const documentId = crypto.randomUUID();
      const docChunks = splitIntoChunks(
        extractedText,
        CHUNK_SIZE,
        CHUNK_OVERLAP,
      ).slice(0, MAX_CHUNKS);

      if (docChunks.length === 0) {
        res
          .status(400)
          .json({ error: "Unable to create chunks from document text." });
        return;
      }

      const embeddings = await embedTexts(docChunks.map((chunk) => chunk.text));
      const vectorRecord = {
        documentId,
        fileName: req.file.originalname,
        filePath: req.file.path || "",
        textLength: extractedText.length,
        createdAt: new Date().toISOString(),
        chunkConfig: {
          chunkSize: CHUNK_SIZE,
          chunkOverlap: CHUNK_OVERLAP,
        },
        chunks: docChunks.map((chunk, index) => ({
          ...chunk,
          embedding: embeddings[index],
        })),
      };

      await saveVectorRecord(documentId, vectorRecord);
      const clientVectorRecord = { ...vectorRecord };
      delete clientVectorRecord.filePath;

      const wantsStream =
        String(req.query?.stream || "").toLowerCase() === "true" ||
        String(req.headers.accept || "").includes("text/event-stream");

      if (wantsStream) {
        res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        res.flushHeaders?.();

        const analysis = await streamLegalAnalysis(vectorRecord, (chunk) => {
          sendSse(res, "delta", chunk);
        });

        sendSse(
          res,
          "done",
          JSON.stringify({
            documentId,
            fileName: req.file.originalname,
            pageCount: parsed.numpages || null,
            stats: {
              characters: extractedText.length,
              chunks: vectorRecord.chunks.length,
            },
            analysis,
            vectorRecord: clientVectorRecord,
          }),
        );
        res.end();
        return;
      }

      const analysis = await generateLegalAnalysis(vectorRecord);
      res.status(201).json({
        documentId,
        fileName: req.file.originalname,
        pageCount: parsed.numpages || null,
        stats: {
          characters: extractedText.length,
          chunks: vectorRecord.chunks.length,
        },
        analysis,
        vectorRecord: clientVectorRecord,
      });
    } catch (error) {
      res.status(500).json({
        error: error.message || "Failed to process the uploaded PDF.",
      });
    }
  },
);

documentRouter.post("/docs/:documentId/query", async (req, res) => {
  try {
    const { documentId } = req.params;
    const question = String(req.body?.question || "").trim();

    if (!question) {
      res.status(400).json({ error: "Question is required." });
      return;
    }

    const vectorRecord =
      req.body?.vectorRecord || (await loadVectorRecord(documentId));
    if (!vectorRecord) {
      res
        .status(404)
        .json({ error: "Document not found. Upload a PDF first." });
      return;
    }

    const answer = await answerQuestionWithRag(vectorRecord, question);
    res.json(answer);
  } catch (error) {
    res.status(500).json({
      error:
        error.message || "Failed to answer the question for this document.",
    });
  }
});

function sendSse(res, event, data) {
  const payload = String(data)
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => `data: ${line}`)
    .join("\n");

  res.write(`${event ? `event: ${event}\n` : ""}${payload}\n\n`);
}

export default documentRouter;
