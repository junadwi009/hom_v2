# Phase 6D Payment Read-only UI Log

## Scope

Added a read-only payments UI backed by the payment domain and local DB
foundation: Supabase read-only repositories, a `/payments` page, a navigation
item, and safe table rendering. No payment write, create payment, mark paid,
cancel, refund, payment gateway, settlement, invoice PDF, finance ledger,
commission, package payment gating, clinical, WhatsApp, AI, or production service
was added.

## Files Changed

New:

- `apps/web/src/lib/payments/errors.ts`
- `apps/web/src/lib/payments/index.ts`
- `apps/web/src/lib/payments/repository-factory.ts`
- `apps/web/src/lib/payments/supabase/types.ts`
- `apps/web/src/lib/payments/supabase/payment-row-mapper.ts`
- `apps/web/src/lib/payments/supabase/payment-repository.ts`
- `apps/web/src/lib/payments/supabase/payment-status-history-row-mapper.ts`
- `apps/web/src/lib/payments/supabase/payment-status-history-repository.ts`
- `apps/web/src/features/payments/payments-page-state.ts`
- `apps/web/src/features/payments/payments-page-loader.ts`
- `apps/web/src/features/payments/payments-table.tsx`
- `apps/web/src/features/payments/payments-page.tsx`
- `apps/web/src/features/payments/payments-page.stories.tsx`
- `apps/web/src/app/payments/page.tsx`
- `apps/web/src/app/payments/loading.tsx`
- `apps/web/tests/unit/payments/repositories-and-loaders.test.ts`
- `docs/PHASE_6D_PAYMENT_READONLY_UI_LOG.md`

Modified:

- `apps/web/src/lib/routes.ts` (added the Payments navigation item)
- `packages/domain/package.json` (added the `./payments` export subpath)
- `apps/web/tests/e2e/app-shell.spec.ts` (payments route and table coverage)

## Repository Behavior

- Added Supabase read-only repositories for `payments` and
  `payment_status_history`.
- `HOM_DATA_MODE=mock` uses the Phase 6B mock payment repositories;
  `HOM_DATA_MODE=supabase` uses the existing anon/session-based Supabase server
  client and does not bypass RLS; the default remains mock.
- Repositories expose only `list` and `getById`. No create, update, delete,
  markPaid, cancel, or refund methods were added.
- The payment list query resolves `clientName` via `clients(full_name)` and the
  optional `packageName` via `client_packages(packages(name))`, orders by
  `created_at` descending, and supports status/method/client/clientPackage
  filters plus a safe method/reference search.
- Repository errors are converted to safe `PaymentRepositoryError` instances that
  never surface raw database details.

## UI Fields

- `/payments` renders client name, package name (when linked), amount (`amountIdr`
  formatted as `Rp ...`, no cents naming), payment method, status badge, paid
  date, reference number, and updated date.
- Missing optional values (package, paid date, reference) render a neutral `—`
  placeholder.
- The page exposes loading, ready, empty, permission-denied, configuration-error,
  and generic-error states.
- No card details, bank account numbers, gateway tokens, payment secrets, contact
  data, clinical data, WhatsApp data, notes, or any create/edit/mark-paid/cancel/
  refund controls are rendered.

## Tests

- Unit tests cover the payment and status-history row mappers, the
  linked/unlinked package name and optional-field handling, `amountIdr` naming
  with no cents, repository factory mock/supabase selection, Supabase list and
  `getById` query construction with safe columns only, safe error conversion,
  loader ready/empty/permission-denied/configuration-error states, `amountIdr`
  formatting, and the absence of sensitive fields.
- Storybook stories cover ready, empty, permission denied, configuration error,
  and generic error states.
- Playwright (mock) verifies `/payments` renders, the Payments navigation link is
  present, payment rows render, the amount formats correctly, and there are no
  create/edit/delete/mark-paid/cancel/refund controls and no card/bank/gateway/
  cvv/contact/clinical/WhatsApp columns.

## Final Checks

| Command | Result |
| --- | --- |
| `corepack pnpm typecheck` | Pass |
| `corepack pnpm lint` | Pass |
| `corepack pnpm test` | Pass (109 domain, 187 web) |
| `corepack pnpm build` | Pass |
| `corepack pnpm build-storybook` | Pass |
| `corepack pnpm test:e2e` | Pass (28 passed, 3 guarded local-Supabase specs skipped) |

Warnings: Storybook reported the existing large bundle-size warning; Playwright
reported the existing Node `NO_COLOR`/`FORCE_COLOR` warnings. The `@hom/domain`
package required a new `./payments` export subpath for the web app to import the
payment domain; a stale `apps/web/.next` dev artifact was cleaned before
typecheck.

## Safety Confirmation

No payment writes, create payment, mark paid, cancel, refund, payment gateway,
automatic settlement, invoice PDF, finance ledger, commission, package payment
gating, clinical notes, WhatsApp, AI, production service, secret, or production
data was added. No route handler or server action was added for payments. Direct
browser writes remain blocked for `payments` and `payment_status_history`. The UI
renders safe operational fields only and no card, bank, gateway, or secret data.

## Stop Point

Phase 6D stops here before any create-payment RPC, payment write, or
status-transition phase.
