import { describe, expect, it, beforeEach, vi } from "vitest";

vi.mock("server-only", () => ({}));

describe("submitUploadKnowledgeSource", () => {
  beforeEach(() => {
    process.env.HOM_DATA_MODE = "mock";
    process.env.HOM_AUTH_MODE = "mock";
  });

  it(
    "refuses in mock mode before touching any client or network",
    async () => {
      const { submitUploadKnowledgeSource } = await import(
        "@/lib/knowledge/server/submit-upload-knowledge-source"
      );
      const fd = new FormData();
      fd.set("title", "x");
      fd.set("docType", "pricing");
      fd.set("scopes", "public_chatbot");
      fd.set("file", new File([new Uint8Array([1])], "x.png", { type: "image/png" }));

      const state = await submitUploadKnowledgeSource(fd);

      expect(state.status).toBe("configuration_error");
    },
    // The orchestrator transitively imports heavy libs (xlsx, unpdf, openai,
    // supabase-js) on first import; under full-suite parallel test load that
    // first import can exceed vitest's 5s default, so give this one more room.
    20_000,
  );
});
