import { describe, expect, it } from "vitest";

import {
  createKnowledgeSourceInputSchema,
  knowledgeQueryInputSchema,
  knowledgeScopeSchema,
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
