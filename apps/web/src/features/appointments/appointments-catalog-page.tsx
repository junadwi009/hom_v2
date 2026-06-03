import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { PermissionDeniedState } from "@/components/feedback/permission-denied-state";
import { DashboardCard } from "@/components/hom/dashboard-card";
import { MetricCard } from "@/components/hom/metric-card";
import { PageHeader } from "@/components/layout/page-header";

import { AppointmentsTable } from "./appointments-table";
import type { CancelAppointmentFormAction } from "./cancel-appointment-types";
import type { CompleteAppointmentFormAction } from "./complete-appointment-types";
import type { AppointmentsPageState } from "./appointments-page-state";
import { CreateAppointmentSheet } from "./create-appointment-sheet";
import type {
  CreateAppointmentFormAction,
  CreateAppointmentOptionsState,
} from "./create-appointment-types";
import type { RescheduleAppointmentFormAction } from "./reschedule-appointment-types";
import type { MarkNoShowAppointmentFormAction } from "./mark-no-show-appointment-types";

export function AppointmentsCatalogPage({
  canCreateAppointment,
  canCancelAppointment,
  canCompleteAppointment,
  canMarkNoShowAppointment,
  canRescheduleAppointment,
  cancelAction,
  completeAction,
  createAction,
  createOptionsState,
  markNoShowAction,
  rescheduleAction,
  state,
}: {
  canCreateAppointment?: boolean;
  canCancelAppointment?: boolean;
  canCompleteAppointment?: boolean;
  canMarkNoShowAppointment?: boolean;
  canRescheduleAppointment?: boolean;
  cancelAction?: CancelAppointmentFormAction;
  completeAction?: CompleteAppointmentFormAction;
  createAction?: CreateAppointmentFormAction;
  createOptionsState: CreateAppointmentOptionsState;
  markNoShowAction?: MarkNoShowAppointmentFormAction;
  rescheduleAction?: RescheduleAppointmentFormAction;
  state: AppointmentsPageState;
}) {
  return (
    <>
      <PageHeader
        eyebrow="Schedule"
        title="Appointments"
        description="Appointment schedule for safe operational review and approved changes."
        actions={
          <CreateAppointmentSheet
            action={createAction}
            canCreateAppointment={canCreateAppointment}
            optionsState={createOptionsState}
          />
        }
      />
      <AppointmentsSummary state={state} />
      <DashboardCard
        title="Appointment schedule"
        description="Current appointment time, ownership, service, status, and approved actions."
      >
        <AppointmentsContent
          canCancelAppointment={canCancelAppointment}
          canCompleteAppointment={canCompleteAppointment}
          canMarkNoShowAppointment={canMarkNoShowAppointment}
          canRescheduleAppointment={canRescheduleAppointment}
          cancelAction={cancelAction}
          completeAction={completeAction}
          markNoShowAction={markNoShowAction}
          rescheduleAction={rescheduleAction}
          state={state}
        />
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

function AppointmentsContent({
  canCancelAppointment,
  canCompleteAppointment,
  canMarkNoShowAppointment,
  canRescheduleAppointment,
  cancelAction,
  completeAction,
  markNoShowAction,
  rescheduleAction,
  state,
}: {
  canCancelAppointment?: boolean;
  canCompleteAppointment?: boolean;
  canMarkNoShowAppointment?: boolean;
  canRescheduleAppointment?: boolean;
  cancelAction?: CancelAppointmentFormAction;
  completeAction?: CompleteAppointmentFormAction;
  markNoShowAction?: MarkNoShowAppointmentFormAction;
  rescheduleAction?: RescheduleAppointmentFormAction;
  state: AppointmentsPageState;
}) {
  if (state.status === "ready") {
    return (
      <AppointmentsTable
        canCancelAppointment={canCancelAppointment}
        canCompleteAppointment={canCompleteAppointment}
        canMarkNoShowAppointment={canMarkNoShowAppointment}
        canRescheduleAppointment={canRescheduleAppointment}
        cancelAction={cancelAction}
        completeAction={completeAction}
        dataMode={state.source}
        markNoShowAction={markNoShowAction}
        rescheduleAction={rescheduleAction}
        rows={state.rows}
      />
    );
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
