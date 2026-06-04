import "server-only";

import {
  createManualPaymentInputSchema,
  type CreateManualPaymentInput,
  type Payment,
} from "@hom/domain/payments";
import { z } from "zod";

import { toJakartaIsoTimestamp } from "@/features/appointments/create-appointment-time";
import type { CreatePaymentActionState } from "@/features/payments/create-payment-types";
import { getAuthMode, getDataMode } from "@/lib/env/app-mode";

import {
  createManualPayment,
  CreateManualPaymentRpcError,
} from "./create-manual-payment";

const createPaymentFormSchema = z
  .object({
    clientId: z.string().trim().min(1),
    clientPackageId: z.string().trim().optional(),
    amountIdr: z.string().trim().min(1),
    paymentMethod: z.string().trim().min(1),
    status: z.string().trim().min(1),
    paidAtLocal: z.string().trim().optional(),
    referenceNumber: z.string().trim().optional(),
    notes: z.string().trim().optional(),
  })
  .strict();

type SubmitCreatePaymentOptions = {
  dataMode?: "mock" | "supabase";
  authMode?: "mock" | "supabase";
  createPayment?: (input: CreateManualPaymentInput) => Promise<Payment>;
};

export async function submitCreateManualPaymentFormData(
  formData: FormData,
  options: SubmitCreatePaymentOptions = {},
): Promise<CreatePaymentActionState> {
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
    const input = toCreateManualPaymentInput(formData);
    const payment = await (options.createPayment ?? createManualPayment)(input);

    return {
      status: "success",
      paymentId: payment.id,
      message: "Payment created.",
    };
  } catch (error) {
    return toSafeCreatePaymentActionState(error);
  }
}

export function toCreateManualPaymentInput(formData: FormData) {
  const parsedForm = createPaymentFormSchema.parse({
    clientId: readFormText(formData, "clientId"),
    clientPackageId: readFormText(formData, "clientPackageId"),
    amountIdr: readFormText(formData, "amountIdr"),
    paymentMethod: readFormText(formData, "paymentMethod"),
    status: readFormText(formData, "status"),
    paidAtLocal: readFormText(formData, "paidAtLocal"),
    referenceNumber: readFormText(formData, "referenceNumber"),
    notes: readFormText(formData, "notes"),
  });

  const paidAt =
    parsedForm.status === "paid"
      ? resolvePaidAt(parsedForm.paidAtLocal)
      : undefined;

  return createManualPaymentInputSchema.parse({
    clientId: parsedForm.clientId,
    clientPackageId: emptyToUndefined(parsedForm.clientPackageId),
    amountIdr: Number(parsedForm.amountIdr),
    paymentMethod: parsedForm.paymentMethod,
    status: parsedForm.status,
    paidAt,
    referenceNumber: emptyToUndefined(parsedForm.referenceNumber),
    notes: emptyToUndefined(parsedForm.notes),
  });
}

function resolvePaidAt(paidAtLocal: string | undefined) {
  const paidAt = paidAtLocal ? toJakartaIsoTimestamp(paidAtLocal) : null;

  if (!paidAt) {
    throw new CreatePaymentFormValidationError(
      "Choose a valid paid date for a paid payment.",
    );
  }

  return paidAt;
}

export function toSafeCreatePaymentActionState(
  error: unknown,
): CreatePaymentActionState {
  if (
    error instanceof CreatePaymentFormValidationError ||
    error instanceof z.ZodError
  ) {
    return {
      status: "validation_error",
      message: "Check the payment details and try again.",
    };
  }

  if (error instanceof CreateManualPaymentRpcError) {
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
    message: "Payment could not be created. Try again.",
  };
}

class CreatePaymentFormValidationError extends Error {}

function mapRpcError(
  code: CreateManualPaymentRpcError["code"],
): CreatePaymentActionState {
  const resultByCode: Record<
    CreateManualPaymentRpcError["code"],
    CreatePaymentActionState
  > = {
    AUTH_REQUIRED: {
      status: "auth_required",
      message: "Sign in before creating a payment.",
    },
    APP_USER_REQUIRED: {
      status: "app_user_required",
      message: "Your studio profile is not ready for payment changes.",
    },
    PERMISSION_DENIED: {
      status: "permission_denied",
      message: "You do not have permission to create payments.",
    },
    AMOUNT_INVALID: {
      status: "validation_error",
      message: "Enter a payment amount greater than zero.",
    },
    PAYMENT_METHOD_INVALID: {
      status: "validation_error",
      message: "Choose a valid payment method.",
    },
    PAYMENT_STATUS_INVALID: {
      status: "validation_error",
      message: "Choose a pending or paid status.",
    },
    PAYMENT_PAID_AT_REQUIRED: {
      status: "validation_error",
      message: "A paid payment needs a paid date.",
    },
    PAYMENT_PAID_AT_NOT_ALLOWED: {
      status: "validation_error",
      message: "A pending payment must not have a paid date.",
    },
    CLIENT_UNAVAILABLE: {
      status: "client_unavailable",
      message: "Choose an eligible client and try again.",
    },
    CLIENT_PACKAGE_UNAVAILABLE: {
      status: "client_package_unavailable",
      message: "Choose a package that belongs to the client.",
    },
    CREATE_MANUAL_PAYMENT_FAILED: {
      status: "unknown_error",
      message: "Payment could not be created. Try again.",
    },
  };

  return resultByCode[code];
}

function emptyToUndefined(value: string | undefined) {
  return value && value.length > 0 ? value : undefined;
}

function readFormText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}
