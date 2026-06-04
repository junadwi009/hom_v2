# Phase 6F Create Manual Payment UI Log

## Scope

Added the create manual payment UI that records a manual payment through the
existing server-only adapter and `public.create_manual_payment(...)` RPC. Approved
behavior: create only, status `pending` or `paid`, `paidAt` required when paid and
empty when pending, optional link to a client package that must belong to the
selected client, and no card/bank/gateway/secret/contact/clinical/WhatsApp data.
No mark paid, cancel, refund, payment gateway, settlement, invoice PDF, finance
ledger, commission, package payment gating, clinical, WhatsApp, AI, production
service, service-role browser client, or cloud Supabase link/push was added.

## Files Changed

New:

- `apps/web/src/features/payments/create-payment-types.ts`
- `apps/web/src/features/payments/create-payment-options-loader.ts`
- `apps/web/src/features/payments/create-payment-action.ts`
- `apps/web/src/features/payments/create-payment-sheet.tsx`
- `apps/web/src/features/payments/create-payment-sheet.stories.tsx`
- `apps/web/src/lib/payments/server/submit-create-manual-payment.ts`
- `apps/web/tests/unit/payments/create-payment-ui.test.ts`
- `apps/web/tests/e2e/local-supabase-create-payment.spec.ts`
- `docs/PHASE_6F_CREATE_MANUAL_PAYMENT_UI_LOG.md`

Modified:

- `apps/web/src/features/payments/payments-page.tsx`
- `apps/web/src/app/payments/page.tsx`
- `apps/web/src/lib/payments/server/index.ts`
- `apps/web/tests/e2e/app-shell.spec.ts`

No route handler and no service-role browser client were added.

## UI Behavior

- A `Create Payment` button is rendered in the `/payments` page header and is
  disabled for users without `can_manage_payments`.
- The sheet form includes a non-archived client selector, an optional client
  package selector filtered to the selected client only, an amount (IDR) input, a
  payment method selector, a status selector (`pending` or `paid`), a paid
  date/time shown and required only when status is `paid`, an optional reference
  number (max 64), and optional notes (max 280).
- Choosing `paid` reveals a required Asia/Jakarta paid date; choosing `pending`
  hides and clears the paid date so a pending payment never carries one.
- The selectors expose only client and package names; no contact, clinical,
  WhatsApp, card, bank, or gateway fields are present.
- Submission is enabled only in Supabase data mode for a permitted user.

## Server Action Behavior

- Added a server action and `submitCreateManualPaymentFormData` path that requires
  Supabase auth and data mode, validates the form, converts the local paid date to
  a studio-local timestamp (required for paid, omitted for pending), validates the
  whole input through `createManualPaymentInputSchema` (positive amount, paidAt
  rules, safe reference/notes), calls the existing server-only `createManualPayment`
  adapter, revalidates `/payments` on success, and maps RPC errors to safe UI
  states (`validation_error`, `client_unavailable`, `client_package_unavailable`,
  `permission_denied`, `auth_required`, `app_user_required`, `configuration_error`,
  `unknown_error`).
- No route handler or service-role client was added.

## Mock Mode

- Mock mode can open the sheet and preview all fields, but submission is disabled
  and the server path returns a `configuration_error` instead of faking
  persistence.

## Tests

- Unit tests cover non-archived client and client-package option filtering with
  client ids, mock-mode submission blocking, a successful pending submission with
  `paidAt` cleared, a successful paid submission with a converted paid date, paid
  without paid date rejection, non-positive amount rejection, card/bank/gateway
  secret rejection in notes and reference, and the `toCreateManualPaymentInput`
  pending paid-date clearing.
- Storybook stories cover ready, mock preview, validation error, unavailable
  client, unavailable client package, permission denied, configuration error,
  submitting, and success states.
- Playwright (mock) verifies `/payments` renders the Create Payment button, the
  dialog opens and closes, the paid date appears only for paid status and is
  hidden for pending, the submit is disabled in mock mode, and no card/bank/CVV/
  contact/clinical/WhatsApp fields are present.
- A guarded local-Supabase Playwright spec (skipped unless
  `HOM_E2E_LOCAL_SUPABASE=1`) logs in and creates a pending unlinked payment and a
  paid payment linked to the client's own package through the UI.

## Verification

- `corepack pnpm exec supabase db reset` applied cleanly.
- The guarded local-Supabase create payment spec passed in Supabase auth/data mode
  against the local stack.
- Local container `psql` confirmed the UI created:
  - a pending payment with `paid_at` null and no linked package,
  - a paid payment with `paid_at` set and a linked client package,
  - an initial `payment_status_history` row (`from_status` null) for each,
  - a `payment.created` audit row for each with safe metadata (amount, method,
    status, clientPackageId) and no `notes` or `referenceNumber` keys.
  The local demo payments were then cleared by restoring the seed baseline with
  `corepack pnpm exec supabase db reset`.

## Final Checks

| Command | Result |
| --- | --- |
| `corepack pnpm exec supabase db reset` | Pass |
| `corepack pnpm typecheck` | Pass |
| `corepack pnpm lint` | Pass |
| `corepack pnpm test` | Pass (115 domain, 202 web) |
| `corepack pnpm build` | Pass |
| `corepack pnpm build-storybook` | Pass |
| `corepack pnpm test:e2e` | Pass (29 passed, 4 guarded local-Supabase specs skipped) |
| Guarded local-Supabase create payment spec | Pass |
| Created payment verification via local DB `psql` | Pass |

Warnings: Supabase CLI reported that v2.104.0 is available; Storybook reported the
existing large bundle-size warning; Playwright reported the existing Node
`NO_COLOR`/`FORCE_COLOR` warnings. Two initial mock Playwright failures came from
strict-locator ambiguity (the client package combobox shares the "Client"
substring, and the overlay close button sits outside the dialog section); both
were fixed with name-attribute locators and the in-dialog close control. A stale
`apps/web/.next` dev artifact was cleaned before typecheck.

## Safety Confirmation

No mark paid, cancel, refund, payment gateway, automatic settlement, invoice PDF,
finance ledger, commission, package payment gating, clinical notes, WhatsApp, AI,
production service, service-role browser client, cloud Supabase link/push, secret,
or production data was added. No card numbers, bank account numbers, gateway
tokens, or payment secrets are accepted, and notes/reference never enter the audit
metadata. Direct browser writes remain blocked for `payments`,
`payment_status_history`, and `audit_logs`.

## Stop Point

Phase 6F stops here before any mark paid, cancel, or refund status-transition
phase.
