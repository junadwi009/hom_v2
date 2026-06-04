# Phase 5I Package Deduction RPC Log

## Scope

Implemented server-only package session deduction for a completed appointment
through a narrow local-first Postgres RPC and a server-only TypeScript adapter.
Approved trigger is Option C (hybrid/manual): completion stays a separate step,
and an operator explicitly selects one eligible client package to deduct exactly
one session. No deduction UI, payment, finance, reversal, cancellation, extension,
clinical, WhatsApp, AI, production service, service-role browser client, or cloud
Supabase link/push was added.

## Files Changed

- `packages/domain/src/packages/schemas.ts`
- `packages/domain/src/packages/types.ts`
- `packages/domain/src/packages/index.ts`
- `apps/web/src/lib/packages/server/deduct-client-package-session.ts`
- `apps/web/src/lib/packages/server/index.ts`
- `apps/web/tests/unit/packages/deduct-client-package-session.test.ts`
- `supabase/migrations/20260603000300_deduct_client_package_session_rpc.sql`
- `supabase/tests/phase_5i_deduct_client_package_session_rpc.sql`
- `docs/PHASE_5I_PACKAGE_DEDUCTION_RPC_LOG.md`

No deduction UI, server action, route handler, or service-role client was added.

## RPC Behavior

Added `public.deduct_client_package_session(p_appointment_id uuid,
p_client_package_id uuid)` as a `security definer` function with
`search_path = public, private`, mirroring the existing assign and complete
appointment RPCs.

The RPC, in order:

- requires `auth.uid()` (`AUTH_REQUIRED`),
- resolves the active mapped `app_users` actor (`APP_USER_REQUIRED`),
- requires `can_manage_client_packages` (`PERMISSION_DENIED`),
- locks and requires the appointment to exist (`APPOINTMENT_NOT_FOUND`) and to be
  `completed` (`APPOINTMENT_NOT_COMPLETED`),
- locks and requires the client package to exist, to belong to the appointment
  client, to be `active`, to not be past its `expires_at`, and to have
  `remaining_sessions > 0` (all surfaced as `CLIENT_PACKAGE_UNAVAILABLE`),
- rejects a second deduction for the same appointment (`ALREADY_DEDUCTED`),
- deducts exactly one session: `before_remaining = remaining_sessions`,
  `after_remaining = before_remaining - 1`,
- updates `client_packages.remaining_sessions`,
- sets `client_packages.status = 'depleted'` when `after_remaining = 0`,
- inserts one `package_usage_history` row with `change_type = 'deducted'`,
  `quantity = 1`, before/after remaining, `appointment_id`, and the actor,
- inserts one `audit_logs` row with action `package_usage.recorded`,
- returns a safe client package read model.

All writes commit atomically or roll back together. Execute is granted to
`authenticated` only; `public` and `anon` are revoked. No direct browser
insert/update/delete policies were added for `client_packages`,
`package_usage_history`, or `audit_logs`.

## Server Adapter Behavior

Added a server-only adapter `deductClientPackageSession(...)` that validates input
with `deductClientPackageSessionInputSchema`, runs the existing server audit guard
over the safe metadata, calls `deduct_client_package_session` through the existing
Supabase server client, maps known database error messages to a safe
`DeductClientPackageSessionRpcError` code, and parses the RPC row into the shared
`clientPackageSchema` read model. Unknown failures fall back to
`DEDUCT_CLIENT_PACKAGE_SESSION_FAILED`, and raw database details are never
surfaced. No service-role client was added.

## Idempotency

Two backstops enforce one deduction per completed appointment:

- A runtime check in the RPC rejects a deduction when a `deducted`
  `package_usage_history` row already exists for the appointment
  (`ALREADY_DEDUCTED`).
- A partial unique index `uq_package_usage_history_deducted_appointment` on
  `package_usage_history(appointment_id) where change_type = 'deducted'`.
- A check constraint `package_usage_history_deducted_requires_appointment` ensures
  every `deducted` usage row carries a non-null `appointment_id`.

## Audit Behavior

The audit row uses action `package_usage.recorded`, `target_type =
client_package`, `target_id =` the client package id, and `risk_level = high`.
Metadata includes only `clientPackageId`, `appointmentId`, `beforeRemaining`,
`afterRemaining`, and `quantity`. It contains no payment, contact, clinical,
WhatsApp, secret, or raw database error content. Direct browser audit inserts
remain blocked; the row is written only inside the RPC transaction.

## Verification

- `corepack pnpm exec supabase db reset` applied the new migration cleanly.
- The rollback SQL probe
  `supabase/tests/phase_5i_deduct_client_package_session_rpc.sql` passed and
  verified:
  - authenticated can execute the RPC; anon cannot,
  - the partial unique deducted-appointment index exists,
  - active package allowed and `remaining_sessions` decrements by exactly one,
  - usage `deducted` row and safe `package_usage.recorded` audit row inserted,
  - status becomes `depleted` when remaining reaches zero,
  - duplicate deduction for the same appointment denied,
  - wrong-client package denied,
  - expired-status, depleted-status, and past-expiry-date packages denied,
  - scheduled, confirmed, cancelled, and no-show appointments denied,
  - user without `can_manage_client_packages` denied,
  - direct authenticated insert/update/delete on `client_packages` and
    `package_usage_history` denied,
  - direct authenticated insert into `audit_logs` denied,
  - transaction rolls back fully when the audit insert fails (no decrement, no
    usage row).
- Unit tests cover input validation, RPC parameter mapping, the depleted result,
  rejection of extra payment/contact/clinical/WhatsApp fields, safe error mapping
  without raw details, the generic no-row fallback, server-only/no-service-role
  guarantees, and the migration's blocked-direct-write and authenticated-only
  grant invariants.

## Final Checks

| Command | Result |
| --- | --- |
| `corepack pnpm exec supabase db reset` | Pass |
| `phase_5i_deduct_client_package_session_rpc.sql` rollback probe | Pass |
| `corepack pnpm typecheck` | Pass |
| `corepack pnpm lint` | Pass |
| `corepack pnpm test` | Pass (93 domain, 164 web) |
| `corepack pnpm build` | Pass |
| `corepack pnpm build-storybook` | Pass |
| `corepack pnpm test:e2e` | Pass (24 passed, 2 guarded local-Supabase specs skipped) |

Warnings: Supabase CLI reported that v2.104.0 is available; Storybook reported the
existing large bundle-size warning; Playwright reported the existing Node
`NO_COLOR`/`FORCE_COLOR` warnings. An initial typecheck failure came from a stale
`apps/web/.next` dev artifact left by an earlier local dev server; removing
`.next` and re-running typecheck passed, and the subsequent build regenerated it
cleanly.

## Safety Confirmation

No deduction UI, server action, route handler, payment, finance ledger, package
reversal, package cancellation, package extension, clinical notes, WhatsApp, AI,
production services, service-role browser client, cloud Supabase link/push,
secrets, or production data were added. Direct browser writes remain blocked for
`client_packages`, `package_usage_history`, and `audit_logs`, including direct
browser audit inserts. Completion of an appointment does not auto-deduct a
package.

## Stop Point

Phase 5I stops after the deduction RPC and server-only adapter. The deduction UI
(Phase 5J), package reversal, payment, and finance work remain deferred until the
owner approves the next slice.
