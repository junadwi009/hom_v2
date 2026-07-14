import "server-only";

import { getDataMode } from "@/lib/env/app-mode";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Row = Record<string, unknown>;

type RevenueSupabaseClient = {
  from: (table: string) => {
    select: (
      columns: string,
    ) => PromiseLike<{ data: Row[] | null; error: unknown }>;
  };
};

type LoadCurrentMonthRevenueOptions = {
  client?: RevenueSupabaseClient;
  now?: Date;
};

/**
 * The single canonical "revenue this month" figure: the sum of SETTLED (paid)
 * payments whose payment month is the current calendar month.
 *
 * This is deliberately the SAME definition the Executive Overview KPI uses
 * (see `features/executive-command/overview-loader.ts`) so the two pages can
 * never disagree. Returns `null` when the figure is unavailable — mock mode,
 * a query error, or a thrown client — so callers render an honest placeholder
 * instead of a fabricated number.
 */
export async function loadCurrentMonthRevenueIdr(
  options: LoadCurrentMonthRevenueOptions = {},
): Promise<number | null> {
  if (options.client === undefined && getDataMode() !== "supabase") {
    return null;
  }

  const now = options.now ?? new Date();

  try {
    const client =
      options.client ??
      ((await createSupabaseServerClient()) as unknown as RevenueSupabaseClient);
    const response = await client
      .from("payments")
      .select("status,amount_idr,paid_at,created_at");

    if (response.error || !response.data) {
      return null;
    }

    const currentKey = monthKeyFromDate(now);
    let total = 0;
    for (const payment of response.data) {
      if (String(payment.status) !== "paid") continue;
      const when = monthKey(
        (payment.paid_at as string | null) ??
          (payment.created_at as string | null),
      );
      if (when === currentKey) {
        total += toNonNegativeInt(payment.amount_idr);
      }
    }
    return total;
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

function toNonNegativeInt(value: unknown): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) return 0;
  return Math.floor(numeric);
}
