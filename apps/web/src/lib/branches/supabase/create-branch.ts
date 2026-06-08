import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

type CreateBranchRow = {
  id: string;
  name: string;
  city: string | null;
  address: string | null;
  manager_name: string | null;
  phone: string | null;
  email: string | null;
  branch_type: string;
  status: string;
  created_at: string;
  updated_at: string;
};

type CreateBranchRpcResponse = {
  data: CreateBranchRow[] | null;
  error: unknown;
};

type CreateBranchRpcParams = {
  p_name: string;
  p_city: string | null;
  p_address: string | null;
  p_manager_name: string | null;
  p_phone: string | null;
  p_email: string | null;
  p_branch_type: string;
  p_status: string;
};

type CreateBranchRpcClient = {
  rpc(
    functionName: "create_branch",
    params: CreateBranchRpcParams,
  ): PromiseLike<CreateBranchRpcResponse>;
};

const knownErrorCodes = [
  "AUTH_REQUIRED",
  "APP_USER_REQUIRED",
  "PERMISSION_DENIED",
  "NAME_REQUIRED",
  "NAME_TOO_LONG",
  "BRANCH_TYPE_INVALID",
  "STATUS_INVALID",
] as const;

export type CreateBranchErrorCode =
  | (typeof knownErrorCodes)[number]
  | "CREATE_BRANCH_FAILED";

export class CreateBranchRpcError extends Error {
  readonly code: CreateBranchErrorCode;

  constructor(code: CreateBranchErrorCode) {
    super("Branch could not be created.");
    this.name = "CreateBranchRpcError";
    this.code = code;
  }

  static fromSupabase(error: unknown): CreateBranchRpcError {
    const message =
      typeof error === "object" && error !== null
        ? (error as { message?: string }).message
        : undefined;
    const code = knownErrorCodes.find((candidate) =>
      message?.includes(candidate),
    );
    return new CreateBranchRpcError(code ?? "CREATE_BRANCH_FAILED");
  }
}

export type CreateBranchInput = {
  name: string;
  city: string | null;
  address: string | null;
  managerName: string | null;
  phone: string | null;
  email: string | null;
  branchType: string;
  status: string;
};

export async function createBranch(
  input: CreateBranchInput,
): Promise<{ id: string; name: string }> {
  const supabase =
    (await createSupabaseServerClient()) as unknown as CreateBranchRpcClient;

  const response = await supabase.rpc("create_branch", {
    p_name: input.name,
    p_city: input.city,
    p_address: input.address,
    p_manager_name: input.managerName,
    p_phone: input.phone,
    p_email: input.email,
    p_branch_type: input.branchType,
    p_status: input.status,
  });

  if (response.error) {
    throw CreateBranchRpcError.fromSupabase(response.error);
  }

  const row = response.data?.[0];
  if (!row) {
    throw new CreateBranchRpcError("CREATE_BRANCH_FAILED");
  }

  return { id: row.id, name: row.name };
}
