import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

type CreatePractitionerRow = {
  id: string;
  display_name: string;
  email: string | null;
  status: string;
  app_user_id: string | null;
  created_at: string;
  updated_at: string;
};

type CreatePractitionerRpcResponse = {
  data: CreatePractitionerRow[] | null;
  error: unknown;
};

type CreatePractitionerRpcParams = {
  p_display_name: string;
  p_email: string | null;
  p_status: string;
};

type CreatePractitionerRpcClient = {
  rpc(
    functionName: "create_practitioner",
    params: CreatePractitionerRpcParams,
  ): PromiseLike<CreatePractitionerRpcResponse>;
};

const knownErrorCodes = [
  "AUTH_REQUIRED",
  "APP_USER_REQUIRED",
  "PERMISSION_DENIED",
  "NAME_REQUIRED",
  "NAME_TOO_LONG",
  "STATUS_INVALID",
] as const;

export type CreatePractitionerErrorCode =
  | (typeof knownErrorCodes)[number]
  | "CREATE_PRACTITIONER_FAILED";

export class CreatePractitionerRpcError extends Error {
  readonly code: CreatePractitionerErrorCode;

  constructor(code: CreatePractitionerErrorCode) {
    super("Practitioner could not be created.");
    this.name = "CreatePractitionerRpcError";
    this.code = code;
  }

  static fromSupabase(error: unknown): CreatePractitionerRpcError {
    const message =
      typeof error === "object" && error !== null
        ? (error as { message?: string }).message
        : undefined;
    const code = knownErrorCodes.find((candidate) =>
      message?.includes(candidate),
    );
    return new CreatePractitionerRpcError(code ?? "CREATE_PRACTITIONER_FAILED");
  }
}

export type CreatePractitionerInput = {
  displayName: string;
  email: string | null;
  status: string;
};

export async function createPractitioner(
  input: CreatePractitionerInput,
): Promise<{ id: string; displayName: string }> {
  const supabase =
    (await createSupabaseServerClient()) as unknown as CreatePractitionerRpcClient;

  const response = await supabase.rpc("create_practitioner", {
    p_display_name: input.displayName,
    p_email: input.email,
    p_status: input.status,
  });

  if (response.error) {
    throw CreatePractitionerRpcError.fromSupabase(response.error);
  }

  const row = response.data?.[0];
  if (!row) {
    throw new CreatePractitionerRpcError("CREATE_PRACTITIONER_FAILED");
  }

  return { id: row.id, displayName: row.display_name };
}
