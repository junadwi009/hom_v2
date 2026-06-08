import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

type CreateLeadRow = {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  source: string;
  stage: string;
  status: string;
  score: number;
  interest: string | null;
  branch: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
};

type CreateLeadRpcResponse = {
  data: CreateLeadRow[] | null;
  error: unknown;
};

type CreateLeadRpcParams = {
  p_full_name: string;
  p_phone: string | null;
  p_email: string | null;
  p_source: string;
  p_stage: string;
  p_status: string;
  p_score: number;
  p_interest: string | null;
  p_branch: string | null;
  p_note: string | null;
};

type CreateLeadRpcClient = {
  rpc(
    functionName: "create_lead",
    params: CreateLeadRpcParams,
  ): PromiseLike<CreateLeadRpcResponse>;
};

const knownErrorCodes = [
  "AUTH_REQUIRED",
  "APP_USER_REQUIRED",
  "PERMISSION_DENIED",
  "FULL_NAME_REQUIRED",
  "FULL_NAME_TOO_LONG",
  "SOURCE_INVALID",
  "STAGE_INVALID",
  "STATUS_INVALID",
  "SCORE_INVALID",
] as const;

export type CreateLeadErrorCode =
  | (typeof knownErrorCodes)[number]
  | "CREATE_LEAD_FAILED";

export class CreateLeadRpcError extends Error {
  readonly code: CreateLeadErrorCode;

  constructor(code: CreateLeadErrorCode) {
    super("Lead could not be created.");
    this.name = "CreateLeadRpcError";
    this.code = code;
  }

  static fromSupabase(error: unknown): CreateLeadRpcError {
    const message =
      typeof error === "object" && error !== null
        ? (error as { message?: string }).message
        : undefined;
    const code = knownErrorCodes.find((candidate) =>
      message?.includes(candidate),
    );
    return new CreateLeadRpcError(code ?? "CREATE_LEAD_FAILED");
  }
}

export type CreateLeadInput = {
  fullName: string;
  phone: string | null;
  email: string | null;
  source: string;
  stage: string;
  status: string;
  score: number;
  interest: string | null;
  branch: string | null;
  note: string | null;
};

export async function createLead(
  input: CreateLeadInput,
): Promise<{ id: string; fullName: string }> {
  const supabase =
    (await createSupabaseServerClient()) as unknown as CreateLeadRpcClient;

  const response = await supabase.rpc("create_lead", {
    p_full_name: input.fullName,
    p_phone: input.phone,
    p_email: input.email,
    p_source: input.source,
    p_stage: input.stage,
    p_status: input.status,
    p_score: input.score,
    p_interest: input.interest,
    p_branch: input.branch,
    p_note: input.note,
  });

  if (response.error) {
    throw CreateLeadRpcError.fromSupabase(response.error);
  }

  const row = response.data?.[0];
  if (!row) {
    throw new CreateLeadRpcError("CREATE_LEAD_FAILED");
  }

  return { id: row.id, fullName: row.full_name };
}
