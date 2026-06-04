# Phase 5G.1 Assign Package Local E2E Verification Log

## Scope

Verified the local-only logged-in `studio_director` assign package UI flow end to
end through the existing server action and `public.assign_client_package(...)` RPC,
in Supabase auth/data mode. No product-code fix was required.

This phase did not add package deduction, payment, finance, package reversal,
package cancellation, package extension, clinical notes, WhatsApp, AI, or any
production service.

## Files Changed

- Added `apps/web/tests/e2e/local-supabase-assign-package.spec.ts` — a guarded
  local-Supabase Playwright spec that is skipped unless
  `HOM_E2E_LOCAL_SUPABASE=1`, mirroring the existing appointment MVP guard.
- Added `docs/PHASE_5G_1_ASSIGN_PACKAGE_E2E_LOG.md`.

No product code was changed. The existing flow passed as-is.

## E2E Verification

Run mode: `corepack pnpm exec supabase db reset`, then a local dev server with
`HOM_AUTH_MODE=supabase` and `HOM_DATA_MODE=supabase`, then the guarded spec with
`HOM_E2E_LOCAL_SUPABASE=1` and the local-only fixture credentials. The flow uses
local dummy data only and does not link or push to any cloud Supabase project.

- Reset local Supabase successfully; all package migrations and dummy seed applied.
- Confirmed unauthenticated `/client-packages` redirects to `/login`.
- Logged in with the local-only mapped `studio_director` fixture
  (`local.studio.director@example.invalid`).
- Confirmed `/api/me` returns the active mapped `Local Studio Director` with the
  `studio_director` role and the `can_manage_client_packages` permission, with
  `authMode = supabase`.
- Confirmed `/client-packages` renders real local seeded rows (e.g. `Mock Client
  001`) and contains no mock-mode data (`Mock Client Alpha` absent).
- Confirmed the `Assign Package` button is enabled and the sheet opens.
- Confirmed Supabase data mode does not show the mock preview-disabled banner.
- Selected an eligible active client (`Mock Client 028`) and an active package
  (`Mock Long Validity Pack`, 6 sessions, 90-day validity), and chose a
  `purchased_at` date/time.
- Confirmed the preview shows total sessions `6`, starting remaining `6`, and the
  calculated expiry `2036-10-13`.
- Submitted successfully; the success state appeared, the sheet closed, the list
  refreshed, and the new client package row (`Mock Client 028` / `Mock Long
  Validity Pack` / `6 / 6`) appeared.
- Verified the database directly via local container `psql`:
  - `client_packages`: one new row with copied `total_sessions = 6`,
    `remaining_sessions = 6`, `status = active`, and `expires_at = purchased_at +
    90 days`.
  - `package_usage_history`: one `assigned` row, quantity `6`, before `0`, after
    `6`, actor = the local studio director `app_users` id.
  - `audit_logs`: one `client_package.assigned` row, `target_type =
    client_package`, `risk_level = high`, metadata containing only safe ids and
    `totalSessions`/`remainingSessions`. No `payment`, `contact`, `clinical`, or
    `whatsapp` metadata keys are present.
- Confirmed the sheet exposes no payment, contact, clinical, or WhatsApp fields.

## Negative Cases

- Re-ran the Phase 5F rollback SQL probe
  (`supabase/tests/phase_5f_assign_client_package_rpc.sql`) against the freshly
  reset database; it passed and covers:
  - inactive package assignment denied (`PACKAGE_UNAVAILABLE`),
  - archived package assignment denied (`PACKAGE_UNAVAILABLE`),
  - archived client assignment denied (`CLIENT_UNAVAILABLE`),
  - user without `can_manage_client_packages` denied (`PERMISSION_DENIED`),
  - direct authenticated insert/update/delete on `client_packages` denied,
  - direct authenticated insert/update/delete on `package_usage_history` denied,
  - direct authenticated insert into `audit_logs` denied,
  - transaction rollback when the audit insert fails.
- Confirmed mock mode does not fake a successful assignment: the existing
  `app-shell.spec.ts` preview-safe assign sheet test keeps the submit button
  disabled and shows the "Preview mode: saving is disabled" banner, and the server
  adapter returns a `configuration_error` outside Supabase auth/data mode.

## Final Checks

| Command | Result |
| --- | --- |
| `corepack pnpm exec supabase db reset` | Pass |
| Guarded local-Supabase assign package Playwright spec | Pass (1 test) |
| Assign package row verification via local DB `psql` | Pass |
| `phase_5f_assign_client_package_rpc.sql` rollback probe | Pass |
| `corepack pnpm typecheck` | Pass |
| `corepack pnpm lint` | Pass |
| `corepack pnpm test` | Pass (93 domain, 157 web) |
| `corepack pnpm build` | Pass |
| `corepack pnpm build-storybook` | Pass |
| `corepack pnpm test:e2e` | Pass (24 passed, 2 guarded local-Supabase specs skipped) |

Warnings: Supabase CLI reported that v2.104.0 is available; Storybook reported the
existing large bundle-size warning; Playwright reported the existing Node
`NO_COLOR`/`FORCE_COLOR` warnings. The local dummy assignment created during
verification was cleared by restoring the clean seed baseline with
`corepack pnpm exec supabase db reset`.

## Safety Confirmation

No package deduction, payment, finance ledger, package reversal, package
cancellation, package extension, clinical notes, WhatsApp, AI, production services,
service-role browser client, cloud Supabase link/push, secrets, or production data
were added. Direct browser writes remain blocked for `client_packages`,
`package_usage_history`, and `audit_logs`, including direct browser audit inserts.
The intentional assignment used dummy local-only data.

## Stop Point

Phase 5G.1 stops after end-to-end verification of the existing local assign package
slice. Package deduction, package lifecycle mutations, and payment/finance work
remain deferred until the owner approves the exact deduction rules.
