export type MarkNoShowAppointmentActionState = {
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

export type MarkNoShowAppointmentFormAction = (
  previousState: MarkNoShowAppointmentActionState,
  formData: FormData,
) => Promise<MarkNoShowAppointmentActionState>;

export const initialMarkNoShowAppointmentActionState: MarkNoShowAppointmentActionState =
  {
    status: "idle",
  };
