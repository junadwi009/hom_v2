import "server-only";

import {
  knowledgeSourceListQuerySchema,
  knowledgeSourceListResultSchema,
  knowledgeSourceSchema,
  type KnowledgeRepository,
  type KnowledgeSourceListQuery,
} from "@hom/domain/knowledge";

import type { KnowledgeSourceRow, KnowledgeSupabaseClient } from "./types";

const KNOWLEDGE_SOURCE_SELECT = "*";

export function createSupabaseKnowledgeRepository(
  client: KnowledgeSupabaseClient,
): KnowledgeRepository {
  return {
    async list(query: Partial<KnowledgeSourceListQuery> = {}) {
      const parsedQuery = knowledgeSourceListQuerySchema.parse(query ?? {});
      const from = (parsedQuery.page - 1) * parsedQuery.pageSize;
      const to = from + parsedQuery.pageSize - 1;

      const response = await client
        .from("knowledge_sources")
        .select(KNOWLEDGE_SOURCE_SELECT, { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, to);

      if (response.error) {
        throw response.error;
      }

      const rows = response.data ?? [];

      return knowledgeSourceListResultSchema.parse({
        items: rows.map(mapKnowledgeSourceRow),
        total: response.count ?? rows.length,
        page: parsedQuery.page,
        pageSize: parsedQuery.pageSize,
      });
    },

    async getById(id: string) {
      const response = await client
        .from("knowledge_sources")
        .select(KNOWLEDGE_SOURCE_SELECT)
        .eq("id", id)
        .maybeSingle();

      if (response.error) {
        throw response.error;
      }

      return response.data ? mapKnowledgeSourceRow(response.data) : null;
    },
  };
}

function mapKnowledgeSourceRow(row: KnowledgeSourceRow) {
  return knowledgeSourceSchema.parse({
    id: row.id,
    title: row.title,
    docType: row.doc_type,
    scopes: row.scopes,
    status: row.status,
    version: row.version,
    confidence: row.confidence,
    extractedText: row.extracted_text ?? null,
    createdAt: toIsoTimestamp(row.created_at),
    updatedAt: toIsoTimestamp(row.updated_at),
  });
}

function toIsoTimestamp(value: string) {
  const time = Date.parse(value);

  if (Number.isNaN(time)) {
    return value;
  }

  return new Date(time).toISOString();
}
