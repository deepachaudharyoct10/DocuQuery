import { GoogleGenerativeAI } from "@google/generative-ai";

import { env } from "../config/env";
import { logger } from "../utils/logger";

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
const embeddingModel = genAI.getGenerativeModel({ model: env.GEMINI_EMBEDDING_MODEL });

const MAX_RETRIES = 4;
const BASE_DELAY_MS = 1000;
/** Gemini free tier is rate-limited per minute; space out sequential calls. */
const REQUEST_SPACING_MS = 300;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRateLimitError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return message.includes("429") || message.toLowerCase().includes("rate limit");
}

async function embedWithRetry(text: string, attempt = 1): Promise<number[]> {
  try {
    const result = await embeddingModel.embedContent(text);
    return result.embedding.values;
  } catch (err) {
    if (attempt >= MAX_RETRIES || !isRateLimitError(err)) {
      throw err;
    }
    const delay = BASE_DELAY_MS * 2 ** (attempt - 1);
    logger.warn("Embedding rate-limited, retrying", { attempt, delayMs: delay });
    await sleep(delay);
    return embedWithRetry(text, attempt + 1);
  }
}

export async function embedText(text: string): Promise<number[]> {
  return embedWithRetry(text);
}

/** Embeds texts sequentially (order-preserving) with spacing to stay under free-tier rate limits. */
export async function embedTexts(texts: string[]): Promise<number[][]> {
  const vectors: number[][] = [];

  for (const text of texts) {
    const vector = await embedWithRetry(text);
    vectors.push(vector);
    await sleep(REQUEST_SPACING_MS);
  }

  return vectors;
}
