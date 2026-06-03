# Phase 4N Reschedule Appointment Log

## Scope

Implemented reschedule-only appointment flow for scheduled and confirmed appointments. The flow preserves the current appointment status and stored duration, requires a future Asia/Jakarta start time and operational reason, and writes the appointment update, status history, and audit row atomically.

## Files Changed

- `packages/domain/src/appointments/schemas.ts`
- `packages/domain/tests/appointments.test.ts`
- `supabase/migrations/20260602000300_reschedule_appointment_rpc.sql`
- `supabase/tests/phase_4n_reschedule_appointment_rpc.sql`
- `apps/web/src/lib/appointments/server/reschedule-appointment.ts`
- `apps/web/src/lib/appointments/server/submit-reschedule-appointment.ts`
- `apps/web/src/lib/appointments/server/index.ts`
- `apps/web/src/features/appointments/reschedule-appointment-types.ts`
- `apps/web/src/features/appointments/reschedule-appointment-action.ts`
- `apps/web/src/features/appointments/reschedule-appointment-dialog.tsx`
- `apps/web/src/features/appointments/reschedule-appointment-dialog.stories.tsx`
- `apps/web/src/features/appointments/appointments-table.tsx`
- `apps/web/src/features/appointments/appointments-catalog-page.tsx`
- `apps/web/src/app/appointments/page.tsx`
- `apps/web/tests/unit/appointments/reschedule-appointment.test.ts`
- `apps/web/tests/unit/appointments/submit-reschedule-appointment.test.ts`
- `apps/web/tests/e2e/app-shell.spec.ts`

## Reschedule Behavior

- `public.reschedule_appointment(...)` requires an active mapped app user and `can_reschedule_appointments` or `can_manage_appointments`.
- Only scheduled or confirmed appointments can be rescheduled.
- Current status and stored duration remain unchanged. The RPC calculates the new end time.
- New start time must be in the future. Reason is required and limited to 280 characters.
- Scheduled and confirmed overlaps are rejected. Adjacent appointments are allowed.
- UI action appears only for scheduled and confirmed rows. It exposes new start time, read-only duration, and reason only.

## Audit Atomicity

- The RPC inserts same-status `appointment_status_history` with safe previous/new schedule metadata.
- The RPC inserts `appointment.rescheduled` audit metadata without reason or sensitive content.
- Rollback-only SQL verification confirmed an audit insertion failure rolls back the appointment update and status-history insert.

## Verification

- Local Supabase reset passed.
- Rollback-only SQL probe passed for permissions, adjacency, overlap denial, terminal-state denial, browser write denial, audit insert denial, and rollback atomicity.
- Secret scan found placeholders and documentation references only.
- `supabase/.temp/project-ref` does not exist.

## Final Checks

| Command | Result |
| --- | --- |
| `corepack pnpm exec supabase db reset` | Pass |
| `corepack pnpm typecheck` | Pass |
| `corepack pnpm lint` | Pass |
| `corepack pnpm test` | Pass: 187 tests |
| `corepack pnpm build` | Pass |
| `corepack pnpm build-storybook` | Pass |
| `corepack pnpm test:e2e` | Pass: 17 tests |

## Warnings

- Supabase CLI reported that `v2.104.0` is available while local tooling uses `v2.101.0`.
- Storybook reported existing plugin-timing and large-chunk notices.
- The in-app browser visual capture channel timed out on its streamed loading surface; Playwright completed the finished reschedule-dialog browser verification successfully.

## Safety Confirmation

- No complete or no-show flow was added.
- No payment, package, clinical note, WhatsApp, AI, worker, production-auth, or production-service feature was added.
- No service-role browser client, cloud Supabase link/push, secret, or production data was added.
- Direct browser table writes and direct browser audit inserts remain blocked.

## Stop Point

Phase 4N stops after the reschedule-only flow and its verification.
