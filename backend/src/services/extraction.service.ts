import mammoth from "mammoth";
import pdfParse from "pdf-parse";

import { AppError } from "../middleware/errorHandler";

export type SupportedFileType = "pdf" | "docx" | "md" | "txt";

export interface ExtractionResult {
  text: string;
  pageCount?: number;
}

const EXTENSION_TO_TYPE: Record<string, SupportedFileType> = {
  pdf: "pdf",
  docx: "docx",
  md: "md",
  txt: "txt",
};

export function resolveFileType(originalName: string, mimeType: string): SupportedFileType {
  const ext = originalName.split(".").pop()?.toLowerCase() ?? "";
  const fileType = EXTENSION_TO_TYPE[ext];

  if (!fileType) {
    throw new AppError(
      `Unsupported file type "${ext || mimeType}". Supported formats: PDF, DOCX, MD, TXT.`,
      400
    );
  }
  return fileType;
}

export async function extractText(buffer: Buffer, fileType: SupportedFileType): Promise<ExtractionResult> {
  try {
    switch (fileType) {
      case "pdf": {
        const parsed = await pdfParse(buffer);
        return { text: parsed.text, pageCount: parsed.numpages };
      }
      case "docx": {
        const parsed = await mammoth.extractRawText({ buffer });
        return { text: parsed.value };
      }
      case "md":
      case "txt": {
        return { text: buffer.toString("utf-8") };
      }
      default: {
        const exhaustiveCheck: never = fileType;
        throw new AppError(`Unhandled file type: ${exhaustiveCheck}`, 400);
      }
    }
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError(
      `Failed to extract text from ${fileType.toUpperCase()} file. It may be corrupted.`,
      400
    );
  }
}
