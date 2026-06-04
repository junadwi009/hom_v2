import { paymentSchema } from "@hom/domain/payments";

export type PaymentRpcRow = {
  id: string;
  client_id: string;
  client_name: string;
  client_package_id: string | null;
  package_name: string | null;
  amount_idr: number | string;
  payment_method: string;
  status: string;
  paid_at: string | null;
  reference_number: string | null;
  notes: string | null;
  created_by_app_user_id: string | null;
  updated_by_app_user_id: string | null;
  created_at: string;
  updated_at: string;
};

export function mapPaymentRpcRow(row: PaymentRpcRow) {
  return paymentSchema.parse({
    id: row.id,
    clientId: row.client_id,
    clientName: row.client_name,
    clientPackageId: row.client_package_id ?? undefined,
    packageName: row.package_name ?? undefined,
    amountIdr: typeof row.amount_idr === "number" ? row.amount_idr : Number(row.amount_idr),
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

function toIsoTimestamp(value: string) {
  const time = Date.parse(value);

  if (Number.isNaN(time)) {
    return value;
  }

  return new Date(time).toISOString();
}
