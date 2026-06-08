import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

const knownErrorCodes = [
  "AUTH_REQUIRED",
  "APP_USER_REQUIRED",
  "PERMISSION_DENIED",
  "NAME_REQUIRED",
  "CATEGORY_REQUIRED",
  "DURATION_INVALID",
  "PRICE_INVALID",
  "TYPE_INVALID",
  "SESSIONS_INVALID",
  "VALIDITY_INVALID",
  "STATUS_INVALID",
] as const;

export type CatalogCreateErrorCode =
  | (typeof knownErrorCodes)[number]
  | "CREATE_FAILED";

export class CatalogCreateError extends Error {
  readonly code: CatalogCreateErrorCode;

  constructor(code: CatalogCreateErrorCode) {
    super("Catalog item could not be created.");
    this.name = "CatalogCreateError";
    this.code = code;
  }

  static fromSupabase(error: unknown): CatalogCreateError {
    const message =
      typeof error === "object" && error !== null
        ? (error as { message?: string }).message
        : undefined;
    const code = knownErrorCodes.find((candidate) => message?.includes(candidate));
    return new CatalogCreateError(code ?? "CREATE_FAILED");
  }
}

type ServiceRow = { id: string; name: string };
type PackageRow = { id: string; name: string };

type CatalogRpcClient = {
  rpc(
    functionName: "create_service",
    params: {
      p_name: string;
      p_category: string;
      p_duration_minutes: number;
      p_price_idr: number | null;
      p_status: string;
    },
  ): PromiseLike<{ data: ServiceRow[] | null; error: unknown }>;
  rpc(
    functionName: "create_package",
    params: {
      p_name: string;
      p_package_type: string;
      p_total_sessions: number;
      p_validity_days: number;
      p_price_idr: number;
      p_status: string;
    },
  ): PromiseLike<{ data: PackageRow[] | null; error: unknown }>;
};

async function client(): Promise<CatalogRpcClient> {
  return (await createSupabaseServerClient()) as unknown as CatalogRpcClient;
}

export type CreateServiceInput = {
  name: string;
  category: string;
  durationMinutes: number;
  priceIdr: number | null;
  status: string;
};

export async function createService(
  input: CreateServiceInput,
): Promise<{ id: string; name: string }> {
  const supabase = await client();
  const response = await supabase.rpc("create_service", {
    p_name: input.name,
    p_category: input.category,
    p_duration_minutes: input.durationMinutes,
    p_price_idr: input.priceIdr,
    p_status: input.status,
  });
  if (response.error) throw CatalogCreateError.fromSupabase(response.error);
  const row = response.data?.[0];
  if (!row) throw new CatalogCreateError("CREATE_FAILED");
  return { id: row.id, name: row.name };
}

export type CreatePackageInput = {
  name: string;
  packageType: string;
  totalSessions: number;
  validityDays: number;
  priceIdr: number;
  status: string;
};

export async function createPackage(
  input: CreatePackageInput,
): Promise<{ id: string; name: string }> {
  const supabase = await client();
  const response = await supabase.rpc("create_package", {
    p_name: input.name,
    p_package_type: input.packageType,
    p_total_sessions: input.totalSessions,
    p_validity_days: input.validityDays,
    p_price_idr: input.priceIdr,
    p_status: input.status,
  });
  if (response.error) throw CatalogCreateError.fromSupabase(response.error);
  const row = response.data?.[0];
  if (!row) throw new CatalogCreateError("CREATE_FAILED");
  return { id: row.id, name: row.name };
}
