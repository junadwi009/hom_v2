# Phase 4B Appointment Local DB Log

## Scope

Added local-only appointment tables, safe dummy appointment seed data, and read-only RLS verification. No appointment UI or write flow was added.

## Files Changed

- `supabase/migrations/20260601000100_appointment_tables_and_read_rls.sql`
- `supabase/seed.sql`
- `supabase/config.toml`
- `docs/PHASE_4B_APPOINTMENT_LOCAL_DB_LOG.md`

## Migration Summary

Added:

- `public.appointments`
- `public.appointment_status_history`

The migration adds Phase 4A-aligned status/source checks, time and duration checks, a 280-character `notes_summary` limit, foreign keys, requested indexes, the existing `private.set_updated_at()` trigger, and RLS on both tables.

Authenticated browser/client access is select-only. Reads require `can_view_appointments` or `can_manage_appointments`. No direct insert, update, or delete policies were added.

Local Supabase ports moved from reserved Windows range `54320-54328` to `55420-55428`.

## Seed Summary

- Appointments: `25`
- Appointment status history rows: `25`
- Statuses: `5` each for `scheduled`, `confirmed`, `completed`, `cancelled`, `no_show`
- Sources: `admin=15`, `import=10`

Seed rows use existing dummy clients, practitioners, and services only. No contact, clinical, payment, package, WhatsApp, AI, secret, or production data was added.

## RLS Verification

Rollback-only probes passed:

- Allowed `admin_frontdesk` user: `appointments=25`, `history=25`
- Denied `viewer` user: `appointments=0`, `history=0`
- Direct authenticated appointment insert/update/delete: denied with `42501`
- Direct authenticated status-history insert/update/delete: denied with `42501`
- Temporary probe users and rows remaining after rollback: `0`

Prohibited new-table scan returned `none`.

## Audit Safety

Phase 2.6 remains intact:

- Direct authenticated `audit_logs` insert: denied with `42501`
- `audit_logs` insert policies: `0`
- No audit writer API was added.

## Final Checks

| Command | Result |
| --- | --- |
| `corepack pnpm exec supabase db reset` | Pass |
| `corepack pnpm typecheck` | Pass |
| `corepack pnpm lint` | Pass |
| `corepack pnpm test` | Pass: domain `55`, web `38` |
| `corepack pnpm build` | Pass |
| `corepack pnpm build-storybook` | Pass |
| `corepack pnpm test:e2e` | Pass: `13` |

## Warnings

- Docker Desktop had to be started locally.
- Windows reserved ports `54305-54404`, so local Supabase ports were moved to `55420-55428`.
- Supabase CLI printed a newer-version notice and local development key output; no keys were copied into files.
- Supabase CLI warned that analytics on Windows needs Docker TCP exposure.
- Storybook reported existing Vite timing and chunk-size warnings.
- Playwright reported existing `NO_COLOR` / `FORCE_COLOR` warnings.

## Safety Confirmation

Confirmed no appointment UI, appointment write flow, route handler, server action, audit writer, real auth, service-role client, production service, secret, or production data was added. No cloud Supabase project was linked or pushed.

## Stop Point

Phase 4B stops here before appointment repository, UI, or write phases.
