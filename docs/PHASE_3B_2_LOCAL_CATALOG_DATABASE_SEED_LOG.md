# Phase 3B.2 Local Catalog Database Seed Log

Date: 2026-05-27

## Scope

Phase 3B.2 created local-only Supabase catalog tables and safe dummy seed data for the read-only practitioner, client, and service catalog foundation.

This phase did not add UI changes, Supabase repositories, write endpoints, appointment core, finance, clinical notes, WhatsApp, AI Gateway, workers, n8n, FastAPI, Flask, VPS deployment, production services, secrets, or production data.

## Files Changed

- `supabase/migrations/20260527000100_catalog_tables_and_read_rls.sql`
- `supabase/seed.sql`
- `docs/PHASE_3B_2_LOCAL_CATALOG_DATABASE_SEED_LOG.md`

## Migration Added

Added `20260527000100_catalog_tables_and_read_rls.sql` with three local catalog tables:

- `public.practitioners`
- `public.clients`
- `public.services`

The migration creates `practitioners` before `clients` because `clients.primary_practitioner_id` references `public.practitioners(id)`.

The migration uses:

- `public.app_users`, not a generic `users` table.
- `default_price_idr` for services.
- `private.set_updated_at()` triggers for catalog `updated_at` fields.
- RLS enabled on all three catalog tables.
- `select` grants for `authenticated`.
- Read-only RLS policies.
- No authenticated insert, update, or delete policies.

Indexes added:

- `idx_practitioners_status`
- `idx_practitioners_lower_display_name`
- `idx_clients_status`
- `idx_clients_primary_practitioner_id`
- `idx_clients_lower_full_name`
- `idx_services_status`
- `idx_services_category`
- `idx_services_lower_name`

## Seed Data Added

Updated `supabase/seed.sql` with safe local dummy catalog data:

- Practitioners: 8
- Clients: 40
- Services: 12

Example dummy records:

```text
Mock Practitioner 001 | mock.practitioner.001@example.invalid | active
Mock Client 001 | null | mock.client.001@example.invalid | active
Mock Client 002 | +62 000-0000-0002 | mock.client.002@example.invalid | active
Mock Service 001 Intro Assessment | assessment | 60 minutes | 450000 IDR | active
```

All seeded catalog names clearly start with `Mock`. Emails use `example.invalid`. Phone numbers are null or clearly dummy values. No real names, clinical details, payment data, WhatsApp content, secrets, or production data were added.

## Local Supabase Reset

Command run:

```powershell
corepack pnpm exec supabase db reset
```

Result: passed.

Supabase applied the existing Phase 2 migrations, applied the new Phase 3B.2 catalog migration, and seeded `supabase/seed.sql`. The reset completed locally on the `main` branch.

Docker status:

- Docker Desktop was initially unavailable because the local Docker engine pipe was not reachable.
- Docker Desktop was started locally.
- Docker engine then became available with version `28.4.0`.

Cloud safety:

- `supabase/.temp/project-ref` was checked before and after verification.
- Result: no cloud Supabase project reference was present.
- No Supabase cloud link, push, or production connection was used.

## Table Verification

Verified expected Phase 3B.2 catalog tables exist:

- `practitioners`
- `clients`
- `services`

Verified seed counts:

```text
practitioners = 8
clients = 40
services = 12
```

Verified prohibited product tables were not created. No appointment, finance, clinical note, WhatsApp, AI Gateway, worker, payroll, package, or payment tables were found.

Verified `services.default_price_idr` exists as a `bigint` column. No `default_price_cents` column was created.

## RLS Verification

Verified RLS is enabled:

```text
practitioners = true
clients = true
services = true
```

Verified read policies:

- `practitioners`: readable by users with `can_view_practitioners`, `can_manage_practitioners`, `can_view_appointments`, or `can_manage_appointments`.
- `clients`: readable by users with `can_view_clients` or `can_manage_clients`.
- `services`: readable by users with `can_manage_services`, `can_view_appointments`, or `can_manage_appointments`.

Verified a temporary allowed user could read:

```text
allowed_practitioners = 8
allowed_clients = 40
allowed_services = 12
```

Verified a temporary user without catalog permissions could not read:

```text
viewer_practitioners = 0
viewer_clients = 0
viewer_services = 0
```

The permission verification ran inside a rollback-only SQL transaction, so no temporary verification users remained.

## Denied Write Verification

Verified direct authenticated writes are denied:

```text
practitioners_insert = denied
practitioners_update = denied
practitioners_delete = denied
clients_insert = denied
clients_update = denied
clients_delete = denied
services_insert = denied
services_update = denied
services_delete = denied
```

This matches the approved Phase 3B.2 rule: catalog writes remain blocked until a future server-only audited mutation flow is approved.

## Audit Safety Confirmation

Phase 2.6 remains intact.

Verified `audit_logs` still has only the read policy:

```text
audit_logs:audit viewers can read audit logs:SELECT
```

Verified direct authenticated insert into `audit_logs` is still denied:

```text
audit_logs_insert = denied
```

No audit writer API and no service-role admin client were added.

## Commands Run

```powershell
corepack pnpm exec supabase db reset
corepack pnpm typecheck
corepack pnpm lint
corepack pnpm test
corepack pnpm build
corepack pnpm build-storybook
corepack pnpm test:e2e
```

Additional local verification commands inspected Docker status, local Supabase cloud-link state, table existence, seed counts, RLS state, policies, grants, denied writes, and audit safety.

## Final Check Results

| Command | Result | Notes |
| --- | --- | --- |
| `corepack pnpm typecheck` | Passed | `packages/domain` and `apps/web` TypeScript checks passed. |
| `corepack pnpm lint` | Passed | ESLint passed for `apps/web`. |
| `corepack pnpm test` | Passed | `packages/domain`: 5 files, 44 tests passed. `apps/web`: 1 file, 2 tests passed. |
| `corepack pnpm build` | Passed | Next.js production build passed. |
| `corepack pnpm build-storybook` | Passed | Storybook static build completed successfully. |
| `corepack pnpm test:e2e` | Passed | Playwright: 7 tests passed. |

## Warnings

- Docker Desktop had to be started because the Docker engine was initially unavailable.
- Storybook reported Vite plugin timing warnings and chunk-size warnings during build. The Storybook build still completed successfully.
- Playwright/Next dev emitted `NO_COLOR` ignored because `FORCE_COLOR` was set. The e2e suite still passed.
- `git status` could not be used because this folder is not initialized as a Git repository.

## Prohibited Feature Confirmation

Phase 3B.2 did not add:

- UI changes
- Supabase repositories
- Catalog write endpoints
- Appointment core
- Finance features
- Clinical notes
- WhatsApp features
- AI Gateway
- Workers
- n8n
- FastAPI
- Flask
- VPS deployment
- Production services
- Secrets
- Production data
- Cloud Supabase linking or pushing

## Stop Point

Phase 3B.2 is complete and stops here. Phase 3B.3 or any catalog read integration work requires explicit owner approval before implementation.
