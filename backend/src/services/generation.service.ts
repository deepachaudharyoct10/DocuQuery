import { GoogleGenerativeAI } from "@google/generative-ai";

import { env } from "../config/env";
import type { SimilarChunk } from "./vector.service";

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
const chatModel = genAI.getGenerativeModel({
  model: env.GEMINI_CHAT_MODEL,
  generationConfig: { responseMimeType: "application/json" },
});

export interface ChatHistoryItem {
  role: "user" | "assistant";
  content: string;
}

export interface Citation {
  documentId: string;
  documentName: string;
  chunkIndex: number;
  pageNumber?: number;
  snippet: string;
}

export interface GeneratedAnswer {
  answer: string;
  citations: Citation[];
}

function buildContextBlock(chunks: SimilarChunk[]): string {
  return chunks
    .map(
      (chunk, i) =>
        `[${i + 1}] Source: ${chunk.payload.documentName} (chunk ${chunk.payload.chunkIndex})\n${chunk.payload.text}`
    )
    .join("\n\n");
}

function buildHistoryBlock(history: ChatHistoryItem[]): string {
  if (history.length === 0) return "";
  return (
    "Conversation so far:\n" +
    history.map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`).join("\n") +
    "\n\n"
  );
}

const SYSTEM_INSTRUCTIONS = `You are a document Q&A assistant. Answer ONLY using the numbered sources provided below.
- If the answer isn't in the sources, say so explicitly instead of guessing.
- Do not use outside knowledge.
- Respond with strict JSON: {"answer": string, "sourceIndices": number[]}
  where "sourceIndices" lists the [n] source numbers you actually relied on.`;

export async function generateAnswer(
  question: string,
  chunks: SimilarChunk[],
  history: ChatHistoryItem[] = []
): Promise<GeneratedAnswer> {
  if (chunks.length === 0) {
    return {
      answer: "I couldn't find any relevant information in the uploaded documents to answer this question.",
      citations: [],
    };
  }

  const prompt = `${SYSTEM_INSTRUCTIONS}

${buildHistoryBlock(history)}Sources:
${buildContextBlock(chunks)}

Question: ${question}`;

  const result = await chatModel.generateContent(prompt);
  const raw = result.response.text();

  let parsed: { answer: string; sourceIndices: number[] };
  try {
    parsed = JSON.parse(raw);
  } catch {
    // Fall back to using the raw text as the answer with all retrieved chunks cited.
    parsed = { answer: raw, sourceIndices: chunks.map((_, i) => i + 1) };
  }

  const citations: Citation[] = (parsed.sourceIndices ?? [])
    .map((idx) => chunks[idx - 1])
    .filter((chunk): chunk is SimilarChunk => Boolean(chunk))
    .map((chunk) => ({
      documentId: chunk.payload.documentId,
      documentName: chunk.payload.documentName,
      chunkIndex: chunk.payload.chunkIndex,
      pageNumber: chunk.payload.pageNumber,
      snippet: chunk.payload.text.slice(0, 240),
    }));

  return { answer: parsed.answer, citations };
}
