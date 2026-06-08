export type CreateFinancialEntryActionState = {
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
  entryId?: string;
};

export type CreateFinancialEntryFormAction = (
  previousState: CreateFinancialEntryActionState,
  formData: FormData,
) => Promise<CreateFinancialEntryActionState>;

export const initialCreateFinancialEntryActionState: CreateFinancialEntryActionState =
  {
    status: "idle",
  };
