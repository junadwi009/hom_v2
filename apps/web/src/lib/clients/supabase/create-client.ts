import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

type CreateClientRow = {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

type CreateClientRpcResponse = {
  data: CreateClientRow[] | null;
  error: unknown;
};

type CreateClientRpcParams = {
  p_full_name: string;
  p_phone: string | null;
  p_email: string | null;
  p_status: string;
};

type CreateClientRpcClient = {
  rpc(
    functionName: "create_client",
    params: CreateClientRpcParams,
  ): PromiseLike<CreateClientRpcResponse>;
};

const knownErrorCodes = [
  "AUTH_REQUIRED",
  "APP_USER_REQUIRED",
  "PERMISSION_DENIED",
  "FULL_NAME_REQUIRED",
  "FULL_NAME_TOO_LONG",
  "STATUS_INVALID",
] as const;

export type CreateClientErrorCode =
  | (typeof knownErrorCodes)[number]
  | "CREATE_CLIENT_FAILED";

export class CreateClientRpcError extends Error {
  readonly code: CreateClientErrorCode;

  constructor(code: CreateClientErrorCode) {
    super("Client could not be created.");
    this.name = "CreateClientRpcError";
    this.code = code;
  }

  static fromSupabase(error: unknown): CreateClientRpcError {
    const message =
      typeof error === "object" && error !== null
        ? (error as { message?: string }).message
        : undefined;
    const code = knownErrorCodes.find((candidate) =>
      message?.includes(candidate),
    );
    return new CreateClientRpcError(code ?? "CREATE_CLIENT_FAILED");
  }
}

export type CreateClientInput = {
  fullName: string;
  phone: string | null;
  email: string | null;
  status: string;
};

export async function createClient(
  input: CreateClientInput,
): Promise<{ id: string; fullName: string }> {
  const supabase =
    (await createSupabaseServerClient()) as unknown as CreateClientRpcClient;

  const response = await supabase.rpc("create_client", {
    p_full_name: input.fullName,
    p_phone: input.phone,
    p_email: input.email,
    p_status: input.status,
  });

  if (response.error) {
    throw CreateClientRpcError.fromSupabase(response.error);
  }

  const row = response.data?.[0];
  if (!row) {
    throw new CreateClientRpcError("CREATE_CLIENT_FAILED");
  }

  return { id: row.id, fullName: row.full_name };
}
