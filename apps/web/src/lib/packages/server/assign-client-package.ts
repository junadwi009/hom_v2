import "server-only";

import {
  assignClientPackageInputSchema,
  clientPackageSchema,
  type AssignClientPackageInput,
  type ClientPackage,
} from "@hom/domain/packages";

import { prepareServerAuditLogInput } from "@/lib/audit/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type AssignClientPackageRpcParams = {
  p_client_id: string;
  p_package_id: string;
  p_purchased_at: string;
};

type AssignClientPackageRpcResponse = {
  data: AssignClientPackageRpcRow[] | null;
  error: unknown;
};

export type AssignClientPackageRpcClient = {
  rpc(
    functionName: "assign_client_package",
    params: AssignClientPackageRpcParams,
  ): PromiseLike<AssignClientPackageRpcResponse>;
};

type AssignClientPackageOptions = {
  createSupabaseClient?: () => Promise<AssignClientPackageRpcClient>;
};

type AssignClientPackageRpcRow = {
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
  "CLIENT_UNAVAILABLE",
  "PACKAGE_UNAVAILABLE",
  "PURCHASED_AT_REQUIRED",
] as const;

type KnownAssignClientPackageErrorCode = (typeof knownErrorCodes)[number];

export class AssignClientPackageRpcError extends Error {
  readonly code:
    | KnownAssignClientPackageErrorCode
    | "ASSIGN_CLIENT_PACKAGE_FAILED";

  constructor(
    code:
      | KnownAssignClientPackageErrorCode
      | "ASSIGN_CLIENT_PACKAGE_FAILED",
  ) {
    super("Client package could not be assigned.");
    this.name = "AssignClientPackageRpcError";
    this.code = code;
  }

  static fromSupabase(error: unknown) {
    const message = readOptionalString(error, "message");
    const code = knownErrorCodes.find((candidate) =>
      message?.includes(candidate),
    );

    return new AssignClientPackageRpcError(
      code ?? "ASSIGN_CLIENT_PACKAGE_FAILED",
    );
  }
}

export async function assignClientPackage(
  input: unknown,
  options: AssignClientPackageOptions = {},
): Promise<ClientPackage> {
  const parsedInput = assignClientPackageInputSchema.parse(input);

  prepareAuditInput(parsedInput);

  const supabase = options.createSupabaseClient
    ? await options.createSupabaseClient()
    : await createAssignClientPackageRpcClient();
  const response = await supabase.rpc("assign_client_package", {
    p_client_id: parsedInput.clientId,
    p_package_id: parsedInput.packageId,
    p_purchased_at: parsedInput.purchasedAt,
  });

  if (response.error) {
    throw AssignClientPackageRpcError.fromSupabase(response.error);
  }

  const row = response.data?.[0];

  if (!row) {
    throw new AssignClientPackageRpcError("ASSIGN_CLIENT_PACKAGE_FAILED");
  }

  return mapAssignClientPackageRpcRow(row);
}

function prepareAuditInput(input: AssignClientPackageInput) {
  prepareServerAuditLogInput({
    actorUserId: null,
    actorAuthUserId: null,
    action: "client_package.assigned",
    targetType: "client_package",
    targetId: null,
    riskLevel: "high",
    metadata: {
      clientId: input.clientId,
      packageId: input.packageId,
      purchasedAt: input.purchasedAt,
    },
  });
}

function mapAssignClientPackageRpcRow(row: AssignClientPackageRpcRow) {
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

async function createAssignClientPackageRpcClient(): Promise<AssignClientPackageRpcClient> {
  return (await createSupabaseServerClient()) as unknown as AssignClientPackageRpcClient;
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
