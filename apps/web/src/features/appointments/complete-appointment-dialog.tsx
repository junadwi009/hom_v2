"use client";

import type {
  CompleteAppointmentActionState,
  CompleteAppointmentFormAction,
} from "./complete-appointment-types";
import { TerminalAppointmentDialog } from "./terminal-appointment-dialog";

export function CompleteAppointmentDialog({
  action,
  appointmentId,
  appointmentLabel,
  canCompleteAppointment,
  dataMode,
  initialOpen,
  previewState,
  previewSubmitting,
}: {
  action?: CompleteAppointmentFormAction;
  appointmentId: string;
  appointmentLabel: string;
  canCompleteAppointment?: boolean;
  dataMode: "mock" | "supabase";
  initialOpen?: boolean;
  previewState?: CompleteAppointmentActionState;
  previewSubmitting?: boolean;
}) {
  return (
    <TerminalAppointmentDialog
      action={action}
      appointmentId={appointmentId}
      appointmentLabel={appointmentLabel}
      canManageAppointment={canCompleteAppointment}
      dataMode={dataMode}
      initialOpen={initialOpen}
      kind="complete"
      previewState={previewState}
      previewSubmitting={previewSubmitting}
    />
  );
}
