import { describe, expect, it, beforeEach } from "vitest";
import { vi } from "vitest";

vi.mock("server-only", () => ({}));

describe("loadKnowledgeStudioPage", () => {
  beforeEach(() => {
    process.env.HOM_DATA_MODE = "mock";
  });

  it(
    "returns permission_denied when the user cannot manage",
    async () => {
      const { loadKnowledgeStudioPage } = await import(
        "@/features/knowledge-studio/knowledge-studio-page-loader"
      );
      expect((await loadKnowledgeStudioPage(false)).status).toBe(
        "permission_denied",
      );
    },
    20_000,
  );

  it(
    "returns ready with mock sources",
    async () => {
      const { loadKnowledgeStudioPage } = await import(
        "@/features/knowledge-studio/knowledge-studio-page-loader"
      );
      const state = await loadKnowledgeStudioPage(true);
      expect(state.status === "ready" && state.sources.length > 0).toBe(true);
    },
    20_000,
  );
});
