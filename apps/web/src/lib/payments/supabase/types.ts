export type PaymentSupabaseError = {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
  status?: number;
};

export type PaymentSupabaseListResponse<TRow> = {
  data: TRow[] | null;
  error: PaymentSupabaseError | null;
  count: number | null;
};

export type PaymentSupabaseSingleResponse<TRow> = {
  data: TRow | null;
  error: PaymentSupabaseError | null;
};

export type PaymentSupabaseFilterBuilder<TRow> = {
  eq(column: string, value: string): PaymentSupabaseFilterBuilder<TRow>;
  ilike(column: string, pattern: string): PaymentSupabaseFilterBuilder<TRow>;
  or(filters: string): PaymentSupabaseFilterBuilder<TRow>;
  order(
    column: string,
    options?: { ascending?: boolean },
  ): PaymentSupabaseFilterBuilder<TRow>;
  range(from: number, to: number): Promise<PaymentSupabaseListResponse<TRow>>;
  maybeSingle(): Promise<PaymentSupabaseSingleResponse<TRow>>;
};

export type PaymentSupabaseTable<TRow> = {
  select(
    columns: string,
    options?: { count?: "exact" },
  ): PaymentSupabaseFilterBuilder<TRow>;
};

type RelatedName = { name: string | null };
type RelatedFullName = { full_name: string | null };

export type PaymentRow = {
  id: string;
  client_id: string;
  client_package_id: string | null;
  amount_idr: number | string;
  payment_method: string;
  status: string;
  paid_at: string | null;
  reference_number: string | null;
  notes: string | null;
  created_by_app_user_id: string | null;
  updated_by_app_user_id: string | null;
  created_at: string;
  updated_at: string;
  clients: RelatedFullName | RelatedFullName[] | null;
  client_packages:
    | { packages: RelatedName | RelatedName[] | null }
    | { packages: RelatedName | RelatedName[] | null }[]
    | null;
};

export type PaymentStatusHistoryRow = {
  id: string;
  payment_id: string;
  from_status: string | null;
  to_status: string;
  reason: string | null;
  actor_app_user_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

export type PaymentSupabaseClient = {
  from(table: "payments"): PaymentSupabaseTable<PaymentRow>;
  from(
    table: "payment_status_history",
  ): PaymentSupabaseTable<PaymentStatusHistoryRow>;
};
