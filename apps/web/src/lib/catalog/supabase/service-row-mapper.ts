import { serviceSchema } from "@hom/domain/services";

import type { ServiceRow } from "./types";

export function mapServiceRow(row: ServiceRow) {
  return serviceSchema.parse({
    id: row.id,
    name: row.name,
    category: row.category,
    defaultDurationMinutes: row.default_duration_minutes,
    defaultPriceIdr: toNullableNumber(row.default_price_idr),
    status: row.status,
    createdAt: toIsoTimestamp(row.created_at),
    updatedAt: toIsoTimestamp(row.updated_at),
  });
}

function toNullableNumber(value: number | string | null) {
  if (value === null) {
    return null;
  }

  return Number(value);
}

function toIsoTimestamp(value: string) {
  const time = Date.parse(value);

  if (Number.isNaN(time)) {
    return value;
  }

  return new Date(time).toISOString();
}
