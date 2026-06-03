import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { PermissionDeniedState } from "@/components/feedback/permission-denied-state";
import { DashboardCard } from "@/components/hom/dashboard-card";
import { MetricCard } from "@/components/hom/metric-card";
import { PageHeader } from "@/components/layout/page-header";

import type { PackagesPageState } from "./packages-page-state";
import { PackagesTable } from "./packages-table";

export function PackagesPage({ state }: { state: PackagesPageState }) {
  return (
    <>
      <PageHeader
        eyebrow="Membership"
        title="Packages"
        description="Read-only package and membership catalog for operational reference."
      />
      <PackagesSummary state={state} />
      <DashboardCard
        title="Package catalog"
        description="Package type, sessions, validity, price, and status."
      >
        <PackagesContent state={state} />
      </DashboardCard>
    </>
  );
}

function PackagesSummary({ state }: { state: PackagesPageState }) {
  const loadedValue =
    state.status === "ready" ? String(state.total) : "Unavailable";
  const visibleValue =
    state.status === "ready" ? String(state.rows.length) : "Unavailable";

  return (
    <section className="grid gap-4 md:grid-cols-3">
      <MetricCard
        label="Loaded packages"
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

function PackagesContent({ state }: { state: PackagesPageState }) {
  if (state.status === "ready") {
    return <PackagesTable rows={state.rows} />;
  }

  if (state.status === "empty") {
    return (
      <EmptyState
        title="No packages available"
        description="The read-only package catalog returned no records for this page."
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
        description="The package catalog cannot be loaded from the selected source."
      />
    );
  }

  return (
    <ErrorState
      title="Could not load packages"
      description="The package catalog is temporarily unavailable."
    />
  );
}
