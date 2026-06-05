import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import { aiDemoAggregateSchema, type AiDemoAggregate } from "./ai-demo-types";

// Allowlisted, non-sensitive columns only. Never select client_id, names, email,
// phone, notes, reasons, references, or card/bank/gateway fields.
const APPOINTMENT_AGGREGATE_SELECT = "status,starts_at";
const PAYMENT_AGGREGATE_SELECT = "status,amount_idr";
const CLIENT_PACKAGE_AGGREGATE_SELECT = "status,remaining_sessions";

const UPCOMING_STATUSES = new Set(["scheduled", "confirmed"]);
const LOW_SESSION_THRESHOLD = 2;

type AggregateRow = Record<string, unknown>;

type AggregateSupabaseClient = {
  from: (table: string) => {
    select: (
      columns: string,
    ) => PromiseLike<{ data: AggregateRow[] | null; error: unknown }>;
  };
};

type LoadAiDemoAggregateOptions = {
  client?: AggregateSupabaseClient;
  now?: Date;
};

export async function loadAiDemoAggregate(
  options: LoadAiDemoAggregateOptions = {},
): Promise<AiDemoAggregate> {
  const client =
    options.client ??
    ((await createSupabaseServerClient()) as unknown as AggregateSupabaseClient);
  const now = options.now ?? new Date();

  const [appointments, payments, packages] = await Promise.all([
    selectRows(client, "appointments", APPOINTMENT_AGGREGATE_SELECT),
    selectRows(client, "payments", PAYMENT_AGGREGATE_SELECT),
    selectRows(client, "client_packages", CLIENT_PACKAGE_AGGREGATE_SELECT),
  ]);

  const upcomingAppointmentCount = appointments.filter((row) => {
    const startsAt = row.starts_at;
    return (
      UPCOMING_STATUSES.has(String(row.status)) &&
      typeof startsAt === "string" &&
      Number.isFinite(Date.parse(startsAt)) &&
      Date.parse(startsAt) >= now.getTime()
    );
  }).length;

  const activePackages = packages.filter(
    (row) => String(row.status) === "active",
  );

  return aiDemoAggregateSchema.parse({
    appointmentsByStatus: countByStatus(appointments),
    upcomingAppointmentCount,
    paymentsByStatus: countByStatus(payments),
    paymentTotalsByStatusIdr: sumByStatus(payments, "amount_idr"),
    activePackageCount: activePackages.length,
    totalRemainingSessions: activePackages.reduce(
      (total, row) => total + toNonNegativeInt(row.remaining_sessions),
      0,
    ),
    lowSessionPackageCount: activePackages.filter(
      (row) => toNonNegativeInt(row.remaining_sessions) <= LOW_SESSION_THRESHOLD,
    ).length,
  });
}

async function selectRows(
  client: AggregateSupabaseClient,
  table: string,
  columns: string,
): Promise<AggregateRow[]> {
  const response = await client.from(table).select(columns);
  if (response.error) {
    throw new Error(`Failed to load aggregate rows for ${table}.`);
  }
  return response.data ?? [];
}

function countByStatus(rows: AggregateRow[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const row of rows) {
    const status = String(row.status ?? "unknown");
    counts[status] = (counts[status] ?? 0) + 1;
  }
  return counts;
}

function sumByStatus(
  rows: AggregateRow[],
  field: string,
): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const row of rows) {
    const status = String(row.status ?? "unknown");
    totals[status] = (totals[status] ?? 0) + toNonNegativeInt(row[field]);
  }
  return totals;
}

function toNonNegativeInt(value: unknown): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) {
    return 0;
  }
  return Math.floor(numeric);
}
