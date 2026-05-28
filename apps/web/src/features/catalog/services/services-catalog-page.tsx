import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { PermissionDeniedState } from "@/components/feedback/permission-denied-state";
import { DashboardCard } from "@/components/hom/dashboard-card";
import { MetricCard } from "@/components/hom/metric-card";
import { PageHeader } from "@/components/layout/page-header";

import type { ServicesPageState } from "./services-page-state";
import { ServicesTable } from "./services-table";

export function ServicesCatalogPage({ state }: { state: ServicesPageState }) {
  return (
    <>
      <PageHeader
        eyebrow="Registry"
        title="Services"
        description="Read-only service catalog for operational reference."
      />
      <ServicesSummary state={state} />
      <DashboardCard
        title="Service catalog"
        description="Service category, duration, default price, and status."
      >
        <ServicesContent state={state} />
      </DashboardCard>
    </>
  );
}

function ServicesSummary({ state }: { state: ServicesPageState }) {
  const loadedValue =
    state.status === "ready" ? String(state.total) : "Unavailable";
  const visibleValue =
    state.status === "ready" ? String(state.rows.length) : "Unavailable";

  return (
    <section className="grid gap-4 md:grid-cols-3">
      <MetricCard
        label="Loaded services"
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

function ServicesContent({ state }: { state: ServicesPageState }) {
  if (state.status === "ready") {
    return <ServicesTable rows={state.rows} />;
  }

  if (state.status === "empty") {
    return (
      <EmptyState
        title="No services available"
        description="The read-only catalog returned no services for this page."
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
        description="The service catalog cannot be loaded from the selected source."
      />
    );
  }

  return (
    <ErrorState
      title="Could not load services"
      description="The service catalog is temporarily unavailable."
    />
  );
}
