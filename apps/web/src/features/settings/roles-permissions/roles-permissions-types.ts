export type SetRolePermissionsActionState = {
  status:
    | "idle"
    | "success"
    | "validation_error"
    | "auth_required"
    | "app_user_required"
    | "permission_denied"
    | "role_protected"
    | "configuration_error"
    | "unknown_error";
  message?: string;
  roleName?: string;
};

export type SetRolePermissionsFormAction = (
  previousState: SetRolePermissionsActionState,
  formData: FormData,
) => Promise<SetRolePermissionsActionState>;

export const initialSetRolePermissionsActionState: SetRolePermissionsActionState =
  {
    status: "idle",
  };
