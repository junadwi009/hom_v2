import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { loadManagementKpis } from "../../../src/features/clients/management/management-kpis-loader";

type Rows = Record<string, unknown>[];

function createFakeClient(rows: Rows, error: unknown = null) {
  const selects: { table: string; columns: string }[] = [];
  const client = {
    from(table: string) {
      return {
        select(columns: string) {
          selects.push({ table, columns });
          return Promise.resolve({ data: error ? null : rows, error });
        },
      };
    },
  };
  return { client, selects };
}

const NOW = new Date("2026-07-05T10:00:00Z");

describe("management kpis loader", () => {
  it("computes totals, active, prospects, and new-this-month from a light select", async () => {
    const { client, selects } = createFakeClient([
      { status: "active", created_at: "2026-07-01T09:00:00Z" },
      { status: "active", created_at: "2026-06-20T09:00:00Z" },
      { status: "prospect", created_at: "2026-07-03T09:00:00Z" },
      { status: "inactive", created_at: "2025-01-01T09:00:00Z" },
      { status: "archived", created_at: null },
    ]);

    const kpis = await loadManagementKpis({ client, now: NOW });

    expect(kpis).toEqual({
      totalClients: 5,
      activeClients: 2,
      newClientsThisMonth: 2,
      prospectClients: 1,
    });
    // Only the clients table, only non-sensitive columns.
    expect(selects).toEqual([{ table: "clients", columns: "status,created_at" }]);
  });

  it("returns null on query error instead of fake zeros", async () => {
    const { client } = createFakeClient([], new Error("boom"));
    expect(await loadManagementKpis({ client, now: NOW })).toBeNull();
  });

  it("returns null when the client throws", async () => {
    const throwing = {
      from(): {
        select: (
          columns: string,
        ) => PromiseLike<{ data: Record<string, unknown>[] | null; error: unknown }>;
      } {
        throw new Error("network down");
      },
    };
    expect(
      await loadManagementKpis({ client: throwing, now: NOW }),
    ).toBeNull();
  });

  it("ignores malformed created_at values without crashing", async () => {
    const { client } = createFakeClient([
      { status: "active", created_at: "not-a-date" },
      { status: "active", created_at: "2026-07-04T09:00:00Z" },
    ]);
    const kpis = await loadManagementKpis({ client, now: NOW });
    expect(kpis?.newClientsThisMonth).toBe(1);
    expect(kpis?.totalClients).toBe(2);
  });
});
