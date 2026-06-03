import { clientPackageSchema } from "@hom/domain/packages";

import type { ClientPackageRow } from "./types";

export function mapClientPackageRow(row: ClientPackageRow) {
  return clientPackageSchema.parse({
    id: row.id,
    clientId: row.client_id,
    clientName: getClientName(row),
    packageId: row.package_id,
    packageName: getPackageName(row),
    purchasedAt: toIsoTimestamp(row.purchased_at),
    expiresAt: toIsoTimestamp(row.expires_at),
    totalSessions: row.total_sessions,
    remainingSessions: row.remaining_sessions,
    status: row.status,
    createdAt: toIsoTimestamp(row.created_at),
    updatedAt: toIsoTimestamp(row.updated_at),
  });
}

function getClientName(row: ClientPackageRow) {
  const relation = row.clients;

  if (Array.isArray(relation)) {
    return relation[0]?.full_name ?? "Unknown client";
  }

  return relation?.full_name ?? "Unknown client";
}

function getPackageName(row: ClientPackageRow) {
  const relation = row.packages;

  if (Array.isArray(relation)) {
    return relation[0]?.name ?? "Unknown package";
  }

  return relation?.name ?? "Unknown package";
}

function toIsoTimestamp(value: string) {
  const time = Date.parse(value);

  if (Number.isNaN(time)) {
    return value;
  }

  return new Date(time).toISOString();
}
