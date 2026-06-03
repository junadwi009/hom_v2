import { StatusBadge } from "@/components/hom/status-badge";

import { CancelAppointmentDialog } from "./cancel-appointment-dialog";
import type { CancelAppointmentFormAction } from "./cancel-appointment-types";
import type { AppointmentTableRow } from "./appointments-page-state";
import { CompleteAppointmentDialog } from "./complete-appointment-dialog";
import type { CompleteAppointmentFormAction } from "./complete-appointment-types";
import { MarkNoShowAppointmentDialog } from "./mark-no-show-appointment-dialog";
import type { MarkNoShowAppointmentFormAction } from "./mark-no-show-appointment-types";
import { RescheduleAppointmentDialog } from "./reschedule-appointment-dialog";
import type { RescheduleAppointmentFormAction } from "./reschedule-appointment-types";

export function AppointmentsTable({
  canCancelAppointment,
  canCompleteAppointment,
  canMarkNoShowAppointment,
  canRescheduleAppointment,
  cancelAction,
  completeAction,
  dataMode,
  markNoShowAction,
  rescheduleAction,
  rows,
}: {
  canCancelAppointment?: boolean;
  canCompleteAppointment?: boolean;
  canMarkNoShowAppointment?: boolean;
  canRescheduleAppointment?: boolean;
  cancelAction?: CancelAppointmentFormAction;
  completeAction?: CompleteAppointmentFormAction;
  dataMode: "mock" | "supabase";
  markNoShowAction?: MarkNoShowAppointmentFormAction;
  rescheduleAction?: RescheduleAppointmentFormAction;
  rows: AppointmentTableRow[];
}) {
  return (
    <div className="overflow-hidden rounded-lg border bg-background-card">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1180px] border-collapse text-left text-sm">
          <thead className="bg-stone-50 text-xs uppercase text-foreground-muted">
            <tr>
              <th className="border-b px-4 py-3 font-semibold" scope="col">
                Schedule
              </th>
              <th className="border-b px-4 py-3 font-semibold" scope="col">
                Client
              </th>
              <th className="border-b px-4 py-3 font-semibold" scope="col">
                Practitioner
              </th>
              <th className="border-b px-4 py-3 font-semibold" scope="col">
                Service
              </th>
              <th className="border-b px-4 py-3 font-semibold" scope="col">
                Duration
              </th>
              <th className="border-b px-4 py-3 font-semibold" scope="col">
                Status
              </th>
              <th className="border-b px-4 py-3 font-semibold" scope="col">
                Source
              </th>
              <th className="border-b px-4 py-3 font-semibold" scope="col">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                className={
                  row.isModified
                    ? "border-b bg-amber-50/80 last:border-b-0 hover:bg-amber-100/70"
                    : "border-b last:border-b-0 hover:bg-stone-50/70"
                }
                key={row.id}
              >
                <td className="px-4 py-3 font-medium text-foreground">
                  <span className="flex flex-wrap items-center gap-2">
                    {row.scheduled}
                    {row.isModified ? (
                      <span className="rounded border border-amber-300 bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-amber-900">
                        Modified
                      </span>
                    ) : null}
                  </span>
                </td>
                <td className="px-4 py-3 text-foreground">{row.clientName}</td>
                <td className="px-4 py-3 text-foreground">
                  {row.practitionerName}
                </td>
                <td className="px-4 py-3 text-foreground">
                  {row.serviceName}
                </td>
                <td className="px-4 py-3 text-foreground">{row.duration}</td>
                <td className="px-4 py-3 text-foreground">
                  <StatusBadge status={row.status} />
                </td>
                <td className="px-4 py-3 text-foreground">{row.source}</td>
                <td className="px-4 py-3 text-foreground">
                  {row.status === "scheduled" ||
                  row.status === "confirmed" ? (
                    <span className="flex flex-wrap gap-2">
                      <RescheduleAppointmentDialog
                        action={rescheduleAction}
                        appointmentId={row.id}
                        appointmentLabel={`${row.scheduled} - ${row.clientName}`}
                        canRescheduleAppointment={canRescheduleAppointment}
                        dataMode={dataMode}
                        duration={row.duration}
                      />
                      <CancelAppointmentDialog
                        action={cancelAction}
                        appointmentId={row.id}
                        appointmentLabel={`${row.scheduled} - ${row.clientName}`}
                        canCancelAppointment={canCancelAppointment}
                        dataMode={dataMode}
                      />
                      <CompleteAppointmentDialog
                        action={completeAction}
                        appointmentId={row.id}
                        appointmentLabel={`${row.scheduled} - ${row.clientName}`}
                        canCompleteAppointment={canCompleteAppointment}
                        dataMode={dataMode}
                      />
                      <MarkNoShowAppointmentDialog
                        action={markNoShowAction}
                        appointmentId={row.id}
                        appointmentLabel={`${row.scheduled} - ${row.clientName}`}
                        canMarkNoShowAppointment={canMarkNoShowAppointment}
                        dataMode={dataMode}
                      />
                    </span>
                  ) : (
                    <span className="text-foreground-muted">Not available</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
