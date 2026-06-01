export type AppointmentSupabaseError = {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
  status?: number;
};

export type AppointmentSupabaseListResponse<TRow> = {
  data: TRow[] | null;
  error: AppointmentSupabaseError | null;
  count: number | null;
};

export type AppointmentSupabaseSingleResponse<TRow> = {
  data: TRow | null;
  error: AppointmentSupabaseError | null;
};

export type AppointmentSupabaseFilterBuilder<TRow> = {
  eq(column: string, value: string): AppointmentSupabaseFilterBuilder<TRow>;
  gte(column: string, value: string): AppointmentSupabaseFilterBuilder<TRow>;
  lt(column: string, value: string): AppointmentSupabaseFilterBuilder<TRow>;
  order(
    column: string,
    options?: { ascending?: boolean },
  ): AppointmentSupabaseFilterBuilder<TRow>;
  range(
    from: number,
    to: number,
  ): Promise<AppointmentSupabaseListResponse<TRow>>;
  maybeSingle(): Promise<AppointmentSupabaseSingleResponse<TRow>>;
};

export type AppointmentSupabaseTable<TRow> = {
  select(
    columns: string,
    options?: { count?: "exact" },
  ): AppointmentSupabaseFilterBuilder<TRow>;
};

type AppointmentRelation<TFields> = TFields | TFields[] | null;

export type AppointmentRow = {
  id: string;
  client_id: string;
  practitioner_id: string;
  service_id: string;
  status: string;
  starts_at: string;
  ends_at: string;
  duration_minutes: number;
  source: string;
  notes_summary: string | null;
  created_at: string;
  updated_at: string;
  clients: AppointmentRelation<{
    full_name: string | null;
  }>;
  practitioners: AppointmentRelation<{
    display_name: string | null;
  }>;
  services: AppointmentRelation<{
    name: string | null;
  }>;
};

export type AppointmentSupabaseClient = {
  from(table: "appointments"): AppointmentSupabaseTable<AppointmentRow>;
};
