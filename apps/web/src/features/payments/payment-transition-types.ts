export type PaymentTransitionActionState = {
  status:
    | "idle"
    | "success"
    | "validation_error"
    | "payment_unavailable"
    | "invalid_transition"
    | "auth_required"
    | "app_user_required"
    | "permission_denied"
    | "configuration_error"
    | "unknown_error";
  message?: string;
  paymentId?: string;
};

export type PaymentTransitionFormAction = (
  previousState: PaymentTransitionActionState,
  formData: FormData,
) => Promise<PaymentTransitionActionState>;

export const initialPaymentTransitionActionState: PaymentTransitionActionState =
  {
    status: "idle",
  };
