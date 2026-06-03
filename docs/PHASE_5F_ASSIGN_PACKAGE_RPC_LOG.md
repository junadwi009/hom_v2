# Phase 5F Assign Package RPC Log

## Scope
Implemented the server-only foundation for assigning an active package to an eligible client through a narrow local-first Postgres RPC.

## Files Changed
- `packages/domain/src/rbac/constants.ts`
- `packages/domain/src/rbac/role-permissions.ts`
- `packages/domain/src/packages/schemas.ts`
- `packages/domain/src/packages/types.ts`
- `packages/domain/src/packages/index.ts`
- `packages/domain/tests/rbac.test.ts`
- `packages/domain/tests/packages.test.ts`
- `apps/web/src/lib/packages/server/assign-client-package.ts`
- `apps/web/src/lib/packages/server/index.ts`
- `apps/web/tests/unit/api-me.test.ts`
- `apps/web/tests/unit/auth/supabase-auth-boundary.test.ts`
- `apps/web/tests/unit/packages/assign-client-package.test.ts`
- `supabase/migrations/20260603000200_assign_client_package_rpc.sql`
- `supabase/seed.sql`
- `supabase/tests/phase_4k_minimum_local_auth.sql`
- `supabase/tests/phase_5f_assign_client_package_rpc.sql`
- `docs/PHASE_5F_ASSIGN_PACKAGE_RPC_LOG.md`

## Permission Added
Added canonical permission `can_manage_client_packages`.

The local seed grants this permission to `studio_director`; `super_admin` receives it through the canonical permission set.

## RPC Behavior
Added `public.assign_client_package(client_id, package_id, purchased_at)`.

The RPC requires an authenticated active `app_users` actor, requires `can_manage_client_packages`, validates that the client is not archived, validates that the package is active, copies `total_sessions`, initializes `remaining_sessions`, calculates `expires_at`, inserts `client_packages`, inserts `package_usage_history`, and inserts an atomic `client_package.assigned` audit row.

No direct browser insert, update, or delete policies were added for `client_packages`, `package_usage_history`, or `audit_logs`.

## Server Adapter Behavior
Added a server-only TypeScript adapter that validates input, validates/redacts audit metadata through the existing server audit helper, calls the RPC through the existing Supabase server client, and converts database errors into safe application errors.

No service-role client was added.

## Verification
- Local database reset passed.
- SQL verification passed for permission seed, studio director permission, active assignment, inactive/archived package denial, archived client denial, usage history insert, audit insert, rollback on audit failure, denied user, denied direct package writes, denied direct usage writes, and denied direct audit insert.

## Final Checks
| Command | Result |
| --- | --- |
| `corepack pnpm exec supabase db reset` | Pass |
| `phase_5f_assign_client_package_rpc.sql` rollback probe | Pass |
| `corepack pnpm typecheck` | Pass |
| `corepack pnpm lint` | Pass |
| `corepack pnpm test` | Pass |
| `corepack pnpm build` | Pass |
| `corepack pnpm build-storybook` | Pass |
| `corepack pnpm test:e2e` | Pass |

Warnings: Supabase CLI reported that v2.104.0 is available; Storybook reported existing bundle-size/plugin-timing warnings; Playwright reported Node `NO_COLOR`/`FORCE_COLOR` warnings.

## Safety Confirmation
No assign package UI, package deduction, payment, finance ledger, package reversal, package cancellation, package extension, clinical notes, WhatsApp, AI, production services, service-role browser client, cloud Supabase link/push, secrets, or production data were added.

## Stop Point
Phase 5F stops here before assign package UI, package deduction, payment, finance, and any production integration work.
