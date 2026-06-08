export type CreateTagActionState = {
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
  tagId?: string;
};

export type CreateTagFormAction = (
  previousState: CreateTagActionState,
  formData: FormData,
) => Promise<CreateTagActionState>;

export const initialCreateTagActionState: CreateTagActionState = {
  status: "idle",
};
