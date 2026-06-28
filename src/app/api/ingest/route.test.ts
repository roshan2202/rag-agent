// @vitest-environment node

import { describe, expect, it } from "vitest";
import { POST } from "./route";

describe("/api/ingest", () => {
  it("rejects requests without files", async () => {
    const formData = new FormData();
    const response = await POST(new Request("http://localhost/api/ingest", { method: "POST", body: formData }));
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toContain("Upload at least one file");
  });

  it("parses text uploads into source documents", async () => {
    const formData = new FormData();
    formData.append("files", new File(["The refund window is 30 days."], "policy.txt", { type: "text/plain" }));

    const response = await POST(new Request("http://localhost/api/ingest", { method: "POST", body: formData }));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.documents[0]).toMatchObject({
      name: "policy.txt",
      type: "txt",
      text: "The refund window is 30 days.",
    });
  });
});
