# Phase 5C Package Local DB Log

## Scope
Added local-only package/membership database foundations for package catalog, client package ownership, and package usage history. This phase is read-only from the browser and uses dummy local seed data only.

## Files Changed
- `supabase/migrations/20260603000100_package_tables_and_read_rls.sql`
- `supabase/seed.sql`
- `supabase/tests/phase_5c_package_local_db.sql`
- `apps/web/playwright.config.ts`
- `docs/PHASE_5C_PACKAGE_LOCAL_DB_LOG.md`

## Migration Summary
- Added `packages`, `client_packages`, and `package_usage_history`.
- Used `package_type`, `price_idr`, `total_sessions`, `remaining_sessions`, and `validity_days`.
- Added status checks for package, client package, and usage history states.
- Added constraints for positive session counts, non-negative balances, `remaining_sessions <= total_sessions`, non-negative `price_idr`, positive `validity_days`, expiry after purchase, and max 280-character safe operational reasons.
- Added requested indexes for status/type, client/package references, appointment references, and usage change type.
- Enabled RLS on all three tables.
- Granted `select` to `authenticated` and added read policies for operational users with client or appointment permissions.
- Added no direct browser/client insert, update, or delete policies.

## Seed Summary
- Seeded 10 dummy packages.
- Seeded 24 dummy client packages.
- Seeded 24 matching `assigned` package usage history rows.
- All seeded names are `Mock` local dummy records with no real client, payment, clinical, WhatsApp, secret, or production data.

## RLS Verification
- `corepack pnpm exec supabase db reset` passed.
- Rollback SQL probe passed through local DB container `psql`.
- Verified tables exist and seeded counts are present.
- Verified RLS is enabled.
- Verified local Studio Director can read all three package tables.
- Verified a temporary no-permission user cannot read package tables.
- Verified direct authenticated insert/update/delete is denied for all three package tables.
- Verified direct authenticated insert into `audit_logs` remains denied.

## Final Checks
| Command | Result |
| --- | --- |
| `corepack pnpm exec supabase db reset` | Pass |
| Package rollback SQL probe via local DB `psql` | Pass |
| `corepack pnpm typecheck` | Pass |
| `corepack pnpm lint` | Pass |
| `corepack pnpm test` | Pass, 91 domain tests and 130 web tests |
| `corepack pnpm build` | Pass |
| `corepack pnpm build-storybook` | Pass |
| `corepack pnpm test:e2e` | Pass, 19 passed and 1 guarded local-Supabase test skipped |

## Warnings
- Supabase CLI reported a newer version is available.
- `supabase test db` was not used for the rollback SQL probe because the repo probe files are plain SQL scripts, not pgTAP plans; the probe passed via local DB container `psql`.
- Storybook reported the existing large chunk warning.
- Playwright reported the existing `NO_COLOR` / `FORCE_COLOR` environment warning.
- Playwright initially served 404 pages when launched from the root script because the web server cwd was not pinned; `apps/web/playwright.config.ts` now pins `webServer.cwd` to `__dirname`.

## Safety Confirmation
No package UI, package writes, package assignment flow, session deduction, payment, finance, clinical notes, WhatsApp, AI, production services, production secrets, or production data were added. Direct browser writes remain blocked for package tables and `audit_logs`.

## Stop Point
Phase 5C stops here before package repository/UI/write phases.
