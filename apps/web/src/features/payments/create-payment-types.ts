export type CreatePaymentClientOption = {
  id: string;
  label: string;
};

export type CreatePaymentClientPackageOption = {
  id: string;
  clientId: string;
  label: string;
};

export type CreatePaymentOptions = {
  clients: CreatePaymentClientOption[];
  clientPackages: CreatePaymentClientPackageOption[];
};

export type CreatePaymentOptionsState =
  | {
      status: "ready";
      dataMode: "mock" | "supabase";
      options: CreatePaymentOptions;
    }
  | {
      status: "permission_denied" | "configuration_error" | "error";
      dataMode: "mock" | "supabase";
    };

export type CreatePaymentActionState = {
  status:
    | "idle"
    | "success"
    | "validation_error"
    | "client_unavailable"
    | "client_package_unavailable"
    | "auth_required"
    | "app_user_required"
    | "permission_denied"
    | "configuration_error"
    | "unknown_error";
  message?: string;
  paymentId?: string;
};

export type CreatePaymentFormAction = (
  previousState: CreatePaymentActionState,
  formData: FormData,
) => Promise<CreatePaymentActionState>;

export const initialCreatePaymentActionState: CreatePaymentActionState = {
  status: "idle",
};
