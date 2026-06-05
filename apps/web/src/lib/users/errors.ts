const knownErrorCodes = [
  "AUTH_REQUIRED",
  "APP_USER_REQUIRED",
  "PERMISSION_DENIED",
  "AUTH_USER_ID_REQUIRED",
  "FULL_NAME_REQUIRED",
  "EMAIL_REQUIRED",
  "ROLES_REQUIRED",
  "ROLE_UNKNOWN",
  "EMAIL_ALREADY_EXISTS",
  "STATUS_INVALID",
  "APP_USER_NOT_FOUND",
  "CANNOT_MODIFY_SELF",
] as const;

export type KnownUserAdminErrorCode = (typeof knownErrorCodes)[number];

export type UserAdminErrorCode =
  | KnownUserAdminErrorCode
  | "AUTH_CREATE_FAILED"
  | "USER_ADMIN_FAILED";

export class AdminUserRpcError extends Error {
  readonly code: UserAdminErrorCode;

  constructor(code: UserAdminErrorCode) {
    super("User administration request failed.");
    this.name = "AdminUserRpcError";
    this.code = code;
  }

  static fromSupabase(error: unknown): AdminUserRpcError {
    const message = readOptionalString(error, "message");
    const code = knownErrorCodes.find((candidate) =>
      message?.includes(candidate),
    );

    return new AdminUserRpcError(code ?? "USER_ADMIN_FAILED");
  }

  // Maps a Supabase Admin API (auth.admin.createUser) error to our codes.
  static fromAuthAdmin(error: unknown): AdminUserRpcError {
    const message = readOptionalString(error, "message")?.toLowerCase() ?? "";
    if (message.includes("already") && message.includes("registered")) {
      return new AdminUserRpcError("EMAIL_ALREADY_EXISTS");
    }
    if (message.includes("email") && message.includes("exist")) {
      return new AdminUserRpcError("EMAIL_ALREADY_EXISTS");
    }
    return new AdminUserRpcError("AUTH_CREATE_FAILED");
  }
}

function readOptionalString(value: unknown, key: string) {
  if (typeof value !== "object" || value === null) {
    return undefined;
  }

  const property = (value as Record<string, unknown>)[key];
  return typeof property === "string" ? property : undefined;
}
