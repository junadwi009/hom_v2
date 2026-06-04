# Phase 7G Staging Minimal Catalog Bootstrap Log

## Scope

Staging-only insertion of the minimum staging-safe catalog data required to run the
later staging smoke test. Exactly four approved records were inserted: 1 client,
1 practitioner, 1 service, 1 package. No transactional business data, no `Mock` data,
no production data, no smoke test.

- Staging project ref: `pgokujwfwrxopgwhpluj` (approved).
- All records are clearly staging-only (each `STAGING`-prefixed), with no real
  client/staff PII (no phone, no email).

Explicitly NOT done (per the approved rules):

- No `supabase/seed.sql` run.
- No `supabase db reset` on staging.
- No `Mock` local seed data.
- No production data.
- No `client_packages`, `appointments`, `payments`, or `package_usage_history`
  inserted.
- No manual `audit_logs` insert.
- No Vercel deploy.
- No smoke test executed.
- No passwords, access tokens, anon keys, database password, DB URLs, or other
  secrets printed or committed.
- No `supabase/.temp/project-ref` (or `pooler-url`) committed.

## Files Changed

None. The bootstrap was applied directly to the staging database (server-side SQL
only) and produced no repository changes. The cached `supabase/.temp/project-ref`
and `supabase/.temp/pooler-url` remain gitignored (confirmed via `git check-ignore`)
and were not committed. `git status` shows only the untracked Phase 7A–7G plan/log
docs. This log file (`docs/PHASE_7G_STAGING_MINIMAL_CATALOG_BOOTSTRAP_LOG.md`) is the
only added file.

## Connection Method

Same safe path as Phase 7E. The staging direct host (`db.<ref>.supabase.co`) does not
resolve on free-tier, so the bootstrap connected through the session connection
pooler endpoint cached by `supabase link`
(`supabase/.temp/pooler-url`, host `...pooler.supabase.com`, port 5432, user
`postgres.<ref>`). The database password was parsed from the owner's credential file,
URL-decoded, and supplied to `psql` only via a transient `PGPASSWORD` environment
variable inside a single shell invocation — never printed, logged, or committed. SQL
was executed with `psql` from the local Supabase Docker container
(`supabase_db_hom-studio-os-v2`). No Supabase CLI login was persisted.

## Bootstrap SQL Behavior

Applied as a single transaction with `ON_ERROR_STOP=1` and `--single-transaction`, so
any failure rolls back the entire bootstrap (verified: an earlier run that hit a
precheck column error rolled back with zero rows inserted). The script ran in three
parts inside that one transaction:

1. Prechecks (raise an exception → full rollback if any fails):
   - Migration `20260603000600_payment_status_transitions_rpc` is applied on the
     remote (`supabase_migrations.schema_migrations`).
   - A `super_admin` assignment exists (`user_roles` joined to `roles.name =
     'super_admin'`).
   - No `Mock%` records exist in `clients` / `practitioners` / `services` /
     `packages`.
   - No unexpected non-`STAGING` business records exist (guards against running
     against unintended/production-like data).
   - The transactional business tables (`client_packages`, `appointments`,
     `payments`, `package_usage_history`) are empty.
2. Idempotent inserts (each guarded by `where not exists`, so re-running is a no-op):
   - `public.clients`: `full_name = 'STAGING Test Client'`, `status = 'active'`.
   - `public.practitioners`: `display_name = 'STAGING Practitioner One'`,
     `status = 'active'`.
   - `public.services`: `name = 'STAGING Test Service'`, `category = 'general'`,
     `default_duration_minutes = 60`, `default_price_idr = 100000`,
     `status = 'active'`.
   - `public.packages`: `name = 'STAGING Test Pack'`,
     `package_type = 'session_pack'`, `total_sessions = 5`, `validity_days = 90`,
     `price_idr = 1000000`, `status = 'active'`.
3. Verification counts (read-only).

Applied row counts on the successful run: `INSERT 0 1` for each of clients,
practitioners, services, packages (4 rows total).

## Verification Results

Post-bootstrap counts (all match the required acceptance):

| Check | Expected | Actual |
|---|---|---|
| `clients` = `STAGING Test Client` | 1 | 1 |
| `practitioners` = `STAGING Practitioner One` | 1 | 1 |
| `services` = `STAGING Test Service` | 1 | 1 |
| `packages` = `STAGING Test Pack` | 1 | 1 |
| `clients` total | 1 | 1 |
| `practitioners` total | 1 | 1 |
| `services` total | 1 | 1 |
| `packages` total | 1 | 1 |
| `client_packages` total | 0 | 0 |
| `appointments` total | 0 | 0 |
| `payments` total | 0 | 0 |
| `package_usage_history` total | 0 | 0 |
| `audit_logs` total | 0 | 0 |
| `Mock` records total | 0 | 0 |

The catalog tables contain only the four approved `STAGING` records (each table total
= 1 and equals its `STAGING` count), all transactional/history/audit tables remain
empty, and no `Mock` records exist.

## Safety Confirmation

- `supabase/seed.sql` was not run; no `supabase db reset` on staging; no Vercel
  deploy.
- Only the four approved `STAGING` catalog records were inserted; no
  `client_packages`, `appointments`, `payments`, `package_usage_history`, or manual
  `audit_logs`.
- No `Mock` data and no production data were inserted.
- The inserts were idempotent (`where not exists`) and applied as one
  `ON_ERROR_STOP` single transaction.
- No passwords, access tokens, anon keys, database password, or DB URLs were printed
  or committed; the database password was used only as a transient `PGPASSWORD`
  environment variable.
- `supabase/.temp/project-ref` and `supabase/.temp/pooler-url` remain gitignored and
  uncommitted; the bootstrap produced no repo changes.

## Stop Point

Phase 7G stops after this log. The staging catalog now has the minimum data
(1 client, 1 practitioner, 1 service, 1 package) needed for the smoke test, while all
transactional and audit tables remain empty. The smoke test was NOT run; it remains
the next step pending separate owner direction (owner-performed authenticated login
plus the create / assign / deduct / payment flows per Phase 7B Section 10).
