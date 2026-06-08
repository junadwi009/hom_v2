import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

type SetRolePermissionsRow = {
  role_name: string;
  permission_keys: string[];
};

type SetRolePermissionsRpcResponse = {
  data: SetRolePermissionsRow[] | null;
  error: unknown;
};

type SetRolePermissionsRpcParams = {
  p_role_name: string;
  p_permission_keys: string[];
};

type SetRolePermissionsRpcClient = {
  rpc(
    functionName: "set_role_permissions",
    params: SetRolePermissionsRpcParams,
  ): PromiseLike<SetRolePermissionsRpcResponse>;
};

const knownErrorCodes = [
  "AUTH_REQUIRED",
  "APP_USER_REQUIRED",
  "PERMISSION_DENIED",
  "ROLE_PROTECTED",
  "ROLE_UNKNOWN",
  "PERMISSIONS_REQUIRED",
  "PERMISSION_UNKNOWN",
] as const;

export type SetRolePermissionsErrorCode =
  | (typeof knownErrorCodes)[number]
  | "SET_ROLE_PERMISSIONS_FAILED";

export class SetRolePermissionsRpcError extends Error {
  readonly code: SetRolePermissionsErrorCode;

  constructor(code: SetRolePermissionsErrorCode) {
    super("Role permissions could not be updated.");
    this.name = "SetRolePermissionsRpcError";
    this.code = code;
  }

  static fromSupabase(error: unknown): SetRolePermissionsRpcError {
    const message =
      typeof error === "object" && error !== null
        ? (error as { message?: string }).message
        : undefined;
    const code = knownErrorCodes.find((candidate) =>
      message?.includes(candidate),
    );
    return new SetRolePermissionsRpcError(
      code ?? "SET_ROLE_PERMISSIONS_FAILED",
    );
  }
}

export type SetRolePermissionsInput = {
  roleName: string;
  permissionKeys: string[];
};

export async function setRolePermissions(
  input: SetRolePermissionsInput,
): Promise<{ roleName: string; permissionKeys: string[] }> {
  const supabase =
    (await createSupabaseServerClient()) as unknown as SetRolePermissionsRpcClient;

  const response = await supabase.rpc("set_role_permissions", {
    p_role_name: input.roleName,
    p_permission_keys: input.permissionKeys,
  });

  if (response.error) {
    throw SetRolePermissionsRpcError.fromSupabase(response.error);
  }

  const row = response.data?.[0];
  // An empty permission set is a valid result (role with no rows returns none).
  return {
    roleName: row?.role_name ?? input.roleName,
    permissionKeys: row?.permission_keys ?? [],
  };
}
