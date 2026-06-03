# Phase 4P Appointment MVP Stabilization Log

## Scope

Verified the local appointment MVP end to end and prepared a clean demo checkpoint. Added only ordering, copy, and test-stability improvements.

## Files Changed

- `apps/web/src/lib/appointments/supabase/appointment-repository.ts`
- `apps/web/src/features/appointments/appointments-catalog-page.tsx`
- `apps/web/playwright.config.ts`
- `apps/web/tests/unit/appointments/repositories.test.ts`
- `apps/web/tests/e2e/local-supabase-appointment-mvp.spec.ts`
- `docs/APPOINTMENT_MVP_DEMO_GUIDE.md`
- `docs/PHASE_4P_APPOINTMENT_MVP_STABILIZATION_LOG.md`

## Stabilization

- Appointment rows now load newest schedule times first so a newly created future appointment remains visible after refresh.
- Appointment page copy now reflects approved actions instead of describing the page as read-only.
- Local Playwright runs may reuse an intentionally started dev server outside CI.
- Added an opt-in local-Supabase Playwright scenario. The normal mock-mode suite skips it unless explicitly enabled.

## Real Local Workflow Verification

- Logged in as the local-only mapped `studio_director`.
- Confirmed `/api/me`, appointment listing, create, overlap rejection, reschedule, cancel, complete, and no-show through the UI.
- Confirmed the overlap attempt inserted zero rows.
- Confirmed the successful browser run inserted five `appointment_status_history` rows and five `audit_logs` rows:
  `appointment.created`, `appointment.rescheduled`, `appointment.cancelled`, `appointment.completed`, and `appointment.no_show_marked`.
- Reset local Supabase after verification. Clean demo baseline: `25` appointments, `25` seed history rows, and `0` audit rows.

## Safety Verification

- Existing rollback-only SQL probes passed for create, local auth, cancel, reschedule, complete, no-show, audit safety, rollback atomicity, and denied direct browser writes.
- Mock-mode Playwright passed and continues to prove that preview controls cannot fake persistence.
- `supabase/.temp/project-ref` does not exist.

## Final Checks

| Command | Result |
| --- | --- |
| `corepack pnpm exec supabase db reset` | Pass |
| `corepack pnpm typecheck` | Pass |
| `corepack pnpm lint` | Pass |
| `corepack pnpm test` | Pass: 206 tests |
| `corepack pnpm build` | Pass |
| `corepack pnpm build-storybook` | Pass |
| `corepack pnpm test:e2e` | Pass: 19 tests, 1 guarded local-only skip |
| Guarded local-Supabase Playwright scenario | Pass: 1 test |

## Warnings

- Supabase CLI reports that `v2.104.0` is available while local tooling uses `v2.101.0`.
- Storybook retains existing plugin-timing and large-chunk notices.
- Next.js dev routing was intermittently flaky when Playwright repeatedly started and stopped its server. Local server reuse outside CI stabilized the demo verification.
- Git retains existing Windows LF-to-CRLF working-copy notices.

## Safety Confirmation

No payment, package, clinical-note, WhatsApp, AI, worker, production deployment, cloud Supabase link, production credential, secret, or production data was added. Direct browser table writes and direct browser audit inserts remain blocked.

## Stop Point

Phase 4P stops at the clean local Appointment MVP demo checkpoint.
