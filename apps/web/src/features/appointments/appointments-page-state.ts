import type { Appointment } from "@hom/domain/appointments";

export type AppointmentDataSource = "mock" | "supabase";

export type AppointmentTableRow = {
  id: string;
  scheduled: string;
  clientName: string;
  practitionerName: string;
  serviceName: string;
  duration: string;
  isModified: boolean;
  status: Appointment["status"];
  source: string;
};

export type AppointmentsPageState =
  | {
      status: "ready";
      source: AppointmentDataSource;
      rows: AppointmentTableRow[];
      total: number;
      pageSize: number;
    }
  | {
      status: "empty";
      source: AppointmentDataSource;
    }
  | {
      status: "permission_denied";
      source: "supabase";
    }
  | {
      status: "configuration_error";
      source: "supabase";
    }
  | {
      status: "error";
      source: AppointmentDataSource;
    };

export function toAppointmentTableRow(
  appointment: Appointment,
): AppointmentTableRow {
  return {
    id: appointment.id,
    scheduled: toScheduleLabel(appointment.startsAt),
    clientName: appointment.clientName,
    practitionerName: appointment.practitionerName,
    serviceName: appointment.serviceName,
    duration: `${appointment.durationMinutes} min`,
    isModified:
      Date.parse(appointment.updatedAt) > Date.parse(appointment.createdAt),
    status: appointment.status,
    source: appointment.source.replaceAll("_", " "),
  };
}

function toScheduleLabel(timestamp: string) {
  const time = Date.parse(timestamp);

  if (Number.isNaN(time)) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(time);
}
