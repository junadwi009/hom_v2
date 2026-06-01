import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { PermissionDeniedState } from "@/components/feedback/permission-denied-state";
import { DashboardCard } from "@/components/hom/dashboard-card";
import { MetricCard } from "@/components/hom/metric-card";
import { PageHeader } from "@/components/layout/page-header";

import { AppointmentsTable } from "./appointments-table";
import type { AppointmentsPageState } from "./appointments-page-state";

export function AppointmentsCatalogPage({
  state,
}: {
  state: AppointmentsPageState;
}) {
  return (
    <>
      <PageHeader
        eyebrow="Schedule"
        title="Appointments"
        description="Read-only appointment schedule for operational review."
      />
      <AppointmentsSummary state={state} />
      <DashboardCard
        title="Appointment schedule"
        description="Current appointment time, ownership, service, and status."
      >
        <AppointmentsContent state={state} />
      </DashboardCard>
    </>
  );
}

function AppointmentsSummary({ state }: { state: AppointmentsPageState }) {
  const loadedValue =
    state.status === "ready" ? String(state.total) : "Unavailable";
  const visibleValue =
    state.status === "ready" ? String(state.rows.length) : "Unavailable";

  return (
    <section className="grid gap-4 md:grid-cols-3">
      <MetricCard
        label="Loaded appointments"
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
        label="Schedule source"
        value={state.source}
        helper="local workspace"
        trend="safe"
        tone="neutral"
      />
    </section>
  );
}

function AppointmentsContent({ state }: { state: AppointmentsPageState }) {
  if (state.status === "ready") {
    return <AppointmentsTable rows={state.rows} />;
  }

  if (state.status === "empty") {
    return (
      <EmptyState
        title="No appointments available"
        description="The read-only schedule returned no appointments for this page."
      />
    );
  }

  if (state.status === "permission_denied") {
    return <PermissionDeniedState />;
  }

  if (state.status === "configuration_error") {
    return (
      <ErrorState
        title="Schedule configuration unavailable"
        description="The appointment schedule cannot be loaded from the selected source."
      />
    );
  }

  return (
    <ErrorState
      title="Could not load appointments"
      description="The appointment schedule is temporarily unavailable."
    />
  );
}
