export type SupabaseAuthBoundaryErrorCode =
  | "AUTH_REQUIRED"
  | "APP_USER_REQUIRED"
  | "APP_USER_INACTIVE"
  | "AUTH_CONTEXT_FAILED";

export class SupabaseAuthBoundaryError extends Error {
  readonly code: SupabaseAuthBoundaryErrorCode;

  constructor(code: SupabaseAuthBoundaryErrorCode) {
    super("Authentication context could not be loaded.");
    this.name = "SupabaseAuthBoundaryError";
    this.code = code;
  }
}
