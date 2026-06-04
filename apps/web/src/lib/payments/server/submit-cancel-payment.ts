import "server-only";

import {
  cancelPaymentInputSchema,
  type CancelPaymentInput,
  type Payment,
} from "@hom/domain/payments";
import { z } from "zod";

import type { PaymentTransitionActionState } from "@/features/payments/payment-transition-types";
import { getAuthMode, getDataMode } from "@/lib/env/app-mode";

import { cancelPayment, CancelPaymentRpcError } from "./cancel-payment";

const cancelFormSchema = z
  .object({
    paymentId: z.string().trim().min(1),
    reason: z.string().trim().min(1),
  })
  .strict();

type SubmitCancelPaymentOptions = {
  dataMode?: "mock" | "supabase";
  authMode?: "mock" | "supabase";
  cancel?: (input: CancelPaymentInput) => Promise<Payment>;
};

export async function submitCancelPaymentFormData(
  formData: FormData,
  options: SubmitCancelPaymentOptions = {},
): Promise<PaymentTransitionActionState> {
  if (
    (options.dataMode ?? getDataMode()) !== "supabase" ||
    (options.authMode ?? getAuthMode()) !== "supabase"
  ) {
    return {
      status: "configuration_error",
      message: "Saving is unavailable in mock preview mode.",
    };
  }

  try {
    const input = toCancelPaymentInput(formData);
    const payment = await (options.cancel ?? cancelPayment)(input);

    return {
      status: "success",
      paymentId: payment.id,
      message: "Payment cancelled.",
    };
  } catch (error) {
    return toSafeCancelPaymentActionState(error);
  }
}

export function toCancelPaymentInput(formData: FormData) {
  const parsedForm = cancelFormSchema.parse({
    paymentId: readFormText(formData, "paymentId"),
    reason: readFormText(formData, "reason"),
  });

  return cancelPaymentInputSchema.parse({
    paymentId: parsedForm.paymentId,
    reason: parsedForm.reason,
  });
}

export function toSafeCancelPaymentActionState(
  error: unknown,
): PaymentTransitionActionState {
  if (error instanceof z.ZodError) {
    return {
      status: "validation_error",
      message: "Enter a safe cancellation reason and try again.",
    };
  }

  if (error instanceof CancelPaymentRpcError) {
    return mapRpcError(error.code);
  }

  if (
    error instanceof Error &&
    error.message.includes("Supabase public environment variables are missing")
  ) {
    return {
      status: "configuration_error",
      message: "Local Supabase configuration is unavailable.",
    };
  }

  return {
    status: "unknown_error",
    message: "Payment could not be cancelled. Try again.",
  };
}

function mapRpcError(
  code: CancelPaymentRpcError["code"],
): PaymentTransitionActionState {
  const resultByCode: Record<
    CancelPaymentRpcError["code"],
    PaymentTransitionActionState
  > = {
    AUTH_REQUIRED: {
      status: "auth_required",
      message: "Sign in before changing a payment.",
    },
    APP_USER_REQUIRED: {
      status: "app_user_required",
      message: "Your studio profile is not ready for payment changes.",
    },
    PERMISSION_DENIED: {
      status: "permission_denied",
      message: "You do not have permission to change payments.",
    },
    PAYMENT_NOT_FOUND: {
      status: "payment_unavailable",
      message: "This payment is no longer available.",
    },
    PAYMENT_NOT_PENDING: {
      status: "invalid_transition",
      message: "Only a pending payment can be cancelled.",
    },
    CANCEL_REASON_REQUIRED: {
      status: "validation_error",
      message: "Enter a cancellation reason.",
    },
    CANCEL_REASON_INVALID: {
      status: "validation_error",
      message: "The cancellation reason is too long or unsafe.",
    },
    CANCEL_PAYMENT_FAILED: {
      status: "unknown_error",
      message: "Payment could not be cancelled. Try again.",
    },
  };

  return resultByCode[code];
}

function readFormText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}
