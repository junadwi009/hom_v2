# Phase 6C Payment Local DB Log

## Scope

Added local-only manual payment database foundations: the `payments` and
`payment_status_history` tables, the two canonical payment permissions, dummy
local seed data, and read-only RLS. This phase is read-only from the browser and
uses dummy local data only. No payment UI, payment write, payment gateway,
settlement, invoice PDF, finance ledger, commission, package payment gating,
clinical, WhatsApp, AI, or production service was added.

## Files Changed

- `supabase/migrations/20260603000400_payment_tables_and_read_rls.sql`
- `supabase/seed.sql`
- `supabase/tests/phase_6c_payment_local_db.sql`
- `packages/domain/src/rbac/constants.ts`
- `packages/domain/src/rbac/role-permissions.ts`
- `docs/PHASE_6C_PAYMENT_LOCAL_DB_LOG.md`

## Migration Summary

- Extended the canonical `permissions_key_check` constraint with
  `can_view_payments` and `can_manage_payments`.
- Added `public.payments` with `client_id` (references `clients`),
  `client_package_id` (nullable, references `client_packages`), `amount_idr`
  (`bigint`), `payment_method`, `status`, `paid_at`, `reference_number`, `notes`,
  `created_by_app_user_id`, `updated_by_app_user_id`, `created_at`, `updated_at`.
- Added `public.payment_status_history` with `payment_id` (cascade), `from_status`,
  `to_status`, `reason`, `actor_app_user_id`, `metadata`, `created_at`.
- Constraints: `amount_idr > 0`; `payment_method` constrained to
  `cash`/`bank_transfer`/`card`/`e_wallet`/`other`; `status` (and `from_status`/
  `to_status`) constrained to `pending`/`paid`/`failed`/`refunded`/`cancelled`;
  `reference_number` max 64 chars; `notes`/`reason` max 280 chars; and
  `paid_at` only allowed when status is settled (`paid` or, forward-compatibly,
  `refunded`).
- No gateway metadata, card detail, or bank account secret columns were added.
- Added an `updated_at` trigger on `payments` via `private.set_updated_at()`.
- Added requested indexes: `payments(client_id)`, `payments(client_package_id)`,
  `payments(status)`, `payments(payment_method)`, `payments(paid_at)`,
  `payment_status_history(payment_id, created_at)`, and
  `payment_status_history(to_status)`.
- Enabled RLS on both tables, granted `select` to `authenticated`, and added read
  policies for users with `can_view_payments` or `can_manage_payments`. No direct
  browser insert/update/delete policies were added.

## Seed Summary

- Added the `can_view_payments` and `can_manage_payments` permission rows.
- Granted both payment permissions to `studio_director` and `finance_admin`;
  `super_admin` receives them through the all-permissions cross join.
  `admin_frontdesk` was intentionally not granted payment permissions.
- Seeded 24 dummy payments (12 `paid`, 12 `pending`) across mock clients, with
  about half linked to mock client packages and a spread across all payment
  methods.
- Seeded 24 matching initial `payment_status_history` rows (one per payment, with
  `to_status` equal to the payment status).
- All seeded records use `Mock` local dummy clients and packages. No card numbers,
  bank account numbers, gateway tokens, payment secrets, or clinical/contact/
  WhatsApp data were added. Reference numbers use safe `MOCK-PAY-*` labels only.
- Also mirrored the two payment permissions and their `studio_director` and
  `finance_admin` grants into the domain RBAC constants and role matrix to keep
  the canonical permission set consistent.

## RLS Verification

- `corepack pnpm exec supabase db reset` applied the migration and seed cleanly.
- The rollback SQL probe `supabase/tests/phase_6c_payment_local_db.sql` passed and
  verified:
  - both tables exist and the seed counts are 24 and 24 with a pending/paid mix,
  - RLS is enabled on both tables,
  - both payment permissions exist and are held by `super_admin`,
    `studio_director`, and `finance_admin` but not `admin_frontdesk`,
  - the local Studio Director can read all payments and history,
  - a seeded local Finance Admin fixture can read all payments,
  - a temporary no-permission user reads zero payments and zero history rows,
  - direct authenticated insert/update/delete on `payments` and
    `payment_status_history` is denied,
  - direct authenticated insert into `audit_logs` remains denied.

## Final Checks

| Command | Result |
| --- | --- |
| `corepack pnpm exec supabase db reset` | Pass |
| `phase_6c_payment_local_db.sql` rollback probe | Pass |
| `corepack pnpm typecheck` | Pass |
| `corepack pnpm lint` | Pass |
| `corepack pnpm test` | Pass (109 domain, 173 web) |
| `corepack pnpm build` | Pass |
| `corepack pnpm build-storybook` | Pass |
| `corepack pnpm test:e2e` | Pass (26 passed, 3 guarded local-Supabase specs skipped) |

Warnings: Supabase CLI reported that v2.104.0 is available; Storybook reported the
existing large bundle-size warning; Playwright reported the existing Node
`NO_COLOR`/`FORCE_COLOR` warnings. A stale `apps/web/.next` dev artifact was
cleaned before typecheck.

## Safety Confirmation

No payment UI, payment write, payment gateway, automatic settlement, invoice PDF,
finance ledger, commission, package payment gating, clinical notes, WhatsApp, AI,
production service, secret, or production data was added. No card numbers, bank
account numbers, gateway tokens, or payment secrets are stored in the schema or
seed. Direct browser writes remain blocked for `payments`,
`payment_status_history`, and `audit_logs`.

## Stop Point

Phase 6C stops here before any payment repository, read-only UI, write RPC, or
status-transition phase.
