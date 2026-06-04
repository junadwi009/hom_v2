import { paymentSchema } from "@hom/domain/payments";

import type { PaymentRow } from "./types";

export function mapPaymentRow(row: PaymentRow) {
  const packageName = row.client_package_id
    ? getPackageName(row)
    : undefined;

  return paymentSchema.parse({
    id: row.id,
    clientId: row.client_id,
    clientName: getClientName(row),
    clientPackageId: row.client_package_id ?? undefined,
    packageName,
    amountIdr: toNumber(row.amount_idr),
    paymentMethod: row.payment_method,
    status: row.status,
    paidAt: row.paid_at ? toIsoTimestamp(row.paid_at) : undefined,
    referenceNumber: row.reference_number ?? undefined,
    notes: row.notes ?? undefined,
    createdByAppUserId: row.created_by_app_user_id ?? undefined,
    updatedByAppUserId: row.updated_by_app_user_id ?? undefined,
    createdAt: toIsoTimestamp(row.created_at),
    updatedAt: toIsoTimestamp(row.updated_at),
  });
}

function getClientName(row: PaymentRow) {
  const relation = row.clients;

  if (Array.isArray(relation)) {
    return relation[0]?.full_name ?? "Unknown client";
  }

  return relation?.full_name ?? "Unknown client";
}

function getPackageName(row: PaymentRow) {
  const relation = row.client_packages;
  const clientPackage = Array.isArray(relation) ? relation[0] : relation;
  const packages = clientPackage?.packages;

  if (Array.isArray(packages)) {
    return packages[0]?.name ?? undefined;
  }

  return packages?.name ?? undefined;
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
