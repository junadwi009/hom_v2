import "server-only";

import { getDataMode } from "@/lib/env/app-mode";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Honest, computable client KPIs for /clients. Derived from a single light
// select over `clients` (status + created_at) — the same aggregate pattern as
// the executive overview loader. Anything we cannot compute honestly yet
// (at-risk, VIP, expiring value) is intentionally NOT part of this shape;
// never substitute fabricated numbers.
export type ManagementKpis = {
  totalClients: number;
  activeClients: number;
  newClientsThisMonth: number;
  prospectClients: number;
};

type Row = Record<string, unknown>;

type KpisSupabaseClient = {
  from: (table: string) => {
    select: (
      columns: string,
    ) => PromiseLike<{ data: Row[] | null; error: unknown }>;
  };
};

type LoadManagementKpisOptions = {
  client?: KpisSupabaseClient;
  now?: Date;
};

// Returns null when not in Supabase data mode or when the query fails, so the
// page can render an honest "—" placeholder instead of fake zeros.
export async function loadManagementKpis(
  options: LoadManagementKpisOptions = {},
): Promise<ManagementKpis | null> {
  if (options.client === undefined && getDataMode() !== "supabase") {
    return null;
  }

  const now = options.now ?? new Date();

  try {
    const client =
      options.client ??
      ((await createSupabaseServerClient()) as unknown as KpisSupabaseClient);

    const response = await client.from("clients").select("status,created_at");
    if (response.error || !response.data) {
      return null;
    }

    const currentKey = monthKeyFromDate(now);
    let activeClients = 0;
    let prospectClients = 0;
    let newClientsThisMonth = 0;

    for (const row of response.data) {
      const status = String(row.status);
      if (status === "active") activeClients += 1;
      if (status === "prospect") prospectClients += 1;
      if (monthKey(row.created_at as string | null) === currentKey) {
        newClientsThisMonth += 1;
      }
    }

    return {
      totalClients: response.data.length,
      activeClients,
      newClientsThisMonth,
      prospectClients,
    };
  } catch {
    return null;
  }
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
