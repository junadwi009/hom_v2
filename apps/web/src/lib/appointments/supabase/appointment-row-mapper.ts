import { appointmentSchema } from "@hom/domain/appointments";

import type { AppointmentRow } from "./types";

export function mapAppointmentRow(row: AppointmentRow) {
  return appointmentSchema.parse({
    id: row.id,
    clientId: row.client_id,
    clientName: readRelationValue(row.clients, "full_name"),
    practitionerId: row.practitioner_id,
    practitionerName: readRelationValue(row.practitioners, "display_name"),
    serviceId: row.service_id,
    serviceName: readRelationValue(row.services, "name"),
    status: row.status,
    startsAt: toIsoTimestamp(row.starts_at),
    endsAt: toIsoTimestamp(row.ends_at),
    durationMinutes: row.duration_minutes,
    source: row.source,
    notesSummary: row.notes_summary ?? undefined,
    createdAt: toIsoTimestamp(row.created_at),
    updatedAt: toIsoTimestamp(row.updated_at),
  });
}

function readRelationValue<TField extends string>(
  relation: Record<TField, string | null> | Record<TField, string | null>[] | null,
  field: TField,
) {
  const record = Array.isArray(relation) ? relation[0] : relation;
  return record?.[field] ?? "";
}

function toIsoTimestamp(value: string) {
  const time = Date.parse(value);

  if (Number.isNaN(time)) {
    return value;
  }

  return new Date(time).toISOString();
}
