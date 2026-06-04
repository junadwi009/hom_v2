import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  createManualPayment,
  CreateManualPaymentRpcError,
  type CreateManualPaymentRpcClient,
} from "../../../src/lib/payments/server/create-manual-payment";

const rpcRow = {
  id: "60000000-0000-4000-8000-0000000000aa",
  client_id: "10000000-0000-4000-8000-000000000001",
  client_name: "Mock Client Alpha",
  client_package_id: "51000000-0000-4000-8000-000000000001" as string | null,
  package_name: "Mock Intro Package" as string | null,
  amount_idr: 750000 as number | string,
  payment_method: "cash",
  status: "paid",
  paid_at: "2026-06-03 02:00:00+00" as string | null,
  reference_number: "MOCK-PAY-9001" as string | null,
  notes: "Mock cash settlement." as string | null,
  created_by_app_user_id: "94000000-0000-4000-8000-000000000001" as
    | string
    | null,
  updated_by_app_user_id: "94000000-0000-4000-8000-000000000001" as
    | string
    | null,
  created_at: "2026-06-03 02:00:00+00",
  updated_at: "2026-06-03 02:00:00+00",
};

const validInput = {
  clientId: rpcRow.client_id,
  clientPackageId: rpcRow.client_package_id,
  amountIdr: 750000,
  paymentMethod: "cash",
  status: "paid",
  paidAt: "2026-06-03T02:00:00.000Z",
} as const;

function createMockRpcClient(options?: {
  data?: (typeof rpcRow)[];
  error?: unknown;
}) {
  const rpc = vi.fn(async () => ({
    data: options?.data ?? [rpcRow],
    error: options?.error ?? null,
  }));

  return {
    client: { rpc } as CreateManualPaymentRpcClient,
    rpc,
  };
}

describe("server-only create manual payment adapter", () => {
  it("validates input, calls the create-only RPC, and maps the safe result", async () => {
    const { client, rpc } = createMockRpcClient();

    await expect(
      createManualPayment(validInput, {
        createSupabaseClient: async () => client,
      }),
    ).resolves.toMatchObject({
      id: rpcRow.id,
      clientName: "Mock Client Alpha",
      packageName: "Mock Intro Package",
      amountIdr: 750000,
      paymentMethod: "cash",
      status: "paid",
    });

    expect(rpc).toHaveBeenCalledWith("create_manual_payment", {
      p_client_id: validInput.clientId,
      p_client_package_id: validInput.clientPackageId,
      p_amount_idr: 750000,
      p_payment_method: "cash",
      p_status: "paid",
      p_paid_at: validInput.paidAt,
      p_reference_number: null,
      p_notes: null,
    });
  });

  it("passes null for an unlinked pending payment", async () => {
    const { client, rpc } = createMockRpcClient({
      data: [
        {
          ...rpcRow,
          client_package_id: null,
          package_name: null,
          status: "pending",
          paid_at: null,
          reference_number: null,
          notes: null,
        },
      ],
    });

    await createManualPayment(
      {
        clientId: validInput.clientId,
        amountIdr: 500000,
        paymentMethod: "bank_transfer",
        status: "pending",
      },
      { createSupabaseClient: async () => client },
    );

    expect(rpc).toHaveBeenCalledWith("create_manual_payment", {
      p_client_id: validInput.clientId,
      p_client_package_id: null,
      p_amount_idr: 500000,
      p_payment_method: "bank_transfer",
      p_status: "pending",
      p_paid_at: null,
      p_reference_number: null,
      p_notes: null,
    });
  });

  it("rejects a paid payment without paidAt before the RPC", async () => {
    const { client, rpc } = createMockRpcClient();

    await expect(
      createManualPayment(
        {
          clientId: validInput.clientId,
          amountIdr: 750000,
          paymentMethod: "cash",
          status: "paid",
        },
        { createSupabaseClient: async () => client },
      ),
    ).rejects.toThrow();
    expect(rpc).not.toHaveBeenCalled();
  });

  it("rejects card, bank account, and gateway secret payloads before the RPC", async () => {
    const { client, rpc } = createMockRpcClient();

    await expect(
      createManualPayment(
        { ...validInput, notes: "card 4111 1111 1111 1111" },
        { createSupabaseClient: async () => client },
      ),
    ).rejects.toThrow();
    await expect(
      createManualPayment(
        { ...validInput, referenceNumber: "sk_live_abcdef123456" },
        { createSupabaseClient: async () => client },
      ),
    ).rejects.toThrow();
    await expect(
      createManualPayment(
        { ...validInput, accountNumber: "1234567890123" },
        { createSupabaseClient: async () => client },
      ),
    ).rejects.toThrow();
    expect(rpc).not.toHaveBeenCalled();
  });

  it("converts known RPC failures to safe application errors", async () => {
    const { client } = createMockRpcClient({
      error: {
        code: "P0001",
        message: "CLIENT_PACKAGE_UNAVAILABLE",
        details: "raw database details",
      },
    });

    await expect(
      createManualPayment(validInput, {
        createSupabaseClient: async () => client,
      }),
    ).rejects.toMatchObject({
      name: "CreateManualPaymentRpcError",
      message: "Payment could not be created.",
      code: "CLIENT_PACKAGE_UNAVAILABLE",
    });

    try {
      await createManualPayment(validInput, {
        createSupabaseClient: async () => client,
      });
    } catch (error) {
      expect(error).toBeInstanceOf(CreateManualPaymentRpcError);
      expect((error as Error).message).not.toContain("raw database details");
    }
  });

  it("keeps the adapter server-only and free of service-role clients", () => {
    const source = readWorkspaceFile(
      "apps/web/src/lib/payments/server/create-manual-payment.ts",
    );

    expect(source).toContain('import "server-only";');
    expect(source).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(source).not.toContain("service-role");
  });

  it("keeps direct table writes blocked and grants authenticated RPC execute only", () => {
    const migration = readWorkspaceFile(
      "supabase/migrations/20260603000500_create_manual_payment_rpc.sql",
    );

    expect(migration).toContain(
      "create or replace function public.create_manual_payment(",
    );
    expect(migration).toContain("can_manage_payments");
    expect(migration).toContain("payment.created");
    expect(migration).toContain("to authenticated;");
    expect(migration).not.toMatch(
      /grant (insert|update|delete) on public\.(payments|payment_status_history|audit_logs) to authenticated/i,
    );
  });
});

function readWorkspaceFile(path: string) {
  return readFileSync(resolve(process.cwd(), "../..", path), "utf8");
}
