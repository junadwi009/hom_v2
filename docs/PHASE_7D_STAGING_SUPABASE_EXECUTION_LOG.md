# Phase 7D Staging Supabase Execution Log

## Scope

Staging-only Supabase setup: link the staging project and apply all migrations
forward-only. No production deploy, no production data, no `supabase/seed.sql` on
the cloud project, no `supabase db reset` on staging, no staging bootstrap, no
super_admin creation, and no Vercel deploy. No secrets, anon key, database
password, or direct Postgres URL are recorded in this log (all command output was
redacted).

## Owner Confirmation & Approval

- Owner confirmed: "this Supabase project is staging only, not production,
  contains no real HOM client/staff/payment data, and supabase/seed.sql has never
  been run against this cloud project."
- Owner approved Phase 7D cloud execution for staging only, with
  `STAGING_PROJECT_REF = pgokujwfwrxopgwhpluj`.

## Authentication Path

- The direct Postgres host (`db.<ref>.supabase.co`) did not resolve (free-tier
  direct connections are deprecated), so the direct-URL path was not usable.
- Resolved via Option A: a Supabase Management access token (from the owner's
  credential file) plus the database password were supplied as transient,
  server-only environment variables (`SUPABASE_ACCESS_TOKEN`,
  `SUPABASE_DB_PASSWORD`). They were never printed, committed, or written to any
  repo file. The token was not persisted to the CLI config (a fresh shell reports
  "not logged in"), so it remains transient.

## Commands Executed (redacted-safe)

1. `supabase link --project-ref pgokujwfwrxopgwhpluj` — succeeded (`exit 0`).
   - Warning (non-blocking): linked project is Postgres major 17 while local
     `config.toml` is 15. `config.toml` was intentionally NOT changed (it would
     affect the local Docker stack). This does not block migration push.
2. `supabase migration list` (before) — succeeded; all 16 local migrations showed
   an empty Remote column (staging schema was empty).
3. `supabase db push` — succeeded (`exit 0`); applied all 16 migrations. The push
   did not run `seed.sql` (only `db reset` runs seed), so no dummy/seed data was
   inserted.
4. `supabase migration list` (after) — succeeded; all 16 migrations show matching
   Local and Remote versions.

## Migration State

Before push: 16 local migrations, 0 applied on remote.

After push: 16 of 16 applied on remote (Local = Remote), through
`20260603000600_payment_status_transitions_rpc`:

- `20260526000100_foundation_extensions_and_schemas`
- `20260526000200_identity_rbac_audit`
- `20260526000300_rls_helpers_and_policies`
- `20260527000100_catalog_tables_and_read_rls`
- `20260601000100_appointment_tables_and_read_rls`
- `20260601000200_create_appointment_rpc`
- `20260602000100_minimum_local_auth_context`
- `20260602000200_cancel_appointment_rpc`
- `20260602000300_reschedule_appointment_rpc`
- `20260602000400_complete_no_show_appointment_rpcs`
- `20260603000100_package_tables_and_read_rls`
- `20260603000200_assign_client_package_rpc`
- `20260603000300_deduct_client_package_session_rpc`
- `20260603000400_payment_tables_and_read_rls`
- `20260603000500_create_manual_payment_rpc`
- `20260603000600_payment_status_transitions_rpc`

## Repo / Link Safety

- `supabase link` wrote `supabase/.temp/project-ref` locally. It is gitignored
  (`.gitignore` `supabase/.temp/`), confirmed via `git check-ignore`, and does NOT
  appear in `git status`. It was not committed.
- `git status` shows only the untracked Phase 7A/7B/7C plan docs; no credential
  values or `.temp` content are staged or committed.
- The access token and database password were used only as transient environment
  variables and were not persisted to disk by these commands.

## Current Staging State

- Schema: fully migrated (tables, RPCs, RLS, permissions) matching local.
- Data: empty — no seed, no dummy `Mock` records, no real client/staff/payment
  data.
- Auth users / app_users: none yet (no super_admin bootstrap performed).
- Vercel staging app (`hom-gamma.vercel.app`, connected to `junadwi009/hom_v2`,
  root `apps/web`, Supabase env vars set) will reach this staging schema but is not
  yet usable for login because no super_admin user exists.

## Not Done (intentionally gated)

- No `supabase/seed.sql` on staging.
- No `supabase db reset` on staging.
- No staging bootstrap and no super_admin creation.
- No Vercel production deploy.
- No production project, data, or service-role/browser secret exposure.

## Next Steps (require separate owner approval)

- Phase 7E: staging auth / bootstrap — create one staging super_admin auth user
  (`junadwi009@gmail.com`), map an active `app_users` row, and assign the
  `super_admin` role through a separate reviewed script (not `seed.sql`).
- Then a staging smoke test (Phase 7B Section 10) signed in as the super_admin.

## Stop Point

Phase 7D stops here after applying staging migrations. Bootstrap, super_admin
creation, seed, reset, and any production work remain deferred until the owner
approves the next phase.
