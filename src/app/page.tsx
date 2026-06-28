"use client";

import { FormEvent, useMemo, useRef, useState } from "react";
import { FileText, Loader2, Send, UploadCloud, X } from "lucide-react";
import type { ChatMessage, SourceDocument } from "@/lib/rag/types";

type Source = {
  marker: number;
  documentName: string;
  preview: string;
  score: number;
};

type ConversationMessage = ChatMessage & {
  sources?: Source[];
};

const acceptedTypes = ".txt,.md,.markdown,.csv,.json,.pdf,.docx";

export default function Home() {
  const [documents, setDocuments] = useState<SourceDocument[]>([]);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [error, setError] = useState("");
  const [isIngesting, setIsIngesting] = useState(false);
  const [isAsking, setIsAsking] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalCharacters = useMemo(
    () => documents.reduce((total, document) => total + document.text.length, 0),
    [documents],
  );

  async function ingestFiles(files: FileList | null) {
    if (!files?.length) {
      return;
    }

    setError("");
    setIsIngesting(true);

    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append("files", file));

    try {
      const response = await fetch("/api/ingest", {
        method: "POST",
        body: formData,
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Upload failed.");
      }

      setDocuments(payload.documents);
      setMessages([]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Upload failed.");
    } finally {
      setIsIngesting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  async function askQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!question.trim() || isAsking) {
      return;
    }

    setError("");
    setIsAsking(true);

    const userMessage: ConversationMessage = { role: "user", content: question.trim() };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setQuestion("");

    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: userMessage.content,
          documents,
          messages: messages.slice(-6),
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "The model could not answer.");
      }

      setMessages([
        ...nextMessages,
        {
          role: "assistant",
          content: payload.answer,
          sources: payload.sources,
        },
      ]);
    } catch (caught) {
      setMessages(messages);
      setError(caught instanceof Error ? caught.message : "The model could not answer.");
    } finally {
      setIsAsking(false);
    }
  }

  function clearDocuments() {
    setDocuments([]);
    setMessages([]);
    setError("");
  }

  return (
    <main className="min-h-screen bg-[#f6f7f4] text-[#1f2622]">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-3 border-b border-[#d9ded5] pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#586d64]">Vercel RAG Agent</p>
            <h1 className="mt-2 text-3xl font-semibold text-[#17201b] sm:text-4xl">Ask your files</h1>
          </div>
          <div className="text-sm text-[#58635d]">TXT, MD, CSV, JSON, PDF, DOCX | OpenRouter compatible</div>
        </header>

        <section className="grid flex-1 gap-5 lg:grid-cols-[320px_1fr]">
          <aside className="flex flex-col gap-4">
            <label className="flex min-h-48 cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-[#8ba192] bg-white px-5 text-center shadow-sm transition hover:border-[#2d6f55] hover:bg-[#fbfcfa]">
              {isIngesting ? (
                <Loader2 className="h-8 w-8 animate-spin text-[#2d6f55]" aria-hidden="true" />
              ) : (
                <UploadCloud className="h-9 w-9 text-[#2d6f55]" aria-hidden="true" />
              )}
              <span className="text-base font-medium">{isIngesting ? "Reading files" : "Upload knowledge files"}</span>
              <span className="max-w-60 text-sm text-[#647169]">Choose one or more supported files under 8 MB each.</span>
              <input
                ref={fileInputRef}
                className="sr-only"
                type="file"
                multiple
                accept={acceptedTypes}
                aria-label="Upload knowledge files"
                onChange={(event) => void ingestFiles(event.target.files)}
              />
            </label>

            <div className="rounded-lg border border-[#dde3da] bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-[#edf0eb] px-4 py-3">
                <div>
                  <h2 className="text-sm font-semibold">Knowledge base</h2>
                  <p className="text-xs text-[#68736c]">
                    {documents.length} files | {totalCharacters.toLocaleString()} chars
                  </p>
                </div>
                {documents.length > 0 ? (
                  <button
                    className="inline-flex h-9 w-9 items-center justify-center rounded-md text-[#59665f] transition hover:bg-[#eef2ec]"
                    type="button"
                    onClick={clearDocuments}
                    aria-label="Clear uploaded files"
                    title="Clear uploaded files"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                ) : null}
              </div>
              <div className="max-h-72 overflow-auto p-2">
                {documents.length === 0 ? (
                  <p className="px-2 py-6 text-sm text-[#68736c]">No files uploaded yet.</p>
                ) : (
                  documents.map((document) => (
                    <div key={document.id} className="flex gap-3 rounded-md px-2 py-3">
                      <FileText className="mt-0.5 h-5 w-5 shrink-0 text-[#2d6f55]" aria-hidden="true" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{document.name}</p>
                        <p className="text-xs uppercase text-[#6a7770]">{document.type}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </aside>

          <section className="flex min-h-[620px] flex-col rounded-lg border border-[#dde3da] bg-white shadow-sm">
            <div className="flex-1 overflow-auto px-4 py-5 sm:px-6">
              {messages.length === 0 ? (
                <div className="flex h-full items-center justify-center text-center">
                  <div className="max-w-md">
                    <h2 className="text-xl font-semibold">Upload files, then ask a question.</h2>
                    <p className="mt-2 text-sm leading-6 text-[#647169]">
                      The app retrieves the most relevant chunks from your files before sending a grounded prompt to OpenRouter.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  {messages.map((message, index) => (
                    <article
                      key={`${message.role}-${index}`}
                      className={message.role === "user" ? "ml-auto max-w-2xl" : "mr-auto max-w-3xl"}
                    >
                      <div
                        className={
                          message.role === "user"
                            ? "rounded-lg bg-[#245c48] px-4 py-3 text-white"
                            : "rounded-lg border border-[#e1e7de] bg-[#fbfcfa] px-4 py-3 text-[#1f2622]"
                        }
                      >
                        <p className="whitespace-pre-wrap text-sm leading-6">{message.content}</p>
                      </div>
                      {message.sources?.length ? (
                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                          {message.sources.map((source) => (
                            <div
                              key={`${source.marker}-${source.documentName}`}
                              className="rounded-md border border-[#e5ebe2] bg-white p-3 text-xs text-[#536059]"
                            >
                              <p className="font-semibold text-[#243129]">
                                [{source.marker}] {source.documentName}
                              </p>
                              <p className="mt-1 line-clamp-3 leading-5">{source.preview}</p>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </article>
                  ))}
                </div>
              )}
            </div>

            {error ? (
              <div className="border-t border-[#f2d5d2] bg-[#fff6f5] px-4 py-3 text-sm text-[#9b2f25] sm:px-6">{error}</div>
            ) : null}

            <form className="flex gap-3 border-t border-[#e6ebe3] p-4 sm:p-5" onSubmit={askQuestion}>
              <input
                className="min-h-11 flex-1 rounded-md border border-[#cfd8d0] bg-white px-3 text-sm outline-none transition placeholder:text-[#8a958d] focus:border-[#2d6f55] focus:ring-2 focus:ring-[#cfe3d9]"
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder={documents.length ? "Ask about your uploaded files..." : "Upload files first..."}
                disabled={!documents.length || isAsking}
              />
              <button
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-[#245c48] text-white transition hover:bg-[#1f4f3f] disabled:cursor-not-allowed disabled:bg-[#aeb8b1]"
                type="submit"
                disabled={!documents.length || !question.trim() || isAsking}
                aria-label="Send question"
                title="Send question"
              >
                {isAsking ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Send className="h-4 w-4" aria-hidden="true" />}
              </button>
            </form>
          </section>
        </section>
      </div>
    </main>
  );
}
