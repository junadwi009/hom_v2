import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { PermissionDeniedState } from "@/components/feedback/permission-denied-state";
import { DashboardCard } from "@/components/hom/dashboard-card";
import { MetricCard } from "@/components/hom/metric-card";
import { PageHeader } from "@/components/layout/page-header";

import { AssignClientPackageSheet } from "./assign-client-package-sheet";
import type {
  AssignClientPackageFormAction,
  AssignClientPackageOptionsState,
} from "./assign-client-package-types";
import type { ClientPackagesPageState } from "./client-packages-page-state";
import { ClientPackagesTable } from "./client-packages-table";

export function ClientPackagesPage({
  assignAction,
  assignmentOptionsState,
  canAssignPackage,
  state,
}: {
  assignAction?: AssignClientPackageFormAction;
  assignmentOptionsState: AssignClientPackageOptionsState;
  canAssignPackage?: boolean;
  state: ClientPackagesPageState;
}) {
  return (
    <>
      <PageHeader
        eyebrow="Membership"
        title="Client Packages"
        description="Read-only package ownership and session balance view."
        actions={
          <AssignClientPackageSheet
            action={assignAction}
            canAssignPackage={canAssignPackage}
            optionsState={assignmentOptionsState}
          />
        }
      />
      <ClientPackagesSummary state={state} />
      <DashboardCard
        title="Client package ownership"
        description="Client package dates, session balances, and status."
      >
        <ClientPackagesContent state={state} />
      </DashboardCard>
    </>
  );
}

function ClientPackagesSummary({ state }: { state: ClientPackagesPageState }) {
  const loadedValue =
    state.status === "ready" ? String(state.total) : "Unavailable";
  const visibleValue =
    state.status === "ready" ? String(state.rows.length) : "Unavailable";

  return (
    <section className="grid gap-4 md:grid-cols-3">
      <MetricCard
        label="Loaded ownerships"
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
        label="Roster source"
        value={state.source}
        helper="local workspace"
        trend="safe"
        tone="neutral"
      />
    </section>
  );
}

function ClientPackagesContent({ state }: { state: ClientPackagesPageState }) {
  if (state.status === "ready") {
    return <ClientPackagesTable rows={state.rows} />;
  }

  if (state.status === "empty") {
    return (
      <EmptyState
        title="No client packages available"
        description="The read-only ownership view returned no records for this page."
      />
    );
  }

  if (state.status === "permission_denied") {
    return <PermissionDeniedState />;
  }

  if (state.status === "configuration_error") {
    return (
      <ErrorState
        title="Package configuration unavailable"
        description="Client package ownership cannot be loaded from the selected source."
      />
    );
  }

  return (
    <ErrorState
      title="Could not load client packages"
      description="Client package ownership is temporarily unavailable."
    />
  );
}
