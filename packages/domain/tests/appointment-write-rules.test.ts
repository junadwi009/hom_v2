import { describe, expect, it } from "vitest";

import {
  appointmentBlocksPractitionerTime,
  appointmentsOverlap,
  assertAppointmentStatusTransition,
  canTransitionAppointmentStatus,
  InvalidAppointmentStatusTransitionError,
  isReschedulableAppointmentStatus,
  mockAppointments,
  type AppointmentAuditLogSink,
  type AppointmentStatus,
  type AppointmentWriteTransaction,
  type AppointmentWriteTransactionAdapter,
  type CancelAppointmentUseCase,
  type CompleteAppointmentUseCase,
  type CreateAppointmentUseCase,
  type MarkNoShowAppointmentUseCase,
  type RescheduleAppointmentUseCase,
} from "../src/appointments";

const scheduledWindow = {
  startsAt: "2026-06-01T03:00:00.000Z",
  endsAt: "2026-06-01T04:00:00.000Z",
  status: "scheduled",
} as const;

describe("appointment status transition rules", () => {
  it.each([
    ["scheduled", "confirmed"],
    ["scheduled", "cancelled"],
    ["scheduled", "completed"],
    ["scheduled", "no_show"],
    ["confirmed", "cancelled"],
    ["confirmed", "completed"],
    ["confirmed", "no_show"],
  ] satisfies [AppointmentStatus, AppointmentStatus][])(
    "allows %s -> %s",
    (from, to) => {
      expect(canTransitionAppointmentStatus(from, to)).toBe(true);
      expect(() => assertAppointmentStatusTransition(from, to)).not.toThrow();
    },
  );

  it.each([
    ["completed", "scheduled"],
    ["cancelled", "scheduled"],
    ["no_show", "scheduled"],
  ] satisfies [AppointmentStatus, AppointmentStatus][])(
    "rejects reopening terminal status %s -> %s",
    (from, to) => {
      expect(canTransitionAppointmentStatus(from, to)).toBe(false);
      expect(() => assertAppointmentStatusTransition(from, to)).toThrow(
        InvalidAppointmentStatusTransitionError,
      );
    },
  );

  it("keeps reschedule eligibility limited to scheduled and confirmed", () => {
    expect(isReschedulableAppointmentStatus("scheduled")).toBe(true);
    expect(isReschedulableAppointmentStatus("confirmed")).toBe(true);
    expect(isReschedulableAppointmentStatus("completed")).toBe(false);
    expect(isReschedulableAppointmentStatus("cancelled")).toBe(false);
    expect(isReschedulableAppointmentStatus("no_show")).toBe(false);
  });
});

describe("appointment overlap rules", () => {
  it("detects identical blocking intervals", () => {
    expect(appointmentsOverlap(scheduledWindow, scheduledWindow)).toBe(true);
  });

  it("detects a contained blocking interval", () => {
    expect(
      appointmentsOverlap(scheduledWindow, {
        startsAt: "2026-06-01T03:15:00.000Z",
        endsAt: "2026-06-01T03:45:00.000Z",
        status: "confirmed",
      }),
    ).toBe(true);
  });

  it("detects a partial overlap at the start", () => {
    expect(
      appointmentsOverlap(scheduledWindow, {
        startsAt: "2026-06-01T02:30:00.000Z",
        endsAt: "2026-06-01T03:30:00.000Z",
        status: "confirmed",
      }),
    ).toBe(true);
  });

  it("detects a partial overlap at the end", () => {
    expect(
      appointmentsOverlap(scheduledWindow, {
        startsAt: "2026-06-01T03:30:00.000Z",
        endsAt: "2026-06-01T04:30:00.000Z",
        status: "confirmed",
      }),
    ).toBe(true);
  });

  it("allows adjacent appointments", () => {
    expect(
      appointmentsOverlap(scheduledWindow, {
        startsAt: scheduledWindow.endsAt,
        endsAt: "2026-06-01T05:00:00.000Z",
        status: "confirmed",
      }),
    ).toBe(false);
  });

  it("does not block time for cancelled appointments", () => {
    expect(appointmentBlocksPractitionerTime("cancelled")).toBe(false);
    expect(
      appointmentsOverlap(scheduledWindow, {
        ...scheduledWindow,
        status: "cancelled",
      }),
    ).toBe(false);
  });

  it("treats completed and no-show appointments as historical", () => {
    expect(appointmentBlocksPractitionerTime("completed")).toBe(false);
    expect(appointmentBlocksPractitionerTime("no_show")).toBe(false);
    expect(
      appointmentsOverlap(scheduledWindow, {
        ...scheduledWindow,
        status: "completed",
      }),
    ).toBe(false);
    expect(
      appointmentsOverlap(scheduledWindow, {
        ...scheduledWindow,
        status: "no_show",
      }),
    ).toBe(false);
  });
});

describe("appointment write contracts", () => {
  it("keeps future use cases behind execute-only server contracts", () => {
    const execute = async () => mockAppointments[0];
    const useCases = [
      { execute } satisfies CreateAppointmentUseCase,
      { execute } satisfies RescheduleAppointmentUseCase,
      { execute } satisfies CancelAppointmentUseCase,
      { execute } satisfies CompleteAppointmentUseCase,
      { execute } satisfies MarkNoShowAppointmentUseCase,
    ];

    for (const useCase of useCases) {
      expect(Object.keys(useCase)).toEqual(["execute"]);
      expect(JSON.stringify(Object.keys(useCase))).not.toMatch(
        /browser|route|serverAction|supabase/i,
      );
    }
  });

  it("describes one atomic transaction adapter with an audit writer sink", async () => {
    const auditLogSink = {
      async append() {},
    } satisfies AppointmentAuditLogSink;
    const transaction = {
      async insertAppointment() {
        return mockAppointments[0];
      },
      async updateAppointment() {
        return mockAppointments[0];
      },
      async insertStatusHistory() {},
      auditLogSink,
    } satisfies AppointmentWriteTransaction;
    const adapter = {
      async runInTransaction<TResult>(
        operation: (activeTransaction: AppointmentWriteTransaction) => Promise<TResult>,
      ) {
        return operation(transaction);
      },
    } satisfies AppointmentWriteTransactionAdapter;

    await expect(
      adapter.runInTransaction(async (activeTransaction) =>
        Object.keys(activeTransaction).sort(),
      ),
    ).resolves.toEqual([
      "auditLogSink",
      "insertAppointment",
      "insertStatusHistory",
      "updateAppointment",
    ]);
    expect(Object.keys(adapter)).toEqual(["runInTransaction"]);
  });
});
