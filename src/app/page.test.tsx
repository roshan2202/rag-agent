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
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        documents: [
          {
            id: "0-policy-txt",
            name: "policy.txt",
            type: "txt",
            text: "Refunds last 30 days.",
          },
        ],
      }),
    } as Response);

    render(<Home />);

    await userEvent.upload(
      screen.getByLabelText("Upload knowledge files", { selector: "input" }),
      new File(["Refunds last 30 days."], "policy.txt", { type: "text/plain" }),
    );

    await waitFor(() => expect(screen.getByText("policy.txt")).toBeInTheDocument());
    expect(screen.getByPlaceholderText("Ask about your uploaded files...")).toBeEnabled();
  });
});
