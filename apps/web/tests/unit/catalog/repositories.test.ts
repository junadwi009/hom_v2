import { describe, expect, it, vi, afterEach } from "vitest";

import {
  GENERIC_MASKED_EMAIL,
  GENERIC_MASKED_PHONE,
  maskEmail,
  maskPhone,
} from "../../../src/lib/catalog/contact-masking";
import { CatalogRepositoryError } from "../../../src/lib/catalog/errors";
import {
  createCatalogRepositories,
  createSupabaseCatalogRepositories,
} from "../../../src/lib/catalog/repository-factory";
import { mapClientRow } from "../../../src/lib/catalog/supabase/client-row-mapper";
import { createSupabaseClientRepository } from "../../../src/lib/catalog/supabase/client-repository";
import { mapPractitionerRow } from "../../../src/lib/catalog/supabase/practitioner-row-mapper";
import { mapServiceRow } from "../../../src/lib/catalog/supabase/service-row-mapper";
import type {
  CatalogSupabaseClient,
  CatalogSupabaseError,
  ClientRow,
  PractitionerRow,
  ServiceRow,
} from "../../../src/lib/catalog/supabase/types";

const clientRow: ClientRow = {
  id: "10000000-0000-4000-8000-000000000001",
  full_name: "Mock Client 001",
  phone: "+62 000-0000-0002",
  email: "mock.client.001@example.invalid",
  status: "active",
  primary_practitioner_id: "20000000-0000-4000-8000-000000000001",
  created_by_app_user_id: null,
  created_at: "2026-05-27 01:00:00+00",
  updated_at: "2026-05-27 01:00:00+00",
  practitioners: {
    display_name: "Mock Practitioner 001",
  },
};

const practitionerRow: PractitionerRow = {
  id: "20000000-0000-4000-8000-000000000001",
  app_user_id: null,
  display_name: "Mock Practitioner 001",
  email: "mock.practitioner.001@example.invalid",
  status: "active",
  created_at: "2026-05-27 01:00:00+00",
  updated_at: "2026-05-27 01:00:00+00",
};

const serviceRow: ServiceRow = {
  id: "30000000-0000-4000-8000-000000000001",
  name: "Mock Service 001 Intro Assessment",
  category: "assessment",
  default_duration_minutes: 60,
  default_price_idr: 450000,
  status: "active",
  created_at: "2026-05-27 01:00:00+00",
  updated_at: "2026-05-27 01:00:00+00",
};

type TableName = "clients" | "practitioners" | "services";

type RowsByTable = {
  clients: ClientRow[];
  practitioners: PractitionerRow[];
  services: ServiceRow[];
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

function createMockCatalogSupabaseClient(options?: {
  rows?: Partial<RowsByTable>;
  errors?: Partial<Record<TableName, CatalogSupabaseError>>;
}) {
  const rows: RowsByTable = {
    clients: [],
    practitioners: [],
    services: [],
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
  } as unknown as CatalogSupabaseClient;

  return { client, calls };
}

describe("catalog contact masking", () => {
  it("masks valid emails while preserving only a masked local part and visible domain", () => {
    expect(maskEmail(null)).toBeNull();
    expect(maskEmail("mock.client.001@example.invalid")).toBe(
      "m***@example.invalid",
    );
  });

  it("masks valid phones with at most the last four digits visible", () => {
    const maskedPhone = maskPhone("+62 000-0000-0002");

    expect(maskPhone(null)).toBeNull();
    expect(maskedPhone).toBe("***-***-0002");
    expect(maskedPhone?.match(/\d/g)?.length).toBe(4);
  });

  it("returns generic masked values for malformed contact input", () => {
    expect(maskEmail("not an email")).toBe(GENERIC_MASKED_EMAIL);
    expect(maskPhone("call me at 123456")).toBe(GENERIC_MASKED_PHONE);
  });
});

describe("catalog Supabase row mappers", () => {
  it("maps client rows without exposing raw contact fields", () => {
    const client = mapClientRow(clientRow);

    expect(client.fullName).toBe("Mock Client 001");
    expect(client.primaryPractitionerName).toBe("Mock Practitioner 001");
    expect(client.maskedPhone).toBe("***-***-0002");
    expect(client.maskedEmail).toBe("m***@example.invalid");
    expect("phone" in client).toBe(false);
    expect("email" in client).toBe(false);
    expect(JSON.stringify(client)).not.toContain(clientRow.email);
    expect(JSON.stringify(client)).not.toContain(clientRow.phone);
  });

  it("maps practitioner rows without exposing raw email fields", () => {
    const practitioner = mapPractitionerRow(practitionerRow);

    expect(practitioner.appUserId).toBeNull();
    expect(practitioner.displayName).toBe("Mock Practitioner 001");
    expect(practitioner.maskedEmail).toBe("m***@example.invalid");
    expect("email" in practitioner).toBe(false);
    expect(JSON.stringify(practitioner)).not.toContain(practitionerRow.email);
  });

  it("maps service rows with IDR price naming only", () => {
    const service = mapServiceRow(serviceRow);

    expect(service.defaultDurationMinutes).toBe(60);
    expect(service.defaultPriceIdr).toBe(450000);
    expect("defaultPriceCents" in service).toBe(false);
  });

  it("rejects invalid catalog statuses through domain schemas", () => {
    expect(() =>
      mapClientRow({
        ...clientRow,
        status: "not_a_status",
      }),
    ).toThrow();
  });
});

describe("catalog repository factory", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("falls back to mock repositories for missing or invalid data mode", async () => {
    vi.stubEnv("HOM_DATA_MODE", "invalid_mode");

    let supabaseFactoryCalled = false;
    const { client } = createMockCatalogSupabaseClient();
    const repositories = await createCatalogRepositories({
      createSupabaseClient: async () => {
        supabaseFactoryCalled = true;
        return client;
      },
    });
    const result = await repositories.clients.list();

    expect(supabaseFactoryCalled).toBe(false);
    expect(result.items[0]?.fullName).toBe("Mock Client Alpha");
  });

  it("selects Supabase repositories when HOM_DATA_MODE is supabase", async () => {
    vi.stubEnv("HOM_DATA_MODE", "supabase");

    const { client, calls } = createMockCatalogSupabaseClient({
      rows: {
        services: [serviceRow],
      },
    });
    const repositories = await createCatalogRepositories({
      createSupabaseClient: async () => client,
    });

    await repositories.services.list();

    expect(calls[0]?.table).toBe("services");
  });

  it("exposes only list and getById methods on Supabase repositories", () => {
    const { client } = createMockCatalogSupabaseClient();
    const repositories = createSupabaseCatalogRepositories(client);

    expect(Object.keys(repositories.clients).sort()).toEqual([
      "getById",
      "list",
    ]);
    expect(Object.keys(repositories.practitioners).sort()).toEqual([
      "getById",
      "list",
    ]);
    expect(Object.keys(repositories.services).sort()).toEqual([
      "getById",
      "list",
    ]);
  });
});

describe("catalog Supabase repositories", () => {
  it("builds client list and getById queries safely", async () => {
    const { client, calls } = createMockCatalogSupabaseClient({
      rows: {
        clients: [clientRow],
      },
    });
    const repository = createSupabaseCatalogRepositories(client).clients;

    await repository.list({
      status: "active",
      search: "Mock",
      page: 2,
      pageSize: 10,
    });
    await repository.getById(clientRow.id);

    expect(calls[0]).toMatchObject({
      table: "clients",
      select: {
        options: {
          count: "exact",
        },
      },
      eq: [{ column: "status", value: "active" }],
      ilike: [{ column: "full_name", pattern: "%Mock%" }],
      order: { column: "full_name", options: { ascending: true } },
      range: { from: 10, to: 19 },
    });
    expect(calls[0]?.select.columns).toContain("practitioners(display_name)");
    expect(calls[1]).toMatchObject({
      table: "clients",
      eq: [{ column: "id", value: clientRow.id }],
      maybeSingle: true,
    });
  });

  it("builds practitioner list queries with safe display search", async () => {
    const { client, calls } = createMockCatalogSupabaseClient({
      rows: {
        practitioners: [practitionerRow],
      },
    });
    const repository = createSupabaseCatalogRepositories(client).practitioners;

    await repository.list({
      status: "active",
      search: "Practitioner",
      page: 1,
      pageSize: 5,
    });

    expect(calls[0]).toMatchObject({
      table: "practitioners",
      eq: [{ column: "status", value: "active" }],
      ilike: [{ column: "display_name", pattern: "%Practitioner%" }],
      order: { column: "display_name", options: { ascending: true } },
      range: { from: 0, to: 4 },
    });
  });

  it("builds service list and getById queries with IDR naming", async () => {
    const { client, calls } = createMockCatalogSupabaseClient({
      rows: {
        services: [serviceRow],
      },
    });
    const repository = createSupabaseCatalogRepositories(client).services;
    const result = await repository.list({
      status: "active",
      category: "assessment",
      search: "Intro",
      page: 1,
      pageSize: 20,
    });

    await repository.getById(serviceRow.id);

    expect(result.items[0]?.defaultPriceIdr).toBe(450000);
    expect(calls[0]).toMatchObject({
      table: "services",
      select: {
        options: {
          count: "exact",
        },
      },
      eq: [
        { column: "status", value: "active" },
        { column: "category", value: "assessment" },
      ],
      or: ["name.ilike.%Intro%,category.ilike.%Intro%"],
      order: { column: "name", options: { ascending: true } },
      range: { from: 0, to: 19 },
    });
    expect(calls[0]?.select.columns).toContain("default_price_idr");
    expect(calls[0]?.select.columns).not.toContain("default_price_cents");
    expect(calls[1]).toMatchObject({
      table: "services",
      eq: [{ column: "id", value: serviceRow.id }],
      maybeSingle: true,
    });
  });

  it("converts Supabase errors into safe CatalogRepositoryError instances", async () => {
    const { client } = createMockCatalogSupabaseClient({
      errors: {
        clients: {
          code: "42501",
          message: "permission denied for table clients",
          details: "raw database detail",
        },
      },
    });
    const repository = createSupabaseClientRepository(client);

    await expect(repository.list()).rejects.toMatchObject({
      name: "CatalogRepositoryError",
      message: "Catalog data could not be loaded.",
      operation: "clients.list",
      table: "clients",
      code: "42501",
    });

    try {
      await repository.list();
    } catch (error) {
      expect(error).toBeInstanceOf(CatalogRepositoryError);
      expect((error as Error).message).not.toContain("permission denied");
      expect((error as Error).message).not.toContain("raw database detail");
    }
  });
});
