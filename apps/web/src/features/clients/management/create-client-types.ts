export type CreateClientActionState = {
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
  clientId?: string;
};

export type CreateClientFormAction = (
  previousState: CreateClientActionState,
  formData: FormData,
) => Promise<CreateClientActionState>;

export const initialCreateClientActionState: CreateClientActionState = {
  status: "idle",
};
