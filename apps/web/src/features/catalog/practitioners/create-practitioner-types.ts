export type CreatePractitionerActionState = {
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
  practitionerId?: string;
};

export type CreatePractitionerFormAction = (
  previousState: CreatePractitionerActionState,
  formData: FormData,
) => Promise<CreatePractitionerActionState>;

export const initialCreatePractitionerActionState: CreatePractitionerActionState =
  {
    status: "idle",
  };
