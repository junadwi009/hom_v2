# Phase 4L Create Appointment E2E Log

## Scope

Verified the local-only logged-in `studio_director` create appointment UI flow through the existing server action and `public.create_appointment(...)` RPC. No product-code fix was required.

## Files Changed

- Added `docs/PHASE_4L_CREATE_APPOINTMENT_E2E_LOG.md`.

## E2E Verification

- Reset local Supabase successfully and confirmed no cloud project link exists.
- Confirmed unauthenticated `/appointments` redirects to `/login`.
- Logged in with the local-only mapped `studio_director` fixture.
- Confirmed `/api/me` returns the active mapped user with `can_manage_appointments`.
- Confirmed `/appointments` renders real local seeded rows and enables `New Appointment`.
- Created one safe local dummy appointment for `Mock Client 001`, `Mock Practitioner 001`, and `Mock Service 001 Intro Assessment`.
- Confirmed the sheet closed, the success message appeared, the list refreshed, and the new appointment appeared.
- Confirmed the RPC atomically inserted one scheduled appointment, one initial status-history row, and one `appointment.created` audit row.
- Confirmed audit metadata contains only safe IDs, source, and copied duration. It does not contain the operational summary or sensitive data.

## Negative Cases

- Confirmed a same-slot overlap returns a safe conflict message, keeps the entered values, reveals no conflicting client details, and inserts no row.
- Confirmed mock mode does not fake a successful save.
- Confirmed direct authenticated REST insert, update, and delete requests for `appointments` return `403`.
- Confirmed direct authenticated REST insert into `audit_logs` returns `403`.

## Final Checks

| Command | Result |
| --- | --- |
| `corepack pnpm exec supabase db reset` | Pass |
| `corepack pnpm typecheck` | Pass |
| `corepack pnpm lint` | Pass |
| `corepack pnpm test` | Pass (`164` tests) |
| `corepack pnpm build` | Pass |
| `corepack pnpm build-storybook` | Pass |
| `corepack pnpm test:e2e` | Pass (`15` tests) |

## Safety Confirmation

- No reschedule, cancel, complete, no-show, payment, package, clinical-note, WhatsApp, AI, worker, production-auth, cloud-Supabase, service-role browser client, or role-management feature was added.
- Direct browser writes remain blocked, including direct browser audit inserts.
- The intentional created appointment uses dummy local-only data. No production data or secrets were added.

## Stop Point

Phase 4L stops after end-to-end verification of the existing local create appointment slice.
