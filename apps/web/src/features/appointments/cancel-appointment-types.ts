export type CancelAppointmentActionState = {
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

export type CancelAppointmentFormAction = (
  previousState: CancelAppointmentActionState,
  formData: FormData,
) => Promise<CancelAppointmentActionState>;

export const initialCancelAppointmentActionState: CancelAppointmentActionState =
  {
    status: "idle",
  };
