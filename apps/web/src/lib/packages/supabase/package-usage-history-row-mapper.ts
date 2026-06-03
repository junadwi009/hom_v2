import { packageUsageHistorySchema } from "@hom/domain/packages";

import type { PackageUsageHistoryRow } from "./types";

export function mapPackageUsageHistoryRow(row: PackageUsageHistoryRow) {
  return packageUsageHistorySchema.parse({
    id: row.id,
    clientPackageId: row.client_package_id,
    appointmentId: row.appointment_id ?? undefined,
    changeType: row.change_type,
    quantity: row.quantity,
    beforeRemaining: row.before_remaining,
    afterRemaining: row.after_remaining,
    reason: row.reason ?? undefined,
    actorAppUserId: row.actor_app_user_id ?? undefined,
    createdAt: toIsoTimestamp(row.created_at),
  });
}

function toIsoTimestamp(value: string) {
  const time = Date.parse(value);

  if (Number.isNaN(time)) {
    return value;
  }

  return new Date(time).toISOString();
}
