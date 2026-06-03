import { afterEach, describe, expect, it, vi } from "vitest";

import { PackageRepositoryError } from "../../../src/lib/packages/errors";
import {
  createPackageRepositories,
  createSupabasePackageRepositories,
} from "../../../src/lib/packages/repository-factory";
import { mapClientPackageRow } from "../../../src/lib/packages/supabase/client-package-row-mapper";
import { mapPackageRow } from "../../../src/lib/packages/supabase/package-row-mapper";
import { mapPackageUsageHistoryRow } from "../../../src/lib/packages/supabase/package-usage-history-row-mapper";
import type {
  ClientPackageRow,
  PackageRow,
  PackageSupabaseClient,
  PackageSupabaseError,
  PackageUsageHistoryRow,
} from "../../../src/lib/packages/supabase/types";
import {
  createEmptyClientPackageRepository,
  loadClientPackagesPage,
} from "../../../src/features/packages/client-packages/client-packages-page-loader";
import {
  formatRemainingSessions,
  toClientPackageTableRow,
} from "../../../src/features/packages/client-packages/client-packages-page-state";
import {
  createEmptyPackageRepository,
  loadPackagesPage,
} from "../../../src/features/packages/packages/packages-page-loader";
import {
  formatPriceIdr,
  toPackageTableRow,
} from "../../../src/features/packages/packages/packages-page-state";

afterEach(() => {
  vi.unstubAllEnvs();
});

const packageRow: PackageRow = {
  id: "50000000-0000-4000-8000-000000000001",
  name: "Mock Intro Package",
  package_type: "intro",
  total_sessions: 2,
  validity_days: 14,
  price_idr: "750000",
  status: "active",
  created_at: "2026-06-03 01:00:00+00",
  updated_at: "2026-06-03 01:00:00+00",
};

const clientPackageRow: ClientPackageRow = {
  id: "51000000-0000-4000-8000-000000000001",
  client_id: "10000000-0000-4000-8000-000000000001",
  package_id: "50000000-0000-4000-8000-000000000001",
  purchased_at: "2026-06-03 02:00:00+00",
  expires_at: "2026-06-17 02:00:00+00",
  total_sessions: 2,
  remaining_sessions: 2,
  status: "active",
  created_at: "2026-06-03 02:00:00+00",
  updated_at: "2026-06-03 02:00:00+00",
  clients: {
    full_name: "Mock Client Alpha",
  },
  packages: {
    name: "Mock Intro Package",
  },
};

const usageHistoryRow: PackageUsageHistoryRow = {
  id: "52000000-0000-4000-8000-000000000001",
  client_package_id: "51000000-0000-4000-8000-000000000001",
  appointment_id: null,
  change_type: "assigned",
  quantity: 2,
  before_remaining: 0,
  after_remaining: 2,
  reason: "Mock local assignment.",
  actor_app_user_id: "94000000-0000-4000-8000-000000000001",
  created_at: "2026-06-03 02:00:00+00",
};

type TableName = "packages" | "client_packages" | "package_usage_history";

type RowsByTable = {
  packages: PackageRow[];
  client_packages: ClientPackageRow[];
  package_usage_history: PackageUsageHistoryRow[];
};

type QueryCall = {
  table: TableName;
  select: {
    columns: string;
    options?: { count?: "exact" };
  };
  eq: { column: string; value: string }[];
  ilike: { column: string; pattern: string }[];
  or: string[];
  order?: { column: string; options?: { ascending?: boolean } };
  range?: { from: number; to: number };
  maybeSingle: boolean;
};

function createMockPackageSupabaseClient(options?: {
  rows?: Partial<RowsByTable>;
  errors?: Partial<Record<TableName, PackageSupabaseError>>;
}) {
  const rows: RowsByTable = {
    packages: [],
    client_packages: [],
    package_usage_history: [],
    ...options?.rows,
  };
  const calls: QueryCall[] = [];

  const client = {
    from(table: TableName) {
      return {
        select(columns: string, selectOptions?: { count?: "exact" }) {
          const call: QueryCall = {
            table,
            select: {
              columns,
              options: selectOptions,
            },
            eq: [],
            ilike: [],
            or: [],
            maybeSingle: false,
          };
          calls.push(call);

          const builder = {
            eq(column: string, value: string) {
              call.eq.push({ column, value });
              return builder;
            },
            ilike(column: string, pattern: string) {
              call.ilike.push({ column, pattern });
              return builder;
            },
            or(filters: string) {
              call.or.push(filters);
              return builder;
            },
            order(column: string, orderOptions?: { ascending?: boolean }) {
              call.order = { column, options: orderOptions };
              return builder;
            },
            async range(from: number, to: number) {
              call.range = { from, to };

              return {
                data: rows[table],
                error: options?.errors?.[table] ?? null,
                count: rows[table].length,
              };
            },
            async maybeSingle() {
              call.maybeSingle = true;

              return {
                data: rows[table][0] ?? null,
                error: options?.errors?.[table] ?? null,
              };
            },
          };

          return builder;
        },
      };
    },
  } as unknown as PackageSupabaseClient;

  return { client, calls };
}

describe("package Supabase row mappers", () => {
  it("maps package rows with priceIdr naming and no cents naming", () => {
    const packageItem = mapPackageRow(packageRow);

    expect(packageItem.name).toBe("Mock Intro Package");
    expect(packageItem.packageType).toBe("intro");
    expect(packageItem.priceIdr).toBe(750000);
    expect("priceCents" in packageItem).toBe(false);
  });

  it("maps client package rows with safe names and balances", () => {
    const clientPackage = mapClientPackageRow(clientPackageRow);

    expect(clientPackage.clientName).toBe("Mock Client Alpha");
    expect(clientPackage.packageName).toBe("Mock Intro Package");
    expect(clientPackage.remainingSessions).toBe(2);
    expect(JSON.stringify(clientPackage)).not.toMatch(
      /phone|email|payment|clinical|whatsapp|contact/i,
    );
  });

  it("maps package usage history rows without payment or clinical fields", () => {
    const historyItem = mapPackageUsageHistoryRow(usageHistoryRow);

    expect(historyItem.changeType).toBe("assigned");
    expect(historyItem.afterRemaining).toBe(2);
    expect(JSON.stringify(historyItem)).not.toMatch(
      /phone|email|payment|clinical|whatsapp|contact/i,
    );
  });

  it("rejects invalid package status through domain schemas", () => {
    expect(() =>
      mapPackageRow({
        ...packageRow,
        status: "not_a_status",
      }),
    ).toThrow();
  });
});

describe("package repository factory", () => {
  it("falls back to mock repositories for missing or invalid data mode", async () => {
    vi.stubEnv("HOM_DATA_MODE", "invalid_mode");

    let supabaseFactoryCalled = false;
    const { client } = createMockPackageSupabaseClient();
    const repositories = await createPackageRepositories({
      createSupabaseClient: async () => {
        supabaseFactoryCalled = true;
        return client;
      },
    });
    const result = await repositories.packages.list();

    expect(supabaseFactoryCalled).toBe(false);
    expect(result.items[0]?.name).toBe("Mock Intro Package");
  });

  it("selects Supabase repositories when HOM_DATA_MODE is supabase", async () => {
    vi.stubEnv("HOM_DATA_MODE", "supabase");

    const { client, calls } = createMockPackageSupabaseClient({
      rows: {
        packages: [packageRow],
      },
    });
    const repositories = await createPackageRepositories({
      createSupabaseClient: async () => client,
    });

    await repositories.packages.list();

    expect(calls[0]?.table).toBe("packages");
  });

  it("exposes only list and getById methods on Supabase repositories", () => {
    const { client } = createMockPackageSupabaseClient();
    const repositories = createSupabasePackageRepositories(client);

    expect(Object.keys(repositories.packages).sort()).toEqual([
      "getById",
      "list",
    ]);
    expect(Object.keys(repositories.clientPackages).sort()).toEqual([
      "getById",
      "list",
    ]);
    expect(Object.keys(repositories.packageUsageHistory).sort()).toEqual([
      "getById",
      "list",
    ]);
  });
});

describe("package Supabase repositories", () => {
  it("builds package list queries with priceIdr fields only", async () => {
    const { client, calls } = createMockPackageSupabaseClient({
      rows: {
        packages: [packageRow],
      },
    });
    const repository = createSupabasePackageRepositories(client).packages;
    const result = await repository.list({
      status: "active",
      packageType: "intro",
      search: "Intro",
      page: 2,
      pageSize: 10,
    });

    await repository.getById(packageRow.id);

    expect(result.items[0]?.priceIdr).toBe(750000);
    expect(calls[0]).toMatchObject({
      table: "packages",
      select: {
        options: {
          count: "exact",
        },
      },
      eq: [
        { column: "status", value: "active" },
        { column: "package_type", value: "intro" },
      ],
      or: ["name.ilike.%Intro%,package_type.ilike.%Intro%"],
      order: { column: "name", options: { ascending: true } },
      range: { from: 10, to: 19 },
    });
    expect(calls[0]?.select.columns).toContain("price_idr");
    expect(calls[0]?.select.columns).not.toContain("price_cents");
    expect(calls[1]).toMatchObject({
      table: "packages",
      eq: [{ column: "id", value: packageRow.id }],
      maybeSingle: true,
    });
  });

  it("builds client package list queries without sensitive fields", async () => {
    const { client, calls } = createMockPackageSupabaseClient({
      rows: {
        client_packages: [clientPackageRow],
      },
    });
    const repository = createSupabasePackageRepositories(client).clientPackages;
    const result = await repository.list({
      status: "active",
      clientId: clientPackageRow.client_id,
      packageId: clientPackageRow.package_id,
      page: 1,
      pageSize: 20,
    });

    await repository.getById(clientPackageRow.id);

    expect(result.items[0]?.clientName).toBe("Mock Client Alpha");
    expect(calls[0]).toMatchObject({
      table: "client_packages",
      select: {
        options: {
          count: "exact",
        },
      },
      eq: [
        { column: "status", value: "active" },
        { column: "client_id", value: clientPackageRow.client_id },
        { column: "package_id", value: clientPackageRow.package_id },
      ],
      order: { column: "updated_at", options: { ascending: false } },
      range: { from: 0, to: 19 },
    });
    expect(calls[0]?.select.columns).toContain("remaining_sessions");
    expect(calls[0]?.select.columns).toContain("clients(full_name)");
    expect(calls[0]?.select.columns).not.toMatch(
      /phone|email|payment|clinical|whatsapp|contact/i,
    );
    expect(calls[1]).toMatchObject({
      table: "client_packages",
      eq: [{ column: "id", value: clientPackageRow.id }],
      maybeSingle: true,
    });
  });

  it("builds package usage history queries as read-only history", async () => {
    const { client, calls } = createMockPackageSupabaseClient({
      rows: {
        package_usage_history: [usageHistoryRow],
      },
    });
    const repository =
      createSupabasePackageRepositories(client).packageUsageHistory;

    await repository.list({
      clientPackageId: usageHistoryRow.client_package_id,
      changeType: "assigned",
      page: 1,
      pageSize: 20,
    });
    await repository.getById(usageHistoryRow.id);

    expect(calls[0]).toMatchObject({
      table: "package_usage_history",
      select: {
        options: {
          count: "exact",
        },
      },
      eq: [
        {
          column: "client_package_id",
          value: usageHistoryRow.client_package_id,
        },
        { column: "change_type", value: "assigned" },
      ],
      order: { column: "created_at", options: { ascending: false } },
      range: { from: 0, to: 19 },
    });
    expect(calls[1]).toMatchObject({
      table: "package_usage_history",
      eq: [{ column: "id", value: usageHistoryRow.id }],
      maybeSingle: true,
    });
  });

  it("converts Supabase errors into safe PackageRepositoryError instances", async () => {
    const { client } = createMockPackageSupabaseClient({
      errors: {
        packages: {
          code: "42501",
          message: "permission denied for table packages",
          details: "raw database detail",
        },
      },
    });
    const repository = createSupabasePackageRepositories(client).packages;

    await expect(repository.list()).rejects.toMatchObject({
      name: "PackageRepositoryError",
      message: "Package data could not be loaded.",
      operation: "packages.list",
      table: "packages",
      code: "42501",
    });

    try {
      await repository.list();
    } catch (error) {
      expect(error).toBeInstanceOf(PackageRepositoryError);
      expect((error as Error).message).not.toContain("permission denied");
      expect((error as Error).message).not.toContain("raw database detail");
    }
  });
});

describe("package page loaders and display helpers", () => {
  it("returns ready package state in mock mode", async () => {
    vi.stubEnv("HOM_DATA_MODE", "mock");

    const state = await loadPackagesPage();

    expect(state.status).toBe("ready");
    if (state.status === "ready") {
      expect(state.rows[0]?.name).toBe("Mock Intro Package");
    }
  });

  it("returns empty states for empty repositories", async () => {
    await expect(
      loadPackagesPage({
        repositories: {
          packages: createEmptyPackageRepository(),
        },
        source: "mock",
      }),
    ).resolves.toMatchObject({
      status: "empty",
      source: "mock",
    });

    await expect(
      loadClientPackagesPage({
        repositories: {
          clientPackages: createEmptyClientPackageRepository(),
        },
        source: "mock",
      }),
    ).resolves.toMatchObject({
      status: "empty",
      source: "mock",
    });
  });

  it("maps repository errors to permission and configuration states safely", async () => {
    await expect(
      loadPackagesPage({
        repositories: {
          packages: {
            async list() {
              throw new PackageRepositoryError({
                operation: "packages.list",
                table: "packages",
                code: "42501",
              });
            },
            async getById() {
              return null;
            },
          },
        },
        source: "supabase",
      }),
    ).resolves.toMatchObject({
      status: "permission_denied",
      source: "supabase",
    });

    await expect(
      loadClientPackagesPage({
        repositories: {
          clientPackages: {
            async list() {
              throw new Error(
                "Supabase public environment variables are missing",
              );
            },
            async getById() {
              return null;
            },
          },
        },
        source: "supabase",
      }),
    ).resolves.toMatchObject({
      status: "configuration_error",
      source: "supabase",
    });
  });

  it("formats priceIdr and remaining sessions without cents naming", () => {
    expect(formatPriceIdr(1800000)).toBe("Rp 1.800.000");
    expect(formatRemainingSessions(3, 4)).toBe("3 / 4");

    const packageTableRow = toPackageTableRow(mapPackageRow(packageRow));
    const clientPackageTableRow = toClientPackageTableRow(
      mapClientPackageRow({
        ...clientPackageRow,
        total_sessions: 4,
        remaining_sessions: 3,
      }),
    );

    expect(packageTableRow.priceIdr).toBe("Rp 750.000");
    expect(clientPackageTableRow.remainingSessions).toBe("3 / 4");
    expect(JSON.stringify(packageTableRow)).not.toContain("Cents");
    expect(JSON.stringify(clientPackageTableRow)).not.toContain("Cents");
    expect(JSON.stringify(clientPackageTableRow)).not.toMatch(
      /phone|email|payment|clinical|whatsapp|contact/i,
    );
  });
});
