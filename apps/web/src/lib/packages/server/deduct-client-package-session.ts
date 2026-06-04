import "server-only";

import {
  clientPackageSchema,
  deductClientPackageSessionInputSchema,
  type ClientPackage,
  type DeductClientPackageSessionInput,
} from "@hom/domain/packages";

import { prepareServerAuditLogInput } from "@/lib/audit/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type DeductClientPackageSessionRpcParams = {
  p_appointment_id: string;
  p_client_package_id: string;
};

type DeductClientPackageSessionRpcResponse = {
  data: DeductClientPackageSessionRpcRow[] | null;
  error: unknown;
};

export type DeductClientPackageSessionRpcClient = {
  rpc(
    functionName: "deduct_client_package_session",
    params: DeductClientPackageSessionRpcParams,
  ): PromiseLike<DeductClientPackageSessionRpcResponse>;
};

type DeductClientPackageSessionOptions = {
  createSupabaseClient?: () => Promise<DeductClientPackageSessionRpcClient>;
};

type DeductClientPackageSessionRpcRow = {
  id: string;
  client_id: string;
  client_name: string;
  package_id: string;
  package_name: string;
  purchased_at: string;
  expires_at: string;
  total_sessions: number;
  remaining_sessions: number;
  status: string;
  created_at: string;
  updated_at: string;
};

const knownErrorCodes = [
  "AUTH_REQUIRED",
  "APP_USER_REQUIRED",
  "PERMISSION_DENIED",
  "APPOINTMENT_NOT_FOUND",
  "APPOINTMENT_NOT_COMPLETED",
  "CLIENT_PACKAGE_UNAVAILABLE",
  "ALREADY_DEDUCTED",
] as const;

type KnownDeductClientPackageSessionErrorCode = (typeof knownErrorCodes)[number];

export class DeductClientPackageSessionRpcError extends Error {
  readonly code:
    | KnownDeductClientPackageSessionErrorCode
    | "DEDUCT_CLIENT_PACKAGE_SESSION_FAILED";

  constructor(
    code:
      | KnownDeductClientPackageSessionErrorCode
      | "DEDUCT_CLIENT_PACKAGE_SESSION_FAILED",
  ) {
    super("Client package session could not be deducted.");
    this.name = "DeductClientPackageSessionRpcError";
    this.code = code;
  }

  static fromSupabase(error: unknown) {
    const message = readOptionalString(error, "message");
    const code = knownErrorCodes.find((candidate) =>
      message?.includes(candidate),
    );

    return new DeductClientPackageSessionRpcError(
      code ?? "DEDUCT_CLIENT_PACKAGE_SESSION_FAILED",
    );
  }
}

export async function deductClientPackageSession(
  input: unknown,
  options: DeductClientPackageSessionOptions = {},
): Promise<ClientPackage> {
  const parsedInput = deductClientPackageSessionInputSchema.parse(input);

  prepareAuditInput(parsedInput);

  const supabase = options.createSupabaseClient
    ? await options.createSupabaseClient()
    : await createDeductClientPackageSessionRpcClient();
  const response = await supabase.rpc("deduct_client_package_session", {
    p_appointment_id: parsedInput.appointmentId,
    p_client_package_id: parsedInput.clientPackageId,
  });

  if (response.error) {
    throw DeductClientPackageSessionRpcError.fromSupabase(response.error);
  }

  const row = response.data?.[0];

  if (!row) {
    throw new DeductClientPackageSessionRpcError(
      "DEDUCT_CLIENT_PACKAGE_SESSION_FAILED",
    );
  }

  return mapDeductClientPackageSessionRpcRow(row);
}

function prepareAuditInput(input: DeductClientPackageSessionInput) {
  prepareServerAuditLogInput({
    actorUserId: null,
    actorAuthUserId: null,
    action: "package_usage.recorded",
    targetType: "client_package",
    targetId: input.clientPackageId,
    riskLevel: "high",
    metadata: {
      clientPackageId: input.clientPackageId,
      appointmentId: input.appointmentId,
      quantity: 1,
    },
  });
}

function mapDeductClientPackageSessionRpcRow(
  row: DeductClientPackageSessionRpcRow,
) {
  return clientPackageSchema.parse({
    id: row.id,
    clientId: row.client_id,
    clientName: row.client_name,
    packageId: row.package_id,
    packageName: row.package_name,
    purchasedAt: toIsoTimestamp(row.purchased_at),
    expiresAt: toIsoTimestamp(row.expires_at),
    totalSessions: row.total_sessions,
    remainingSessions: row.remaining_sessions,
    status: row.status,
    createdAt: toIsoTimestamp(row.created_at),
    updatedAt: toIsoTimestamp(row.updated_at),
  });
}

async function createDeductClientPackageSessionRpcClient(): Promise<DeductClientPackageSessionRpcClient> {
  return (await createSupabaseServerClient()) as unknown as DeductClientPackageSessionRpcClient;
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

function toIsoTimestamp(value: string) {
  const time = Date.parse(value);

  if (Number.isNaN(time)) {
    return value;
  }

  return new Date(time).toISOString();
}
