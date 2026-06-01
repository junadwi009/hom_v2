# Phase 4C Appointment Read-only UI Log

## Scope

Added a read-only appointment Supabase adapter, mock-default repository factory, server loader, and `/appointments` list UI.

## Files Changed

- `packages/domain/package.json`
- `apps/web/src/lib/appointments/**`
- `apps/web/src/features/appointments/**`
- `apps/web/src/app/appointments/page.tsx`
- `apps/web/src/app/appointments/loading.tsx`
- `apps/web/tests/unit/appointments/**`
- `apps/web/tests/e2e/app-shell.spec.ts`
- `docs/PHASE_4C_APPOINTMENT_READONLY_UI_LOG.md`

## Repository Behavior

- Default or invalid `HOM_DATA_MODE` uses safe mock appointments.
- `HOM_DATA_MODE=supabase` uses the existing anon/session server client and RLS.
- Supabase repository exposes only `list` and `getById`.
- Relation-wide Supabase search is rejected safely until a correct cross-table search design is approved.
- No write methods were added.

## UI Fields

Rendered: schedule, client name, practitioner name, service name, duration, status, and source.

Omitted: contact fields, clinical data, payment data, package data, WhatsApp data, notes summary, and all write controls.

## Tests

- Added mapper, repository, factory, loader, safe-error, and table-row unit coverage.
- Added static Storybook stories for ready, empty, permission, configuration, and generic error states.
- Added Playwright assertions for the read-only `/appointments` page and omitted controls/columns.

## Final Checks

| Command | Result |
| --- | --- |
| `corepack pnpm typecheck` | Pass |
| `corepack pnpm lint` | Pass |
| `corepack pnpm test` | Pass: domain `55`, web `54` |
| `corepack pnpm build` | Pass |
| `corepack pnpm build-storybook` | Pass |
| `corepack pnpm test:e2e` | Pass: `14` |

## Warnings

- Storybook reported existing Vite plugin-timing and chunk-size warnings.
- Playwright reported existing `NO_COLOR` / `FORCE_COLOR` warnings.
- Git reported Windows LF-to-CRLF working-copy notices.

## Safety Confirmation

Confirmed no migration changes, appointment writes, route handlers, server actions, audit writer, real auth, service-role client, production services, secrets, or production data were added. No cloud Supabase project was linked or pushed.

## Stop Point

Phase 4C stops before appointment write and audit phases.
