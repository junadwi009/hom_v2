export type CreateBranchActionState = {
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
  branchId?: string;
};

export type CreateBranchFormAction = (
  previousState: CreateBranchActionState,
  formData: FormData,
) => Promise<CreateBranchActionState>;

export const initialCreateBranchActionState: CreateBranchActionState = {
  status: "idle",
};
