import type { ClientPackageStatus } from "./types";

/**
 * Effective client-package status.
 *
 * `client_packages.status` is a stored enum set at purchase time and only ever
 * transitioned to `depleted` (sessions exhausted) or `cancelled` — nothing
 * flips an `active` row to `expired` when its `expires_at` passes. This derives
 * the honest status at read time so an `active` package past its expiry is
 * presented as `expired`.
 *
 * Only `active` is overridden: `depleted`, `cancelled`, and an already-stored
 * `expired` are terminal and returned as-is. An unparseable `expiresAt` leaves
 * the stored status untouched (fail safe — never fabricate an expiry).
 */
export function deriveClientPackageStatus(
  storedStatus: ClientPackageStatus,
  expiresAt: string,
  now: Date = new Date(),
): ClientPackageStatus {
  if (storedStatus !== "active") {
    return storedStatus;
  }

  const expiresAtMs = Date.parse(expiresAt);
  if (Number.isNaN(expiresAtMs)) {
    return storedStatus;
  }

  // Strict `<` mirrors the DB expiry guard (`expires_at < now()`): the exact
  // expiry instant still counts as valid.
  return expiresAtMs < now.getTime() ? "expired" : storedStatus;
}
