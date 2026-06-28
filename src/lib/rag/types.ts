export type SourceDocument = {
  id: string;
  name: string;
  type: string;
  text: string;
};

export type Chunk = {
  id: string;
  documentId: string;
  documentName: string;
  index: number;
  text: string;
};

export type RetrievedChunk = Chunk & {
  score: number;
};

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};
