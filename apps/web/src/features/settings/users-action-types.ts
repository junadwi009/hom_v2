export type UserAdminActionStatus =
  | "idle"
  | "success"
  | "validation_error"
  | "email_exists"
  | "role_unknown"
  | "not_found"
  | "cannot_modify_self"
  | "auth_required"
  | "app_user_required"
  | "permission_denied"
  | "configuration_error"
  | "unknown_error";

export type UserAdminActionState = {
  status: UserAdminActionStatus;
  message?: string;
  userId?: string;
};

export const initialUserAdminActionState: UserAdminActionState = {
  status: "idle",
};

export type UserAdminFormAction = (
  previousState: UserAdminActionState,
  formData: FormData,
) => Promise<UserAdminActionState>;
