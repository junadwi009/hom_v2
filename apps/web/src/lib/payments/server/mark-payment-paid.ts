import "server-only";

import {
  markPaymentPaidInputSchema,
  type MarkPaymentPaidInput,
  type Payment,
} from "@hom/domain/payments";

import { prepareServerAuditLogInput } from "@/lib/audit/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { mapPaymentRpcRow, type PaymentRpcRow } from "./payment-rpc-row";

type MarkPaymentPaidRpcParams = {
  p_payment_id: string;
  p_paid_at: string;
};

type MarkPaymentPaidRpcResponse = {
  data: PaymentRpcRow[] | null;
  error: unknown;
};

export type MarkPaymentPaidRpcClient = {
  rpc(
    functionName: "mark_payment_paid",
    params: MarkPaymentPaidRpcParams,
  ): PromiseLike<MarkPaymentPaidRpcResponse>;
};

type MarkPaymentPaidOptions = {
  createSupabaseClient?: () => Promise<MarkPaymentPaidRpcClient>;
};

const knownErrorCodes = [
  "AUTH_REQUIRED",
  "APP_USER_REQUIRED",
  "PERMISSION_DENIED",
  "PAYMENT_NOT_FOUND",
  "PAYMENT_NOT_PENDING",
  "PAYMENT_PAID_AT_REQUIRED",
] as const;

type KnownMarkPaymentPaidErrorCode = (typeof knownErrorCodes)[number];

export class MarkPaymentPaidRpcError extends Error {
  readonly code: KnownMarkPaymentPaidErrorCode | "MARK_PAYMENT_PAID_FAILED";

  constructor(code: KnownMarkPaymentPaidErrorCode | "MARK_PAYMENT_PAID_FAILED") {
    super("Payment could not be marked paid.");
    this.name = "MarkPaymentPaidRpcError";
    this.code = code;
  }

  static fromSupabase(error: unknown) {
    const message = readOptionalString(error, "message");
    const code = knownErrorCodes.find((candidate) =>
      message?.includes(candidate),
    );

    return new MarkPaymentPaidRpcError(code ?? "MARK_PAYMENT_PAID_FAILED");
  }
}

export async function markPaymentPaid(
  input: unknown,
  options: MarkPaymentPaidOptions = {},
): Promise<Payment> {
  const parsedInput = markPaymentPaidInputSchema.parse(input);

  prepareAuditInput(parsedInput);

  const supabase = options.createSupabaseClient
    ? await options.createSupabaseClient()
    : await createMarkPaymentPaidRpcClient();
  const response = await supabase.rpc("mark_payment_paid", {
    p_payment_id: parsedInput.paymentId,
    p_paid_at: parsedInput.paidAt,
  });

  if (response.error) {
    throw MarkPaymentPaidRpcError.fromSupabase(response.error);
  }

  const row = response.data?.[0];

  if (!row) {
    throw new MarkPaymentPaidRpcError("MARK_PAYMENT_PAID_FAILED");
  }

  return mapPaymentRpcRow(row);
}

function prepareAuditInput(input: MarkPaymentPaidInput) {
  prepareServerAuditLogInput({
    actorUserId: null,
    actorAuthUserId: null,
    action: "payment.marked_paid",
    targetType: "payment",
    targetId: input.paymentId,
    riskLevel: "high",
    metadata: {
      paymentId: input.paymentId,
      paidAt: input.paidAt,
    },
  });
}

async function createMarkPaymentPaidRpcClient(): Promise<MarkPaymentPaidRpcClient> {
  return (await createSupabaseServerClient()) as unknown as MarkPaymentPaidRpcClient;
}

function readOptionalString(value: unknown, key: string) {
  if (typeof value !== "object" || value === null) {
    return undefined;
  }

  const property = (value as Record<string, unknown>)[key];
  return typeof property === "string" ? property : undefined;
}
