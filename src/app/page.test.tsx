import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import Home from "./page";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Home", () => {
  it("starts with the question input disabled until documents are uploaded", () => {
    render(<Home />);

    expect(screen.getByPlaceholderText("Upload files first...")).toBeDisabled();
    expect(screen.getByText("No files uploaded yet.")).toBeInTheDocument();
  });

  it("uploads files and enables asking", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({
        documents: [
          {
            id: "0-policy-txt",
            name: "policy.txt",
            type: "txt",
            text: "Refunds last 30 days.",
          },
        ],
      }),
    );

    render(<Home />);

    await userEvent.upload(
      screen.getByLabelText("Upload knowledge files", { selector: "input" }),
      new File(["Refunds last 30 days."], "policy.txt", { type: "text/plain" }),
    );

    await waitFor(() => expect(screen.getByText("policy.txt")).toBeInTheDocument());
    expect(screen.getByPlaceholderText("Ask about your uploaded files...")).toBeEnabled();
  });

  it("shows a useful error when an API route returns HTML", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("<!DOCTYPE html><title>Server error</title>", {
        status: 500,
        headers: { "Content-Type": "text/html" },
      }),
    );

    render(<Home />);

    await userEvent.upload(
      screen.getByLabelText("Upload knowledge files", { selector: "input" }),
      new File(["Refunds last 30 days."], "policy.txt", { type: "text/plain" }),
    );

    await waitFor(() => expect(screen.getByText("Request failed with status 500. Check the deployment logs.")).toBeInTheDocument());
  });
});
