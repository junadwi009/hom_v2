export type PackageSupabaseError = {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
  status?: number;
};

export type PackageSupabaseListResponse<TRow> = {
  data: TRow[] | null;
  error: PackageSupabaseError | null;
  count: number | null;
};

export type PackageSupabaseSingleResponse<TRow> = {
  data: TRow | null;
  error: PackageSupabaseError | null;
};

export type PackageSupabaseFilterBuilder<TRow> = {
  eq(column: string, value: string): PackageSupabaseFilterBuilder<TRow>;
  ilike(column: string, pattern: string): PackageSupabaseFilterBuilder<TRow>;
  or(filters: string): PackageSupabaseFilterBuilder<TRow>;
  order(
    column: string,
    options?: { ascending?: boolean },
  ): PackageSupabaseFilterBuilder<TRow>;
  range(from: number, to: number): Promise<PackageSupabaseListResponse<TRow>>;
  maybeSingle(): Promise<PackageSupabaseSingleResponse<TRow>>;
};

export type PackageSupabaseTable<TRow> = {
  select(
    columns: string,
    options?: { count?: "exact" },
  ): PackageSupabaseFilterBuilder<TRow>;
};

export type PackageRow = {
  id: string;
  name: string;
  package_type: string;
  total_sessions: number;
  validity_days: number;
  price_idr: number | string;
  status: string;
  created_at: string;
  updated_at: string;
};

export type ClientPackageRow = {
  id: string;
  client_id: string;
  package_id: string;
  purchased_at: string;
  expires_at: string;
  total_sessions: number;
  remaining_sessions: number;
  status: string;
  created_at: string;
  updated_at: string;
  clients:
    | {
        full_name: string | null;
      }
    | { full_name: string | null }[]
    | null;
  packages:
    | {
        name: string | null;
      }
    | { name: string | null }[]
    | null;
};

export type PackageUsageHistoryRow = {
  id: string;
  client_package_id: string;
  appointment_id: string | null;
  change_type: string;
  quantity: number;
  before_remaining: number;
  after_remaining: number;
  reason: string | null;
  actor_app_user_id: string | null;
  created_at: string;
};

export type PackageSupabaseClient = {
  from(table: "packages"): PackageSupabaseTable<PackageRow>;
  from(table: "client_packages"): PackageSupabaseTable<ClientPackageRow>;
  from(
    table: "package_usage_history",
  ): PackageSupabaseTable<PackageUsageHistoryRow>;
};
