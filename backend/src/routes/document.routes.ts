import { Router } from "express";

import { deleteDocument, listDocuments, uploadDocument } from "../controllers/document.controller";
import { uploadMiddleware } from "../middleware/upload.middleware";

export const documentRoutes = Router();

documentRoutes.post("/upload", uploadMiddleware.single("file"), uploadDocument);
documentRoutes.get("/", listDocuments);
documentRoutes.delete("/:id", deleteDocument);
