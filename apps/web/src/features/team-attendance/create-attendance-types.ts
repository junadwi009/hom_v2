export type CreateAttendanceActionState = {
  status:
    | "idle"
    | "success"
    | "validation_error"
    | "auth_required"
    | "app_user_required"
    | "permission_denied"
    | "configuration_error"
    | "unknown_error";
  message?: string;
  recordId?: string;
};

export type CreateAttendanceFormAction = (
  previousState: CreateAttendanceActionState,
  formData: FormData,
) => Promise<CreateAttendanceActionState>;

export const initialCreateAttendanceActionState: CreateAttendanceActionState = {
  status: "idle",
};
