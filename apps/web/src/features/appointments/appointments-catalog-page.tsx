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
import type {
  DeductSessionFormAction,
  DeductSessionOptionsState,
} from "./deduct-session-types";
import type { RescheduleAppointmentFormAction } from "./reschedule-appointment-types";
import type { MarkNoShowAppointmentFormAction } from "./mark-no-show-appointment-types";

export function AppointmentsCatalogPage({
  canCreateAppointment,
  canCancelAppointment,
  canCompleteAppointment,
  canDeductSession,
  canMarkNoShowAppointment,
  canRescheduleAppointment,
  cancelAction,
  completeAction,
  createAction,
  createOptionsState,
  deductAction,
  deductOptionsByAppointmentId,
  markNoShowAction,
  rescheduleAction,
  state,
}: {
  canCreateAppointment?: boolean;
  canCancelAppointment?: boolean;
  canCompleteAppointment?: boolean;
  canDeductSession?: boolean;
  canMarkNoShowAppointment?: boolean;
  canRescheduleAppointment?: boolean;
  cancelAction?: CancelAppointmentFormAction;
  completeAction?: CompleteAppointmentFormAction;
  createAction?: CreateAppointmentFormAction;
  createOptionsState: CreateAppointmentOptionsState;
  deductAction?: DeductSessionFormAction;
  deductOptionsByAppointmentId?: Record<string, DeductSessionOptionsState>;
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
          canDeductSession={canDeductSession}
          canMarkNoShowAppointment={canMarkNoShowAppointment}
          canRescheduleAppointment={canRescheduleAppointment}
          cancelAction={cancelAction}
          completeAction={completeAction}
          deductAction={deductAction}
          deductOptionsByAppointmentId={deductOptionsByAppointmentId}
          markNoShowAction={markNoShowAction}
          rescheduleAction={rescheduleAction}
          state={state}
        />
      </DashboardCard>
    </>
  );
}

function AppointmentsSummary({ state }: { state: AppointmentsPageState }) {
  const ready = state.status === "ready";
  const rows = ready ? state.rows : [];
  const totalJadwal = ready ? state.total : 0;
  const totalSukses = rows.filter((row) => row.status === "completed").length;
  const totalCancelNoShow = rows.filter(
    (row) => row.status === "cancelled" || row.status === "no_show",
  ).length;

  return (
    <section className="grid gap-4 md:grid-cols-3">
      <MetricCard
        label="Total Jadwal"
        value={ready ? String(totalJadwal) : "—"}
        helper="Seluruh janji temu"
        trend={ready ? "terjadwal" : "—"}
        tone={ready ? "info" : "neutral"}
      />
      <MetricCard
        label="Total Sukses"
        value={ready ? String(totalSukses) : "—"}
        helper="Sesi selesai"
        trend={ready ? "selesai" : "—"}
        tone={ready ? "success" : "neutral"}
      />
      <MetricCard
        label="Total Cancel / No-show"
        value={ready ? String(totalCancelNoShow) : "—"}
        helper="Dibatalkan atau tidak hadir"
        trend={ready && totalCancelNoShow > 0 ? "perlu perhatian" : "aman"}
        tone={ready ? (totalCancelNoShow > 0 ? "warning" : "success") : "neutral"}
      />
    </section>
  );
}

function AppointmentsContent({
  canCancelAppointment,
  canCompleteAppointment,
  canDeductSession,
  canMarkNoShowAppointment,
  canRescheduleAppointment,
  cancelAction,
  completeAction,
  deductAction,
  deductOptionsByAppointmentId,
  markNoShowAction,
  rescheduleAction,
  state,
}: {
  canCancelAppointment?: boolean;
  canCompleteAppointment?: boolean;
  canDeductSession?: boolean;
  canMarkNoShowAppointment?: boolean;
  canRescheduleAppointment?: boolean;
  cancelAction?: CancelAppointmentFormAction;
  completeAction?: CompleteAppointmentFormAction;
  deductAction?: DeductSessionFormAction;
  deductOptionsByAppointmentId?: Record<string, DeductSessionOptionsState>;
  markNoShowAction?: MarkNoShowAppointmentFormAction;
  rescheduleAction?: RescheduleAppointmentFormAction;
  state: AppointmentsPageState;
}) {
  if (state.status === "ready") {
    return (
      <AppointmentsTable
        canCancelAppointment={canCancelAppointment}
        canCompleteAppointment={canCompleteAppointment}
        canDeductSession={canDeductSession}
        canMarkNoShowAppointment={canMarkNoShowAppointment}
        canRescheduleAppointment={canRescheduleAppointment}
        cancelAction={cancelAction}
        completeAction={completeAction}
        dataMode={state.source}
        deductAction={deductAction}
        deductOptionsByAppointmentId={deductOptionsByAppointmentId}
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
