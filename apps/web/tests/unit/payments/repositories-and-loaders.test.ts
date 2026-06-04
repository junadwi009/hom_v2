import { afterEach, describe, expect, it, vi } from "vitest";

import { PaymentRepositoryError } from "../../../src/lib/payments/errors";
import {
  createPaymentRepositories,
  createSupabasePaymentRepositories,
} from "../../../src/lib/payments/repository-factory";
import { mapPaymentRow } from "../../../src/lib/payments/supabase/payment-row-mapper";
import { mapPaymentStatusHistoryRow } from "../../../src/lib/payments/supabase/payment-status-history-row-mapper";
import type {
  PaymentRow,
  PaymentStatusHistoryRow,
  PaymentSupabaseClient,
  PaymentSupabaseError,
} from "../../../src/lib/payments/supabase/types";
import {
  createEmptyPaymentRepository,
  loadPaymentsPage,
} from "../../../src/features/payments/payments-page-loader";
import {
  formatAmountIdr,
  toPaymentTableRow,
} from "../../../src/features/payments/payments-page-state";

afterEach(() => {
  vi.unstubAllEnvs();
});

const paymentRow: PaymentRow = {
  id: "60000000-0000-4000-8000-000000000001",
  client_id: "10000000-0000-4000-8000-000000000001",
  client_package_id: "51000000-0000-4000-8000-000000000001",
  amount_idr: "750000",
  payment_method: "cash",
  status: "paid",
  paid_at: "2026-06-01 02:00:00+00",
  reference_number: "MOCK-PAY-0001",
  notes: "Mock cash settlement.",
  created_by_app_user_id: "94000000-0000-4000-8000-000000000001",
  updated_by_app_user_id: "94000000-0000-4000-8000-000000000001",
  created_at: "2026-06-01 02:00:00+00",
  updated_at: "2026-06-01 02:05:00+00",
  clients: { full_name: "Mock Client Alpha" },
  client_packages: { packages: { name: "Mock Intro Package" } },
};

const unlinkedPaymentRow: PaymentRow = {
  ...paymentRow,
  id: "60000000-0000-4000-8000-000000000002",
  client_package_id: null,
  payment_method: "bank_transfer",
  status: "pending",
  paid_at: null,
  reference_number: null,
  notes: null,
  clients: { full_name: "Mock Client Beta" },
  client_packages: null,
};

const statusHistoryRow: PaymentStatusHistoryRow = {
  id: "61000000-0000-4000-8000-000000000001",
  payment_id: "60000000-0000-4000-8000-000000000001",
  from_status: null,
  to_status: "paid",
  reason: "Mock initial payment record.",
  actor_app_user_id: "94000000-0000-4000-8000-000000000001",
  metadata: { paymentId: "60000000-0000-4000-8000-000000000001" },
  created_at: "2026-06-01 02:05:00+00",
};

type TableName = "payments" | "payment_status_history";

type RowsByTable = {
  payments: PaymentRow[];
  payment_status_history: PaymentStatusHistoryRow[];
};

type QueryCall = {
  table: TableName;
  select: { columns: string; options?: { count?: "exact" } };
  eq: { column: string; value: string }[];
  or: string[];
  order?: { column: string; options?: { ascending?: boolean } };
  range?: { from: number; to: number };
  maybeSingle: boolean;
};

function createMockPaymentSupabaseClient(options?: {
  rows?: Partial<RowsByTable>;
  errors?: Partial<Record<TableName, PaymentSupabaseError>>;
}) {
  const rows: RowsByTable = {
    payments: [],
    payment_status_history: [],
    ...options?.rows,
  };
  const calls: QueryCall[] = [];

  const client = {
    from(table: TableName) {
      return {
        select(columns: string, selectOptions?: { count?: "exact" }) {
          const call: QueryCall = {
            table,
            select: { columns, options: selectOptions },
            eq: [],
            or: [],
            maybeSingle: false,
          };
          calls.push(call);

          const builder = {
            eq(column: string, value: string) {
              call.eq.push({ column, value });
              return builder;
            },
            ilike() {
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
  } as unknown as PaymentSupabaseClient;

  return { client, calls };
}

describe("payment Supabase row mappers", () => {
  it("maps payment rows with amountIdr naming and no cents naming", () => {
    const payment = mapPaymentRow(paymentRow);

    expect(payment.clientName).toBe("Mock Client Alpha");
    expect(payment.packageName).toBe("Mock Intro Package");
    expect(payment.amountIdr).toBe(750000);
    expect("amountCents" in payment).toBe(false);
    expect(JSON.stringify(payment)).not.toMatch(
      /card number|account number|cvv|sk_live|gateway/i,
    );
  });

  it("maps unlinked payments without a package name", () => {
    const payment = mapPaymentRow(unlinkedPaymentRow);

    expect(payment.packageName).toBeUndefined();
    expect(payment.paidAt).toBeUndefined();
    expect(payment.referenceNumber).toBeUndefined();
    expect(payment.status).toBe("pending");
  });

  it("maps payment status history rows safely", () => {
    const history = mapPaymentStatusHistoryRow(statusHistoryRow);

    expect(history.toStatus).toBe("paid");
    expect(history.fromStatus).toBeUndefined();
    expect(JSON.stringify(history)).not.toMatch(
      /card number|account number|cvv|sk_live/i,
    );
  });

  it("rejects invalid payment status through domain schemas", () => {
    expect(() =>
      mapPaymentRow({ ...paymentRow, status: "settled" }),
    ).toThrow();
  });
});

describe("payment repository factory", () => {
  it("falls back to mock repositories for missing or invalid data mode", async () => {
    vi.stubEnv("HOM_DATA_MODE", "invalid_mode");

    let supabaseFactoryCalled = false;
    const { client } = createMockPaymentSupabaseClient();
    const repositories = await createPaymentRepositories({
      createSupabaseClient: async () => {
        supabaseFactoryCalled = true;
        return client;
      },
    });
    const result = await repositories.payments.list();

    expect(supabaseFactoryCalled).toBe(false);
    expect(result.items.length).toBeGreaterThan(0);
  });

  it("selects Supabase repositories when HOM_DATA_MODE is supabase", async () => {
    vi.stubEnv("HOM_DATA_MODE", "supabase");

    const { client, calls } = createMockPaymentSupabaseClient({
      rows: { payments: [paymentRow] },
    });
    const repositories = await createPaymentRepositories({
      createSupabaseClient: async () => client,
    });

    await repositories.payments.list();

    expect(calls[0]?.table).toBe("payments");
  });

  it("exposes only list and getById methods on Supabase repositories", () => {
    const { client } = createMockPaymentSupabaseClient();
    const repositories = createSupabasePaymentRepositories(client);

    expect(Object.keys(repositories.payments).sort()).toEqual([
      "getById",
      "list",
    ]);
    expect(Object.keys(repositories.paymentStatusHistory).sort()).toEqual([
      "getById",
      "list",
    ]);
  });
});

describe("payment Supabase repositories", () => {
  it("builds payment list queries with safe fields only", async () => {
    const { client, calls } = createMockPaymentSupabaseClient({
      rows: { payments: [paymentRow] },
    });
    const repository = createSupabasePaymentRepositories(client).payments;
    const result = await repository.list({
      status: "paid",
      paymentMethod: "cash",
      clientId: paymentRow.client_id,
      search: "PAY",
      page: 2,
      pageSize: 10,
    });

    await repository.getById(paymentRow.id);

    expect(result.items[0]?.amountIdr).toBe(750000);
    expect(calls[0]).toMatchObject({
      table: "payments",
      select: { options: { count: "exact" } },
      eq: [
        { column: "status", value: "paid" },
        { column: "payment_method", value: "cash" },
        { column: "client_id", value: paymentRow.client_id },
      ],
      or: [
        "payment_method.ilike.%PAY%,reference_number.ilike.%PAY%",
      ],
      order: { column: "created_at", options: { ascending: false } },
      range: { from: 10, to: 19 },
    });
    expect(calls[0]?.select.columns).toContain("amount_idr");
    expect(calls[0]?.select.columns).toContain("clients(full_name)");
    expect(calls[0]?.select.columns).toContain("client_packages(packages(name))");
    expect(calls[0]?.select.columns).not.toContain("amount_cents");
    expect(calls[0]?.select.columns).not.toMatch(
      /card|bank_account|gateway|token|cvv/i,
    );
    expect(calls[1]).toMatchObject({
      table: "payments",
      eq: [{ column: "id", value: paymentRow.id }],
      maybeSingle: true,
    });
  });

  it("builds payment status history queries as read-only history", async () => {
    const { client, calls } = createMockPaymentSupabaseClient({
      rows: { payment_status_history: [statusHistoryRow] },
    });
    const repository =
      createSupabasePaymentRepositories(client).paymentStatusHistory;

    await repository.list({
      paymentId: statusHistoryRow.payment_id,
      toStatus: "paid",
      page: 1,
      pageSize: 20,
    });
    await repository.getById(statusHistoryRow.id);

    expect(calls[0]).toMatchObject({
      table: "payment_status_history",
      eq: [
        { column: "payment_id", value: statusHistoryRow.payment_id },
        { column: "to_status", value: "paid" },
      ],
      order: { column: "created_at", options: { ascending: false } },
      range: { from: 0, to: 19 },
    });
    expect(calls[1]).toMatchObject({
      table: "payment_status_history",
      eq: [{ column: "id", value: statusHistoryRow.id }],
      maybeSingle: true,
    });
  });

  it("converts Supabase errors into safe PaymentRepositoryError instances", async () => {
    const { client } = createMockPaymentSupabaseClient({
      errors: {
        payments: {
          code: "42501",
          message: "permission denied for table payments",
          details: "raw database detail",
        },
      },
    });
    const repository = createSupabasePaymentRepositories(client).payments;

    await expect(repository.list()).rejects.toMatchObject({
      name: "PaymentRepositoryError",
      message: "Payment data could not be loaded.",
      operation: "payments.list",
      table: "payments",
      code: "42501",
    });

    try {
      await repository.list();
    } catch (error) {
      expect(error).toBeInstanceOf(PaymentRepositoryError);
      expect((error as Error).message).not.toContain("permission denied");
      expect((error as Error).message).not.toContain("raw database detail");
    }
  });
});

describe("payment page loader and display helpers", () => {
  it("returns ready payment state in mock mode", async () => {
    vi.stubEnv("HOM_DATA_MODE", "mock");

    const state = await loadPaymentsPage();

    expect(state.status).toBe("ready");
    if (state.status === "ready") {
      expect(state.rows.length).toBeGreaterThan(0);
      expect(state.rows[0]?.clientName).toBeTruthy();
    }
  });

  it("returns an empty state for empty repositories", async () => {
    await expect(
      loadPaymentsPage({
        repositories: { payments: createEmptyPaymentRepository() },
        source: "mock",
      }),
    ).resolves.toMatchObject({ status: "empty", source: "mock" });
  });

  it("maps repository errors to permission and configuration states safely", async () => {
    await expect(
      loadPaymentsPage({
        repositories: {
          payments: {
            async list() {
              throw new PaymentRepositoryError({
                operation: "payments.list",
                table: "payments",
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
      loadPaymentsPage({
        repositories: {
          payments: {
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

  it("formats amountIdr and table rows without cents or sensitive fields", () => {
    expect(formatAmountIdr(1800000)).toBe("Rp 1.800.000");

    const linkedRow = toPaymentTableRow(mapPaymentRow(paymentRow));
    const unlinkedRow = toPaymentTableRow(mapPaymentRow(unlinkedPaymentRow));

    expect(linkedRow.amountIdr).toBe("Rp 750.000");
    expect(linkedRow.packageName).toBe("Mock Intro Package");
    expect(linkedRow.paidAt).toBe("2026-06-01");
    expect(unlinkedRow.packageName).toBe("—");
    expect(unlinkedRow.paidAt).toBe("—");
    expect(unlinkedRow.referenceNumber).toBe("—");
    expect(JSON.stringify(linkedRow)).not.toContain("Cents");
    expect(JSON.stringify(linkedRow)).not.toMatch(
      /card number|account number|cvv|gateway|token|notes/i,
    );
  });
});
