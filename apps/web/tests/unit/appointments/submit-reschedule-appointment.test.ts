import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import type { Appointment } from "@hom/domain/appointments";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  submitRescheduleAppointmentFormData,
  toRescheduleAppointmentInput,
  toSafeRescheduleAppointmentActionState,
} from "../../../src/lib/appointments/server/submit-reschedule-appointment";
import { RescheduleAppointmentRpcError } from "../../../src/lib/appointments/server/reschedule-appointment";

const rescheduledAppointment = {
  id: "40000000-0000-4000-8000-000000000001",
  clientId: "10000000-0000-4000-8000-000000000001",
  clientName: "Mock Client Alpha",
  practitionerId: "20000000-0000-4000-8000-000000000001",
  practitionerName: "Mock Practitioner One",
  serviceId: "30000000-0000-4000-8000-000000000001",
  serviceName: "Mock Intro Assessment",
  status: "scheduled",
  startsAt: "2036-06-20T02:00:00.000Z",
  endsAt: "2036-06-20T03:00:00.000Z",
  durationMinutes: 60,
  source: "admin",
  createdAt: "2026-06-01T01:00:00.000Z",
  updatedAt: "2026-06-02T01:00:00.000Z",
} satisfies Appointment;

describe("reschedule appointment form submission", () => {
  it("maps only appointment id, Jakarta-local start time, and reason", () => {
    const formData = createValidFormData();
    formData.set("durationMinutes", "15");
    formData.set("endsAt", "2036-06-20T09:15");
    formData.set("phone", "+62 000-0000-0001");
    formData.set("payment", "mock payment");
    formData.set("clinicalNotes", "mock clinical");
    formData.set("whatsappMessage", "mock WhatsApp");
    formData.set("packageId", "mock package");

    expect(toRescheduleAppointmentInput(formData, new Date("2036-06-01"))).toEqual({
      id: rescheduledAppointment.id,
      startsAt: "2036-06-20T02:00:00.000Z",
      reason: "Mock reschedule reason.",
    });
  });

  it("requires a future time and a reason no longer than 280 characters", () => {
    expect(() =>
      toRescheduleAppointmentInput(
        createValidFormData({ startsAtLocal: "2026-01-01T09:00" }),
        new Date("2026-06-01"),
      ),
    ).toThrow();
    expect(() =>
      toRescheduleAppointmentInput(createValidFormData({ reason: "" })),
    ).toThrow();
    expect(() =>
      toRescheduleAppointmentInput(
        createValidFormData({ reason: "x".repeat(281) }),
      ),
    ).toThrow();
  });

  it("cannot report fake success in mock mode", async () => {
    const reschedule = vi.fn(async () => rescheduledAppointment);

    await expect(
      submitRescheduleAppointmentFormData(createValidFormData(), {
        dataMode: "mock",
        reschedule,
      }),
    ).resolves.toEqual({
      status: "configuration_error",
      message: "Rescheduling is unavailable in mock preview mode.",
    });
    expect(reschedule).not.toHaveBeenCalled();
  });

  it("returns success only after the server adapter succeeds", async () => {
    const reschedule = vi.fn(async () => rescheduledAppointment);

    await expect(
      submitRescheduleAppointmentFormData(createValidFormData(), {
        dataMode: "supabase",
        authMode: "supabase",
        reschedule,
      }),
    ).resolves.toEqual({
      status: "success",
      appointmentId: rescheduledAppointment.id,
      message: "Appointment rescheduled.",
    });
  });

  it("maps overlap failures without leaking conflicting appointment details", () => {
    const state = toSafeRescheduleAppointmentActionState(
      new RescheduleAppointmentRpcError("APPOINTMENT_OVERLAP"),
    );

    expect(state).toEqual({
      status: "appointment_overlap",
      message: "This practitioner already has an appointment during that time.",
    });
    expect(JSON.stringify(state)).not.toContain("client");
  });

  it("renders stored duration read-only without sensitive inputs", () => {
    const source = readWorkspaceFile(
      "apps/web/src/features/appointments/reschedule-appointment-dialog.tsx",
    );

    expect(source).toContain('name="startsAtLocal"');
    expect(source).toContain('name="reason"');
    expect(source).toContain("required");
    expect(source).toContain("maxLength={280}");
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
    id: rescheduledAppointment.id,
    startsAtLocal: "2036-06-20T09:00",
    reason: "Mock reschedule reason.",
    ...overrides,
  };

  Object.entries(values).forEach(([key, value]) => formData.set(key, value));

  return formData;
}

function readWorkspaceFile(path: string) {
  return readFileSync(resolve(process.cwd(), "../..", path), "utf8");
}
