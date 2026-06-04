import "server-only";

import {
  markPaymentPaidInputSchema,
  type MarkPaymentPaidInput,
  type Payment,
} from "@hom/domain/payments";
import { z } from "zod";

import { toJakartaIsoTimestamp } from "@/features/appointments/create-appointment-time";
import type { PaymentTransitionActionState } from "@/features/payments/payment-transition-types";
import { getAuthMode, getDataMode } from "@/lib/env/app-mode";

import {
  markPaymentPaid,
  MarkPaymentPaidRpcError,
} from "./mark-payment-paid";

const markPaidFormSchema = z
  .object({
    paymentId: z.string().trim().min(1),
    paidAtLocal: z.string().trim().min(1),
  })
  .strict();

type SubmitMarkPaymentPaidOptions = {
  dataMode?: "mock" | "supabase";
  authMode?: "mock" | "supabase";
  markPaid?: (input: MarkPaymentPaidInput) => Promise<Payment>;
};

export async function submitMarkPaymentPaidFormData(
  formData: FormData,
  options: SubmitMarkPaymentPaidOptions = {},
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
    const input = toMarkPaymentPaidInput(formData);
    const payment = await (options.markPaid ?? markPaymentPaid)(input);

    return {
      status: "success",
      paymentId: payment.id,
      message: "Payment marked paid.",
    };
  } catch (error) {
    return toSafeMarkPaymentPaidActionState(error);
  }
}

export function toMarkPaymentPaidInput(formData: FormData) {
  const parsedForm = markPaidFormSchema.parse({
    paymentId: readFormText(formData, "paymentId"),
    paidAtLocal: readFormText(formData, "paidAtLocal"),
  });

  const paidAt = toJakartaIsoTimestamp(parsedForm.paidAtLocal);

  if (!paidAt) {
    throw new MarkPaidFormValidationError("Choose a valid paid date.");
  }

  return markPaymentPaidInputSchema.parse({
    paymentId: parsedForm.paymentId,
    paidAt,
  });
}

export function toSafeMarkPaymentPaidActionState(
  error: unknown,
): PaymentTransitionActionState {
  if (
    error instanceof MarkPaidFormValidationError ||
    error instanceof z.ZodError
  ) {
    return {
      status: "validation_error",
      message: "Check the paid date and try again.",
    };
  }

  if (error instanceof MarkPaymentPaidRpcError) {
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
    message: "Payment could not be marked paid. Try again.",
  };
}

class MarkPaidFormValidationError extends Error {}

function mapRpcError(
  code: MarkPaymentPaidRpcError["code"],
): PaymentTransitionActionState {
  const resultByCode: Record<
    MarkPaymentPaidRpcError["code"],
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
      message: "Only a pending payment can be marked paid.",
    },
    PAYMENT_PAID_AT_REQUIRED: {
      status: "validation_error",
      message: "A paid payment needs a paid date.",
    },
    MARK_PAYMENT_PAID_FAILED: {
      status: "unknown_error",
      message: "Payment could not be marked paid. Try again.",
    },
  };

  return resultByCode[code];
}

function readFormText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}
