"use client";

import type {
  MarkNoShowAppointmentActionState,
  MarkNoShowAppointmentFormAction,
} from "./mark-no-show-appointment-types";
import { TerminalAppointmentDialog } from "./terminal-appointment-dialog";

export function MarkNoShowAppointmentDialog({
  action,
  appointmentId,
  appointmentLabel,
  canMarkNoShowAppointment,
  dataMode,
  initialOpen,
  previewState,
  previewSubmitting,
}: {
  action?: MarkNoShowAppointmentFormAction;
  appointmentId: string;
  appointmentLabel: string;
  canMarkNoShowAppointment?: boolean;
  dataMode: "mock" | "supabase";
  initialOpen?: boolean;
  previewState?: MarkNoShowAppointmentActionState;
  previewSubmitting?: boolean;
}) {
  return (
    <TerminalAppointmentDialog
      action={action}
      appointmentId={appointmentId}
      appointmentLabel={appointmentLabel}
      canManageAppointment={canMarkNoShowAppointment}
      dataMode={dataMode}
      initialOpen={initialOpen}
      kind="no_show"
      previewState={previewState}
      previewSubmitting={previewSubmitting}
    />
  );
}
