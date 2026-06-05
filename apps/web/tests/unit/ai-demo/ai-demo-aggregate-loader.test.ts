import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { loadAiDemoAggregate } from "../../../src/lib/ai/ai-demo-aggregate-loader";

type Rows = Record<string, unknown>[];
type FakeData = Record<string, Rows>;

function createFakeClient(data: FakeData) {
  const selects: { table: string; columns: string }[] = [];
  const writeCalls: string[] = [];

  const client = {
    from(table: string) {
      return {
        select(columns: string) {
          selects.push({ table, columns });
          return Promise.resolve({
            data: data[table] ?? [],
            error: null as unknown,
          });
        },
        insert() {
          writeCalls.push(`insert:${table}`);
          return Promise.resolve({ error: null });
        },
        update() {
          writeCalls.push(`update:${table}`);
          return Promise.resolve({ error: null });
        },
        delete() {
          writeCalls.push(`delete:${table}`);
          return Promise.resolve({ error: null });
        },
        upsert() {
          writeCalls.push(`upsert:${table}`);
          return Promise.resolve({ error: null });
        },
      };
    },
  };

  return { client, selects, writeCalls };
}

describe("ai demo aggregate loader", () => {
  it("selects only allowlisted non-sensitive columns, never writes, and computes safe counts", async () => {
    const { client, selects, writeCalls } = createFakeClient({
      appointments: [
        { status: "scheduled", starts_at: "2999-01-01T00:00:00Z" },
        { status: "completed", starts_at: "2000-01-01T00:00:00Z" },
        { status: "cancelled", starts_at: "2000-01-01T00:00:00Z" },
      ],
      payments: [
        { status: "paid", amount_idr: 1_000_000 },
        { status: "paid", amount_idr: 250_000 },
        { status: "pending", amount_idr: 150_000 },
        { status: "cancelled", amount_idr: 150_000 },
      ],
      client_packages: [
        { status: "active", remaining_sessions: 4 },
        { status: "active", remaining_sessions: 10 },
        { status: "active", remaining_sessions: 1 },
        { status: "cancelled", remaining_sessions: 0 },
      ],
    });

    const aggregate = await loadAiDemoAggregate({
      client,
      now: new Date("2026-06-04T00:00:00Z"),
    });

    const columns = selects.map((entry) => entry.columns).join(" ");
    for (const forbidden of [
      "client_id",
      "full_name",
      "email",
      "phone",
      "notes",
      "reason",
      "reference",
      "card",
      "bank",
    ]) {
      expect(columns).not.toContain(forbidden);
    }
    expect(columns).toContain("status");
    expect(columns).toContain("amount_idr");
    expect(columns).toContain("remaining_sessions");

    expect(writeCalls).toHaveLength(0);

    expect(aggregate.appointmentsByStatus).toEqual({
      scheduled: 1,
      completed: 1,
      cancelled: 1,
    });
    expect(aggregate.upcomingAppointmentCount).toBe(1);
    expect(aggregate.paymentsByStatus).toEqual({
      paid: 2,
      pending: 1,
      cancelled: 1,
    });
    expect(aggregate.paymentTotalsByStatusIdr).toEqual({
      paid: 1_250_000,
      pending: 150_000,
      cancelled: 150_000,
    });
    expect(aggregate.activePackageCount).toBe(3);
    expect(aggregate.totalRemainingSessions).toBe(15);
    expect(aggregate.lowSessionPackageCount).toBe(1);
  });
});
