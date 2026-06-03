import type { AppointmentStatus } from "./types";

export type AppointmentTimeWindow = {
  startsAt: string;
  endsAt: string;
  status: AppointmentStatus;
};

const allowedStatusTransitions: Readonly<
  Record<AppointmentStatus, readonly AppointmentStatus[]>
> = {
  scheduled: ["confirmed", "cancelled", "completed", "no_show"],
  confirmed: ["cancelled", "completed", "no_show"],
  completed: [],
  cancelled: [],
  no_show: [],
};

export class InvalidAppointmentStatusTransitionError extends Error {
  constructor(from: AppointmentStatus, to: AppointmentStatus) {
    super(`Appointment status cannot change from ${from} to ${to}.`);
    this.name = "InvalidAppointmentStatusTransitionError";
  }
}

export function canTransitionAppointmentStatus(
  from: AppointmentStatus,
  to: AppointmentStatus,
) {
  return allowedStatusTransitions[from].includes(to);
}

export function assertAppointmentStatusTransition(
  from: AppointmentStatus,
  to: AppointmentStatus,
) {
  if (!canTransitionAppointmentStatus(from, to)) {
    throw new InvalidAppointmentStatusTransitionError(from, to);
  }
}

export function appointmentBlocksPractitionerTime(status: AppointmentStatus) {
  return status === "scheduled" || status === "confirmed";
}

export function isReschedulableAppointmentStatus(
  status: AppointmentStatus,
): status is "scheduled" | "confirmed" {
  return status === "scheduled" || status === "confirmed";
}

export function appointmentsOverlap(
  first: AppointmentTimeWindow,
  second: AppointmentTimeWindow,
) {
  if (
    !appointmentBlocksPractitionerTime(first.status) ||
    !appointmentBlocksPractitionerTime(second.status)
  ) {
    return false;
  }

  const firstStart = Date.parse(first.startsAt);
  const firstEnd = Date.parse(first.endsAt);
  const secondStart = Date.parse(second.startsAt);
  const secondEnd = Date.parse(second.endsAt);

  return firstStart < secondEnd && secondStart < firstEnd;
}
