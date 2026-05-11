import { Router } from "express";

import {
  OLLAMA_BASE_URL,
  OLLAMA_CHAT_MODEL,
  OLLAMA_EMBED_MODEL,
} from "../config/index.js";

const healthRouter = Router();

healthRouter.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "legal-rag-server",
    ollama: OLLAMA_BASE_URL,
    chatModel: OLLAMA_CHAT_MODEL,
    embeddingModel: OLLAMA_EMBED_MODEL,
  });
});

export default healthRouter;
