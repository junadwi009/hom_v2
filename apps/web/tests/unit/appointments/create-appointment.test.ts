import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  createScheduledAppointment,
  CreateAppointmentRpcError,
  type CreateAppointmentRpcClient,
} from "../../../src/lib/appointments/server/create-appointment";

const rpcRow = {
  id: "42000000-0000-4000-8000-000000000001",
  client_id: "10000000-0000-4000-8000-000000000001",
  client_name: "Mock Client 001",
  practitioner_id: "20000000-0000-4000-8000-000000000001",
  practitioner_name: "Mock Practitioner 001",
  service_id: "30000000-0000-4000-8000-000000000001",
  service_name: "Mock Service 001 Intro Assessment",
  status: "scheduled",
  starts_at: "2026-06-10 03:00:00+00",
  ends_at: "2026-06-10 04:00:00+00",
  duration_minutes: 60,
  source: "admin",
  notes_summary: "Mock operational booking.",
  created_at: "2026-06-01 01:00:00+00",
  updated_at: "2026-06-01 01:00:00+00",
};

const validInput = {
  clientId: rpcRow.client_id,
  practitionerId: rpcRow.practitioner_id,
  serviceId: rpcRow.service_id,
  startsAt: "2026-06-10T03:00:00.000Z",
  source: "admin",
  notesSummary: "Mock operational booking.",
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
    } as CreateAppointmentRpcClient,
    rpc,
  };
}

describe("server-only create appointment adapter", () => {
  it("validates input, calls the create-only RPC, and maps the safe result", async () => {
    const { client, rpc } = createMockRpcClient();

    await expect(
      createScheduledAppointment(validInput, {
        createSupabaseClient: async () => client,
      }),
    ).resolves.toMatchObject({
      id: rpcRow.id,
      clientName: "Mock Client 001",
      practitionerName: "Mock Practitioner 001",
      serviceName: "Mock Service 001 Intro Assessment",
      status: "scheduled",
      durationMinutes: 60,
    });

    expect(rpc).toHaveBeenCalledWith("create_appointment", {
      p_client_id: validInput.clientId,
      p_practitioner_id: validInput.practitionerId,
      p_service_id: validInput.serviceId,
      p_starts_at: validInput.startsAt,
      p_source: "admin",
      p_notes_summary: "Mock operational booking.",
    });
  });

  it("rejects staff duration and end-time overrides", async () => {
    const { client, rpc } = createMockRpcClient();

    await expect(
      createScheduledAppointment(
        {
          ...validInput,
          durationMinutes: 30,
          endsAt: "2026-06-10T03:30:00.000Z",
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
        message: "APPOINTMENT_OVERLAP",
        details: "raw database details",
      },
    });

    await expect(
      createScheduledAppointment(validInput, {
        createSupabaseClient: async () => client,
      }),
    ).rejects.toMatchObject({
      name: "CreateAppointmentRpcError",
      message: "Appointment could not be created.",
      code: "APPOINTMENT_OVERLAP",
    });

    try {
      await createScheduledAppointment(validInput, {
        createSupabaseClient: async () => client,
      });
    } catch (error) {
      expect(error).toBeInstanceOf(CreateAppointmentRpcError);
      expect((error as Error).message).not.toContain("raw database details");
    }
  });

  it("keeps the adapter server-only and free of service-role clients", () => {
    const source = readWorkspaceFile(
      "apps/web/src/lib/appointments/server/create-appointment.ts",
    );

    expect(source).toContain('import "server-only";');
    expect(source).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(source).not.toContain("service-role");
  });

  it("keeps direct table writes blocked and grants authenticated RPC execute only", () => {
    const migration = readWorkspaceFile(
      "supabase/migrations/20260601000200_create_appointment_rpc.sql",
    );

    expect(migration).toContain("create or replace function public.create_appointment(");
    expect(migration).toContain("to authenticated;");
    expect(migration).not.toMatch(
      /grant (insert|update|delete) on public\.(appointments|appointment_status_history|audit_logs) to authenticated/i,
    );
  });
});

function readWorkspaceFile(path: string) {
  return readFileSync(resolve(process.cwd(), "../..", path), "utf8");
}
