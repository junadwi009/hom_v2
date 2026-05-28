import { clientSchema } from "@hom/domain/clients";

import { maskEmail, maskPhone } from "@/lib/catalog/contact-masking";

import type { ClientRow } from "./types";

export function mapClientRow(row: ClientRow) {
  return clientSchema.parse({
    id: row.id,
    fullName: row.full_name,
    status: row.status,
    primaryPractitionerId: row.primary_practitioner_id,
    primaryPractitionerName: getPrimaryPractitionerName(row),
    maskedPhone: maskPhone(row.phone),
    maskedEmail: maskEmail(row.email),
    createdByAppUserId: row.created_by_app_user_id,
    createdAt: toIsoTimestamp(row.created_at),
    updatedAt: toIsoTimestamp(row.updated_at),
  });
}

function getPrimaryPractitionerName(row: ClientRow) {
  const relation = row.practitioners;

  if (Array.isArray(relation)) {
    return relation[0]?.display_name ?? null;
  }

  return relation?.display_name ?? null;
}

function toIsoTimestamp(value: string) {
  const time = Date.parse(value);

  if (Number.isNaN(time)) {
    return value;
  }

  return new Date(time).toISOString();
}
