import { PermissionDeniedError } from "./errors";
import type { ActorWithPermissions, PermissionKey } from "./types";

export function hasPermission(
  actor: ActorWithPermissions,
  permission: PermissionKey,
): boolean {
  return actor.permissions.includes(permission);
}

export function requirePermission(
  actor: ActorWithPermissions,
  permission: PermissionKey,
): void {
  if (!hasPermission(actor, permission)) {
    throw new PermissionDeniedError(permission);
  }
}

export function requireAnyPermission(
  actor: ActorWithPermissions,
  permissions: readonly PermissionKey[],
): void {
  if (permissions.some((permission) => hasPermission(actor, permission))) {
    return;
  }

  throw new PermissionDeniedError(null, "At least one permission is required");
}
