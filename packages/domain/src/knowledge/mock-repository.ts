import {
  applyCatalogPagination,
  includesCatalogSearch,
} from "../catalog/mock-utils";
import type { KnowledgeRepository } from "./repository";
import {
  knowledgeSourceListQuerySchema,
  knowledgeSourceListResultSchema,
  knowledgeSourceSchema,
} from "./schemas";
import type { KnowledgeSource, KnowledgeSourceListQuery } from "./types";

export const mockKnowledgeSources = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    title: "Pricing Sheet 2026",
    docType: "pricing",
    scopes: ["public_chatbot"],
    status: "published",
    version: 1,
    confidence: 0.92,
    extractedText: "Private session Rp 550.000. Monthly unlimited Rp 3.500.000.",
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    title: "Cancellation SOP",
    docType: "sop",
    scopes: ["internal_admin"],
    status: "extracted",
    version: 1,
    confidence: 0.81,
    extractedText: "Cancellations under 24 hours forfeit the session.",
    createdAt: "2026-07-02T00:00:00.000Z",
    updatedAt: "2026-07-02T00:00:00.000Z",
  },
] as const satisfies readonly KnowledgeSource[];

export function createMockKnowledgeRepository(
  seed: readonly KnowledgeSource[] = mockKnowledgeSources,
): KnowledgeRepository {
  const sources = seed.map((source) => knowledgeSourceSchema.parse(source));

  return {
    async list(query: Partial<KnowledgeSourceListQuery> = {}) {
      const parsedQuery = knowledgeSourceListQuerySchema.parse(query ?? {});

      const filtered = sources.filter((source) =>
        includesCatalogSearch([source.title, source.docType], parsedQuery.search),
      );

      return knowledgeSourceListResultSchema.parse({
        items: applyCatalogPagination(filtered, parsedQuery),
        total: filtered.length,
        page: parsedQuery.page,
        pageSize: parsedQuery.pageSize,
      });
    },
    async getById(id: string) {
      return sources.find((source) => source.id === id) ?? null;
    },
  };
}
