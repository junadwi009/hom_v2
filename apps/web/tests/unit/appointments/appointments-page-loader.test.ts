import type { Appointment } from "@hom/domain/appointments";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  createEmptyAppointmentRepository,
  loadAppointmentsPage,
} from "../../../src/features/appointments/appointments-page-loader";
import { toAppointmentTableRow } from "../../../src/features/appointments/appointments-page-state";
import { AppointmentRepositoryError } from "../../../src/lib/appointments/errors";

const mockAppointment = {
  id: "40000000-0000-4000-8000-000000000001",
  clientId: "10000000-0000-4000-8000-000000000001",
  clientName: "Mock Client Alpha",
  practitionerId: "20000000-0000-4000-8000-000000000001",
  practitionerName: "Mock Practitioner One",
  serviceId: "30000000-0000-4000-8000-000000000001",
  serviceName: "Mock Intro Assessment",
  status: "scheduled",
  startsAt: "2026-06-01T03:00:00.000Z",
  endsAt: "2026-06-01T04:00:00.000Z",
  durationMinutes: 60,
  source: "admin",
  notesSummary: "Mock operational orientation.",
  createdAt: "2026-05-28T01:00:00.000Z",
  updatedAt: "2026-05-28T01:00:00.000Z",
} satisfies Appointment;

function createFailingAppointmentRepository(error: unknown) {
  return {
    async list() {
      throw error;
    },
    async getById() {
      return null;
    },
  };
}

describe("loadAppointmentsPage", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns a ready state in mock mode", async () => {
    vi.stubEnv("HOM_DATA_MODE", "mock");

    const state = await loadAppointmentsPage();

    expect(state).toMatchObject({
      status: "ready",
      source: "mock",
      total: 5,
      pageSize: 20,
    });
    expect(state.status === "ready" ? state.rows[0]?.clientName : null).toBe(
      "Mock Client Alpha",
    );
  });

  it("uses mock mode when HOM_DATA_MODE is missing or invalid", async () => {
    vi.stubEnv("HOM_DATA_MODE", "not_a_mode");

    const state = await loadAppointmentsPage();

    expect(state.status).toBe("ready");
    expect(state.source).toBe("mock");
  });

  it("returns an empty state when the repository has no appointments", async () => {
    const state = await loadAppointmentsPage({
      source: "mock",
      repository: createEmptyAppointmentRepository(),
    });

    expect(state).toEqual({
      status: "empty",
      source: "mock",
    });
  });

  it("maps permission failures to a safe Supabase permission state", async () => {
    const state = await loadAppointmentsPage({
      source: "supabase",
      repository: createFailingAppointmentRepository(
        new AppointmentRepositoryError({
          operation: "appointments.list",
          table: "appointments",
          code: "42501",
        }),
      ),
    });

    expect(state).toEqual({
      status: "permission_denied",
      source: "supabase",
    });
    expect(JSON.stringify(state)).not.toContain("42501");
    expect(JSON.stringify(state)).not.toContain("permission denied");
  });

  it("maps missing local Supabase configuration to a safe state", async () => {
    const state = await loadAppointmentsPage({
      source: "supabase",
      repository: createFailingAppointmentRepository(
        new Error("Supabase public environment variables are missing."),
      ),
    });

    expect(state).toEqual({
      status: "configuration_error",
      source: "supabase",
    });
    expect(JSON.stringify(state)).not.toContain("environment variables");
  });
});

describe("toAppointmentTableRow", () => {
  it("renders only operational table fields", () => {
    const row = toAppointmentTableRow(mockAppointment);

    expect(row).toEqual({
      id: mockAppointment.id,
      clientId: mockAppointment.clientId,
      scheduled: "1 Jun 2026, 10:00",
      startsAt: mockAppointment.startsAt,
      clientName: "Mock Client Alpha",
      practitionerName: "Mock Practitioner One",
      serviceName: "Mock Intro Assessment",
      duration: "60 min",
      isModified: false,
      status: "scheduled",
      source: "admin",
    });
    expect(Object.keys(row)).not.toEqual(
      expect.arrayContaining([
        "phone",
        "email",
        "clinicalNotes",
        "paymentData",
        "whatsappMessages",
        "packageData",
        "notesSummary",
      ]),
    );
  });

  it("marks appointments whose updated timestamp is later than creation", () => {
    expect(
      toAppointmentTableRow({
        ...mockAppointment,
        updatedAt: "2026-06-02T01:00:00.000Z",
      }).isModified,
    ).toBe(true);
  });
});
