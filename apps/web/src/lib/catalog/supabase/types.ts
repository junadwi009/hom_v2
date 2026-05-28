export type CatalogSupabaseError = {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
  status?: number;
};

export type CatalogSupabaseListResponse<TRow> = {
  data: TRow[] | null;
  error: CatalogSupabaseError | null;
  count: number | null;
};

export type CatalogSupabaseSingleResponse<TRow> = {
  data: TRow | null;
  error: CatalogSupabaseError | null;
};

export type CatalogSupabaseFilterBuilder<TRow> = {
  eq(column: string, value: string): CatalogSupabaseFilterBuilder<TRow>;
  ilike(column: string, pattern: string): CatalogSupabaseFilterBuilder<TRow>;
  or(filters: string): CatalogSupabaseFilterBuilder<TRow>;
  order(
    column: string,
    options?: { ascending?: boolean },
  ): CatalogSupabaseFilterBuilder<TRow>;
  range(from: number, to: number): Promise<CatalogSupabaseListResponse<TRow>>;
  maybeSingle(): Promise<CatalogSupabaseSingleResponse<TRow>>;
};

export type CatalogSupabaseTable<TRow> = {
  select(
    columns: string,
    options?: { count?: "exact" },
  ): CatalogSupabaseFilterBuilder<TRow>;
};

export type ClientRow = {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  status: string;
  primary_practitioner_id: string | null;
  created_by_app_user_id: string | null;
  created_at: string;
  updated_at: string;
  practitioners:
    | {
        display_name: string | null;
      }
    | { display_name: string | null }[]
    | null;
};

export type PractitionerRow = {
  id: string;
  app_user_id: string | null;
  display_name: string;
  email: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export type ServiceRow = {
  id: string;
  name: string;
  category: string;
  default_duration_minutes: number;
  default_price_idr: number | string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export type CatalogSupabaseClient = {
  from(table: "clients"): CatalogSupabaseTable<ClientRow>;
  from(table: "practitioners"): CatalogSupabaseTable<PractitionerRow>;
  from(table: "services"): CatalogSupabaseTable<ServiceRow>;
};
