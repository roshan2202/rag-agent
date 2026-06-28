import { NextResponse } from "next/server";

export const runtime = "nodejs";

export function GET() {
  return NextResponse.json({
    ok: true,
    model: process.env.OPENROUTER_MODEL ?? "openai/gpt-4o-mini",
  });
}
