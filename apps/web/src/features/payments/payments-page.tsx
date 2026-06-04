import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { PermissionDeniedState } from "@/components/feedback/permission-denied-state";
import { DashboardCard } from "@/components/hom/dashboard-card";
import { MetricCard } from "@/components/hom/metric-card";
import { PageHeader } from "@/components/layout/page-header";

import { CreatePaymentSheet } from "./create-payment-sheet";
import type {
  CreatePaymentFormAction,
  CreatePaymentOptionsState,
} from "./create-payment-types";
import type { PaymentTransitionFormAction } from "./payment-transition-types";
import type { PaymentsPageState } from "./payments-page-state";
import { PaymentsTable } from "./payments-table";

export function PaymentsPage({
  canCreatePayment,
  canManagePayment,
  cancelAction,
  createAction,
  createOptionsState,
  markPaidAction,
  state,
}: {
  canCreatePayment?: boolean;
  canManagePayment?: boolean;
  cancelAction?: PaymentTransitionFormAction;
  createAction?: CreatePaymentFormAction;
  createOptionsState?: CreatePaymentOptionsState;
  markPaidAction?: PaymentTransitionFormAction;
  state: PaymentsPageState;
}) {
  return (
    <>
      <PageHeader
        eyebrow="Finance"
        title="Payments"
        description="Read-only manual payment records for operational reference."
        actions={
          createOptionsState ? (
            <CreatePaymentSheet
              action={createAction}
              canCreatePayment={canCreatePayment}
              optionsState={createOptionsState}
            />
          ) : undefined
        }
      />
      <PaymentsSummary state={state} />
      <DashboardCard
        title="Manual payments"
        description="Client, package, amount, method, status, paid date, and reference."
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

function PaymentsSummary({ state }: { state: PaymentsPageState }) {
  const loadedValue =
    state.status === "ready" ? String(state.total) : "Unavailable";
  const visibleValue =
    state.status === "ready" ? String(state.rows.length) : "Unavailable";

  return (
    <section className="grid gap-4 md:grid-cols-3">
      <MetricCard
        label="Loaded payments"
        value={loadedValue}
        helper="repository result"
        trend={state.status === "ready" ? "read-only" : "not loaded"}
        tone={state.status === "ready" ? "success" : "warning"}
      />
      <MetricCard
        label="Visible rows"
        value={visibleValue}
        helper="current page"
        trend={state.status === "ready" ? "page 1" : "paused"}
        tone={state.status === "ready" ? "info" : "warning"}
      />
      <MetricCard
        label="Payment source"
        value={state.source}
        helper="local workspace"
        trend="safe"
        tone="neutral"
      />
    </section>
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
