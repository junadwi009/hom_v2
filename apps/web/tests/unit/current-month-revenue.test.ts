import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { loadCurrentMonthRevenueIdr } from "@/lib/revenue/current-month-revenue";

type Row = Record<string, unknown>;

function clientReturning(rows: Row[] | null, error: unknown = null) {
  return {
    from() {
      return {
        select() {
          return Promise.resolve({ data: rows, error });
        },
      };
    },
  };
}

const now = new Date("2026-07-14T00:00:00.000Z");

describe("loadCurrentMonthRevenueIdr", () => {
  it("sums only paid payments in the current calendar month", async () => {
    const client = clientReturning([
      { status: "paid", amount_idr: 1_000_000, paid_at: "2026-07-02T03:00:00Z" },
      { status: "paid", amount_idr: 500_000, paid_at: "2026-07-30T03:00:00Z" },
      // Pending — excluded even though it is this month.
      { status: "pending", amount_idr: 9_000_000, paid_at: "2026-07-10T03:00:00Z" },
      // Paid but last month — excluded.
      { status: "paid", amount_idr: 8_000_000, paid_at: "2026-06-20T03:00:00Z" },
    ]);

    await expect(
      loadCurrentMonthRevenueIdr({ client, now }),
    ).resolves.toBe(1_500_000);
  });

  it("falls back to created_at when paid_at is missing", async () => {
    const client = clientReturning([
      { status: "paid", amount_idr: 250_000, paid_at: null, created_at: "2026-07-05T03:00:00Z" },
    ]);

    await expect(loadCurrentMonthRevenueIdr({ client, now })).resolves.toBe(
      250_000,
    );
  });

  it("ignores negative or non-numeric amounts", async () => {
    const client = clientReturning([
      { status: "paid", amount_idr: -1_000, paid_at: "2026-07-05T03:00:00Z" },
      { status: "paid", amount_idr: "abc", paid_at: "2026-07-06T03:00:00Z" },
      { status: "paid", amount_idr: 100_000, paid_at: "2026-07-07T03:00:00Z" },
    ]);

    await expect(loadCurrentMonthRevenueIdr({ client, now })).resolves.toBe(
      100_000,
    );
  });

  it("returns null when the query errors", async () => {
    const client = clientReturning(null, { message: "boom" });
    await expect(
      loadCurrentMonthRevenueIdr({ client, now }),
    ).resolves.toBeNull();
  });

  it("returns 0 (not null) when there are no matching payments", async () => {
    const client = clientReturning([
      { status: "paid", amount_idr: 5_000_000, paid_at: "2026-05-01T03:00:00Z" },
    ]);
    await expect(loadCurrentMonthRevenueIdr({ client, now })).resolves.toBe(0);
  });
});
