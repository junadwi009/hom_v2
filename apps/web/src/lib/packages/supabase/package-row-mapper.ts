import { packageSchema } from "@hom/domain/packages";

import type { PackageRow } from "./types";

export function mapPackageRow(row: PackageRow) {
  return packageSchema.parse({
    id: row.id,
    name: row.name,
    packageType: row.package_type,
    totalSessions: row.total_sessions,
    validityDays: row.validity_days,
    priceIdr: toNumber(row.price_idr),
    status: row.status,
    createdAt: toIsoTimestamp(row.created_at),
    updatedAt: toIsoTimestamp(row.updated_at),
  });
}

function toNumber(value: number | string) {
  return typeof value === "number" ? value : Number(value);
}

function toIsoTimestamp(value: string) {
  const time = Date.parse(value);

  if (Number.isNaN(time)) {
    return value;
  }

  return new Date(time).toISOString();
}
