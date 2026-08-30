import { Schema, model, type InferSchemaType } from "mongoose";

const documentSchema = new Schema(
  {
    fileName: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    fileType: {
      type: String,
      enum: ["pdf", "docx", "md", "txt"],
      required: true,
    },
    sizeBytes: { type: Number, required: true },

    cloudinaryUrl: { type: String, required: true },
    cloudinaryPublicId: { type: String, required: true },

    status: {
      type: String,
      enum: ["processing", "completed", "failed"],
      default: "processing",
    },
    failureReason: { type: String },

    chunkCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export type DocumentRecord = InferSchemaType<typeof documentSchema>;

export const DocumentModel = model("Document", documentSchema);
