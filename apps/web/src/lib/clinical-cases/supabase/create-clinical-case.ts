import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

type CreateClinicalCaseRow = {
  id: string;
  client_id: string;
  title: string;
  case_status: string;
  severity: string;
  summary: string | null;
  opened_on: string;
  created_at: string;
  updated_at: string;
};

type CreateClinicalCaseRpcResponse = {
  data: CreateClinicalCaseRow[] | null;
  error: unknown;
};

type CreateClinicalCaseRpcParams = {
  p_client_id: string;
  p_title: string;
  p_case_status: string;
  p_severity: string;
  p_summary: string | null;
  p_opened_on: string;
};

type CreateClinicalCaseRpcClient = {
  rpc(
    functionName: "create_clinical_case",
    params: CreateClinicalCaseRpcParams,
  ): PromiseLike<CreateClinicalCaseRpcResponse>;
};

const knownErrorCodes = [
  "AUTH_REQUIRED",
  "APP_USER_REQUIRED",
  "PERMISSION_DENIED",
  "CLIENT_REQUIRED",
  "CLIENT_NOT_FOUND",
  "TITLE_REQUIRED",
  "TITLE_TOO_LONG",
  "STATUS_INVALID",
  "SEVERITY_INVALID",
  "DATE_REQUIRED",
] as const;

export type CreateClinicalCaseErrorCode =
  | (typeof knownErrorCodes)[number]
  | "CREATE_CLINICAL_CASE_FAILED";

export class CreateClinicalCaseRpcError extends Error {
  readonly code: CreateClinicalCaseErrorCode;

  constructor(code: CreateClinicalCaseErrorCode) {
    super("Clinical case could not be created.");
    this.name = "CreateClinicalCaseRpcError";
    this.code = code;
  }

  static fromSupabase(error: unknown): CreateClinicalCaseRpcError {
    const message =
      typeof error === "object" && error !== null
        ? (error as { message?: string }).message
        : undefined;
    const code = knownErrorCodes.find((candidate) =>
      message?.includes(candidate),
    );
    return new CreateClinicalCaseRpcError(code ?? "CREATE_CLINICAL_CASE_FAILED");
  }
}

export type CreateClinicalCaseInput = {
  clientId: string;
  title: string;
  caseStatus: string;
  severity: string;
  summary: string | null;
  openedOn: string;
};

export async function createClinicalCase(
  input: CreateClinicalCaseInput,
): Promise<{ id: string; title: string }> {
  const supabase =
    (await createSupabaseServerClient()) as unknown as CreateClinicalCaseRpcClient;

  const response = await supabase.rpc("create_clinical_case", {
    p_client_id: input.clientId,
    p_title: input.title,
    p_case_status: input.caseStatus,
    p_severity: input.severity,
    p_summary: input.summary,
    p_opened_on: input.openedOn,
  });

  if (response.error) {
    throw CreateClinicalCaseRpcError.fromSupabase(response.error);
  }

  const row = response.data?.[0];
  if (!row) {
    throw new CreateClinicalCaseRpcError("CREATE_CLINICAL_CASE_FAILED");
  }

  return { id: row.id, title: row.title };
}
