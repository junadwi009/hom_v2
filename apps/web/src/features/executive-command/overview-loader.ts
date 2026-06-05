import "server-only";

import { getDataMode } from "@/lib/env/app-mode";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type OverviewMonthPoint = {
  key: string; // YYYY-MM
  label: string; // e.g. "Jun"
  revenueIdr: number;
  newClients: number;
};

export type OverviewKpis = {
  revenueThisMonthIdr: number;
  newClientsThisMonth: number;
  pendingPaymentsCount: number;
  pendingPaymentsTotalIdr: number;
  upcomingAppointments: number;
};

export type OverviewAttention = {
  lowSessionPackages: number;
  pendingPayments: number;
  noShowAppointments: number;
};

export type OverviewState =
  | {
      status: "ready";
      source: "supabase";
      kpis: OverviewKpis;
      series: OverviewMonthPoint[];
      attention: OverviewAttention;
    }
  | { status: "empty"; source: "mock" }
  | { status: "unavailable"; source: "supabase" };

const MONTHS_BACK = 6;
const LOW_SESSION_THRESHOLD = 2;
const UPCOMING_STATUSES = new Set(["scheduled", "confirmed"]);
const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

type Row = Record<string, unknown>;

type OverviewSupabaseClient = {
  from: (table: string) => {
    select: (
      columns: string,
    ) => PromiseLike<{ data: Row[] | null; error: unknown }>;
  };
};

type LoadExecutiveOverviewOptions = {
  client?: OverviewSupabaseClient;
  now?: Date;
};

export async function loadExecutiveOverview(
  options: LoadExecutiveOverviewOptions = {},
): Promise<OverviewState> {
  if (options.client === undefined && getDataMode() !== "supabase") {
    return { status: "empty", source: "mock" };
  }

  const now = options.now ?? new Date();

  try {
    const client =
      options.client ??
      ((await createSupabaseServerClient()) as unknown as OverviewSupabaseClient);

    const [payments, clients, appointments, clientPackages] = await Promise.all([
      selectRows(client, "payments", "status,amount_idr,paid_at,created_at"),
      selectRows(client, "clients", "created_at"),
      selectRows(client, "appointments", "status,starts_at"),
      selectRows(client, "client_packages", "status,remaining_sessions"),
    ]);

    const buckets = buildMonthBuckets(now);
    const indexByKey = new Map(buckets.map((bucket, index) => [bucket.key, index]));

    for (const payment of payments) {
      if (String(payment.status) !== "paid") continue;
      const when = monthKey(
        (payment.paid_at as string | null) ?? (payment.created_at as string | null),
      );
      const index = when ? indexByKey.get(when) : undefined;
      if (index !== undefined) {
        buckets[index].revenueIdr += toNonNegativeInt(payment.amount_idr);
      }
    }

    for (const client_ of clients) {
      const when = monthKey(client_.created_at as string | null);
      const index = when ? indexByKey.get(when) : undefined;
      if (index !== undefined) {
        buckets[index].newClients += 1;
      }
    }

    const currentKey = monthKeyFromDate(now);
    const pendingPayments = payments.filter(
      (payment) => String(payment.status) === "pending",
    );
    const activePackages = clientPackages.filter(
      (row) => String(row.status) === "active",
    );

    return {
      status: "ready",
      source: "supabase",
      series: buckets,
      kpis: {
        revenueThisMonthIdr:
          buckets.find((bucket) => bucket.key === currentKey)?.revenueIdr ?? 0,
        newClientsThisMonth:
          buckets.find((bucket) => bucket.key === currentKey)?.newClients ?? 0,
        pendingPaymentsCount: pendingPayments.length,
        pendingPaymentsTotalIdr: pendingPayments.reduce(
          (total, payment) => total + toNonNegativeInt(payment.amount_idr),
          0,
        ),
        upcomingAppointments: appointments.filter((appointment) => {
          const startsAt = appointment.starts_at;
          return (
            UPCOMING_STATUSES.has(String(appointment.status)) &&
            typeof startsAt === "string" &&
            Number.isFinite(Date.parse(startsAt)) &&
            Date.parse(startsAt) >= now.getTime()
          );
        }).length,
      },
      attention: {
        lowSessionPackages: activePackages.filter(
          (row) => toNonNegativeInt(row.remaining_sessions) <= LOW_SESSION_THRESHOLD,
        ).length,
        pendingPayments: pendingPayments.length,
        noShowAppointments: appointments.filter(
          (appointment) => String(appointment.status) === "no_show",
        ).length,
      },
    };
  } catch {
    return { status: "unavailable", source: "supabase" };
  }
}

async function selectRows(
  client: OverviewSupabaseClient,
  table: string,
  columns: string,
): Promise<Row[]> {
  const response = await client.from(table).select(columns);
  if (response.error) {
    throw new Error(`Failed to load overview rows for ${table}.`);
  }
  return response.data ?? [];
}

function buildMonthBuckets(now: Date): OverviewMonthPoint[] {
  const buckets: OverviewMonthPoint[] = [];
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  for (let offset = MONTHS_BACK - 1; offset >= 0; offset -= 1) {
    const date = new Date(Date.UTC(year, month - offset, 1));
    buckets.push({
      key: monthKeyFromDate(date),
      label: MONTH_LABELS[date.getUTCMonth()],
      revenueIdr: 0,
      newClients: 0,
    });
  }
  return buckets;
}

function monthKeyFromDate(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function monthKey(value: string | null): string | null {
  if (!value) return null;
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return null;
  return monthKeyFromDate(new Date(parsed));
}

function toNonNegativeInt(value: unknown): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) return 0;
  return Math.floor(numeric);
}
