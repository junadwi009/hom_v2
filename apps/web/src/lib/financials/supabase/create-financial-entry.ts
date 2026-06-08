import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

type CreateFinancialEntryRow = {
  id: string;
  entry_type: string;
  category: string;
  amount_idr: number;
  occurred_on: string;
  note: string | null;
  created_at: string;
  updated_at: string;
};

type CreateFinancialEntryRpcResponse = {
  data: CreateFinancialEntryRow[] | null;
  error: unknown;
};

type CreateFinancialEntryRpcParams = {
  p_entry_type: string;
  p_category: string;
  p_amount_idr: number;
  p_occurred_on: string;
  p_note: string | null;
};

type CreateFinancialEntryRpcClient = {
  rpc(
    functionName: "create_financial_entry",
    params: CreateFinancialEntryRpcParams,
  ): PromiseLike<CreateFinancialEntryRpcResponse>;
};

const knownErrorCodes = [
  "AUTH_REQUIRED",
  "APP_USER_REQUIRED",
  "PERMISSION_DENIED",
  "TYPE_INVALID",
  "CATEGORY_REQUIRED",
  "CATEGORY_TOO_LONG",
  "AMOUNT_INVALID",
  "DATE_REQUIRED",
] as const;

export type CreateFinancialEntryErrorCode =
  | (typeof knownErrorCodes)[number]
  | "CREATE_FINANCIAL_ENTRY_FAILED";

export class CreateFinancialEntryRpcError extends Error {
  readonly code: CreateFinancialEntryErrorCode;

  constructor(code: CreateFinancialEntryErrorCode) {
    super("Financial entry could not be created.");
    this.name = "CreateFinancialEntryRpcError";
    this.code = code;
  }

  static fromSupabase(error: unknown): CreateFinancialEntryRpcError {
    const message =
      typeof error === "object" && error !== null
        ? (error as { message?: string }).message
        : undefined;
    const code = knownErrorCodes.find((candidate) =>
      message?.includes(candidate),
    );
    return new CreateFinancialEntryRpcError(
      code ?? "CREATE_FINANCIAL_ENTRY_FAILED",
    );
  }
}

export type CreateFinancialEntryInput = {
  entryType: string;
  category: string;
  amountIdr: number;
  occurredOn: string;
  note: string | null;
};

export async function createFinancialEntry(
  input: CreateFinancialEntryInput,
): Promise<{ id: string; category: string }> {
  const supabase =
    (await createSupabaseServerClient()) as unknown as CreateFinancialEntryRpcClient;

  const response = await supabase.rpc("create_financial_entry", {
    p_entry_type: input.entryType,
    p_category: input.category,
    p_amount_idr: input.amountIdr,
    p_occurred_on: input.occurredOn,
    p_note: input.note,
  });

  if (response.error) {
    throw CreateFinancialEntryRpcError.fromSupabase(response.error);
  }

  const row = response.data?.[0];
  if (!row) {
    throw new CreateFinancialEntryRpcError("CREATE_FINANCIAL_ENTRY_FAILED");
  }

  return { id: row.id, category: row.category };
}
