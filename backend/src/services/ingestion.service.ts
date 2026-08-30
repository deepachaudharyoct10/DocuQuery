import { randomUUID } from "crypto";

import { DocumentModel } from "../models/document.model";
import { uploadDocumentToCloudinary } from "./cloudinary.service";
import { chunkText } from "./chunking.service";
import { embedTexts } from "./embedding.service";
import { extractText, resolveFileType } from "./extraction.service";
import { upsertChunks, type ChunkPayload } from "./vector.service";
import { logger } from "../utils/logger";

interface UploadedFileInput {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
}

/**
 * Validates and uploads the file, creates a Document record with status
 * "processing", and returns it immediately so the caller can respond fast.
 * Actual extraction/chunking/embedding happens in processDocumentIngestion.
 */
export async function createDocumentFromUpload(input: UploadedFileInput) {
  const fileType = resolveFileType(input.originalName, input.mimeType);

  const { url, publicId } = await uploadDocumentToCloudinary(input.buffer, input.originalName);

  const document = await DocumentModel.create({
    fileName: publicId,
    originalName: input.originalName,
    mimeType: input.mimeType,
    fileType,
    sizeBytes: input.sizeBytes,
    cloudinaryUrl: url,
    cloudinaryPublicId: publicId,
    status: "processing",
  });

  return document;
}

/**
 * Runs the heavy pipeline (extract -> chunk -> embed -> upsert) in the
 * background and updates the document's status when done. Never throws —
 * failures are recorded on the document itself.
 */
export async function processDocumentIngestion(
  documentId: string,
  buffer: Buffer,
  fileType: "pdf" | "docx" | "md" | "txt",
  originalName: string
): Promise<void> {
  try {
    const { text } = await extractText(buffer, fileType);

    if (!text.trim()) {
      throw new Error("No extractable text found in document");
    }

    const chunks = chunkText(text);
    const vectors = await embedTexts(chunks.map((c) => c.text));

    const uploadedAt = new Date().toISOString();

    const points = chunks.map((chunk, i) => ({
      id: randomUUID(),
      vector: vectors[i],
      payload: {
        documentId,
        documentName: originalName,
        fileType,
        chunkIndex: chunk.index,
        text: chunk.text,
        startChar: chunk.startChar,
        endChar: chunk.endChar,
        uploadedAt,
      } satisfies ChunkPayload,
    }));

    await upsertChunks(points);

    await DocumentModel.findByIdAndUpdate(documentId, {
      status: "completed",
      chunkCount: chunks.length,
    });

    logger.info("Document ingestion completed", { documentId, chunkCount: chunks.length });
  } catch (err) {
    const reason = err instanceof Error ? err.message : "Unknown ingestion error";
    logger.error("Document ingestion failed", { documentId, reason });

    await DocumentModel.findByIdAndUpdate(documentId, {
      status: "failed",
      failureReason: reason,
    });
  }
}
