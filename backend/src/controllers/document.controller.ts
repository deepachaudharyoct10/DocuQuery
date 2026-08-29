import type { NextFunction, Request, Response } from "express";

import { AppError } from "../middleware/errorHandler";
import { DocumentModel } from "../models/document.model";
import { deleteDocumentFromCloudinary } from "../services/cloudinary.service";
import { createDocumentFromUpload, processDocumentIngestion } from "../services/ingestion.service";
import { deleteChunksByDocumentId } from "../services/vector.service";

export async function uploadDocument(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) {
      throw new AppError("No file uploaded. Attach a file under the 'file' field.", 400);
    }

    const document = await createDocumentFromUpload({
      buffer: req.file.buffer,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      sizeBytes: req.file.size,
    });

    res.status(201).json({ document });

    // Fire-and-forget: heavy pipeline runs after the response is sent.
    void processDocumentIngestion(
      document.id,
      req.file.buffer,
      document.fileType as "pdf" | "docx" | "md" | "txt",
      document.originalName
    );
  } catch (err) {
    next(err);
  }
}

export async function listDocuments(_req: Request, res: Response, next: NextFunction) {
  try {
    const documents = await DocumentModel.find().sort({ createdAt: -1 });
    res.json({ documents });
  } catch (err) {
    next(err);
  }
}

export async function deleteDocument(req: Request, res: Response, next: NextFunction) {
  try {
    const document = await DocumentModel.findById(req.params.id);
    if (!document) {
      throw new AppError("Document not found", 404);
    }

    await Promise.all([
      deleteDocumentFromCloudinary(document.cloudinaryPublicId),
      deleteChunksByDocumentId(document.id),
    ]);
    await document.deleteOne();

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
