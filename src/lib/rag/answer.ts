import OpenAI from "openai";
import { retrieveRelevantChunks } from "./retrieve";
import type { ChatMessage, SourceDocument } from "./types";

const DEFAULT_MODEL = "openai/gpt-4o-mini";

export function buildContextPrompt(documents: SourceDocument[], question: string) {
  const chunks = retrieveRelevantChunks(documents, question);
  const context = chunks
    .map(
      (chunk, index) =>
        `[${index + 1}] ${chunk.documentName}, chunk ${chunk.index + 1}\n${chunk.text}`,
    )
    .join("\n\n");

  return {
    chunks,
    system:
      "You are a concise RAG assistant. Answer from the provided context when it is relevant. If the context does not contain the answer, say that clearly and offer the closest useful next step. Cite sources as [1], [2], etc.",
    user: `Question:\n${question}\n\nRetrieved context:\n${context || "No matching context was found."}`,
  };
}

export async function answerWithOpenRouter({
  documents,
  question,
  messages = [],
}: {
  documents: SourceDocument[];
  question: string;
  messages?: ChatMessage[];
}) {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured.");
  }

  const prompt = buildContextPrompt(documents, question);
  const client = new OpenAI({
    apiKey,
    baseURL: "https://openrouter.ai/api/v1",
    defaultHeaders: {
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
      "X-Title": "Vercel RAG Agent",
    },
  });

  const completion = await client.chat.completions.create({
    model: process.env.OPENROUTER_MODEL ?? DEFAULT_MODEL,
    temperature: 0.2,
    messages: [
      { role: "system", content: prompt.system },
      ...messages.slice(-6).map((message) => ({
        role: message.role,
        content: message.content,
      })),
      { role: "user", content: prompt.user },
    ],
  });

  return {
    answer: completion.choices[0]?.message.content ?? "I could not generate an answer.",
    sources: prompt.chunks.map((chunk, index) => ({
      marker: index + 1,
      documentName: chunk.documentName,
      preview: chunk.text.slice(0, 220),
      score: Number(chunk.score.toFixed(2)),
    })),
  };
}
