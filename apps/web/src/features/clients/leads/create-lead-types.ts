export type CreateLeadActionState = {
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
  leadId?: string;
};

export type CreateLeadFormAction = (
  previousState: CreateLeadActionState,
  formData: FormData,
) => Promise<CreateLeadActionState>;

export const initialCreateLeadActionState: CreateLeadActionState = {
  status: "idle",
};
