import multer, { type FileFilterCallback } from "multer";
import type { Request } from "express";

import { env } from "../config/env";

const ALLOWED_EXTENSIONS = new Set(["pdf", "docx", "md", "txt"]);

function fileFilter(_req: Request, file: Express.Multer.File, cb: FileFilterCallback) {
  const ext = file.originalname.split(".").pop()?.toLowerCase() ?? "";

  if (!ALLOWED_EXTENSIONS.has(ext)) {
    cb(new Error(`Unsupported file type ".${ext}". Allowed: PDF, DOCX, MD, TXT.`));
    return;
  }

  cb(null, true);
}

export const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_UPLOAD_SIZE_MB * 1024 * 1024 },
  fileFilter,
});
