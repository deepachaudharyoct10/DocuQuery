export interface TextChunk {
  index: number;
  text: string;
  startChar: number;
  endChar: number;
}

export interface ChunkingOptions {
  /** Target chunk size in characters (~4 chars/token, so 3000 ≈ 750 tokens). */
  chunkSize?: number;
  /** Overlap in characters carried from the end of one chunk into the next. */
  overlap?: number;
}

const DEFAULT_CHUNK_SIZE = 3000;
const DEFAULT_OVERLAP = 300;

/**
 * Snap a proposed cut point to the nearest preceding whitespace/newline so
 * chunks don't split mid-word.
 */
function snapToWordBoundary(text: string, proposedEnd: number): number {
  if (proposedEnd >= text.length) return text.length;

  const windowStart = Math.max(0, proposedEnd - 100);
  const slice = text.slice(windowStart, proposedEnd + 1);
  const lastBreak = Math.max(slice.lastIndexOf("\n"), slice.lastIndexOf(" "));

  if (lastBreak === -1) return proposedEnd;
  return windowStart + lastBreak;
}

export function chunkText(text: string, options: ChunkingOptions = {}): TextChunk[] {
  const chunkSize = options.chunkSize ?? DEFAULT_CHUNK_SIZE;
  const overlap = options.overlap ?? DEFAULT_OVERLAP;

  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];

  const chunks: TextChunk[] = [];
  let start = 0;
  let index = 0;

  while (start < normalized.length) {
    const proposedEnd = Math.min(start + chunkSize, normalized.length);
    const end = snapToWordBoundary(normalized, proposedEnd);
    const safeEnd = end > start ? end : proposedEnd;

    const chunkText = normalized.slice(start, safeEnd).trim();
    if (chunkText.length > 0) {
      chunks.push({ index, text: chunkText, startChar: start, endChar: safeEnd });
      index += 1;
    }

    if (safeEnd >= normalized.length) break;
    start = Math.max(safeEnd - overlap, start + 1);
  }

  return chunks;
}
