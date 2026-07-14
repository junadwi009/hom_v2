import { describe, expect, it, beforeEach, vi } from "vitest";

vi.mock("server-only", () => ({}));

describe("gateway facade in mock mode", () => {
  beforeEach(() => {
    delete process.env.OPENAI_API_KEY;
  });
  it("embeds via mock when no key", async () => {
    const { embedText } = await import("@/lib/ai/gateway");
    expect(await embedText("hi")).toHaveLength(1536);
  });
  it("answers via mock when no key", async () => {
    const { answerFromContext } = await import("@/lib/ai/gateway");
    const a = await answerFromContext({ question: "q", contexts: ["ctx"] });
    expect(a).toContain("[demo]");
  });
});
