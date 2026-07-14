import { describe, expect, it, beforeEach, vi } from "vitest";

vi.mock("server-only", () => ({}));

describe("submitPublishKnowledgeSource", () => {
  beforeEach(() => {
    process.env.HOM_DATA_MODE = "mock";
    process.env.HOM_AUTH_MODE = "mock";
  });

  it(
    "refuses in mock mode before touching any client or network",
    async () => {
      const { submitPublishKnowledgeSource } = await import(
        "@/lib/knowledge/server/submit-publish-knowledge-source"
      );
      const fd = new FormData();
      fd.set("sourceId", "11111111-1111-4111-8111-111111111111");
      fd.set("extractedText", "Private session Rp 550.000.");

      const state = await submitPublishKnowledgeSource(fd);

      expect(state.status).toBe("configuration_error");
    },
    // The orchestrator transitively imports heavy libs (xlsx, unpdf, openai,
    // supabase-js) on first import; under full-suite parallel test load that
    // first import can exceed vitest's 5s default, so give this one more room.
    20_000,
  );
});
