# Phase 6B Payment Domain Log

## Scope

Added the manual payment domain foundation only: schemas, TypeScript types,
read-only repository interfaces, safe mock repositories, exports, and unit tests.
No database migration, payment UI, payment write, payment gateway, finance ledger,
commission, invoice PDF, package payment gating, clinical, WhatsApp, AI, or
production service was added.

## Files Changed

- `packages/domain/src/payments/schemas.ts`
- `packages/domain/src/payments/types.ts`
- `packages/domain/src/payments/repository.ts`
- `packages/domain/src/payments/mock-repository.ts`
- `packages/domain/src/payments/index.ts`
- `packages/domain/src/index.ts`
- `packages/domain/tests/payments.test.ts`
- `docs/PHASE_6B_PAYMENT_DOMAIN_LOG.md`

## Schemas Added

- `paymentStatusSchema` — `pending`, `paid`, `failed`, `refunded`, `cancelled`.
- `paymentMethodSchema` — `cash`, `bank_transfer`, `card`, `e_wallet`, `other`.
- `paymentSchema` — read model with `id`, `clientId`, `clientName`,
  `clientPackageId?`, `packageName?`, `amountIdr`, `paymentMethod`, `status`,
  `paidAt?`, `referenceNumber?`, `notes?`, `createdByAppUserId?`,
  `updatedByAppUserId?`, `createdAt`, `updatedAt`. Strict object.
- `paymentListQuerySchema` and `paymentListResultSchema`.
- `paymentStatusHistorySchema` — read model with `id`, `paymentId`, `fromStatus?`,
  `toStatus`, `reason?`, `actorAppUserId?`, `metadata`, `createdAt`. Strict
  object.
- `paymentStatusHistoryListQuerySchema` and
  `paymentStatusHistoryListResultSchema`.

Validation rules:

- `amountIdr` is a positive integer (`> 0`); no cents naming (`amountIdr`, not
  cents).
- `notes` and status-history `reason` are safe operational text capped at 280
  characters.
- `referenceNumber` is safe operational text capped at 64 characters.
- `notes`, `reason`, and `referenceNumber` reject card numbers, bank account
  numbers, gateway tokens (`sk_`/`pk_`/`sk-`/`ghp_`/`whsec_`), API keys/secrets,
  contact data (email and international phone), clinical content, WhatsApp
  content, and explicit secret terms (`cvv`, `card number`, `account number`,
  `routing`). Ordinary words such as "cash" or "bank transfer" remain allowed.
- All objects are strict, so unknown keys (for example a stray `cardNumber`) are
  rejected.

## Repository Behavior

- Added read-only `PaymentRepository` and `PaymentStatusHistoryRepository`, each
  exposing only `list` and `getById`.
- Added safe mock repositories `createMockPaymentRepository` and
  `createMockPaymentStatusHistoryRepository` that parse, filter, and paginate
  through the shared catalog mock utilities.
- Mock payment filtering supports `status`, `paymentMethod`, `clientId`,
  `clientPackageId`, and search; mock status-history filtering supports
  `paymentId`, `toStatus`, and search.
- Mock data uses `Mock` client and package names only and contains no real
  clients, card numbers, bank account numbers, gateway tokens, payment secrets,
  clinical, WhatsApp, or production data.
- No create, update, delete, markPaid, cancel, or refund methods were added.

## Tests

Added unit tests for the approved payment statuses and methods, positive
`amountIdr` validation, no-cents naming, notes length limits, reference-number
safety, rejection of card numbers, bank account numbers, gateway tokens, API
keys/secrets, contact, clinical, and WhatsApp content, strict unknown-key
rejection, status-history validation, mock repository list/filter/getById
behavior, and the read-only `list`/`getById` method shape.

## Final Checks

| Command | Result |
| --- | --- |
| `corepack pnpm typecheck` | Pass |
| `corepack pnpm lint` | Pass |
| `corepack pnpm test` | Pass (109 domain, 173 web) |
| `corepack pnpm build` | Pass |
| `corepack pnpm build-storybook` | Pass |
| `corepack pnpm test:e2e` | Pass (26 passed, 3 guarded local-Supabase specs skipped) |

Warnings: Storybook reported the existing large bundle-size warning; Playwright
reported the existing Node `NO_COLOR`/`FORCE_COLOR` warnings. A stale
`apps/web/.next` dev artifact was cleaned before typecheck.

## Safety Confirmation

No database migration, payment UI, payment write, payment gateway, automatic
settlement, invoice PDF, finance ledger, commission, package payment gating,
clinical notes, WhatsApp, AI, production service, secret, or production data was
added. No card numbers, bank account numbers, gateway tokens, or payment secrets
are stored in schemas or mock data.

## Stop Point

Phase 6B stops here before any payment database, seed, read-only UI, write RPC, or
status-transition phase.
