import type { Chunk, SourceDocument } from "./types";

const DEFAULT_CHUNK_SIZE = 900;
const DEFAULT_OVERLAP = 160;

export function normalizeText(input: string) {
  return input.replace(/\r/g, "\n").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

export function chunkDocument(
  document: SourceDocument,
  chunkSize = DEFAULT_CHUNK_SIZE,
  overlap = DEFAULT_OVERLAP,
): Chunk[] {
  const text = normalizeText(document.text);

  if (!text) {
    return [];
  }

  const chunks: Chunk[] = [];
  let start = 0;
  let index = 0;

  while (start < text.length) {
    const rawEnd = Math.min(start + chunkSize, text.length);
    let end = rawEnd;

    if (rawEnd < text.length) {
      const sentenceBreak = text.lastIndexOf(".", rawEnd);
      const paragraphBreak = text.lastIndexOf("\n\n", rawEnd);
      const bestBreak = Math.max(sentenceBreak, paragraphBreak);

      if (bestBreak > start + chunkSize * 0.55) {
        end = bestBreak + 1;
      }
    }

    const chunkText = normalizeText(text.slice(start, end));

    if (chunkText) {
      chunks.push({
        id: `${document.id}-${index}`,
        documentId: document.id,
        documentName: document.name,
        index,
        text: chunkText,
      });
      index += 1;
    }

    if (end >= text.length) {
      break;
    }

    start = Math.max(end - overlap, start + 1);
  }

  return chunks;
}

export function chunkDocuments(documents: SourceDocument[]) {
  return documents.flatMap((document) => chunkDocument(document));
}
