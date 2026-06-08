import type { Payment } from "@hom/domain/payments";

export type PaymentDataSource = "mock" | "supabase";

export type PaymentTableRow = {
  id: string;
  clientName: string;
  packageName: string;
  amountIdr: string;
  paymentMethod: string;
  status: Payment["status"];
  paidAt: string;
  referenceNumber: string;
  updated: string;
};

export type PaymentsSummary = {
  totalCount: number;
  visibleCount: number;
  paidAmountIdr: number;
  pendingAmountIdr: number;
  cancelledFailedAmountIdr: number;
};

export type PaymentsPageState =
  | {
      status: "ready";
      source: PaymentDataSource;
      rows: PaymentTableRow[];
      total: number;
      pageSize: number;
      summary: PaymentsSummary;
    }
  | {
      status: "empty";
      source: PaymentDataSource;
    }
  | {
      status: "permission_denied";
      source: "supabase";
    }
  | {
      status: "configuration_error";
      source: "supabase";
    }
  | {
      status: "error";
      source: PaymentDataSource;
    };

const PLACEHOLDER = "—";

export function toPaymentTableRow(payment: Payment): PaymentTableRow {
  return {
    id: payment.id,
    clientName: payment.clientName,
    packageName: payment.packageName ?? PLACEHOLDER,
    amountIdr: formatAmountIdr(payment.amountIdr),
    paymentMethod: formatPaymentMethod(payment.paymentMethod),
    status: payment.status,
    paidAt: payment.paidAt ? toDateLabel(payment.paidAt) : PLACEHOLDER,
    referenceNumber: payment.referenceNumber ?? PLACEHOLDER,
    updated: toDateLabel(payment.updatedAt),
  };
}

// Operation-level aggregates for the payments KPI cards. Amount sums cover the
// loaded (visible) page; `totalCount` reflects the repository total.
export function computePaymentsSummary(
  items: Payment[],
  total: number,
): PaymentsSummary {
  let paidAmountIdr = 0;
  let pendingAmountIdr = 0;
  let cancelledFailedAmountIdr = 0;

  for (const payment of items) {
    if (payment.status === "paid") {
      paidAmountIdr += payment.amountIdr;
    } else if (payment.status === "pending") {
      pendingAmountIdr += payment.amountIdr;
    } else if (payment.status === "cancelled" || payment.status === "failed") {
      cancelledFailedAmountIdr += payment.amountIdr;
    }
  }

  return {
    totalCount: total,
    visibleCount: items.length,
    paidAmountIdr,
    pendingAmountIdr,
    cancelledFailedAmountIdr,
  };
}

export function formatAmountIdr(value: number) {
  return `Rp ${value.toLocaleString("id-ID")}`;
}

function formatPaymentMethod(value: Payment["paymentMethod"]) {
  return value.replaceAll("_", " ");
}

function toDateLabel(timestamp: string) {
  const time = Date.parse(timestamp);

  if (Number.isNaN(time)) {
    return "Unknown";
  }

  return new Date(time).toISOString().slice(0, 10);
}
