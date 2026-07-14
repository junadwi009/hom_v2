import { describe, expect, it, beforeEach, vi } from "vitest";

vi.mock("server-only", () => ({}));

describe("submitKnowledgeQuery", () => {
  beforeEach(() => {
    process.env.HOM_DATA_MODE = "mock";
    process.env.HOM_AUTH_MODE = "mock";
  });

  it(
    "refuses in mock mode before touching any client or network",
    async () => {
      const { submitKnowledgeQuery } = await import(
        "@/lib/knowledge/server/submit-knowledge-query"
      );
      const fd = new FormData();
      fd.set("question", "Berapa harga private?");
      fd.set("scope", "public_chatbot");

      const state = await submitKnowledgeQuery(fd);

      expect(state.status).toBe("configuration_error");
    },
    // The orchestrator transitively imports heavy libs (xlsx, unpdf, openai,
    // supabase-js) on first import; under full-suite parallel test load that
    // first import can exceed vitest's 5s default, so give this one more room.
    20_000,
  );
});
