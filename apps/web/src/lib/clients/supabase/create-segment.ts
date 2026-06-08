import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

type CreateSegmentRow = {
  id: string;
  name: string;
  description: string | null;
  segment_type: string;
  criteria: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type CreateSegmentRpcResponse = {
  data: CreateSegmentRow[] | null;
  error: unknown;
};

type CreateSegmentRpcParams = {
  p_name: string;
  p_description: string | null;
  p_segment_type: string;
  p_criteria: string[];
  p_is_active: boolean;
};

type CreateSegmentRpcClient = {
  rpc(
    functionName: "create_segment",
    params: CreateSegmentRpcParams,
  ): PromiseLike<CreateSegmentRpcResponse>;
};

const knownErrorCodes = [
  "AUTH_REQUIRED",
  "APP_USER_REQUIRED",
  "PERMISSION_DENIED",
  "NAME_REQUIRED",
  "NAME_TOO_LONG",
  "TYPE_INVALID",
] as const;

export type CreateSegmentErrorCode =
  | (typeof knownErrorCodes)[number]
  | "CREATE_SEGMENT_FAILED";

export class CreateSegmentRpcError extends Error {
  readonly code: CreateSegmentErrorCode;

  constructor(code: CreateSegmentErrorCode) {
    super("Segment could not be created.");
    this.name = "CreateSegmentRpcError";
    this.code = code;
  }

  static fromSupabase(error: unknown): CreateSegmentRpcError {
    const message =
      typeof error === "object" && error !== null
        ? (error as { message?: string }).message
        : undefined;
    const code = knownErrorCodes.find((candidate) =>
      message?.includes(candidate),
    );
    return new CreateSegmentRpcError(code ?? "CREATE_SEGMENT_FAILED");
  }
}

export type CreateSegmentInput = {
  name: string;
  description: string | null;
  segmentType: string;
  criteria: string[];
  isActive: boolean;
};

export async function createSegment(
  input: CreateSegmentInput,
): Promise<{ id: string; name: string }> {
  const supabase =
    (await createSupabaseServerClient()) as unknown as CreateSegmentRpcClient;

  const response = await supabase.rpc("create_segment", {
    p_name: input.name,
    p_description: input.description,
    p_segment_type: input.segmentType,
    p_criteria: input.criteria,
    p_is_active: input.isActive,
  });

  if (response.error) {
    throw CreateSegmentRpcError.fromSupabase(response.error);
  }

  const row = response.data?.[0];
  if (!row) {
    throw new CreateSegmentRpcError("CREATE_SEGMENT_FAILED");
  }

  return { id: row.id, name: row.name };
}
