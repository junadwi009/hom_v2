# Phase 4H Create Appointment RPC Log

## Scope

Implemented the local-first `public.create_appointment(...)` RPC and a server-only TypeScript adapter for create-appointment flows only.

## Files Changed

- `supabase/migrations/20260601000200_create_appointment_rpc.sql`
- `supabase/tests/phase_4h_create_appointment_rpc.sql`
- `packages/domain/src/appointments/schemas.ts`
- `packages/domain/src/appointments/types.ts`
- `packages/domain/src/appointments/index.ts`
- `packages/domain/src/appointments/write-contracts.ts`
- `packages/domain/tests/appointments.test.ts`
- `apps/web/src/lib/appointments/server/create-appointment.ts`
- `apps/web/src/lib/appointments/server/index.ts`
- `apps/web/src/lib/audit/server/audit-writer.ts`
- `apps/web/tests/unit/appointments/create-appointment.test.ts`

## RPC Behavior

- `public.create_appointment(...)` is executable by `authenticated` only.
- The RPC requires a mapped active `app_users` actor with `can_manage_appointments`.
- It accepts a valid non-archived client, active practitioner, active service, start time, source, and optional operational summary.
- It always creates `scheduled` appointments and copies `duration_minutes` from the service.
- The returned read model contains approved appointment fields only.

## Overlap Protection

- A partial GiST exclusion constraint blocks overlapping `scheduled` and `confirmed` appointments for the same practitioner.
- The RPC also performs a readable overlap pre-check.
- `[)` ranges allow adjacent appointments when one ends exactly as the next begins.

## Audit Atomicity

- The RPC inserts the appointment, initial `appointment_status_history`, and `appointment.created` audit row in one transaction.
- The server-only adapter validates its safe audit metadata preview before calling the RPC.
- Direct authenticated writes to `appointments`, `appointment_status_history`, and `audit_logs` remain blocked.

## Verification

- `corepack pnpm exec supabase db reset` passed.
- Rollback-only SQL probes passed for permission checks, inactive or archived catalog checks, duration copy, overlap denial, adjacent acceptance, history insert, audit insert, rollback on audit failure, and denied direct insert/update/delete.
- Post-probe baseline remained `25` appointments and `25` history rows with no temporary users.
- `supabase/.temp/project-ref` is absent.

## Final Checks

| Command | Result |
| --- | --- |
| `corepack pnpm typecheck` | Pass |
| `corepack pnpm lint` | Pass |
| `corepack pnpm test` | Pass |
| `corepack pnpm build` | Pass |
| `corepack pnpm build-storybook` | Pass |
| `corepack pnpm test:e2e` | Pass (`14/14`) |

## Safety Confirmation

No appointment UI, reschedule, cancel, complete, no-show flow, route handler, server action, service-role client, real Supabase Auth, production service, secret, or production data was added.

## Stop Point

Phase 4H stops after the create-appointment RPC foundation. No appointment write UI or additional mutation flow is implemented.
