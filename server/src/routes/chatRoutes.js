import { Router } from "express";

import { generateChatReply, streamChatReply } from "../services/chatService.js";

const chatRouter = Router();

chatRouter.post("/chat", async (req, res) => {
  try {
    const chatHistory = Array.isArray(req.body?.messages)
      ? req.body.messages
      : [];
    const prompt = String(req.body?.prompt || "").trim();
    const effectiveHistory =
      chatHistory.length > 0
        ? chatHistory
        : prompt
          ? [{ role: "user", content: prompt }]
          : [];

    if (effectiveHistory.length === 0) {
      res.status(400).json({ error: "A chat message is required." });
      return;
    }

    const wantsStream =
      String(req.headers.accept || "").includes("text/event-stream") ||
      String(req.query?.stream || "").toLowerCase() === "true";

    if (wantsStream) {
      res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.flushHeaders();

      try {
        await streamChatReply(effectiveHistory, (chunk) => {
          res.write(chunk);
        });
        res.end();
      } catch (error) {
        res.status(500);
        res.write(error.message || "Failed to stream chat response.");
        res.end();
      }

      return;
    }

    const reply = await generateChatReply(effectiveHistory);
    res.json({ reply });
  } catch (error) {
    res.status(500).json({
      error: error.message || "Failed to generate chat response.",
    });
  }
});

export default chatRouter;
