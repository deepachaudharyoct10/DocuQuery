import { Schema, model, type InferSchemaType } from "mongoose";

const statementSchema = new Schema(
  {
    documentId: { type: String, required: true },
    documentName: { type: String, required: true },
    chunkIndex: { type: Number, required: true },
    pageNumber: { type: Number },
    text: { type: String, required: true },
  },
  { _id: false }
);

const contradictionSchema = new Schema(
  {
    statementA: { type: statementSchema, required: true },
    statementB: { type: statementSchema, required: true },

    type: {
      type: String,
      enum: ["factual", "logical", "temporal", "numerical", "other"],
      required: true,
    },
    severity: {
      type: String,
      enum: ["critical", "warning", "info"],
      default: "warning",
    },
    explanation: { type: String, required: true },

    status: {
      type: String,
      enum: ["open", "resolved", "false_positive"],
      default: "open",
    },

    /** The user question that triggered this contradiction check, if any. */
    triggeredByQuestion: { type: String },
  },
  { timestamps: true }
);

export type ContradictionRecord = InferSchemaType<typeof contradictionSchema>;

export const ContradictionModel = model("Contradiction", contradictionSchema);
