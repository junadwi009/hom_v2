# Phase 4O Complete and No-show Log

## Scope

Implemented terminal appointment flows for marking eligible scheduled or confirmed appointments as completed or no-show. Both flows use authenticated server-only submission paths and atomic local Postgres RPCs.

## Files Changed

- Added `supabase/migrations/20260602000400_complete_no_show_appointment_rpcs.sql`.
- Added `supabase/tests/phase_4o_complete_no_show_appointment_rpcs.sql`.
- Updated appointment domain schemas, types, exports, rules, and tests in `packages/domain`.
- Added complete and no-show server adapters and submission paths in `apps/web/src/lib/appointments/server`.
- Added shared terminal confirmation UI, complete/no-show dialogs, stories, table actions, and tests in `apps/web`.

## RPC Behavior

- `public.complete_appointment(uuid)` marks only scheduled or confirmed appointments as completed.
- `public.mark_appointment_no_show(uuid, text)` marks only scheduled or confirmed appointments as no-show and accepts an optional operational note up to 280 characters.
- Both RPCs require an active mapped app user with `can_manage_appointments`.
- Each RPC atomically updates the appointment, inserts status history, and inserts a minimal audit row.
- Audit actions are `appointment.completed` and `appointment.no_show_marked`.
- Audit metadata contains only safe minimal context and never includes the optional no-show note.

## UI Behavior

- Eligible appointment rows show `Complete` and `Mark No-show` actions.
- Terminal rows expose no terminal mutation controls.
- Confirmation dialogs remain disabled in mock mode and cannot fake a successful save.
- The no-show dialog accepts only an optional short operational note.

## Verification

- Local Supabase reset applied the new migration successfully.
- Rollback-only SQL probe passed for allowed transitions, denied terminal repeats, permission denial, direct browser write denial, audit safety, and transaction rollback.
- In-app browser verification confirmed both dialogs are clear, terminal, and disabled in mock preview mode.

## Final Checks

| Command | Result |
| --- | --- |
| `corepack pnpm exec supabase db reset` | Pass |
| `corepack pnpm typecheck` | Pass |
| `corepack pnpm lint` | Pass |
| `corepack pnpm test` | Pass: 206 tests |
| `corepack pnpm build` | Pass |
| `corepack pnpm build-storybook` | Pass |
| `corepack pnpm test:e2e` | Pass: 19 tests |

## Warnings

- Supabase CLI reported a newer version is available.
- Storybook retained its existing plugin timing and large chunk notices.
- The first Playwright run encountered a transient Next.js dev-router 404 state. A clean restart passed all 19 tests.

## Safety Confirmation

- No payment, package, clinical note, WhatsApp, AI, worker, or production-service features were added.
- No cloud Supabase project was linked or pushed.
- No service-role browser client, production credential, secret, or production data was added.
- Direct browser table writes and direct browser audit insertion remain blocked.

## Stop Point

Phase 4O stops here before any additional appointment or operational workflow phase.
