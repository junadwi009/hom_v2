export type CreateClinicalCaseActionState = {
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
  caseId?: string;
};

export type CreateClinicalCaseFormAction = (
  previousState: CreateClinicalCaseActionState,
  formData: FormData,
) => Promise<CreateClinicalCaseActionState>;

export const initialCreateClinicalCaseActionState: CreateClinicalCaseActionState =
  {
    status: "idle",
  };
