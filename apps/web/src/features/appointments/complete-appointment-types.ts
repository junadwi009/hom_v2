export type CompleteAppointmentActionState = {
  status:
    | "idle"
    | "success"
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

export type CompleteAppointmentFormAction = (
  previousState: CompleteAppointmentActionState,
  formData: FormData,
) => Promise<CompleteAppointmentActionState>;

export const initialCompleteAppointmentActionState: CompleteAppointmentActionState =
  {
    status: "idle",
  };
