# Phase 5K Operational MVP Stabilization Log

## Scope

Verified and documented the complete local operational MVP as a stabilization
checkpoint. The verified surface is: login, appointment create / overlap
protection / reschedule / cancel / complete / no-show, assign package, deduct one
session from a completed appointment, and history/audit verification. No new
product features were added in this phase.

## Files Changed

- Added `docs/LOCAL_OPERATIONAL_MVP_DEMO_GUIDE.md`.
- Added `docs/PHASE_5K_OPERATIONAL_MVP_STABILIZATION_LOG.md`.

No product code, migration, schema, or UI was changed.

## E2E Verification

Local Supabase only; no cloud project link or push.

- `corepack pnpm exec supabase db reset` applied every migration and the clean
  dummy seed.
- All three guarded local-Supabase Playwright specs passed against the local
  stack in Supabase auth/data mode (`HOM_E2E_LOCAL_SUPABASE=1`):
  - appointment MVP (create, overlap conflict, reschedule, cancel, complete,
    no-show),
  - assign package (assign an active package to an eligible client),
  - deduct session (create + complete an appointment, then deduct one session and
    confirm the control becomes disabled).
- Local container `psql` confirmed the full operational audit and history trail
  after the guarded runs:
  - audit actions present: `appointment.created` (2), `appointment.completed`
    (2), `appointment.rescheduled` (1), `appointment.cancelled` (1),
    `appointment.no_show_marked` (1), `client_package.assigned` (1),
    `package_usage.recorded` (1),
  - usage history: 25 `assigned` rows (24 seed + 1 assignment) and 1 `deducted`
    row with `before_remaining 2`, `after_remaining 1`, `quantity 1`,
  - audit metadata carried only safe IDs and counts, with no payment, contact,
    clinical, or WhatsApp content.
- The local demo data created during verification was cleared by restoring the
  seed baseline with `corepack pnpm exec supabase db reset`.

## Final Checks

| Command | Result |
| --- | --- |
| `corepack pnpm exec supabase db reset` | Pass |
| `corepack pnpm typecheck` | Pass |
| `corepack pnpm lint` | Pass |
| `corepack pnpm test` | Pass (93 domain, 173 web) |
| `corepack pnpm build` | Pass |
| `corepack pnpm build-storybook` | Pass |
| `corepack pnpm test:e2e` | Pass (26 passed, 3 guarded local-Supabase specs skipped) |
| Guarded appointment MVP spec | Pass |
| Guarded assign package spec | Pass |
| Guarded deduct session spec | Pass |
| Audit and usage history verification via local DB `psql` | Pass |

Warnings: Supabase CLI reported that v2.104.0 is available; Storybook reported the
existing large bundle-size warning; Playwright reported the existing Node
`NO_COLOR`/`FORCE_COLOR` warnings. A stale `apps/web/.next` dev artifact was
cleaned before typecheck to keep generated route types fresh.

## Safety Confirmation

No package reversal, payment, finance ledger, clinical notes, WhatsApp, AI,
production deployment, production services, service-role browser client, cloud
Supabase link/push, secrets, production data, or new product features were added.
Direct browser writes remain blocked for `appointments`, `client_packages`,
`package_usage_history`, and `audit_logs`. All verification used dummy local-only
data and was reset to the clean baseline afterward.

## Stop Point

Phase 5K stops after stabilization verification and documentation. Package
reversal, payment, finance, clinical, WhatsApp, AI, and production deployment
remain deferred until the owner approves the next slice.
