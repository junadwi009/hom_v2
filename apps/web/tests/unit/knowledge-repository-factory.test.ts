import { describe, expect, it, beforeEach, vi } from "vitest";

vi.mock("server-only", () => ({}));

describe("createKnowledgeRepositories", () => {
  beforeEach(() => {
    process.env.HOM_DATA_MODE = "mock";
  });

  it("returns a working mock repository", async () => {
    const { createKnowledgeRepositories } = await import(
      "@/lib/knowledge/repository-factory"
    );
    const { knowledge } = await createKnowledgeRepositories();
    const result = await knowledge.list();
    expect(result.items.length).toBeGreaterThan(0);
  });

  it("does not call the Supabase client factory in mock mode", async () => {
    const { createKnowledgeRepositories } = await import(
      "@/lib/knowledge/repository-factory"
    );
    let called = false;
    const { knowledge } = await createKnowledgeRepositories({
      createSupabaseClient: async () => {
        called = true;
        throw new Error("should not be called in mock mode");
      },
    });

    await knowledge.list();

    expect(called).toBe(false);
  });
});
