import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { PermissionDeniedState } from "@/components/feedback/permission-denied-state";
import { DashboardCard } from "@/components/hom/dashboard-card";
import { MetricCard } from "@/components/hom/metric-card";
import { PageHeader } from "@/components/layout/page-header";

import { CreatePractitionerSheet } from "./create-practitioner-sheet";
import type { CreatePractitionerFormAction } from "./create-practitioner-types";
import type { PractitionersPageState } from "./practitioners-page-state";
import { PractitionersTable } from "./practitioners-table";

export function PractitionersCatalogPage({
  state,
  createAction,
  canCreate = false,
}: {
  state: PractitionersPageState;
  createAction?: CreatePractitionerFormAction;
  canCreate?: boolean;
}) {
  return (
    <>
      <PageHeader
        eyebrow="Registry"
        title="Practitioners"
        description="Practitioner roster and app profile linkage for operational review."
        actions={
          createAction ? (
            <CreatePractitionerSheet action={createAction} canCreate={canCreate} />
          ) : undefined
        }
      />
      <PractitionersSummary state={state} />
      <DashboardCard
        title="Practitioner catalog"
        description="Practitioner status and app profile linkage."
      >
        <PractitionersContent state={state} />
      </DashboardCard>
    </>
  );
}

function PractitionersSummary({ state }: { state: PractitionersPageState }) {
  const loadedValue =
    state.status === "ready" ? String(state.total) : "Unavailable";
  const visibleValue =
    state.status === "ready" ? String(state.rows.length) : "Unavailable";

  return (
    <section className="grid gap-4 md:grid-cols-3">
      <MetricCard
        label="Loaded practitioners"
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

function PractitionersContent({ state }: { state: PractitionersPageState }) {
  if (state.status === "ready") {
    return <PractitionersTable rows={state.rows} />;
  }

  if (state.status === "empty") {
    return (
      <EmptyState
        title="No practitioners available"
        description="The read-only catalog returned no practitioners for this page."
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
        description="The practitioner roster cannot be loaded from the selected source."
      />
    );
  }

  return (
    <ErrorState
      title="Could not load practitioners"
      description="The practitioner roster is temporarily unavailable."
    />
  );
}
