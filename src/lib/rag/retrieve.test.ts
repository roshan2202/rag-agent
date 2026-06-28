import { describe, expect, it } from "vitest";
import { chunkDocument } from "./chunk";
import { retrieveRelevantChunks } from "./retrieve";
import type { SourceDocument } from "./types";

const document: SourceDocument = {
  id: "handbook",
  name: "handbook.md",
  type: "md",
  text: "Refunds are available for annual plans within 30 days. Security reviews are handled by the platform team.",
};

describe("RAG retrieval", () => {
  it("chunks documents while preserving source metadata", () => {
    const chunks = chunkDocument(document, 45, 10);

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0]).toMatchObject({
      documentId: "handbook",
      documentName: "handbook.md",
      index: 0,
    });
  });

  it("returns the most relevant chunks for a question", () => {
    const results = retrieveRelevantChunks([document], "How long do annual plan refunds last?");

    expect(results[0].text).toContain("Refunds");
    expect(results[0].score).toBeGreaterThan(0);
  });

  it("returns no chunks when no terms match", () => {
    expect(retrieveRelevantChunks([document], "banana telescope")).toEqual([]);
  });
});
