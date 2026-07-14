vi.mock("server-only", () => ({}));

import { describe, expect, it, vi } from "vitest";

import { KnowledgeRepositoryError } from "../../../src/lib/knowledge/errors";
import { createSupabaseKnowledgeRepository } from "../../../src/lib/knowledge/supabase/knowledge-repository";
import type {
  KnowledgeSourceRow,
  KnowledgeSupabaseClient,
  KnowledgeSupabaseError,
} from "../../../src/lib/knowledge/supabase/types";

const knowledgeSourceRow: KnowledgeSourceRow = {
  id: "11111111-1111-4111-8111-111111111111",
  title: "Pricing Sheet 2026",
  doc_type: "pricing",
  scopes: ["public_chatbot"],
  status: "published",
  version: 1,
  confidence: 0.92,
  extracted_text: "Private session Rp 550.000.",
  created_at: "2026-07-01T00:00:00.000Z",
  updated_at: "2026-07-01T00:00:00.000Z",
};

type QueryCall = {
  select: {
    columns: string;
    options?: { count?: "exact" };
  };
  eq: { column: string; value: string }[];
  or: string[];
  order?: { column: string; options?: { ascending?: boolean } };
  range?: { from: number; to: number };
  maybeSingle: boolean;
};

function createMockKnowledgeSupabaseClient(options?: {
  rows?: KnowledgeSourceRow[];
  error?: KnowledgeSupabaseError;
}) {
  const rows = options?.rows ?? [];
  const calls: QueryCall[] = [];

  const client = {
    from(table: "knowledge_sources") {
      expect(table).toBe("knowledge_sources");

      return {
        select(columns: string, selectOptions?: { count?: "exact" }) {
          const call: QueryCall = {
            select: {
              columns,
              options: selectOptions,
            },
            eq: [],
            or: [],
            maybeSingle: false,
          };
          calls.push(call);

          const builder = {
            eq(column: string, value: string) {
              call.eq.push({ column, value });
              return builder;
            },
            ilike() {
              return builder;
            },
            or(filters: string) {
              call.or.push(filters);
              return builder;
            },
            order(column: string, orderOptions?: { ascending?: boolean }) {
              call.order = { column, options: orderOptions };
              return builder;
            },
            async range(from: number, to: number) {
              call.range = { from, to };

              return {
                data: rows,
                error: options?.error ?? null,
                count: rows.length,
              };
            },
            async maybeSingle() {
              call.maybeSingle = true;

              return {
                data: rows[0] ?? null,
                error: options?.error ?? null,
              };
            },
          };

          return builder;
        },
      };
    },
  } as unknown as KnowledgeSupabaseClient;

  return { client, calls };
}

describe("Supabase knowledge repository", () => {
  it("builds a title/doc_type ilike filter when search is provided", async () => {
    const { client, calls } = createMockKnowledgeSupabaseClient({
      rows: [knowledgeSourceRow],
    });
    const repository = createSupabaseKnowledgeRepository(client);

    await repository.list({ search: "pricing" });

    expect(calls[0]?.or).toEqual([
      "title.ilike.%pricing%,doc_type.ilike.%pricing%",
    ]);
  });

  it("does not apply an or() filter when search is empty", async () => {
    const { client, calls } = createMockKnowledgeSupabaseClient({
      rows: [knowledgeSourceRow],
    });
    const repository = createSupabaseKnowledgeRepository(client);

    await repository.list();

    expect(calls[0]?.or).toEqual([]);
  });

  it("sanitizes wildcard characters in the search term", async () => {
    const { client, calls } = createMockKnowledgeSupabaseClient({
      rows: [knowledgeSourceRow],
    });
    const repository = createSupabaseKnowledgeRepository(client);

    await repository.list({ search: "50%_off\\" });

    expect(calls[0]?.or).toEqual([
      "title.ilike.%50\\%\\_off\\\\%,doc_type.ilike.%50\\%\\_off\\\\%",
    ]);
  });

  it("converts Supabase list failures to safe repository errors", async () => {
    const { client } = createMockKnowledgeSupabaseClient({
      error: {
        code: "42501",
        message: "permission denied for table knowledge_sources",
        details: "raw database detail",
      },
    });
    const repository = createSupabaseKnowledgeRepository(client);

    await expect(repository.list()).rejects.toMatchObject({
      name: "KnowledgeRepositoryError",
      operation: "knowledge.list",
      table: "knowledge_sources",
      code: "42501",
    });

    try {
      await repository.list();
    } catch (error) {
      expect(error).toBeInstanceOf(KnowledgeRepositoryError);
      expect((error as Error).message).not.toContain("permission denied");
      expect((error as Error).message).not.toContain("raw database detail");
      expect((error as Error).message).not.toContain("knowledge_sources");
    }
  });

  it("converts Supabase getById failures to safe repository errors", async () => {
    const { client } = createMockKnowledgeSupabaseClient({
      error: {
        code: "42501",
        message: "permission denied for table knowledge_sources",
        details: "raw database detail",
      },
    });
    const repository = createSupabaseKnowledgeRepository(client);

    await expect(repository.getById(knowledgeSourceRow.id)).rejects.toMatchObject({
      name: "KnowledgeRepositoryError",
      operation: "knowledge.getById",
      table: "knowledge_sources",
      code: "42501",
    });
  });

  it("maps a found row through the domain schema on getById", async () => {
    const { client } = createMockKnowledgeSupabaseClient({
      rows: [knowledgeSourceRow],
    });
    const repository = createSupabaseKnowledgeRepository(client);

    const result = await repository.getById(knowledgeSourceRow.id);

    expect(result).toMatchObject({
      id: knowledgeSourceRow.id,
      title: knowledgeSourceRow.title,
      docType: knowledgeSourceRow.doc_type,
      scopes: knowledgeSourceRow.scopes,
      status: knowledgeSourceRow.status,
      version: knowledgeSourceRow.version,
      confidence: knowledgeSourceRow.confidence,
      extractedText: knowledgeSourceRow.extracted_text,
    });
  });

  it("returns null on getById miss", async () => {
    const { client } = createMockKnowledgeSupabaseClient({ rows: [] });
    const repository = createSupabaseKnowledgeRepository(client);

    const result = await repository.getById(knowledgeSourceRow.id);

    expect(result).toBeNull();
  });
});
