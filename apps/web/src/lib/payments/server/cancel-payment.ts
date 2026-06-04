import "server-only";

import {
  cancelPaymentInputSchema,
  type CancelPaymentInput,
  type Payment,
} from "@hom/domain/payments";

import { prepareServerAuditLogInput } from "@/lib/audit/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { mapPaymentRpcRow, type PaymentRpcRow } from "./payment-rpc-row";

type CancelPaymentRpcParams = {
  p_payment_id: string;
  p_reason: string;
};

type CancelPaymentRpcResponse = {
  data: PaymentRpcRow[] | null;
  error: unknown;
};

export type CancelPaymentRpcClient = {
  rpc(
    functionName: "cancel_payment",
    params: CancelPaymentRpcParams,
  ): PromiseLike<CancelPaymentRpcResponse>;
};

type CancelPaymentOptions = {
  createSupabaseClient?: () => Promise<CancelPaymentRpcClient>;
};

const knownErrorCodes = [
  "AUTH_REQUIRED",
  "APP_USER_REQUIRED",
  "PERMISSION_DENIED",
  "PAYMENT_NOT_FOUND",
  "PAYMENT_NOT_PENDING",
  "CANCEL_REASON_REQUIRED",
  "CANCEL_REASON_INVALID",
] as const;

type KnownCancelPaymentErrorCode = (typeof knownErrorCodes)[number];

export class CancelPaymentRpcError extends Error {
  readonly code: KnownCancelPaymentErrorCode | "CANCEL_PAYMENT_FAILED";

  constructor(code: KnownCancelPaymentErrorCode | "CANCEL_PAYMENT_FAILED") {
    super("Payment could not be cancelled.");
    this.name = "CancelPaymentRpcError";
    this.code = code;
  }

  static fromSupabase(error: unknown) {
    const message = readOptionalString(error, "message");
    const code = knownErrorCodes.find((candidate) =>
      message?.includes(candidate),
    );

    return new CancelPaymentRpcError(code ?? "CANCEL_PAYMENT_FAILED");
  }
}

export async function cancelPayment(
  input: unknown,
  options: CancelPaymentOptions = {},
): Promise<Payment> {
  const parsedInput = cancelPaymentInputSchema.parse(input);

  prepareAuditInput(parsedInput);

  const supabase = options.createSupabaseClient
    ? await options.createSupabaseClient()
    : await createCancelPaymentRpcClient();
  const response = await supabase.rpc("cancel_payment", {
    p_payment_id: parsedInput.paymentId,
    p_reason: parsedInput.reason,
  });

  if (response.error) {
    throw CancelPaymentRpcError.fromSupabase(response.error);
  }

  const row = response.data?.[0];

  if (!row) {
    throw new CancelPaymentRpcError("CANCEL_PAYMENT_FAILED");
  }

  return mapPaymentRpcRow(row);
}

function prepareAuditInput(input: CancelPaymentInput) {
  // Reason text is intentionally excluded from audit metadata.
  prepareServerAuditLogInput({
    actorUserId: null,
    actorAuthUserId: null,
    action: "payment.cancelled",
    targetType: "payment",
    targetId: input.paymentId,
    riskLevel: "high",
    metadata: {
      paymentId: input.paymentId,
    },
  });
}

async function createCancelPaymentRpcClient(): Promise<CancelPaymentRpcClient> {
  return (await createSupabaseServerClient()) as unknown as CancelPaymentRpcClient;
}

function readOptionalString(value: unknown, key: string) {
  if (typeof value !== "object" || value === null) {
    return undefined;
  }

  const property = (value as Record<string, unknown>)[key];
  return typeof property === "string" ? property : undefined;
}
