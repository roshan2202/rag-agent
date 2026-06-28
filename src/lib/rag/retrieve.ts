import { chunkDocuments } from "./chunk";
import type { RetrievedChunk, SourceDocument } from "./types";

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "but",
  "by",
  "for",
  "from",
  "has",
  "have",
  "how",
  "in",
  "is",
  "it",
  "of",
  "on",
  "or",
  "that",
  "the",
  "this",
  "to",
  "was",
  "what",
  "when",
  "where",
  "who",
  "why",
  "with",
]);

export function tokenize(text: string) {
  return text
    .toLowerCase()
    .match(/[a-z0-9][a-z0-9-]{1,}/g)
    ?.filter((token) => !STOP_WORDS.has(token)) ?? [];
}

function termCounts(tokens: string[]) {
  const counts = new Map<string, number>();

  for (const token of tokens) {
    counts.set(token, (counts.get(token) ?? 0) + 1);
  }

  return counts;
}

export function retrieveRelevantChunks(
  documents: SourceDocument[],
  question: string,
  limit = 5,
): RetrievedChunk[] {
  const chunks = chunkDocuments(documents);
  const queryTokens = tokenize(question);

  if (chunks.length === 0 || queryTokens.length === 0) {
    return [];
  }

  const queryCounts = termCounts(queryTokens);
  const docFrequencies = new Map<string, number>();
  const chunkTermCounts = chunks.map((chunk) => {
    const counts = termCounts(tokenize(chunk.text));

    for (const term of counts.keys()) {
      docFrequencies.set(term, (docFrequencies.get(term) ?? 0) + 1);
    }

    return counts;
  });

  return chunks
    .map((chunk, index) => {
      const counts = chunkTermCounts[index];
      let score = 0;

      for (const [term, queryCount] of queryCounts) {
        const chunkCount = counts.get(term) ?? 0;
        if (chunkCount === 0) {
          continue;
        }

        const idf = Math.log((chunks.length + 1) / ((docFrequencies.get(term) ?? 0) + 1)) + 1;
        score += queryCount * chunkCount * idf;
      }

      return { ...chunk, score };
    })
    .filter((chunk) => chunk.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
