import { afterEach, describe, expect, it, vi } from "vitest";
import { answerWithOpenRouter } from "./answer";
import type { SourceDocument } from "./types";

const openAiMock = vi.hoisted(() => ({
  configs: [] as unknown[],
  create: vi.fn(),
}));

vi.mock("openai", () => ({
  default: vi.fn().mockImplementation(function MockOpenAI(config) {
    openAiMock.configs.push(config);

    return {
      chat: {
        completions: {
          create: openAiMock.create,
        },
      },
    };
  }),
}));

const document: SourceDocument = {
  id: "policy",
  name: "policy.txt",
  type: "txt",
  text: "Refunds are available for 30 days.",
};

afterEach(() => {
  openAiMock.configs.length = 0;
  openAiMock.create.mockReset();
  vi.unstubAllEnvs();
});

describe("answerWithOpenRouter", () => {
  it("uses the configured OpenRouter key, endpoint, model, and retrieved context", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "test-key");
    vi.stubEnv("OPENROUTER_MODEL", "openai/gpt-4o-mini");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://example.com");
    openAiMock.create.mockResolvedValue({
      choices: [{ message: { content: "Refunds are available for 30 days [1]." } }],
    });

    const response = await answerWithOpenRouter({
      documents: [document],
      question: "How long are refunds available?",
    });

    expect(openAiMock.configs[0]).toMatchObject({
      apiKey: "test-key",
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer": "https://example.com",
        "X-Title": "Vercel RAG Agent",
      },
    });
    expect(openAiMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "openai/gpt-4o-mini",
        temperature: 0.2,
        messages: expect.arrayContaining([
          expect.objectContaining({
            role: "user",
            content: expect.stringContaining("Refunds are available for 30 days."),
          }),
        ]),
      }),
    );
    expect(response).toMatchObject({
      answer: "Refunds are available for 30 days [1].",
      sources: [{ marker: 1, documentName: "policy.txt" }],
    });
  });

  it("requires OPENROUTER_API_KEY", async () => {
    await expect(
      answerWithOpenRouter({
        documents: [document],
        question: "How long are refunds available?",
      }),
    ).rejects.toThrow("OPENROUTER_API_KEY");
  });
});
