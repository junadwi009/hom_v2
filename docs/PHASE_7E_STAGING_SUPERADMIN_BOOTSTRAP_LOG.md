# Phase 7E Staging Super_admin Bootstrap Log

## Scope

Staging-only bootstrap of the canonical RBAC reference data and exactly one
super_admin, so the staging app can log in and run smoke tests later. No
production work, no Vercel deploy, no `supabase/seed.sql`, no `supabase db reset`
on staging, and no business/Mock/dummy data. No secrets, passwords, access tokens,
anon keys, database passwords, or direct/pooler Postgres URLs are recorded in this
log (all command output was redacted).

- Staging project ref: `pgokujwfwrxopgwhpluj`.
- Bootstrapped super_admin email: `junadwi009@gmail.com`.

## Owner / Manual Auth User Step

Per the approved safe flow, the owner created the auth user manually in the
Supabase Dashboard (Authentication → Users → Add user) for
`junadwi009@gmail.com` on the staging project. Codex did not create the auth user
and never handled its password. Codex only verified its existence and mapped the
application identity rows.

## Files Changed

- Added `docs/PHASE_7E_STAGING_SUPERADMIN_BOOTSTRAP_LOG.md`.

No application code, migration, schema, or seed file was changed. The bootstrap
was applied directly to the staging database (server-side SQL only); it produced
no repository changes. The cached `supabase/.temp/project-ref` and
`supabase/.temp/pooler-url` remain gitignored and were not committed.

## Connection Method

The staging direct host (`db.<ref>.supabase.co`) does not resolve on free-tier, so
the bootstrap connected through the session connection pooler endpoint cached by
`supabase link` (`supabase/.temp/pooler-url`, host
`...pooler.supabase.com`, port 5432). The database password was supplied to psql
only via a transient `PGPASSWORD` environment variable, never printed or
committed. SQL was executed with `psql` from the local Supabase container.

## Bootstrap SQL Behavior

Applied as a single transaction with `ON_ERROR_STOP=1` (`psql -1`), so any failure
would roll back the whole bootstrap. The script:

1. Inserted the canonical RBAC reference, extracted verbatim from the
   `roles` / `permissions` / `role_permissions` section of `supabase/seed.sql`
   (the block that ends immediately before the `app_users` fixture). The full
   `supabase/seed.sql` was not run, and no business/`Mock`/fixture rows were
   included. These statements are idempotent (`on conflict`).
2. Inserted exactly one `public.app_users` row for the auth user
   (`junadwi009@gmail.com`, full name "HOM Studio Director", status `active`),
   guarded by `not exists` so a re-run is a no-op.
3. Inserted exactly one `public.user_roles` row granting `super_admin` to that
   app_user, guarded by `not exists`.

Applied row counts: 8 roles, 32 permissions, 88 role_permissions, 1 app_users,
1 user_roles. The local fixture `local.studio.director@example.invalid` was not
created.

## Verification Results

Pre-mutation (read-only):

- Auth user `junadwi009@gmail.com` exists in `auth.users` (1).
- Remote migrations applied through `20260603000600_payment_status_transitions_rpc`.
- RBAC reference tables empty (safe to upsert); app_users/user_roles empty.
- All business tables and `audit_logs` empty.

Post-bootstrap (read-only):

- `auth.users` has `junadwi009@gmail.com` (1).
- `public.app_users` has exactly one active mapping for that email (1).
- `public.user_roles` grants `super_admin` to that app_user (1).
- `public.roles` = 8, `public.permissions` = 32, `public.role_permissions` = 88
  (all populated).
- super_admin holds all four required permissions: `can_manage_appointments`,
  `can_reschedule_appointments`, `can_manage_client_packages`,
  `can_manage_payments` (count = 4).
- `public.get_current_app_user_context()` simulated for the bootstrapped user
  returned `super_admin` role and all four permissions
  (`super_admin=true, payments=true, appointments=true, reschedule=true,
  packages=true`).
- Business tables remain empty: `clients`, `practitioners`, `services`,
  `packages`, `client_packages`, `appointments`, `payments` (all 0).
- `audit_logs` remains empty (0).
- No `Mock`/fixture app_users exist (0); the
  `local.studio.director@example.invalid` fixture is absent.

## Safety Confirmation

`supabase/seed.sql` was not run; no `supabase db reset` on staging; no Vercel
deploy. No business, payment, appointment, or `Mock` data was created. Exactly one
app_users mapping and exactly one super_admin were created. No passwords, access
tokens, anon keys, database passwords, or DB URLs were printed or committed. The
access token and database password were used only as transient environment
variables. `supabase/.temp/project-ref` remains gitignored and uncommitted.

## Stop Point

Phase 7E stops after bootstrap and verification. Staging smoke tests were not run.
The staging super_admin can now sign in to the staging app; the smoke-test pass
(Phase 7B Section 10) remains the next step, pending owner direction.
