# Phase 4I Create Appointment UI Log

## Scope

Added the create-only appointment sheet UI, safe selector loaders, and one narrow server action that delegates to the approved create RPC adapter.

## Files Changed

- `apps/web/src/app/appointments/page.tsx`
- `apps/web/src/features/appointments/appointments-catalog-page.tsx`
- `apps/web/src/features/appointments/appointments-catalog-page.stories.tsx`
- `apps/web/src/features/appointments/create-appointment-action.ts`
- `apps/web/src/features/appointments/create-appointment-options-loader.ts`
- `apps/web/src/features/appointments/create-appointment-sheet.tsx`
- `apps/web/src/features/appointments/create-appointment-sheet.stories.tsx`
- `apps/web/src/features/appointments/create-appointment-time.ts`
- `apps/web/src/features/appointments/create-appointment-types.ts`
- `apps/web/src/lib/appointments/server/index.ts`
- `apps/web/src/lib/appointments/server/submit-create-appointment.ts`
- `apps/web/tests/e2e/app-shell.spec.ts`
- `apps/web/tests/unit/appointments/create-appointment-options-loader.test.ts`
- `apps/web/tests/unit/appointments/submit-create-appointment.test.ts`

## UI Behavior

- `/appointments` has a `New Appointment` header action and right-side sheet.
- The form uses safe client, active practitioner, and active service options only.
- Staff source is fixed to `admin`; Asia/Jakarta future time is required.
- Service duration is copied into a read-only field.
- Operational summary is optional, non-clinical, and limited to 280 characters.
- Mock mode allows preview but disables submit and never reports fake success.

## Server Action Behavior

- One create-only server action validates whitelisted form fields and calls `createScheduledAppointment(...)` only in Supabase data mode.
- Safe result states cover success, overlap, unavailable records, auth, app profile, permission, configuration, validation, and unknown failures.
- Raw database details and sensitive fields are never returned.

## Tests

- Added option filtering, Jakarta time, future-only, fixed-source, summary limit, sensitive-field exclusion, mock refusal, safe-result, Storybook, and Playwright coverage.
- Visual verification confirmed copied duration, disabled mock submit, close behavior, and no browser console errors.

## Final Checks

| Command | Result |
| --- | --- |
| `corepack pnpm typecheck` | Pass |
| `corepack pnpm lint` | Pass |
| `corepack pnpm test` | Pass |
| `corepack pnpm build` | Pass |
| `corepack pnpm build-storybook` | Pass |
| `corepack pnpm test:e2e` | Pass (`15/15`) |

## Safety Confirmation

No reschedule, cancel, complete, no-show, appointment route handler, appointment API route, service-role client, real auth, payment, package, clinical-note, WhatsApp, AI, worker, production-service, secret, or production-data work was added.

## Stop Point

Phase 4I stops after the create-only appointment UI slice.
