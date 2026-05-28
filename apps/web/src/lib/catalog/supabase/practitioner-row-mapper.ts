import { practitionerSchema } from "@hom/domain/practitioners";

import { maskEmail } from "@/lib/catalog/contact-masking";

import type { PractitionerRow } from "./types";

export function mapPractitionerRow(row: PractitionerRow) {
  return practitionerSchema.parse({
    id: row.id,
    appUserId: row.app_user_id,
    displayName: row.display_name,
    status: row.status,
    maskedEmail: maskEmail(row.email),
    createdAt: toIsoTimestamp(row.created_at),
    updatedAt: toIsoTimestamp(row.updated_at),
  });
}

function toIsoTimestamp(value: string) {
  const time = Date.parse(value);

  if (Number.isNaN(time)) {
    return value;
  }

  return new Date(time).toISOString();
}
