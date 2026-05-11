import crypto from "node:crypto";
import path from "node:path";

import multer from "multer";

import { UPLOAD_DIR } from "../config/index.js";

export const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
    filename: (_req, file, cb) => {
      const id = crypto.randomUUID();
      const extension = path.extname(file.originalname || ".pdf") || ".pdf";
      cb(null, `${id}${extension}`);
    },
  }),
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const isPdfByMime = file.mimetype?.includes("pdf");
    const isPdfByExt =
      path.extname(file.originalname || "").toLowerCase() === ".pdf";
    if (isPdfByMime || isPdfByExt) {
      cb(null, true);
      return;
    }
    cb(new Error("Only PDF files are allowed."));
  },
});
