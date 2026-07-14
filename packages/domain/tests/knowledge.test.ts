import { describe, expect, it } from "vitest";

import {
  chunkText,
  createKnowledgeSourceInputSchema,
  createMockKnowledgeRepository,
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
