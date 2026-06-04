import { cancelAppointmentAction } from "@/features/appointments/cancel-appointment-action";
import { completeAppointmentAction } from "@/features/appointments/complete-appointment-action";
import { createAppointmentAction } from "@/features/appointments/create-appointment-action";
import { AppointmentsCatalogPage } from "@/features/appointments/appointments-catalog-page";
import { loadCreateAppointmentOptions } from "@/features/appointments/create-appointment-options-loader";
import { loadAppointmentsPage } from "@/features/appointments/appointments-page-loader";
import { deductSessionAction } from "@/features/appointments/deduct-session-action";
import { loadDeductSessionOptionsByAppointment } from "@/features/appointments/deduct-session-options-loader";
import { markNoShowAppointmentAction } from "@/features/appointments/mark-no-show-appointment-action";
import { rescheduleAppointmentAction } from "@/features/appointments/reschedule-appointment-action";
import { getRequiredCurrentUser } from "@/lib/auth/current-user";

export const dynamic = "force-dynamic";

export default async function AppointmentsPage() {
  const [state, createOptionsState, currentUser] = await Promise.all([
    loadAppointmentsPage(),
    loadCreateAppointmentOptions(),
    getRequiredCurrentUser(),
  ]);

  const deductOptionsByAppointmentId =
    state.status === "ready"
      ? await loadDeductSessionOptionsByAppointment(
          state.rows
            .filter((row) => row.status === "completed")
            .map((row) => ({ appointmentId: row.id, clientId: row.clientId })),
        )
      : {};

  return (
    <AppointmentsCatalogPage
      canCancelAppointment={currentUser.permissions.includes(
        "can_manage_appointments",
      )}
      canCreateAppointment={currentUser.permissions.includes(
        "can_manage_appointments",
      )}
      canCompleteAppointment={currentUser.permissions.includes(
        "can_manage_appointments",
      )}
      canDeductSession={currentUser.permissions.includes(
        "can_manage_client_packages",
      )}
      canMarkNoShowAppointment={currentUser.permissions.includes(
        "can_manage_appointments",
      )}
      canRescheduleAppointment={
        currentUser.permissions.includes("can_reschedule_appointments") ||
        currentUser.permissions.includes("can_manage_appointments")
      }
      cancelAction={cancelAppointmentAction}
      completeAction={completeAppointmentAction}
      createAction={createAppointmentAction}
      createOptionsState={createOptionsState}
      deductAction={deductSessionAction}
      deductOptionsByAppointmentId={deductOptionsByAppointmentId}
      markNoShowAction={markNoShowAppointmentAction}
      rescheduleAction={rescheduleAppointmentAction}
      state={state}
    />
  );
}
