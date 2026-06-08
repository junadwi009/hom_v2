import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

type CreateTagRow = {
  id: string;
  name: string;
  color: string;
  description: string | null;
  tag_type: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type CreateTagRpcResponse = {
  data: CreateTagRow[] | null;
  error: unknown;
};

type CreateTagRpcParams = {
  p_name: string;
  p_color: string;
  p_description: string | null;
  p_tag_type: string;
  p_is_active: boolean;
};

type CreateTagRpcClient = {
  rpc(
    functionName: "create_tag",
    params: CreateTagRpcParams,
  ): PromiseLike<CreateTagRpcResponse>;
};

const knownErrorCodes = [
  "AUTH_REQUIRED",
  "APP_USER_REQUIRED",
  "PERMISSION_DENIED",
  "NAME_REQUIRED",
  "NAME_TOO_LONG",
  "COLOR_INVALID",
  "TYPE_INVALID",
] as const;

export type CreateTagErrorCode =
  | (typeof knownErrorCodes)[number]
  | "CREATE_TAG_FAILED";

export class CreateTagRpcError extends Error {
  readonly code: CreateTagErrorCode;

  constructor(code: CreateTagErrorCode) {
    super("Tag could not be created.");
    this.name = "CreateTagRpcError";
    this.code = code;
  }

  static fromSupabase(error: unknown): CreateTagRpcError {
    const message =
      typeof error === "object" && error !== null
        ? (error as { message?: string }).message
        : undefined;
    const code = knownErrorCodes.find((candidate) =>
      message?.includes(candidate),
    );
    return new CreateTagRpcError(code ?? "CREATE_TAG_FAILED");
  }
}

export type CreateTagInput = {
  name: string;
  color: string;
  description: string | null;
  tagType: string;
  isActive: boolean;
};

export async function createTag(
  input: CreateTagInput,
): Promise<{ id: string; name: string }> {
  const supabase =
    (await createSupabaseServerClient()) as unknown as CreateTagRpcClient;

  const response = await supabase.rpc("create_tag", {
    p_name: input.name,
    p_color: input.color,
    p_description: input.description,
    p_tag_type: input.tagType,
    p_is_active: input.isActive,
  });

  if (response.error) {
    throw CreateTagRpcError.fromSupabase(response.error);
  }

  const row = response.data?.[0];
  if (!row) {
    throw new CreateTagRpcError("CREATE_TAG_FAILED");
  }

  return { id: row.id, name: row.name };
}
