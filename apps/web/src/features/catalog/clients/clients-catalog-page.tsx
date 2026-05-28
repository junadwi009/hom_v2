import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { PermissionDeniedState } from "@/components/feedback/permission-denied-state";
import { DashboardCard } from "@/components/hom/dashboard-card";
import { MetricCard } from "@/components/hom/metric-card";
import { PageHeader } from "@/components/layout/page-header";

import { ClientsTable } from "./clients-table";
import type { ClientsPageState } from "./clients-page-state";

export function ClientsCatalogPage({ state }: { state: ClientsPageState }) {
  return (
    <>
      <PageHeader
        eyebrow="Registry"
        title="Clients"
        description="Current client roster and practitioner ownership for operational review."
      />
      <ClientsSummary state={state} />
      <DashboardCard
        title="Client catalog"
        description="Client status and primary practitioner assignment."
      >
        <ClientsContent state={state} />
      </DashboardCard>
    </>
  );
}

function ClientsSummary({ state }: { state: ClientsPageState }) {
  const loadedValue = state.status === "ready" ? String(state.total) : "Unavailable";
  const visibleValue =
    state.status === "ready" ? String(state.rows.length) : "Unavailable";

  return (
    <section className="grid gap-4 md:grid-cols-3">
      <MetricCard
        label="Loaded clients"
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

function ClientsContent({ state }: { state: ClientsPageState }) {
  if (state.status === "ready") {
    return <ClientsTable rows={state.rows} />;
  }

  if (state.status === "empty") {
    return (
      <EmptyState
        title="No clients available"
        description="The read-only catalog returned no clients for this page."
      />
    );
  }

  if (state.status === "permission_denied") {
    return <PermissionDeniedState />;
  }

  if (state.status === "configuration_error") {
    return (
      <ErrorState
        title="Catalog configuration unavailable"
        description="The client roster cannot be loaded from the selected source."
      />
    );
  }

  return (
    <ErrorState
      title="Could not load clients"
      description="The client roster is temporarily unavailable."
    />
  );
}
