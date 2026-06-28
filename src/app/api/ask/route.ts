import { NextResponse } from "next/server";
import { answerWithOpenRouter } from "@/lib/rag/answer";
import type { ChatMessage, SourceDocument } from "@/lib/rag/types";

export const runtime = "nodejs";

type AskBody = {
  question?: string;
  documents?: SourceDocument[];
  messages?: ChatMessage[];
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AskBody;

    if (!body.question?.trim()) {
      return NextResponse.json({ error: "Question is required." }, { status: 400 });
    }

    if (!Array.isArray(body.documents) || body.documents.length === 0) {
      return NextResponse.json({ error: "Upload documents before asking a question." }, { status: 400 });
    }

    const response = await answerWithOpenRouter({
      documents: body.documents,
      question: body.question.trim(),
      messages: body.messages ?? [],
    });

    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to answer the question.";
    const status = message.includes("OPENROUTER_API_KEY") ? 500 : 400;

    return NextResponse.json({ error: message }, { status });
  }
}
