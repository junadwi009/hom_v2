import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  deductClientPackageSession,
  DeductClientPackageSessionRpcError,
  type DeductClientPackageSessionRpcClient,
} from "../../../src/lib/packages/server/deduct-client-package-session";

const rpcRow = {
  id: "51000000-0000-4000-8000-000000000004",
  client_id: "10000000-0000-4000-8000-000000000004",
  client_name: "Mock Client 004",
  package_id: "50000000-0000-4000-8000-000000000004",
  package_name: "Mock Monthly Membership",
  purchased_at: "2026-06-06 02:00:00+00",
  expires_at: "2026-07-06 02:00:00+00",
  total_sessions: 8,
  remaining_sessions: 7,
  status: "active",
  created_at: "2026-06-06 02:00:00+00",
  updated_at: "2026-06-06 02:00:00+00",
};

const validInput = {
  appointmentId: "40000000-0000-4000-8000-000000000003",
  clientPackageId: rpcRow.id,
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
    client: {
      rpc,
    } as DeductClientPackageSessionRpcClient,
    rpc,
  };
}

describe("server-only deduct client package session adapter", () => {
  it("validates input, calls the deduct-only RPC, and maps the safe result", async () => {
    const { client, rpc } = createMockRpcClient();

    await expect(
      deductClientPackageSession(validInput, {
        createSupabaseClient: async () => client,
      }),
    ).resolves.toMatchObject({
      id: rpcRow.id,
      clientName: "Mock Client 004",
      packageName: "Mock Monthly Membership",
      totalSessions: 8,
      remainingSessions: 7,
      status: "active",
    });

    expect(rpc).toHaveBeenCalledWith("deduct_client_package_session", {
      p_appointment_id: validInput.appointmentId,
      p_client_package_id: validInput.clientPackageId,
    });
  });

  it("maps a depleted result when remaining reaches zero", async () => {
    const { client } = createMockRpcClient({
      data: [{ ...rpcRow, remaining_sessions: 0, status: "depleted" }],
    });

    await expect(
      deductClientPackageSession(validInput, {
        createSupabaseClient: async () => client,
      }),
    ).resolves.toMatchObject({
      remainingSessions: 0,
      status: "depleted",
    });
  });

  it("rejects extra payment, contact, clinical, or WhatsApp fields before RPC", async () => {
    const { client, rpc } = createMockRpcClient();

    await expect(
      deductClientPackageSession(
        {
          ...validInput,
          paymentReference: "not allowed",
          contactNote: "not allowed",
        },
        {
          createSupabaseClient: async () => client,
        },
      ),
    ).rejects.toThrow();
    expect(rpc).not.toHaveBeenCalled();
  });

  it("converts known RPC failures to safe application errors", async () => {
    const { client } = createMockRpcClient({
      error: {
        code: "P0001",
        message: "ALREADY_DEDUCTED",
        details: "raw database details",
      },
    });

    await expect(
      deductClientPackageSession(validInput, {
        createSupabaseClient: async () => client,
      }),
    ).rejects.toMatchObject({
      name: "DeductClientPackageSessionRpcError",
      message: "Client package session could not be deducted.",
      code: "ALREADY_DEDUCTED",
    });

    try {
      await deductClientPackageSession(validInput, {
        createSupabaseClient: async () => client,
      });
    } catch (error) {
      expect(error).toBeInstanceOf(DeductClientPackageSessionRpcError);
      expect((error as Error).message).not.toContain("raw database details");
    }
  });

  it("falls back to a generic failure when no row is returned", async () => {
    const { client } = createMockRpcClient({ data: [] });

    await expect(
      deductClientPackageSession(validInput, {
        createSupabaseClient: async () => client,
      }),
    ).rejects.toMatchObject({
      code: "DEDUCT_CLIENT_PACKAGE_SESSION_FAILED",
    });
  });

  it("keeps the adapter server-only and free of service-role clients", () => {
    const source = readWorkspaceFile(
      "apps/web/src/lib/packages/server/deduct-client-package-session.ts",
    );

    expect(source).toContain('import "server-only";');
    expect(source).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(source).not.toContain("service-role");
  });

  it("keeps direct table writes blocked and grants authenticated RPC execute only", () => {
    const migration = readWorkspaceFile(
      "supabase/migrations/20260603000300_deduct_client_package_session_rpc.sql",
    );

    expect(migration).toContain(
      "create or replace function public.deduct_client_package_session(",
    );
    expect(migration).toContain("can_manage_client_packages");
    expect(migration).toContain("package_usage.recorded");
    expect(migration).toContain(
      "uq_package_usage_history_deducted_appointment",
    );
    expect(migration).toContain("to authenticated;");
    expect(migration).not.toMatch(
      /grant (insert|update|delete) on public\.(client_packages|package_usage_history|audit_logs) to authenticated/i,
    );
  });
});

function readWorkspaceFile(path: string) {
  return readFileSync(resolve(process.cwd(), "../..", path), "utf8");
}
