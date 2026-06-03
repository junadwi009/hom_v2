import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  assignClientPackage,
  AssignClientPackageRpcError,
  type AssignClientPackageRpcClient,
} from "../../../src/lib/packages/server/assign-client-package";

const rpcRow = {
  id: "53000000-0000-4000-8000-000000000001",
  client_id: "10000000-0000-4000-8000-000000000001",
  client_name: "Mock Client 001",
  package_id: "50000000-0000-4000-8000-000000000001",
  package_name: "Mock Intro Package",
  purchased_at: "2026-06-03 02:00:00+00",
  expires_at: "2026-06-17 02:00:00+00",
  total_sessions: 2,
  remaining_sessions: 2,
  status: "active",
  created_at: "2026-06-03 02:00:00+00",
  updated_at: "2026-06-03 02:00:00+00",
};

const validInput = {
  clientId: rpcRow.client_id,
  packageId: rpcRow.package_id,
  purchasedAt: "2026-06-03T02:00:00.000Z",
} as const;

function createMockRpcClient(options?: {
  data?: typeof rpcRow[];
  error?: unknown;
}) {
  const rpc = vi.fn(async () => ({
    data: options?.data ?? [rpcRow],
    error: options?.error ?? null,
  }));

  return {
    client: {
      rpc,
    } as AssignClientPackageRpcClient,
    rpc,
  };
}

describe("server-only assign client package adapter", () => {
  it("validates input, calls the assign-only RPC, and maps the safe result", async () => {
    const { client, rpc } = createMockRpcClient();

    await expect(
      assignClientPackage(validInput, {
        createSupabaseClient: async () => client,
      }),
    ).resolves.toMatchObject({
      id: rpcRow.id,
      clientName: "Mock Client 001",
      packageName: "Mock Intro Package",
      totalSessions: 2,
      remainingSessions: 2,
      status: "active",
    });

    expect(rpc).toHaveBeenCalledWith("assign_client_package", {
      p_client_id: validInput.clientId,
      p_package_id: validInput.packageId,
      p_purchased_at: validInput.purchasedAt,
    });
  });

  it("rejects payment, contact, clinical, or WhatsApp fields before RPC", async () => {
    const { client, rpc } = createMockRpcClient();

    await expect(
      assignClientPackage(
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

  it("converts RPC failures to safe application errors", async () => {
    const { client } = createMockRpcClient({
      error: {
        code: "P0001",
        message: "PACKAGE_UNAVAILABLE",
        details: "raw database details",
      },
    });

    await expect(
      assignClientPackage(validInput, {
        createSupabaseClient: async () => client,
      }),
    ).rejects.toMatchObject({
      name: "AssignClientPackageRpcError",
      message: "Client package could not be assigned.",
      code: "PACKAGE_UNAVAILABLE",
    });

    try {
      await assignClientPackage(validInput, {
        createSupabaseClient: async () => client,
      });
    } catch (error) {
      expect(error).toBeInstanceOf(AssignClientPackageRpcError);
      expect((error as Error).message).not.toContain("raw database details");
    }
  });

  it("keeps the adapter server-only and free of service-role clients", () => {
    const source = readWorkspaceFile(
      "apps/web/src/lib/packages/server/assign-client-package.ts",
    );

    expect(source).toContain('import "server-only";');
    expect(source).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(source).not.toContain("service-role");
  });

  it("keeps direct table writes blocked and grants authenticated RPC execute only", () => {
    const migration = readWorkspaceFile(
      "supabase/migrations/20260603000200_assign_client_package_rpc.sql",
    );

    expect(migration).toContain(
      "create or replace function public.assign_client_package(",
    );
    expect(migration).toContain("can_manage_client_packages");
    expect(migration).toContain("to authenticated;");
    expect(migration).not.toMatch(
      /grant (insert|update|delete) on public\.(client_packages|package_usage_history|audit_logs) to authenticated/i,
    );
  });
});

function readWorkspaceFile(path: string) {
  return readFileSync(resolve(process.cwd(), "../..", path), "utf8");
}
