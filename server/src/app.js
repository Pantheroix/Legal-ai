import cors from "cors";
import express from "express";
import multer from "multer";

import chatRouter from "./routes/chatRoutes.js";
import documentRouter from "./routes/documentRoutes.js";
import healthRouter from "./routes/healthRoutes.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.use("/api", healthRouter);
app.use("/api", chatRouter);
app.use("/api", documentRouter);

app.use((error, _req, res, _next) => {
  if (error instanceof multer.MulterError) {
    res.status(400).json({ error: error.message });
    return;
  }
  res.status(400).json({ error: error.message || "Request error." });
});

export default app;
