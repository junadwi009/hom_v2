import { CheckCircle2, Clock, ListChecks, Wallet, XCircle } from "lucide-react";

import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { PermissionDeniedState } from "@/components/feedback/permission-denied-state";
import { DashboardCard } from "@/components/hom/dashboard-card";
import { PageHeader } from "@/components/layout/page-header";
import {
  ClientKpiRow,
  type ClientKpi,
} from "@/features/clients/shared/clients-kpi-card";
import { formatCompactIDR } from "@/lib/format";

import { CreatePaymentSheet } from "./create-payment-sheet";
import type {
  CreatePaymentFormAction,
  CreatePaymentOptionsState,
} from "./create-payment-types";
import { PaymentsExportButton } from "./payments-export-button";
import type { PaymentTransitionFormAction } from "./payment-transition-types";
import type { PaymentsPageState, PaymentsSummary } from "./payments-page-state";
import { PaymentsTable } from "./payments-table";

export function PaymentsPage({
  canCreatePayment,
  canManagePayment,
  cancelAction,
  createAction,
  createOptionsState,
  initialCreateOpen = false,
  markPaidAction,
  state,
}: {
  canCreatePayment?: boolean;
  canManagePayment?: boolean;
  cancelAction?: PaymentTransitionFormAction;
  createAction?: CreatePaymentFormAction;
  createOptionsState?: CreatePaymentOptionsState;
  initialCreateOpen?: boolean;
  markPaidAction?: PaymentTransitionFormAction;
  state: PaymentsPageState;
}) {
  return (
    <>
      <PageHeader
        eyebrow="Finance"
        title="Payments"
        description="Catatan pembayaran manual untuk referensi operasional (read-only)."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {state.status === "ready" ? (
              <PaymentsExportButton rows={state.rows} />
            ) : null}
            {createOptionsState ? (
              <CreatePaymentSheet
                action={createAction}
                canCreatePayment={canCreatePayment}
                initialOpen={initialCreateOpen}
                optionsState={createOptionsState}
              />
            ) : null}
          </div>
        }
      />
      {state.status === "ready" ? (
        <PaymentsSummaryCards summary={state.summary} />
      ) : null}
      <DashboardCard
        title="Manual payments"
        description="Client, paket, jumlah, metode, status, tanggal bayar, dan referensi."
      >
        <PaymentsContent
          cancelAction={cancelAction}
          canManagePayment={canManagePayment}
          markPaidAction={markPaidAction}
          state={state}
        />
      </DashboardCard>
    </>
  );
}

function PaymentsSummaryCards({ summary }: { summary: PaymentsSummary }) {
  const cards: ClientKpi[] = [
    {
      icon: Wallet,
      label: "Total Payments",
      value: String(summary.totalCount),
      helper: "seluruh record pembayaran",
      accent: "default",
    },
    {
      icon: CheckCircle2,
      label: "Paid Amount",
      value: formatCompactIDR(summary.paidAmountIdr),
      helper: "sudah dibayar",
      accent: "success",
    },
    {
      icon: Clock,
      label: "Pending Amount",
      value: formatCompactIDR(summary.pendingAmountIdr),
      helper: "menunggu pembayaran",
      accent: "warning",
    },
    {
      icon: XCircle,
      label: "Cancelled / Failed",
      value: formatCompactIDR(summary.cancelledFailedAmountIdr),
      helper: "dibatalkan / gagal",
      accent: "danger",
    },
    {
      icon: ListChecks,
      label: "Visible Records",
      value: String(summary.visibleCount),
      helper: "ditampilkan di halaman ini",
      accent: "info",
    },
  ];

  return (
    <ClientKpiRow
      className="grid-cols-2 sm:grid-cols-3 xl:grid-cols-5"
      items={cards}
    />
  );
}

function PaymentsContent({
  cancelAction,
  canManagePayment,
  markPaidAction,
  state,
}: {
  cancelAction?: PaymentTransitionFormAction;
  canManagePayment?: boolean;
  markPaidAction?: PaymentTransitionFormAction;
  state: PaymentsPageState;
}) {
  if (state.status === "ready") {
    return (
      <PaymentsTable
        cancelAction={cancelAction}
        canManagePayment={canManagePayment}
        dataMode={state.source}
        markPaidAction={markPaidAction}
        rows={state.rows}
      />
    );
  }

  if (state.status === "empty") {
    return (
      <EmptyState
        title="No payments available"
        description="The read-only payment records returned no results for this page."
      />
    );
  }

  if (state.status === "permission_denied") {
    return <PermissionDeniedState />;
  }

  if (state.status === "configuration_error") {
    return (
      <ErrorState
        title="Payment configuration unavailable"
        description="The payment records cannot be loaded from the selected source."
      />
    );
  }

  return (
    <ErrorState
      title="Could not load payments"
      description="The payment records are temporarily unavailable."
    />
  );
}
