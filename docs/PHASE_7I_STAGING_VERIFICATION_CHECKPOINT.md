# Phase 7I Staging Verification Checkpoint

This checkpoint records that the staging environment for HOM Studio OS v2 has been
migrated, bootstrapped, seeded with a minimal staging-safe catalog, and verified
end-to-end by an authenticated smoke test. No production deployment has occurred. This
phase adds documentation only — no code, migration, schema, seed, cloud mutation, or
data change.

## Staging Readiness Summary

- Staging project ref: `pgokujwfwrxopgwhpluj`.
- Staging app: `https://hom-gamma.vercel.app`.
- Staging super_admin: `junadwi009@gmail.com` (owner-controlled password).

### Phase 7D — migrations applied

All 16 migrations were applied forward-only to staging via `supabase db push`
(Local = Remote), through `20260603000600_payment_status_transitions_rpc`. No
`seed.sql` and no `db reset` were run on the cloud project. See
[PHASE_7D_STAGING_SUPABASE_EXECUTION_LOG.md](PHASE_7D_STAGING_SUPABASE_EXECUTION_LOG.md).

### Phase 7E — super_admin bootstrap

The owner created the auth user manually; a separate reviewed script (not `seed.sql`)
inserted the canonical RBAC reference (8 roles, 32 permissions, 88 role_permissions),
one active `app_users` mapping, and one `super_admin` `user_roles` grant. Verified the
super_admin holds the four required permissions and
`get_current_app_user_context()` resolves correctly. See
[PHASE_7E_STAGING_SUPERADMIN_BOOTSTRAP_LOG.md](PHASE_7E_STAGING_SUPERADMIN_BOOTSTRAP_LOG.md).

### Phase 7G — minimal staging-safe catalog

A single idempotent `ON_ERROR_STOP` transaction inserted exactly four
`STAGING`-prefixed records — 1 client, 1 practitioner, 1 service, 1 package — with no
`Mock`/production data and no transactional rows. See
[PHASE_7G_STAGING_MINIMAL_CATALOG_BOOTSTRAP_LOG.md](PHASE_7G_STAGING_MINIMAL_CATALOG_BOOTSTRAP_LOG.md).

### Phase 7H — smoke test pass

Authenticated as the staging super_admin (owner logged in manually; the password was
never handled by automation), the full workflow passed:

- Auth: `/api/me` → `authMode=supabase`, role `super_admin`, all four required
  permissions.
- Pages: `/appointments`, `/packages`, `/client-packages`, `/payments` load (no 500).
- Appointments: create, overlap conflict blocked, reschedule, complete, cancel,
  no-show.
- Packages: assign (remaining 5/5), deduct on completed appointment (remaining 4/5),
  duplicate deduction blocked.
- Payments: create pending, create paid (linked to client package), mark paid, cancel
  with reason; terminal rows hide actions.
- Audit/history: all required `audit_logs` actions present; status-history rows
  correct; audit metadata carries no reason text, secrets, or PII (the only token hit
  was the `bank_transfer` payment-method enum). Live proof that the `authenticated`
  role is SELECT-only on all sensitive tables (writes only via RPC).

See [PHASE_7H_STAGING_SMOKE_TEST_LOG.md](PHASE_7H_STAGING_SMOKE_TEST_LOG.md).

## Current Staging Transactional Data (created by the smoke test)

The smoke test created real staging transactional rows through the app UI / RPCs
(all `STAGING`-scoped, no `Mock`/production data):

- Appointments: 3 — one `completed` (session-deducted), one `cancelled`, one
  `no_show`.
- Client packages: 1 — `STAGING Test Pack` for `STAGING Test Client`, remaining 4/5,
  `active`.
- Payments: 3 — two `paid` (one linked to the client package), one `cancelled`.
- History/audit: `appointment_status_history` (7), `package_usage_history`
  (assigned + deducted), `payment_status_history` (pending/paid/cancelled), and
  `audit_logs` (14 rows across all expected actions).

Staging is therefore **no longer empty** of transactional data. A future clean
rehearsal must account for these existing rows.

## Warnings

- **Do not run `supabase db reset` on staging.** Reset is destructive and reserved for
  the local Docker project only. Staging recovery, if ever needed, is via a forward-only
  corrective migration or a restore from backup — never `db reset`. Likewise, never run
  `supabase/seed.sql` against staging.
- **Minor UX issue:** after a mutating action, the `/appointments` and `/payments`
  lists sometimes show a transient "not loaded / paused" (or "Loading payments") state
  and need a page reload to display the new row. Data is always persisted correctly
  (confirmed in the DB); this is a read-side refresh nuance, not a data-loss bug. A
  follow-up could auto-refresh the list after a successful mutation.

## Local Verification Gates (this checkpoint)

All passed on `main`:

- `typecheck` — pass (packages/domain, apps/web).
- `lint` — pass.
- `test` — pass (domain 117, web 215).
- `build` — pass (Next.js production build).
- `build-storybook` — pass (chunk-size warnings only).
- `test:e2e` — pass (30 mock specs passed; 5 local-Supabase specs intentionally
  skipped without `HOM_E2E_LOCAL_SUPABASE`).

## Safety / Repo

- `git status` shows only the Phase 7 docs; `supabase/.temp/project-ref` and
  `supabase/.temp/pooler-url` remain gitignored (`.gitignore:29`) and uncommitted.
- No credential files, `.env` files, or secrets are committed; no password, anon key,
  DB password, access token, or DB URL was printed during this phase.

## Production Gate

Production remains fully gated. No production project, deploy, secret, data import, or
tag exists. Remaining Phase 7 work (production environment/secrets, deploy pipeline,
production auth/bootstrap, real data import, and a production smoke test) requires
separate owner approval before any production action.
