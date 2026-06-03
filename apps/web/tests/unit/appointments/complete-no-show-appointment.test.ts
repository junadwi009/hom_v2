import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  completeAppointment,
  CompleteAppointmentRpcError,
  type CompleteAppointmentRpcClient,
} from "../../../src/lib/appointments/server/complete-appointment";
import {
  markNoShowAppointment,
  MarkNoShowAppointmentRpcError,
  type MarkNoShowAppointmentRpcClient,
} from "../../../src/lib/appointments/server/mark-no-show-appointment";

const scheduledRpcRow = {
  id: "40000000-0000-4000-8000-000000000001",
  client_id: "10000000-0000-4000-8000-000000000001",
  client_name: "Mock Client 001",
  practitioner_id: "20000000-0000-4000-8000-000000000001",
  practitioner_name: "Mock Practitioner 001",
  service_id: "30000000-0000-4000-8000-000000000001",
  service_name: "Mock Service 001 Intro Assessment",
  status: "completed",
  starts_at: "2026-06-10 03:00:00+00",
  ends_at: "2026-06-10 04:00:00+00",
  duration_minutes: 60,
  source: "admin",
  notes_summary: "Mock operational booking.",
  created_at: "2026-06-01 01:00:00+00",
  updated_at: "2026-06-02 01:00:00+00",
};

describe("server-only complete appointment adapter", () => {
  it("calls the completion RPC with appointment id only", async () => {
    const rpc = vi.fn(async () => ({ data: [scheduledRpcRow], error: null }));
    const client = { rpc } as CompleteAppointmentRpcClient;

    await expect(
      completeAppointment(
        { id: scheduledRpcRow.id },
        { createSupabaseClient: async () => client },
      ),
    ).resolves.toMatchObject({ id: scheduledRpcRow.id, status: "completed" });

    expect(rpc).toHaveBeenCalledWith("complete_appointment", {
      p_appointment_id: scheduledRpcRow.id,
    });
  });

  it("rejects stray completion fields before RPC", async () => {
    const rpc = vi.fn();
    const client = { rpc } as CompleteAppointmentRpcClient;

    await expect(
      completeAppointment(
        { id: scheduledRpcRow.id, reason: "not accepted" },
        { createSupabaseClient: async () => client },
      ),
    ).rejects.toThrow();
    expect(rpc).not.toHaveBeenCalled();
  });

  it("converts completion RPC failures to safe errors", async () => {
    const rpc = vi.fn(async () => ({
      data: null,
      error: {
        message: "APPOINTMENT_NOT_COMPLETABLE",
        details: "raw database details",
      },
    }));
    const client = { rpc } as CompleteAppointmentRpcClient;

    await expect(
      completeAppointment(
        { id: scheduledRpcRow.id },
        { createSupabaseClient: async () => client },
      ),
    ).rejects.toMatchObject({
      name: "CompleteAppointmentRpcError",
      message: "Appointment could not be marked completed.",
      code: "APPOINTMENT_NOT_COMPLETABLE",
    });
    expect(
      CompleteAppointmentRpcError.fromSupabase({
        message: "raw database details",
      }).message,
    ).not.toContain("raw");
  });
});

describe("server-only mark no-show appointment adapter", () => {
  it("passes an optional operational note to the no-show RPC", async () => {
    const rpcRow = { ...scheduledRpcRow, status: "no_show" };
    const rpc = vi.fn(async () => ({ data: [rpcRow], error: null }));
    const client = { rpc } as MarkNoShowAppointmentRpcClient;

    await expect(
      markNoShowAppointment(
        { id: rpcRow.id, reason: "Mock operational note." },
        { createSupabaseClient: async () => client },
      ),
    ).resolves.toMatchObject({ id: rpcRow.id, status: "no_show" });

    expect(rpc).toHaveBeenCalledWith("mark_appointment_no_show", {
      p_appointment_id: rpcRow.id,
      p_reason: "Mock operational note.",
    });
  });

  it("rejects an overlong no-show note before RPC", async () => {
    const rpc = vi.fn();
    const client = { rpc } as MarkNoShowAppointmentRpcClient;

    await expect(
      markNoShowAppointment(
        { id: scheduledRpcRow.id, reason: "x".repeat(281) },
        { createSupabaseClient: async () => client },
      ),
    ).rejects.toThrow();
    expect(rpc).not.toHaveBeenCalled();
  });

  it("converts no-show RPC failures to safe errors", async () => {
    const rpc = vi.fn(async () => ({
      data: null,
      error: {
        message: "APPOINTMENT_NOT_MARKABLE_NO_SHOW",
        details: "raw database details",
      },
    }));
    const client = { rpc } as MarkNoShowAppointmentRpcClient;

    await expect(
      markNoShowAppointment(
        { id: scheduledRpcRow.id },
        { createSupabaseClient: async () => client },
      ),
    ).rejects.toMatchObject({
      name: "MarkNoShowAppointmentRpcError",
      message: "Appointment could not be marked no-show.",
      code: "APPOINTMENT_NOT_MARKABLE_NO_SHOW",
    });
    expect(
      MarkNoShowAppointmentRpcError.fromSupabase({
        message: "raw database details",
      }).message,
    ).not.toContain("raw");
  });

  it("keeps both adapters server-only and reason text out of audit metadata", () => {
    for (const path of [
      "apps/web/src/lib/appointments/server/complete-appointment.ts",
      "apps/web/src/lib/appointments/server/mark-no-show-appointment.ts",
    ]) {
      const source = readWorkspaceFile(path);

      expect(source).toContain('import "server-only";');
      expect(source).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
      expect(source).not.toContain("service-role");
      expect(source).not.toMatch(/metadata:\s*{[^}]*reason/);
    }
  });

  it("keeps direct table writes blocked and grants authenticated RPC execute only", () => {
    const migration = readWorkspaceFile(
      "supabase/migrations/20260602000400_complete_no_show_appointment_rpcs.sql",
    );

    expect(migration).toContain(
      "create or replace function public.complete_appointment(",
    );
    expect(migration).toContain(
      "create or replace function public.mark_appointment_no_show(",
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
