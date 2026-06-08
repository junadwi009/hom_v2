export type CatalogCreateActionState = {
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
  itemId?: string;
};

export type CatalogCreateFormAction = (
  previousState: CatalogCreateActionState,
  formData: FormData,
) => Promise<CatalogCreateActionState>;

export const initialCatalogCreateActionState: CatalogCreateActionState = {
  status: "idle",
};
