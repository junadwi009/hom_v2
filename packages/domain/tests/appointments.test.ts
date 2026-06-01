import { describe, expect, it } from "vitest";

import {
  appointmentListQuerySchema,
  appointmentSchema,
  appointmentSourceSchema,
  appointmentStatusSchema,
  cancelAppointmentInputSchema,
  createAppointmentInputSchema,
  createMockAppointmentRepository,
  mockAppointments,
  rescheduleAppointmentInputSchema,
  updateAppointmentStatusInputSchema,
} from "../src/appointments";

const mockAppointmentId = "40000000-0000-4000-8000-000000000001";

describe("appointment domain schemas", () => {
  it("accepts only approved Phase 4A appointment statuses", () => {
    for (const status of [
      "scheduled",
      "confirmed",
      "completed",
      "cancelled",
      "no_show",
    ]) {
      expect(appointmentStatusSchema.safeParse(status).success).toBe(true);
    }

    expect(appointmentStatusSchema.safeParse("draft").success).toBe(false);
    expect(appointmentStatusSchema.safeParse("rescheduled").success).toBe(
      false,
    );
  });

  it("accepts only approved appointment sources", () => {
    for (const source of [
      "admin",
      "import",
      "whatsapp_request",
      "ai_draft",
    ]) {
      expect(appointmentSourceSchema.safeParse(source).success).toBe(true);
    }

    expect(appointmentSourceSchema.safeParse("production_import").success).toBe(
      false,
    );
  });

  it("validates timestamps and requires endsAt after startsAt", () => {
    expect(appointmentSchema.safeParse(mockAppointments[0]).success).toBe(true);
    expect(
      appointmentSchema.safeParse({
        ...mockAppointments[0],
        startsAt: "not-a-timestamp",
      }).success,
    ).toBe(false);
    expect(
      appointmentSchema.safeParse({
        ...mockAppointments[0],
        endsAt: mockAppointments[0].startsAt,
      }).success,
    ).toBe(false);
    expect(
      appointmentSchema.safeParse({
        ...mockAppointments[0],
        endsAt: "2026-06-01T02:59:59.000Z",
      }).success,
    ).toBe(false);
  });

  it("requires durationMinutes to be positive and no more than 480", () => {
    expect(
      appointmentSchema.safeParse({
        ...mockAppointments[0],
        durationMinutes: 0,
      }).success,
    ).toBe(false);
    expect(
      appointmentSchema.safeParse({
        ...mockAppointments[0],
        durationMinutes: 481,
      }).success,
    ).toBe(false);
  });

  it("keeps operational notes summaries short", () => {
    expect(
      appointmentSchema.safeParse({
        ...mockAppointments[0],
        notesSummary: "x".repeat(280),
      }).success,
    ).toBe(true);
    expect(
      appointmentSchema.safeParse({
        ...mockAppointments[0],
        notesSummary: "x".repeat(281),
      }).success,
    ).toBe(false);
  });

  it("rejects contact and sensitive fields from appointment read models", () => {
    for (const field of [
      "phone",
      "email",
      "clinicalNotes",
      "medicalHistory",
      "paymentData",
      "whatsappMessages",
      "packageData",
    ]) {
      expect(
        appointmentSchema.safeParse({
          ...mockAppointments[0],
          [field]: "not allowed",
        }).success,
      ).toBe(false);
    }
  });

  it("applies appointment list query defaults", () => {
    expect(appointmentListQuerySchema.parse({})).toEqual({
      search: "",
      page: 1,
      pageSize: 20,
    });
  });

  it("validates future mutation contracts without adding write methods", () => {
    expect(
      createAppointmentInputSchema.safeParse({
        clientId: mockAppointments[0].clientId,
        practitionerId: mockAppointments[0].practitionerId,
        serviceId: mockAppointments[0].serviceId,
        startsAt: "2026-06-03T03:00:00.000Z",
        endsAt: "2026-06-03T04:00:00.000Z",
        durationMinutes: 60,
      }).success,
    ).toBe(true);
    expect(
      rescheduleAppointmentInputSchema.safeParse({
        id: mockAppointmentId,
        startsAt: "2026-06-03T03:00:00.000Z",
        endsAt: "2026-06-03T04:00:00.000Z",
        durationMinutes: 60,
        reason: "Mock client requested another available time.",
      }).success,
    ).toBe(true);
    expect(
      cancelAppointmentInputSchema.safeParse({
        id: mockAppointmentId,
        reason: "Mock client cancelled.",
      }).success,
    ).toBe(true);
    expect(
      updateAppointmentStatusInputSchema.safeParse({
        id: mockAppointmentId,
        status: "completed",
      }).success,
    ).toBe(true);
  });
});

describe("appointment mock repository", () => {
  it("lists and gets safe mock appointments", async () => {
    const repository = createMockAppointmentRepository();

    await expect(repository.getById(mockAppointmentId)).resolves.toMatchObject({
      clientName: "Mock Client Alpha",
      practitionerName: "Mock Practitioner One",
      serviceName: "Mock Intro Assessment",
      status: "scheduled",
    });
    await expect(
      repository.getById("99999999-0000-4000-8000-000000000999"),
    ).resolves.toBeNull();
    await expect(repository.list({ status: "confirmed" })).resolves.toMatchObject(
      {
        total: 1,
        items: [{ clientName: "Mock Client Beta" }],
      },
    );
    await expect(repository.list({ search: "private" })).resolves.toMatchObject({
      total: 3,
    });
  });

  it("has only read-only appointment repository methods", () => {
    expect(Object.keys(createMockAppointmentRepository()).sort()).toEqual([
      "getById",
      "list",
    ]);
  });

  it("keeps mock rows free of contact and sensitive fields", () => {
    for (const appointment of mockAppointments) {
      expect(Object.keys(appointment)).not.toContain("phone");
      expect(Object.keys(appointment)).not.toContain("email");
      expect(Object.keys(appointment)).not.toContain("clinicalNotes");
      expect(Object.keys(appointment)).not.toContain("medicalHistory");
      expect(Object.keys(appointment)).not.toContain("paymentData");
      expect(Object.keys(appointment)).not.toContain("whatsappMessages");
      expect(Object.keys(appointment)).not.toContain("packageData");
    }
  });
});
