export type KnowledgeSupabaseError = {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
  status?: number;
};

export type KnowledgeSupabaseListResponse<TRow> = {
  data: TRow[] | null;
  error: KnowledgeSupabaseError | null;
  count: number | null;
};

export type KnowledgeSupabaseSingleResponse<TRow> = {
  data: TRow | null;
  error: KnowledgeSupabaseError | null;
};

export type KnowledgeSupabaseFilterBuilder<TRow> = {
  eq(column: string, value: string): KnowledgeSupabaseFilterBuilder<TRow>;
  order(
    column: string,
    options?: { ascending?: boolean },
  ): KnowledgeSupabaseFilterBuilder<TRow>;
  range(from: number, to: number): Promise<KnowledgeSupabaseListResponse<TRow>>;
  maybeSingle(): Promise<KnowledgeSupabaseSingleResponse<TRow>>;
};

export type KnowledgeSupabaseTable<TRow> = {
  select(
    columns: string,
    options?: { count?: "exact" },
  ): KnowledgeSupabaseFilterBuilder<TRow>;
};

export type KnowledgeSourceRow = {
  id: string;
  title: string;
  doc_type: string;
  scopes: string[];
  status: string;
  version: number;
  confidence: number | null;
  extracted_text: string | null;
  created_at: string;
  updated_at: string;
};

export type KnowledgeSupabaseClient = {
  from(table: "knowledge_sources"): KnowledgeSupabaseTable<KnowledgeSourceRow>;
};
