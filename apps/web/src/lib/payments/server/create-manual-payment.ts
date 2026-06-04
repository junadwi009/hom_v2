import "server-only";

import {
  createManualPaymentInputSchema,
  paymentSchema,
  type CreateManualPaymentInput,
  type Payment,
} from "@hom/domain/payments";

import { prepareServerAuditLogInput } from "@/lib/audit/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type CreateManualPaymentRpcParams = {
  p_client_id: string;
  p_client_package_id: string | null;
  p_amount_idr: number;
  p_payment_method: string;
  p_status: string;
  p_paid_at: string | null;
  p_reference_number: string | null;
  p_notes: string | null;
};

type CreateManualPaymentRpcResponse = {
  data: CreateManualPaymentRpcRow[] | null;
  error: unknown;
};

export type CreateManualPaymentRpcClient = {
  rpc(
    functionName: "create_manual_payment",
    params: CreateManualPaymentRpcParams,
  ): PromiseLike<CreateManualPaymentRpcResponse>;
};

type CreateManualPaymentOptions = {
  createSupabaseClient?: () => Promise<CreateManualPaymentRpcClient>;
};

type CreateManualPaymentRpcRow = {
  id: string;
  client_id: string;
  client_name: string;
  client_package_id: string | null;
  package_name: string | null;
  amount_idr: number | string;
  payment_method: string;
  status: string;
  paid_at: string | null;
  reference_number: string | null;
  notes: string | null;
  created_by_app_user_id: string | null;
  updated_by_app_user_id: string | null;
  created_at: string;
  updated_at: string;
};

const knownErrorCodes = [
  "AUTH_REQUIRED",
  "APP_USER_REQUIRED",
  "PERMISSION_DENIED",
  "AMOUNT_INVALID",
  "PAYMENT_METHOD_INVALID",
  "PAYMENT_STATUS_INVALID",
  "PAYMENT_PAID_AT_REQUIRED",
  "PAYMENT_PAID_AT_NOT_ALLOWED",
  "CLIENT_UNAVAILABLE",
  "CLIENT_PACKAGE_UNAVAILABLE",
] as const;

type KnownCreateManualPaymentErrorCode = (typeof knownErrorCodes)[number];

export class CreateManualPaymentRpcError extends Error {
  readonly code:
    | KnownCreateManualPaymentErrorCode
    | "CREATE_MANUAL_PAYMENT_FAILED";

  constructor(
    code:
      | KnownCreateManualPaymentErrorCode
      | "CREATE_MANUAL_PAYMENT_FAILED",
  ) {
    super("Payment could not be created.");
    this.name = "CreateManualPaymentRpcError";
    this.code = code;
  }

  static fromSupabase(error: unknown) {
    const message = readOptionalString(error, "message");
    const code = knownErrorCodes.find((candidate) =>
      message?.includes(candidate),
    );

    return new CreateManualPaymentRpcError(
      code ?? "CREATE_MANUAL_PAYMENT_FAILED",
    );
  }
}

export async function createManualPayment(
  input: unknown,
  options: CreateManualPaymentOptions = {},
): Promise<Payment> {
  const parsedInput = createManualPaymentInputSchema.parse(input);

  prepareAuditInput(parsedInput);

  const supabase = options.createSupabaseClient
    ? await options.createSupabaseClient()
    : await createManualPaymentRpcClient();
  const response = await supabase.rpc("create_manual_payment", {
    p_client_id: parsedInput.clientId,
    p_client_package_id: parsedInput.clientPackageId ?? null,
    p_amount_idr: parsedInput.amountIdr,
    p_payment_method: parsedInput.paymentMethod,
    p_status: parsedInput.status,
    p_paid_at: parsedInput.paidAt ?? null,
    p_reference_number: parsedInput.referenceNumber ?? null,
    p_notes: parsedInput.notes ?? null,
  });

  if (response.error) {
    throw CreateManualPaymentRpcError.fromSupabase(response.error);
  }

  const row = response.data?.[0];

  if (!row) {
    throw new CreateManualPaymentRpcError("CREATE_MANUAL_PAYMENT_FAILED");
  }

  return mapCreateManualPaymentRpcRow(row);
}

function prepareAuditInput(input: CreateManualPaymentInput) {
  prepareServerAuditLogInput({
    actorUserId: null,
    actorAuthUserId: null,
    action: "payment.created",
    targetType: "payment",
    targetId: null,
    riskLevel: "high",
    metadata: {
      clientId: input.clientId,
      clientPackageId: input.clientPackageId ?? null,
      amountIdr: input.amountIdr,
      paymentMethod: input.paymentMethod,
      status: input.status,
    },
  });
}

function mapCreateManualPaymentRpcRow(row: CreateManualPaymentRpcRow) {
  return paymentSchema.parse({
    id: row.id,
    clientId: row.client_id,
    clientName: row.client_name,
    clientPackageId: row.client_package_id ?? undefined,
    packageName: row.package_name ?? undefined,
    amountIdr: toNumber(row.amount_idr),
    paymentMethod: row.payment_method,
    status: row.status,
    paidAt: row.paid_at ? toIsoTimestamp(row.paid_at) : undefined,
    referenceNumber: row.reference_number ?? undefined,
    notes: row.notes ?? undefined,
    createdByAppUserId: row.created_by_app_user_id ?? undefined,
    updatedByAppUserId: row.updated_by_app_user_id ?? undefined,
    createdAt: toIsoTimestamp(row.created_at),
    updatedAt: toIsoTimestamp(row.updated_at),
  });
}

async function createManualPaymentRpcClient(): Promise<CreateManualPaymentRpcClient> {
  return (await createSupabaseServerClient()) as unknown as CreateManualPaymentRpcClient;
}

function readOptionalString(value: unknown, key: string) {
  if (!isRecord(value)) {
    return undefined;
  }

  const property = value[key];
  return typeof property === "string" ? property : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toNumber(value: number | string) {
  return typeof value === "number" ? value : Number(value);
}

function toIsoTimestamp(value: string) {
  const time = Date.parse(value);

  if (Number.isNaN(time)) {
    return value;
  }

  return new Date(time).toISOString();
}
