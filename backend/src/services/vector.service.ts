import { QdrantClient } from "@qdrant/js-client-rest";

import { env } from "../config/env";
import { logger } from "../utils/logger";

const qdrant = new QdrantClient({ url: env.QDRANT_URL, apiKey: env.QDRANT_API_KEY });

const COLLECTION = env.QDRANT_COLLECTION;
/** text-embedding-004 outputs 768-dimensional vectors. */
const VECTOR_SIZE = 768;

export interface ChunkPayload {
  documentId: string;
  documentName: string;
  fileType: string;
  chunkIndex: number;
  pageNumber?: number;
  text: string;
  startChar: number;
  endChar: number;
  uploadedAt: string;
}

export interface ChunkPoint {
  id: string;
  vector: number[];
  payload: ChunkPayload;
}

export interface SimilarChunk {
  id: string;
  score: number;
  payload: ChunkPayload;
}

let collectionReady = false;

export async function ensureCollection(): Promise<void> {
  if (collectionReady) return;

  const { collections } = await qdrant.getCollections();
  const exists = collections.some((c) => c.name === COLLECTION);

  if (!exists) {
    await qdrant.createCollection(COLLECTION, {
      vectors: { size: VECTOR_SIZE, distance: "Cosine" },
    });
    logger.info("Created Qdrant collection", { collection: COLLECTION });
  }

  collectionReady = true;
}

export async function upsertChunks(points: ChunkPoint[]): Promise<void> {
  if (points.length === 0) return;
  await ensureCollection();

  await qdrant.upsert(COLLECTION, {
    points: points.map((p) => ({ id: p.id, vector: p.vector, payload: p.payload })),
  });
}

export async function searchSimilarChunks(
  vector: number[],
  limit = 5,
  filter?: Record<string, unknown>
): Promise<SimilarChunk[]> {
  await ensureCollection();

  const results = await qdrant.search(COLLECTION, {
    vector,
    limit,
    filter,
    with_payload: true,
  });

  return results.map((r) => ({
    id: String(r.id),
    score: r.score,
    payload: r.payload as unknown as ChunkPayload,
  }));
}

export async function deleteChunksByDocumentId(documentId: string): Promise<void> {
  await ensureCollection();

  await qdrant.delete(COLLECTION, {
    filter: { must: [{ key: "documentId", match: { value: documentId } }] },
  });
}
