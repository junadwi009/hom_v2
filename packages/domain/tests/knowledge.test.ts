import { describe, expect, it } from "vitest";

import {
  allowedKnowledgeScopes,
  businessAgentQueryInputSchema,
  chunkText,
  createKnowledgeSourceInputSchema,
  createMockKnowledgeRepository,
  evaluateKnowledgeAnswer,
  knowledgeQueryInputSchema,
  knowledgeScopeSchema,
  knowledgeSourceListQuerySchema,
  knowledgeSourceSchema,
} from "../src/knowledge";

const baseSource = {
  id: "11111111-1111-4111-8111-111111111111",
  title: "Pricing 2026",
  docType: "pricing",
  scopes: ["public_chatbot"],
  status: "uploaded",
  version: 1,
  confidence: null,
  extractedText: null,
  createdAt: "2026-07-13T00:00:00.000Z",
  updatedAt: "2026-07-13T00:00:00.000Z",
} as const;

describe("knowledgeScopeSchema", () => {
  it("accepts a known scope", () => {
    expect(() => knowledgeScopeSchema.parse("public_chatbot")).not.toThrow();
  });
  it("rejects an unknown scope", () => {
    expect(() => knowledgeScopeSchema.parse("nope")).toThrow();
  });
});

describe("knowledgeSourceSchema", () => {
  it("accepts a valid source", () => {
    expect(() => knowledgeSourceSchema.parse(baseSource)).not.toThrow();
  });
  it("rejects unknown keys", () => {
    expect(() => knowledgeSourceSchema.parse({ ...baseSource, extra: 1 })).toThrow();
  });
});

describe("createKnowledgeSourceInputSchema", () => {
  it("requires at least one scope", () => {
    expect(() =>
      createKnowledgeSourceInputSchema.parse({ title: "x", docType: "pricing", scopes: [] }),
    ).toThrow();
  });
});

describe("knowledgeQueryInputSchema", () => {
  it("accepts a question with a scope", () => {
    expect(() =>
      knowledgeQueryInputSchema.parse({ question: "Berapa harga private?", scope: "public_chatbot" }),
    ).not.toThrow();
  });
});

describe("knowledgeSourceListQuerySchema", () => {
  it("accepts a valid query", () => {
    expect(() =>
      knowledgeSourceListQuerySchema.parse({ search: "pricing", page: 1, pageSize: 20 }),
    ).not.toThrow();
  });
  it("rejects an out-of-bounds pageSize", () => {
    expect(() =>
      knowledgeSourceListQuerySchema.parse({ page: 1, pageSize: 101 }),
    ).toThrow();
  });
});

describe("createMockKnowledgeRepository", () => {
  it("exposes only list and getById", () => {
    const repo = createMockKnowledgeRepository();
    expect(Object.keys(repo).sort()).toEqual(["getById", "list"]);
  });
  it("returns seeded sources and finds by id", async () => {
    const repo = createMockKnowledgeRepository();
    const result = await repo.list();
    expect(result.items.length).toBeGreaterThan(0);
    const first = result.items[0];
    expect(await repo.getById(first.id)).not.toBeNull();
    expect(await repo.getById("00000000-0000-4000-8000-000000000000")).toBeNull();
  });
});

describe("chunkText", () => {
  it("returns one chunk for short text", () => {
    expect(chunkText("hello world")).toEqual(["hello world"]);
  });
  it("splits long text into overlapping chunks", () => {
    const text = "a".repeat(2500);
    const chunks = chunkText(text, { maxChars: 1000, overlap: 100 });
    expect(chunks.length).toBeGreaterThan(2);
    expect(chunks.every((c) => c.length <= 1000)).toBe(true);
  });
  it("ignores empty input", () => {
    expect(chunkText("   ")).toEqual([]);
  });
});

describe("evaluateKnowledgeAnswer", () => {
  it("passes a grounded neutral answer", () => {
    const r = evaluateKnowledgeAnswer({ answer: "Harga private session Rp 550.000.", hasSources: true });
    expect(r.policyFlags).toEqual([]);
    expect(r.answer).toContain("550.000");
  });
  it("flags a refund promise", () => {
    const r = evaluateKnowledgeAnswer({ answer: "Kami pasti akan refund penuh.", hasSources: true });
    expect(r.policyFlags).toContain("refund_promise");
  });
  it("returns a safe fallback when there are no sources", () => {
    const r = evaluateKnowledgeAnswer({ answer: "anything", hasSources: false });
    expect(r.policyFlags).toContain("no_sources");
    expect(r.answer.toLowerCase()).toContain("belum ada");
  });
});

describe("allowedKnowledgeScopes", () => {
  it("always includes the 3 base scopes", () => {
    const s = allowedKnowledgeScopes([]);
    expect(s).toEqual(expect.arrayContaining(["public_chatbot", "internal_admin", "marketing"]));
    expect(s).not.toContain("finance");
    expect(s).not.toContain("clinical_safety");
    expect(s).not.toContain("owner_only");
  });
  it("adds finance only with can_view_financials", () => {
    expect(allowedKnowledgeScopes(["can_view_financials"])).toContain("finance");
  });
  it("adds clinical_safety only with can_view_clinical_cases", () => {
    expect(allowedKnowledgeScopes(["can_view_clinical_cases"])).toContain("clinical_safety");
  });
  it("adds owner_only only with can_publish_knowledge", () => {
    expect(allowedKnowledgeScopes(["can_publish_knowledge"])).toContain("owner_only");
  });
});

describe("businessAgentQueryInputSchema", () => {
  it("accepts a valid question", () => {
    expect(() => businessAgentQueryInputSchema.parse({ question: "Berapa harga?" })).not.toThrow();
  });
  it("rejects a too-short question", () => {
    expect(() => businessAgentQueryInputSchema.parse({ question: "hi" })).toThrow();
  });
  it("rejects unknown keys", () => {
    expect(() => businessAgentQueryInputSchema.parse({ question: "valid question", extra: 1 })).toThrow();
  });
});
