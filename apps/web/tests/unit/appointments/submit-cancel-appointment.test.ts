import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import type { Appointment } from "@hom/domain/appointments";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  submitCancelAppointmentFormData,
  toCancelAppointmentInput,
  toSafeCancelAppointmentActionState,
} from "../../../src/lib/appointments/server/submit-cancel-appointment";
import { CancelAppointmentRpcError } from "../../../src/lib/appointments/server/cancel-appointment";

const cancelledAppointment = {
  id: "40000000-0000-4000-8000-000000000001",
  clientId: "10000000-0000-4000-8000-000000000001",
  clientName: "Mock Client Alpha",
  practitionerId: "20000000-0000-4000-8000-000000000001",
  practitionerName: "Mock Practitioner One",
  serviceId: "30000000-0000-4000-8000-000000000001",
  serviceName: "Mock Intro Assessment",
  status: "cancelled",
  startsAt: "2026-06-10T03:00:00.000Z",
  endsAt: "2026-06-10T04:00:00.000Z",
  durationMinutes: 60,
  source: "admin",
  createdAt: "2026-06-01T01:00:00.000Z",
  updatedAt: "2026-06-02T01:00:00.000Z",
} satisfies Appointment;

describe("cancel appointment form submission", () => {
  it("maps only appointment id and required operational reason", () => {
    const formData = createValidFormData();
    formData.set("phone", "+62 000-0000-0001");
    formData.set("payment", "mock payment");
    formData.set("clinicalNotes", "mock clinical");
    formData.set("whatsappMessage", "mock WhatsApp");
    formData.set("packageId", "mock package");

    expect(toCancelAppointmentInput(formData)).toEqual({
      id: cancelledAppointment.id,
      reason: "Mock cancellation reason.",
    });
  });

  it("requires a reason and enforces the 280-character limit", () => {
    expect(() =>
      toCancelAppointmentInput(createValidFormData({ reason: "" })),
    ).toThrow();
    expect(() =>
      toCancelAppointmentInput(
        createValidFormData({ reason: "x".repeat(281) }),
      ),
    ).toThrow();
  });

  it("cannot report fake success in mock mode", async () => {
    const cancel = vi.fn(async () => cancelledAppointment);

    await expect(
      submitCancelAppointmentFormData(createValidFormData(), {
        dataMode: "mock",
        cancel,
      }),
    ).resolves.toEqual({
      status: "configuration_error",
      message: "Cancellation is unavailable in mock preview mode.",
    });
    expect(cancel).not.toHaveBeenCalled();
  });

  it("returns success only after the server adapter succeeds", async () => {
    const cancel = vi.fn(async () => cancelledAppointment);

    await expect(
      submitCancelAppointmentFormData(createValidFormData(), {
        dataMode: "supabase",
        authMode: "supabase",
        cancel,
      }),
    ).resolves.toEqual({
      status: "success",
      appointmentId: cancelledAppointment.id,
      message: "Appointment cancelled.",
    });
  });

  it("maps terminal-status failures without leaking raw details", () => {
    const state = toSafeCancelAppointmentActionState(
      new CancelAppointmentRpcError("APPOINTMENT_NOT_CANCELLABLE"),
    );

    expect(state).toEqual({
      status: "appointment_unavailable",
      message: "Only scheduled or confirmed appointments can be cancelled.",
    });
    expect(JSON.stringify(state)).not.toContain("raw");
  });

  it("renders a required reason field without sensitive inputs", () => {
    const source = readWorkspaceFile(
      "apps/web/src/features/appointments/cancel-appointment-dialog.tsx",
    );

    expect(source).toContain('name="reason"');
    expect(source).toContain("required");
    expect(source).toContain("maxLength={280}");
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
    id: cancelledAppointment.id,
    reason: "Mock cancellation reason.",
    ...overrides,
  };

  Object.entries(values).forEach(([key, value]) => formData.set(key, value));

  return formData;
}

function readWorkspaceFile(path: string) {
  return readFileSync(resolve(process.cwd(), "../..", path), "utf8");
}
