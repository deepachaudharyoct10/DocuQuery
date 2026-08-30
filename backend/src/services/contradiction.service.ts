import { GoogleGenerativeAI } from "@google/generative-ai";

import { env } from "../config/env";
import { ContradictionModel, type ContradictionRecord } from "../models/contradiction.model";
import { logger } from "../utils/logger";
import type { SimilarChunk } from "./vector.service";

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
const judgeModel = genAI.getGenerativeModel({
  model: env.GEMINI_CHAT_MODEL,
  generationConfig: { responseMimeType: "application/json" },
});

const JUDGE_INSTRUCTIONS = `You compare two text passages from different documents on a similar topic and decide
whether they genuinely CONTRADICT each other (direct opposites, conflicting numbers, incompatible rules/dates).

Important: a difference is NOT automatically a contradiction. If passage B reads like a newer revision,
update, or version of passage A (e.g. it mentions a later effective date, "updated", "revised", "as of <newer date>"),
treat it as a superseding update, NOT a contradiction.

Classify contradictions into one of: "factual", "logical", "temporal", "numerical", "other".
Assign severity: "critical" (directly conflicting facts a user would act on), "warning" (meaningful but less critical), "info" (minor/ambiguous).

Respond with strict JSON:
{"isContradiction": boolean, "type": string, "severity": string, "explanation": string}
"explanation" should be one concise sentence citing what conflicts.`;

interface ChunkPair {
  a: SimilarChunk;
  b: SimilarChunk;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Pairs chunks that come from different source documents (same-document differences aren't contradictions). */
function buildCrossDocumentPairs(chunks: SimilarChunk[]): ChunkPair[] {
  const pairs: ChunkPair[] = [];
  for (let i = 0; i < chunks.length; i++) {
    for (let j = i + 1; j < chunks.length; j++) {
      if (chunks[i].payload.documentId !== chunks[j].payload.documentId) {
        pairs.push({ a: chunks[i], b: chunks[j] });
      }
    }
  }
  return pairs;
}

interface Judgment {
  isContradiction: boolean;
  type: "factual" | "logical" | "temporal" | "numerical" | "other";
  severity: "critical" | "warning" | "info";
  explanation: string;
}

async function judgePair(pair: ChunkPair): Promise<Judgment> {
  const prompt = `${JUDGE_INSTRUCTIONS}

Passage A (from "${pair.a.payload.documentName}"):
"${pair.a.payload.text}"

Passage B (from "${pair.b.payload.documentName}"):
"${pair.b.payload.text}"`;

  const result = await judgeModel.generateContent(prompt);

  try {
    return JSON.parse(result.response.text());
  } catch {
    return { isContradiction: false, type: "other", severity: "info", explanation: "Unable to parse judgment" };
  }
}

/**
 * Compares semantically related chunks retrieved for a query and persists any
 * genuine contradictions found. Returns the newly created records.
 */
export async function detectContradictions(
  chunks: SimilarChunk[],
  triggeredByQuestion?: string
): Promise<ContradictionRecord[]> {
  const pairs = buildCrossDocumentPairs(chunks);
  const created: ContradictionRecord[] = [];

  for (const pair of pairs) {
    const judgment = await judgePair(pair);
    await sleep(300); // stay under Gemini free-tier rate limits

    if (!judgment.isContradiction) continue;

    const record = await ContradictionModel.create({
      statementA: {
        documentId: pair.a.payload.documentId,
        documentName: pair.a.payload.documentName,
        chunkIndex: pair.a.payload.chunkIndex,
        pageNumber: pair.a.payload.pageNumber,
        text: pair.a.payload.text,
      },
      statementB: {
        documentId: pair.b.payload.documentId,
        documentName: pair.b.payload.documentName,
        chunkIndex: pair.b.payload.chunkIndex,
        pageNumber: pair.b.payload.pageNumber,
        text: pair.b.payload.text,
      },
      type: judgment.type,
      severity: judgment.severity,
      explanation: judgment.explanation,
      triggeredByQuestion,
    });

    created.push(record);
  }

  logger.info("Contradiction detection complete", { pairsChecked: pairs.length, found: created.length });
  return created;
}
