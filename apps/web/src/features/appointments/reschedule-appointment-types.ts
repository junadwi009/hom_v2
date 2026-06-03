export type RescheduleAppointmentActionState = {
  status:
    | "idle"
    | "success"
    | "appointment_overlap"
    | "appointment_unavailable"
    | "auth_required"
    | "app_user_required"
    | "permission_denied"
    | "configuration_error"
    | "validation_error"
    | "unknown_error";
  message?: string;
  appointmentId?: string;
};

export type RescheduleAppointmentFormAction = (
  previousState: RescheduleAppointmentActionState,
  formData: FormData,
) => Promise<RescheduleAppointmentActionState>;

export const initialRescheduleAppointmentActionState: RescheduleAppointmentActionState =
  {
    status: "idle",
  };
