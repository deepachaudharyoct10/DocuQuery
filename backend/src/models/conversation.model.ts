import { Schema, model, type InferSchemaType } from "mongoose";

const citationSchema = new Schema(
  {
    documentId: { type: String, required: true },
    documentName: { type: String, required: true },
    chunkIndex: { type: Number, required: true },
    pageNumber: { type: Number },
    snippet: { type: String, required: true },
  },
  { _id: false }
);

const messageSchema = new Schema(
  {
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true },
    citations: { type: [citationSchema], default: [] },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const conversationSchema = new Schema(
  {
    title: { type: String, default: "New conversation" },
    messages: { type: [messageSchema], default: [] },
  },
  { timestamps: true }
);

export type ConversationRecord = InferSchemaType<typeof conversationSchema>;

export const ConversationModel = model("Conversation", conversationSchema);
