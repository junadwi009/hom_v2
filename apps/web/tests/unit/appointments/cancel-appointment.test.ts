import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  cancelAppointment,
  CancelAppointmentRpcError,
  type CancelAppointmentRpcClient,
} from "../../../src/lib/appointments/server/cancel-appointment";

const rpcRow = {
  id: "40000000-0000-4000-8000-000000000001",
  client_id: "10000000-0000-4000-8000-000000000001",
  client_name: "Mock Client 001",
  practitioner_id: "20000000-0000-4000-8000-000000000001",
  practitioner_name: "Mock Practitioner 001",
  service_id: "30000000-0000-4000-8000-000000000001",
  service_name: "Mock Service 001 Intro Assessment",
  status: "cancelled",
  starts_at: "2026-06-10 03:00:00+00",
  ends_at: "2026-06-10 04:00:00+00",
  duration_minutes: 60,
  source: "admin",
  notes_summary: "Mock operational booking.",
  created_at: "2026-06-01 01:00:00+00",
  updated_at: "2026-06-02 01:00:00+00",
};

const validInput = {
  id: rpcRow.id,
  reason: "Mock client requested cancellation.",
};

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
    } as CancelAppointmentRpcClient,
    rpc,
  };
}

describe("server-only cancel appointment adapter", () => {
  it("validates input, calls the cancel-only RPC, and maps the safe result", async () => {
    const { client, rpc } = createMockRpcClient();

    await expect(
      cancelAppointment(validInput, {
        createSupabaseClient: async () => client,
      }),
    ).resolves.toMatchObject({
      id: rpcRow.id,
      clientName: "Mock Client 001",
      status: "cancelled",
    });

    expect(rpc).toHaveBeenCalledWith("cancel_appointment", {
      p_appointment_id: validInput.id,
      p_reason: validInput.reason,
    });
  });

  it("rejects missing and overlong cancellation reasons before RPC", async () => {
    const { client, rpc } = createMockRpcClient();

    await expect(
      cancelAppointment(
        { id: validInput.id, reason: "" },
        { createSupabaseClient: async () => client },
      ),
    ).rejects.toThrow();
    await expect(
      cancelAppointment(
        { id: validInput.id, reason: "x".repeat(281) },
        { createSupabaseClient: async () => client },
      ),
    ).rejects.toThrow();
    expect(rpc).not.toHaveBeenCalled();
  });

  it("converts RPC failures to safe application errors", async () => {
    const { client } = createMockRpcClient({
      error: {
        message: "APPOINTMENT_NOT_CANCELLABLE",
        details: "raw database details",
      },
    });

    await expect(
      cancelAppointment(validInput, {
        createSupabaseClient: async () => client,
      }),
    ).rejects.toMatchObject({
      name: "CancelAppointmentRpcError",
      message: "Appointment could not be cancelled.",
      code: "APPOINTMENT_NOT_CANCELLABLE",
    });

    try {
      await cancelAppointment(validInput, {
        createSupabaseClient: async () => client,
      });
    } catch (error) {
      expect(error).toBeInstanceOf(CancelAppointmentRpcError);
      expect((error as Error).message).not.toContain("raw database details");
    }
  });

  it("keeps the adapter server-only and keeps the reason out of audit metadata", () => {
    const source = readWorkspaceFile(
      "apps/web/src/lib/appointments/server/cancel-appointment.ts",
    );

    expect(source).toContain('import "server-only";');
    expect(source).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(source).not.toContain("service-role");
    expect(source).not.toMatch(/metadata:\s*{[^}]*reason/);
  });

  it("keeps direct table writes blocked and grants authenticated RPC execute only", () => {
    const migration = readWorkspaceFile(
      "supabase/migrations/20260602000200_cancel_appointment_rpc.sql",
    );

    expect(migration).toContain(
      "create or replace function public.cancel_appointment(",
    );
    expect(migration).toContain("to authenticated;");
    expect(migration).not.toMatch(
      /grant (insert|update|delete) on public\.(appointments|appointment_status_history|audit_logs) to authenticated/i,
    );
  });
});

function readWorkspaceFile(path: string) {
  return readFileSync(resolve(process.cwd(), "../..", path), "utf8");
}
