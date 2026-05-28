import type { PermissionKey } from "./types";

export class PermissionDeniedError extends Error {
  readonly code = "FORBIDDEN";
  readonly permission: PermissionKey | null;

  constructor(permission: PermissionKey | null, message = "Permission denied") {
    super(message);
    this.name = "PermissionDeniedError";
    this.permission = permission;
  }
}
