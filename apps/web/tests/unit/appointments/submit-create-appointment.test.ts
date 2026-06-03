import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import type { Appointment } from "@hom/domain/appointments";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  submitCreateAppointmentFormData,
  toCreateScheduledAppointmentInput,
  toSafeCreateAppointmentActionState,
} from "../../../src/lib/appointments/server/submit-create-appointment";
import { CreateAppointmentRpcError } from "../../../src/lib/appointments/server/create-appointment";
import {
  STUDIO_TIME_ZONE,
  toJakartaIsoTimestamp,
} from "../../../src/features/appointments/create-appointment-time";

const createdAppointment = {
  id: "40000000-0000-4000-8000-000000000001",
  clientId: "10000000-0000-4000-8000-000000000001",
  clientName: "Mock Client Alpha",
  practitionerId: "20000000-0000-4000-8000-000000000001",
  practitionerName: "Mock Practitioner One",
  serviceId: "30000000-0000-4000-8000-000000000001",
  serviceName: "Mock Intro Assessment",
  status: "scheduled",
  startsAt: "2026-06-10T03:00:00.000Z",
  endsAt: "2026-06-10T04:00:00.000Z",
  durationMinutes: 60,
  source: "admin",
  notesSummary: "Mock operational note.",
  createdAt: "2026-06-01T01:00:00.000Z",
  updatedAt: "2026-06-01T01:00:00.000Z",
} satisfies Appointment;

describe("create appointment form submission", () => {
  it("maps Jakarta-local form data to the create-only server input", () => {
    const input = toCreateScheduledAppointmentInput(
      createValidFormData(),
      new Date("2026-06-01T00:00:00.000Z"),
    );

    expect(STUDIO_TIME_ZONE).toBe("Asia/Jakarta");
    expect(toJakartaIsoTimestamp("2026-06-10T10:00")).toBe(
      "2026-06-10T03:00:00.000Z",
    );
    expect(input).toEqual({
      clientId: createdAppointment.clientId,
      practitionerId: createdAppointment.practitionerId,
      serviceId: createdAppointment.serviceId,
      startsAt: "2026-06-10T03:00:00.000Z",
      source: "admin",
      notesSummary: "Mock operational note.",
    });
  });

  it("forces the staff source to admin and rejects past times", () => {
    expect(() =>
      toCreateScheduledAppointmentInput(
        createValidFormData({ source: "import" }),
        new Date("2026-06-01T00:00:00.000Z"),
      ),
    ).toThrow();
    expect(() =>
      toCreateScheduledAppointmentInput(
        createValidFormData({ startsAtLocal: "2026-05-31T10:00" }),
        new Date("2026-06-01T00:00:00.000Z"),
      ),
    ).toThrow();
  });

  it("enforces the 280-character operational summary limit", () => {
    expect(() =>
      toCreateScheduledAppointmentInput(
        createValidFormData({ notesSummary: "x".repeat(281) }),
        new Date("2026-06-01T00:00:00.000Z"),
      ),
    ).toThrow();
  });

  it("does not forward contact, payment, clinical, WhatsApp, or package fields", () => {
    const formData = createValidFormData();
    formData.set("phone", "+62 000-0000-0001");
    formData.set("payment", "mock payment");
    formData.set("clinicalNotes", "mock clinical");
    formData.set("whatsappMessage", "mock WhatsApp");
    formData.set("packageId", "mock package");

    const input = toCreateScheduledAppointmentInput(
      formData,
      new Date("2026-06-01T00:00:00.000Z"),
    );

    expect(Object.keys(input).sort()).toEqual([
      "clientId",
      "notesSummary",
      "practitionerId",
      "serviceId",
      "source",
      "startsAt",
    ]);
  });

  it("cannot report fake success in mock mode", async () => {
    const createAppointment = vi.fn(async () => createdAppointment);

    await expect(
      submitCreateAppointmentFormData(createValidFormData(), {
        dataMode: "mock",
        createAppointment,
      }),
    ).resolves.toEqual({
      status: "configuration_error",
      message: "Saving is unavailable in mock preview mode.",
    });
    expect(createAppointment).not.toHaveBeenCalled();
  });

  it("returns success only after the server adapter succeeds", async () => {
    const createAppointment = vi.fn(async () => createdAppointment);

    await expect(
      submitCreateAppointmentFormData(createValidFormData(), {
        dataMode: "supabase",
        authMode: "supabase",
        now: new Date("2026-06-01T00:00:00.000Z"),
        createAppointment,
      }),
    ).resolves.toEqual({
      status: "success",
      appointmentId: createdAppointment.id,
      message: "Appointment created.",
    });
  });

  it("maps overlap failures without leaking conflict details", () => {
    const state = toSafeCreateAppointmentActionState(
      new CreateAppointmentRpcError("APPOINTMENT_OVERLAP"),
    );

    expect(state).toEqual({
      status: "appointment_overlap",
      message: "This practitioner already has an appointment during that time.",
    });
    expect(JSON.stringify(state)).not.toContain("client");
    expect(JSON.stringify(state)).not.toContain("raw");
  });

  it("keeps duration read-only in the form and avoids sensitive inputs", () => {
    const source = readWorkspaceFile(
      "apps/web/src/features/appointments/create-appointment-sheet.tsx",
    );

    expect(source).toContain('aria-label="Duration"');
    expect(source).toContain("readOnly");
    expect(source).not.toContain('name="durationMinutes"');
    expect(source).not.toContain('name="phone"');
    expect(source).not.toContain('name="email"');
    expect(source).not.toContain('name="payment"');
    expect(source).not.toContain('name="clinical');
    expect(source).not.toContain('name="whatsapp');
    expect(source).not.toContain('name="package');
  });
});

function createValidFormData(
  overrides: Partial<Record<string, string>> = {},
) {
  const formData = new FormData();
  const values = {
    clientId: createdAppointment.clientId,
    practitionerId: createdAppointment.practitionerId,
    serviceId: createdAppointment.serviceId,
    startsAtLocal: "2026-06-10T10:00",
    source: "admin",
    notesSummary: "Mock operational note.",
    ...overrides,
  };

  Object.entries(values).forEach(([key, value]) => formData.set(key, value));

  return formData;
}

function readWorkspaceFile(path: string) {
  return readFileSync(resolve(process.cwd(), "../..", path), "utf8");
}
