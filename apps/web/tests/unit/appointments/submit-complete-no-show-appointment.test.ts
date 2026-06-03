import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import type { Appointment } from "@hom/domain/appointments";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  submitCompleteAppointmentFormData,
  toCompleteAppointmentInput,
  toSafeCompleteAppointmentActionState,
} from "../../../src/lib/appointments/server/submit-complete-appointment";
import {
  submitMarkNoShowAppointmentFormData,
  toMarkNoShowAppointmentInput,
  toSafeMarkNoShowAppointmentActionState,
} from "../../../src/lib/appointments/server/submit-mark-no-show-appointment";
import { CompleteAppointmentRpcError } from "../../../src/lib/appointments/server/complete-appointment";
import { MarkNoShowAppointmentRpcError } from "../../../src/lib/appointments/server/mark-no-show-appointment";

const appointment = {
  id: "40000000-0000-4000-8000-000000000001",
  clientId: "10000000-0000-4000-8000-000000000001",
  clientName: "Mock Client Alpha",
  practitionerId: "20000000-0000-4000-8000-000000000001",
  practitionerName: "Mock Practitioner One",
  serviceId: "30000000-0000-4000-8000-000000000001",
  serviceName: "Mock Intro Assessment",
  status: "completed",
  startsAt: "2026-06-10T03:00:00.000Z",
  endsAt: "2026-06-10T04:00:00.000Z",
  durationMinutes: 60,
  source: "admin",
  createdAt: "2026-06-01T01:00:00.000Z",
  updatedAt: "2026-06-02T01:00:00.000Z",
} satisfies Appointment;

describe("complete appointment form submission", () => {
  it("maps appointment id only and ignores sensitive form fields", () => {
    const formData = createFormData();
    addSensitiveFields(formData);

    expect(toCompleteAppointmentInput(formData)).toEqual({
      id: appointment.id,
    });
  });

  it("cannot report fake completion in mock mode", async () => {
    const complete = vi.fn(async () => appointment);

    await expect(
      submitCompleteAppointmentFormData(createFormData(), {
        dataMode: "mock",
        complete,
      }),
    ).resolves.toEqual({
      status: "configuration_error",
      message: "Completion is unavailable in mock preview mode.",
    });
    expect(complete).not.toHaveBeenCalled();
  });

  it("returns success only after the completion adapter succeeds", async () => {
    const complete = vi.fn(async () => appointment);

    await expect(
      submitCompleteAppointmentFormData(createFormData(), {
        dataMode: "supabase",
        authMode: "supabase",
        complete,
      }),
    ).resolves.toMatchObject({
      status: "success",
      appointmentId: appointment.id,
    });
  });

  it("maps terminal completion failure safely", () => {
    expect(
      toSafeCompleteAppointmentActionState(
        new CompleteAppointmentRpcError("APPOINTMENT_NOT_COMPLETABLE"),
      ),
    ).toEqual({
      status: "appointment_unavailable",
      message: "Only scheduled or confirmed appointments can be completed.",
    });
  });
});

describe("mark no-show appointment form submission", () => {
  it("maps appointment id and optional note only", () => {
    const formData = createFormData("Mock operational no-show note.");
    addSensitiveFields(formData);

    expect(toMarkNoShowAppointmentInput(formData)).toEqual({
      id: appointment.id,
      reason: "Mock operational no-show note.",
    });
    expect(toMarkNoShowAppointmentInput(createFormData())).toEqual({
      id: appointment.id,
    });
  });

  it("enforces the optional note length limit", () => {
    expect(() =>
      toMarkNoShowAppointmentInput(createFormData("x".repeat(281))),
    ).toThrow();
  });

  it("cannot report fake no-show success in mock mode", async () => {
    const markNoShow = vi.fn(async () => ({
      ...appointment,
      status: "no_show" as const,
    }));

    await expect(
      submitMarkNoShowAppointmentFormData(createFormData(), {
        dataMode: "mock",
        markNoShow,
      }),
    ).resolves.toEqual({
      status: "configuration_error",
      message: "No-show marking is unavailable in mock preview mode.",
    });
    expect(markNoShow).not.toHaveBeenCalled();
  });

  it("returns success only after the no-show adapter succeeds", async () => {
    const markNoShow = vi.fn(async () => ({
      ...appointment,
      status: "no_show" as const,
    }));

    await expect(
      submitMarkNoShowAppointmentFormData(createFormData(), {
        dataMode: "supabase",
        authMode: "supabase",
        markNoShow,
      }),
    ).resolves.toMatchObject({
      status: "success",
      appointmentId: appointment.id,
    });
  });

  it("maps terminal no-show failure safely", () => {
    expect(
      toSafeMarkNoShowAppointmentActionState(
        new MarkNoShowAppointmentRpcError("APPOINTMENT_NOT_MARKABLE_NO_SHOW"),
      ),
    ).toEqual({
      status: "appointment_unavailable",
      message: "Only scheduled or confirmed appointments can be marked no-show.",
    });
  });

  it("renders only the optional operational note field for no-show", () => {
    const source = readWorkspaceFile(
      "apps/web/src/features/appointments/terminal-appointment-dialog.tsx",
    );

    expect(source).toContain('name="reason"');
    expect(source).toContain("maxLength={280}");
    expect(source).not.toContain('name="phone"');
    expect(source).not.toContain('name="email"');
    expect(source).not.toContain('name="payment"');
    expect(source).not.toContain('name="clinical');
    expect(source).not.toContain('name="whatsapp');
    expect(source).not.toContain('name="package');
  });
});

function createFormData(reason = "") {
  const formData = new FormData();
  formData.set("id", appointment.id);
  formData.set("reason", reason);
  return formData;
}

function addSensitiveFields(formData: FormData) {
  formData.set("phone", "+62 000-0000-0001");
  formData.set("payment", "mock payment");
  formData.set("clinicalNotes", "mock clinical");
  formData.set("whatsappMessage", "mock WhatsApp");
  formData.set("packageId", "mock package");
}

function readWorkspaceFile(path: string) {
  return readFileSync(resolve(process.cwd(), "../..", path), "utf8");
}
