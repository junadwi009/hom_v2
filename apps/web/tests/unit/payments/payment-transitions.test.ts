import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  markPaymentPaid,
  MarkPaymentPaidRpcError,
  type MarkPaymentPaidRpcClient,
} from "../../../src/lib/payments/server/mark-payment-paid";
import {
  cancelPayment,
  CancelPaymentRpcError,
  type CancelPaymentRpcClient,
} from "../../../src/lib/payments/server/cancel-payment";
import { submitMarkPaymentPaidFormData } from "../../../src/lib/payments/server/submit-mark-payment-paid";
import { submitCancelPaymentFormData } from "../../../src/lib/payments/server/submit-cancel-payment";

const paymentId = "60000000-0000-4000-8000-000000000002";

function paymentRow(status: string) {
  return {
    id: paymentId,
    client_id: "10000000-0000-4000-8000-000000000002",
    client_name: "Mock Client Beta",
    client_package_id: null as string | null,
    package_name: null as string | null,
    amount_idr: 1800000 as number | string,
    payment_method: "bank_transfer",
    status,
    paid_at: (status === "paid" ? "2026-06-03 02:00:00+00" : null) as
      | string
      | null,
    reference_number: null as string | null,
    notes: null as string | null,
    created_by_app_user_id: "94000000-0000-4000-8000-000000000001" as
      | string
      | null,
    updated_by_app_user_id: "94000000-0000-4000-8000-000000000001" as
      | string
      | null,
    created_at: "2026-06-01 02:00:00+00",
    updated_at: "2026-06-03 02:00:00+00",
  };
}

function formData(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) {
    data.set(key, value);
  }
  return data;
}

describe("mark payment paid adapter", () => {
  it("validates input, calls the RPC, and maps the safe result", async () => {
    const rpc = vi.fn(async () => ({ data: [paymentRow("paid")], error: null }));
    const client = { rpc } as MarkPaymentPaidRpcClient;

    await expect(
      markPaymentPaid(
        { paymentId, paidAt: "2026-06-03T02:00:00.000Z" },
        { createSupabaseClient: async () => client },
      ),
    ).resolves.toMatchObject({ id: paymentId, status: "paid" });

    expect(rpc).toHaveBeenCalledWith("mark_payment_paid", {
      p_payment_id: paymentId,
      p_paid_at: "2026-06-03T02:00:00.000Z",
    });
  });

  it("maps known RPC failures to safe error codes", async () => {
    const client = {
      rpc: vi.fn(async () => ({
        data: null,
        error: { code: "P0001", message: "PAYMENT_NOT_PENDING", details: "raw" },
      })),
    } as MarkPaymentPaidRpcClient;

    await expect(
      markPaymentPaid(
        { paymentId, paidAt: "2026-06-03T02:00:00.000Z" },
        { createSupabaseClient: async () => client },
      ),
    ).rejects.toMatchObject({
      name: "MarkPaymentPaidRpcError",
      code: "PAYMENT_NOT_PENDING",
    });
  });

  it("keeps the adapter server-only and authenticated-only", () => {
    const source = readWorkspaceFile(
      "apps/web/src/lib/payments/server/mark-payment-paid.ts",
    );
    expect(source).toContain('import "server-only";');
    expect(source).not.toContain("service-role");

    const migration = readWorkspaceFile(
      "supabase/migrations/20260603000600_payment_status_transitions_rpc.sql",
    );
    expect(migration).toContain("payment.marked_paid");
    expect(migration).toContain("payment.cancelled");
    expect(migration).toContain("to authenticated;");
    expect(migration).not.toMatch(
      /grant (insert|update|delete) on public\.(payments|payment_status_history|audit_logs) to authenticated/i,
    );
  });
});

describe("cancel payment adapter", () => {
  it("validates input, calls the RPC, and maps the safe result", async () => {
    const rpc = vi.fn(async () => ({
      data: [paymentRow("cancelled")],
      error: null,
    }));
    const client = { rpc } as CancelPaymentRpcClient;

    await expect(
      cancelPayment(
        { paymentId, reason: "Mock cancelled in error." },
        { createSupabaseClient: async () => client },
      ),
    ).resolves.toMatchObject({ id: paymentId, status: "cancelled" });

    expect(rpc).toHaveBeenCalledWith("cancel_payment", {
      p_payment_id: paymentId,
      p_reason: "Mock cancelled in error.",
    });
  });

  it("rejects a sensitive reason before the RPC", async () => {
    const rpc = vi.fn();
    const client = { rpc } as unknown as CancelPaymentRpcClient;

    await expect(
      cancelPayment(
        { paymentId, reason: "card 4111 1111 1111 1111" },
        { createSupabaseClient: async () => client },
      ),
    ).rejects.toThrow();
    expect(rpc).not.toHaveBeenCalled();
  });

  it("maps known RPC failures to safe error codes", async () => {
    const client = {
      rpc: vi.fn(async () => ({
        data: null,
        error: { code: "P0001", message: "PAYMENT_NOT_PENDING" },
      })),
    } as CancelPaymentRpcClient;

    await expect(
      cancelPayment(
        { paymentId, reason: "Mock cancellation." },
        { createSupabaseClient: async () => client },
      ),
    ).rejects.toMatchObject({
      name: "CancelPaymentRpcError",
      code: "PAYMENT_NOT_PENDING",
    });
  });
});

describe("submitMarkPaymentPaidFormData", () => {
  it("does not fake persistence in mock mode", async () => {
    const markPaid = vi.fn();
    const result = await submitMarkPaymentPaidFormData(
      formData({ paymentId, paidAtLocal: "2026-06-03T09:00" }),
      { dataMode: "mock", authMode: "mock", markPaid },
    );
    expect(result.status).toBe("configuration_error");
    expect(markPaid).not.toHaveBeenCalled();
  });

  it("marks paid in supabase mode with a converted paid date", async () => {
    const markPaid = vi.fn(async () => ({ id: paymentId })) as never;
    const result = await submitMarkPaymentPaidFormData(
      formData({ paymentId, paidAtLocal: "2026-06-03T09:00" }),
      { dataMode: "supabase", authMode: "supabase", markPaid },
    );
    expect(result).toMatchObject({ status: "success", paymentId });
    const input = (markPaid as unknown as ReturnType<typeof vi.fn>).mock
      .calls[0][0];
    expect(typeof input.paidAt).toBe("string");
  });

  it("maps an invalid transition to a safe state", async () => {
    const markPaid = vi.fn(async () => {
      throw new MarkPaymentPaidRpcError("PAYMENT_NOT_PENDING");
    }) as never;
    const result = await submitMarkPaymentPaidFormData(
      formData({ paymentId, paidAtLocal: "2026-06-03T09:00" }),
      { dataMode: "supabase", authMode: "supabase", markPaid },
    );
    expect(result.status).toBe("invalid_transition");
  });
});

describe("submitCancelPaymentFormData", () => {
  it("does not fake persistence in mock mode", async () => {
    const cancel = vi.fn();
    const result = await submitCancelPaymentFormData(
      formData({ paymentId, reason: "Mock cancellation." }),
      { dataMode: "mock", authMode: "mock", cancel },
    );
    expect(result.status).toBe("configuration_error");
    expect(cancel).not.toHaveBeenCalled();
  });

  it("cancels in supabase mode and returns a safe success", async () => {
    const cancel = vi.fn(async () => ({ id: paymentId })) as never;
    const result = await submitCancelPaymentFormData(
      formData({ paymentId, reason: "Mock cancellation." }),
      { dataMode: "supabase", authMode: "supabase", cancel },
    );
    expect(result).toMatchObject({ status: "success", paymentId });
  });

  it("requires a reason and rejects sensitive content", async () => {
    const emptyReason = await submitCancelPaymentFormData(
      formData({ paymentId, reason: "" }),
      { dataMode: "supabase", authMode: "supabase", cancel: vi.fn() },
    );
    const sensitiveReason = await submitCancelPaymentFormData(
      formData({ paymentId, reason: "refund to card 4111 1111 1111 1111" }),
      { dataMode: "supabase", authMode: "supabase", cancel: vi.fn() },
    );
    expect(emptyReason.status).toBe("validation_error");
    expect(sensitiveReason.status).toBe("validation_error");
  });

  it("maps an invalid transition to a safe state", async () => {
    const cancel = vi.fn(async () => {
      throw new CancelPaymentRpcError("PAYMENT_NOT_PENDING");
    }) as never;
    const result = await submitCancelPaymentFormData(
      formData({ paymentId, reason: "Mock cancellation." }),
      { dataMode: "supabase", authMode: "supabase", cancel },
    );
    expect(result.status).toBe("invalid_transition");
  });
});

function readWorkspaceFile(path: string) {
  return readFileSync(resolve(process.cwd(), "../..", path), "utf8");
}
