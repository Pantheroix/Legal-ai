import path from "node:path";

import multer from "multer";

export const upload = multer({
  storage: multer.memoryStorage(),
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
