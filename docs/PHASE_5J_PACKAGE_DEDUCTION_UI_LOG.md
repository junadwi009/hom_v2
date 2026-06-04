# Phase 5J Package Deduction UI Log

## Scope

Added the package session deduction UI that deducts exactly one session from an
eligible active client package for an already-completed appointment, through the
existing server-only adapter and `public.deduct_client_package_session(...)` RPC.
Approved trigger is Option C (manual/hybrid): completion stays a separate step,
the operator explicitly selects one eligible package, and one appointment may
deduct only once. No auto-deduction inside complete appointment, no no-show or
cancelled deduction, and no automatic package selection were added.

## Files Changed

New:

- `apps/web/src/features/appointments/deduct-session-types.ts`
- `apps/web/src/features/appointments/deduct-session-options-loader.ts`
- `apps/web/src/features/appointments/deduct-session-action.ts`
- `apps/web/src/features/appointments/deduct-session-dialog.tsx`
- `apps/web/src/features/appointments/deduct-session-dialog.stories.tsx`
- `apps/web/src/lib/packages/server/submit-deduct-session.ts`
- `apps/web/tests/unit/packages/deduct-session-ui.test.ts`
- `apps/web/tests/e2e/local-supabase-deduct-session.spec.ts`
- `docs/PHASE_5J_PACKAGE_DEDUCTION_UI_LOG.md`

Modified:

- `apps/web/src/features/appointments/appointments-table.tsx`
- `apps/web/src/features/appointments/appointments-catalog-page.tsx`
- `apps/web/src/features/appointments/appointments-page-state.ts`
- `apps/web/src/features/appointments/appointments-catalog-page.stories.tsx`
- `apps/web/src/app/appointments/page.tsx`
- `apps/web/src/lib/packages/server/index.ts`
- `packages/domain/src/appointments/mock-repository.ts`
- `apps/web/tests/unit/appointments/appointments-page-loader.test.ts`
- `apps/web/tests/e2e/app-shell.spec.ts`

No route handler and no service-role browser client were added.

## UI Behavior

- A `Deduct Session` control renders only on `completed` appointment rows.
- Scheduled, confirmed, cancelled, and no-show rows do not show any active
  deduction control; cancelled and no-show keep the existing `Not available`
  text, and scheduled/confirmed keep their existing actions.
- When the appointment already has a deducted usage row, the control is disabled
  and labelled `Session Deducted`, and the dialog explains that only one
  deduction is allowed per appointment.
- The dialog shows an eligible-package selector, and a safe preview of the
  selected package name, remaining sessions before, remaining sessions after
  (before minus one, never below zero), and the expiry date.
- The dialog renders no payment, contact, clinical, WhatsApp, or package-secret
  fields.

## Server Action Behavior

- Added a narrow server action and `submitDeductSessionFormData` path that
  validates `appointmentId` and `clientPackageId`, requires Supabase auth and
  data mode, calls the existing server-only `deductClientPackageSession` adapter,
  revalidates `/appointments` on success, and maps RPC errors to safe UI states
  (`already_deducted`, `package_unavailable`, `appointment_not_completed`,
  `permission_denied`, `auth_required`, `app_user_required`, `validation_error`,
  `configuration_error`, `unknown_error`).
- No route handler or service-role client was added.

## Options Loading

- Eligible packages are loaded per completed appointment from the appointment
  client's packages, keeping only `active`, non-expired packages with
  `remaining_sessions > 0` that belong to the appointment client.
- The loader also detects whether the appointment already has a `deducted` usage
  row to drive the already-deducted state.
- Loading runs through the existing anon/session Supabase repositories in
  Supabase mode and the mock repositories in mock mode; it does not bypass RLS
  and adds no service-role client.

## Mock Mode

- Mock mode can open the dialog and preview eligible packages and before/after
  values, but submission is disabled and the server path returns a
  `configuration_error` instead of faking persistence.

## Tests

- Unit tests cover eligible-package filtering (client match, active, non-expired,
  in-credit), already-deducted detection, the before/after preview helper, safe
  result mapping, mock-mode submission blocking, RPC error mapping, and the
  absence of sensitive fields in the package option shape.
- Storybook stories cover ready, mock preview, no eligible package, already
  deducted, package unavailable, appointment not completed, permission denied,
  configuration error, submitting, and success states.
- Playwright (mock) verifies a deduct control appears on completed rows only, the
  dialog opens with the preview, the submit is disabled in mock mode, and no
  payment/contact/clinical/WhatsApp fields are present.
- A guarded local-Supabase Playwright spec (skipped unless
  `HOM_E2E_LOCAL_SUPABASE=1`) logs in, creates and completes an appointment for a
  client with an eligible package, deducts one session through the UI, and
  confirms the control then becomes disabled (duplicate prevented).

## Verification

- `corepack pnpm exec supabase db reset` applied cleanly.
- The guarded local-Supabase deduct session spec passed in Supabase auth/data
  mode against the local stack.
- Local container `psql` confirmed the UI deduction created exactly one
  `package_usage_history` `deducted` row (`quantity 1`, before `2`, after `1`),
  decremented the client package `remaining_sessions` from `2` to `1` with status
  still `active`, and inserted one `package_usage.recorded` audit row with safe
  metadata (`beforeRemaining 2`, `afterRemaining 1`, `quantity 1`, no payment or
  clinical keys). The deducted-row count was exactly one, confirming the
  duplicate guard. The local demo data was then cleared by restoring the seed
  baseline with `corepack pnpm exec supabase db reset`.

## Final Checks

| Command | Result |
| --- | --- |
| `corepack pnpm typecheck` | Pass |
| `corepack pnpm lint` | Pass |
| `corepack pnpm test` | Pass (93 domain, 173 web) |
| `corepack pnpm build` | Pass |
| `corepack pnpm build-storybook` | Pass |
| `corepack pnpm test:e2e` | Pass (26 passed, 3 guarded local-Supabase specs skipped) |
| Guarded local-Supabase deduct session spec | Pass |
| Deduction row verification via local DB `psql` | Pass |

Warnings: Supabase CLI reported that v2.104.0 is available; Storybook reported the
existing large bundle-size warning; Playwright reported the existing Node
`NO_COLOR`/`FORCE_COLOR` warnings. An initial mock Playwright run failed on a
strict-locator match (the close button shares the substring "deduct session" with
the submit button) and was fixed with an exact-name match; a stale `apps/web/.next`
dev artifact also required a clean rebuild before typecheck passed.

## Safety Confirmation

No auto-deduction inside complete appointment, payment, finance ledger, package
reversal, package cancellation, package extension, clinical notes, WhatsApp, AI,
production services, service-role browser client, cloud Supabase link/push,
secrets, or production data were added. Direct browser writes remain blocked for
`client_packages`, `package_usage_history`, and `audit_logs`. The mock completed
appointment fixture was repointed to an existing dummy client so the local
preview has eligible dummy packages; no real or sensitive data was introduced.

## Stop Point

Phase 5J stops after the package deduction UI. Package reversal, payment, finance,
and any production integration remain deferred until the owner approves the next
slice.
