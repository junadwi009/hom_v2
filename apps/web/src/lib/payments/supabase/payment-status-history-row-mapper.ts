import { paymentStatusHistorySchema } from "@hom/domain/payments";

import type { PaymentStatusHistoryRow } from "./types";

export function mapPaymentStatusHistoryRow(row: PaymentStatusHistoryRow) {
  return paymentStatusHistorySchema.parse({
    id: row.id,
    paymentId: row.payment_id,
    fromStatus: row.from_status ?? undefined,
    toStatus: row.to_status,
    reason: row.reason ?? undefined,
    actorAppUserId: row.actor_app_user_id ?? undefined,
    metadata: row.metadata ?? {},
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
