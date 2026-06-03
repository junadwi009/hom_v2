# Phase 4M Cancel Appointment Log

## Scope

Implemented cancel appointment only: required operational reason, server-only submission, atomic RPC update, status history, audit row, cancellable-row UI action, and a visible modified-schedule marker.

## Files Changed

- Added `supabase/migrations/20260602000200_cancel_appointment_rpc.sql`.
- Added `supabase/tests/phase_4m_cancel_appointment_rpc.sql`.
- Added server-only cancel adapter and submission files under `apps/web/src/lib/appointments/server`.
- Added cancel action, dialog, types, and Storybook stories under `apps/web/src/features/appointments`.
- Updated appointment table mapping, UI, domain reason validation, and focused tests.

## Cancel Behavior

- `public.cancel_appointment(...)` requires an authenticated active `app_users` actor with `can_manage_appointments`.
- Only `scheduled` and `confirmed` appointments can be cancelled.
- Cancellation reason is required and limited to `280` characters.
- The RPC atomically updates the appointment, inserts `appointment_status_history`, and inserts `appointment.cancelled` into `audit_logs`.
- Audit metadata contains safe operational context only: `previousStatus`. It does not include the cancellation reason or sensitive data.
- Direct browser writes remain blocked.

## UI Behavior

- Only cancellable appointment rows show `Cancel`.
- The confirmation dialog requires a reason and exposes no contact, clinical, payment, package, or WhatsApp fields.
- Mock mode opens a preview-safe dialog but cannot fake persistence.
- Rows changed after creation receive an amber highlight and a visible `Modified` label.

## Verification

- Rollback-only SQL probes passed for authenticated execute grant, anon denial, scheduled cancellation, stored reason, history insert, audit insert, terminal-state denial, invalid-reason denial, permission denial, direct-write denial, and rollback on audit failure.
- Local Studio Director browser cancellation passed for a dummy appointment.
- Browser verification confirmed the cancelled row refreshes with the `Modified` highlight.
- No cloud Supabase project link exists.

## Final Checks

| Command | Result |
| --- | --- |
| `corepack pnpm exec supabase db reset` | Applied migrations and seed; local Storage restart health warning noted |
| `corepack pnpm typecheck` | Pass |
| `corepack pnpm lint` | Pass |
| `corepack pnpm test` | Pass (`176` tests) |
| `corepack pnpm build` | Pass |
| `corepack pnpm build-storybook` | Pass |
| `corepack pnpm test:e2e` | Pass (`16` tests) |

## Warnings

- Local Supabase CLI reported a Storage container health timeout after reset restart. Storage settled healthy and the reset baseline, RPC, and rollback-only probes were verified.
- Storybook retains existing plugin-timing and large-chunk warnings.
- Git reports existing Windows LF-to-CRLF working-copy notices.

## Safety Confirmation

No reschedule, complete, no-show, payment, package, clinical-note, WhatsApp, AI, worker, production-auth, cloud-Supabase, service-role browser client, production service, secret, or production data was added. Direct browser table writes and direct browser audit inserts remain blocked.

## Stop Point

Phase 4M stops after the local cancel appointment slice and modified-schedule visual marker.
