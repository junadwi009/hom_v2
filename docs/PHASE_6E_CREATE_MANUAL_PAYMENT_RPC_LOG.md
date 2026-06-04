# Phase 6E Create Manual Payment RPC Log

## Scope

Implemented manual payment creation through a server-only, audited, atomic flow:
a create payment input schema, a narrow `public.create_manual_payment(...)`
Postgres RPC, and a server-only TypeScript adapter. No create payment UI, mark
paid, cancel, refund, payment gateway, settlement, invoice PDF, finance ledger,
commission, package payment gating, clinical, WhatsApp, AI, production service,
service-role browser client, or cloud Supabase link/push was added.

## Files Changed

- `packages/domain/src/payments/schemas.ts`
- `packages/domain/src/payments/types.ts`
- `packages/domain/src/payments/index.ts`
- `packages/domain/tests/payments.test.ts`
- `apps/web/src/lib/payments/server/create-manual-payment.ts`
- `apps/web/src/lib/payments/server/index.ts`
- `apps/web/tests/unit/payments/create-manual-payment.test.ts`
- `supabase/migrations/20260603000500_create_manual_payment_rpc.sql`
- `supabase/tests/phase_6e_create_manual_payment_rpc.sql`
- `docs/PHASE_6E_CREATE_MANUAL_PAYMENT_RPC_LOG.md`

## Domain Schema

Added `createPaymentStatusSchema` (`pending` or `paid` only) and
`createManualPaymentInputSchema` with `clientId`, optional `clientPackageId`,
positive `amountIdr`, `paymentMethod`, create `status`, optional `paidAt`, and the
existing safe `referenceNumber`/`notes`. The schema requires `paidAt` when status
is `paid`, forbids `paidAt` when status is `pending`, rejects sensitive
card/bank/gateway/secret text, and rejects unknown keys.

## RPC Behavior

Added `public.create_manual_payment(p_client_id, p_client_package_id,
p_amount_idr, p_payment_method, p_status, p_paid_at, p_reference_number,
p_notes)` as a `security definer` function with `search_path = public, private`.

The RPC, in order:

- requires `auth.uid()` (`AUTH_REQUIRED`),
- resolves the active mapped `app_users` actor (`APP_USER_REQUIRED`),
- requires `can_manage_payments` (`PERMISSION_DENIED`),
- validates `amount_idr > 0` (`AMOUNT_INVALID`), an allowed `payment_method`
  (`PAYMENT_METHOD_INVALID`), and a create status of `pending` or `paid`
  (`PAYMENT_STATUS_INVALID`),
- requires `paid_at` when status is `paid` (`PAYMENT_PAID_AT_REQUIRED`) and null
  `paid_at` when status is `pending` (`PAYMENT_PAID_AT_NOT_ALLOWED`),
- validates the client exists and is not archived (`CLIENT_UNAVAILABLE`),
- when `client_package_id` is provided, validates it exists and belongs to the
  same client (`CLIENT_PACKAGE_UNAVAILABLE`),
- inserts the `payments` row (trimming blank reference/notes to null, actor as
  created/updated by),
- inserts the initial `payment_status_history` row (`from_status` null,
  `to_status` = status),
- inserts the atomic `payment.created` audit row,
- returns a safe payment read model with resolved client and package names.

All writes commit atomically or roll back together. Execute is granted to
`authenticated` only; `public`/`anon` are revoked. No direct browser
insert/update/delete policies were added for `payments`,
`payment_status_history`, or `audit_logs`. No gateway, card, or bank secret data
is accepted or stored.

## Server Adapter Behavior

Added a server-only adapter `createManualPayment(...)` that validates input with
`createManualPaymentInputSchema`, runs the existing server audit guard over the
safe metadata, calls `create_manual_payment` through the existing Supabase server
client (passing null for absent optional fields), maps known database error
messages to a safe `CreateManualPaymentRpcError` code, and parses the RPC row into
the shared `paymentSchema`. Unknown failures fall back to
`CREATE_MANUAL_PAYMENT_FAILED`, and raw database details are never surfaced. No
service-role client and no UI/server action were added.

## Audit Behavior

The audit row uses action `payment.created`, `target_type = payment`, `target_id`
= the new payment id, and `risk_level = high`. Metadata includes `paymentId`,
`clientId`, `clientPackageId`, `amountIdr`, `paymentMethod`, and `status`. It
contains no notes text, reference number, card details, bank account numbers,
gateway tokens, contact data, clinical data, WhatsApp content, secrets, or raw
database error content. Direct browser audit inserts remain blocked.

## Verification

- `corepack pnpm exec supabase db reset` applied the new migration cleanly.
- The rollback SQL probe
  `supabase/tests/phase_6e_create_manual_payment_rpc.sql` passed and verified:
  - authenticated can execute the RPC; anon cannot,
  - a pending payment inserts with `paid_at` null and no linked package,
  - a paid payment inserts with `paid_at` set and a linked client package,
  - each created payment inserts an initial `from_status` null status history row,
  - the `payment.created` audit row holds safe metadata with no notes or
    reference,
  - non-positive amount, invalid create status, paid-without-paid_at,
    pending-with-paid_at, archived client, and mismatched client package are all
    denied,
  - a user without `can_manage_payments` is denied,
  - direct authenticated insert/update/delete on `payments` and
    `payment_status_history`, and direct insert into `audit_logs`, are denied,
  - the transaction rolls back fully when the audit insert fails (no payment and
    no status history row).
- Unit tests cover input validation and RPC parameter mapping, the unlinked
  pending path, paid-without-paidAt rejection, card/bank/gateway secret payload
  rejection before the RPC, safe error mapping without raw details, the
  server-only/no-service-role guarantees, and the migration's blocked-direct-write
  and authenticated-only grant invariants. Domain tests cover the create status
  enum, paidAt rules, positive amount, sensitive-text rejection, and unknown-key
  rejection.

## Final Checks

| Command | Result |
| --- | --- |
| `corepack pnpm exec supabase db reset` | Pass |
| `phase_6e_create_manual_payment_rpc.sql` rollback probe | Pass |
| `corepack pnpm typecheck` | Pass |
| `corepack pnpm lint` | Pass |
| `corepack pnpm test` | Pass (115 domain, 194 web) |
| `corepack pnpm build` | Pass |
| `corepack pnpm build-storybook` | Pass |
| `corepack pnpm test:e2e` | Pass (28 passed, 3 guarded local-Supabase specs skipped) |

Warnings: Supabase CLI reported that v2.104.0 is available; Storybook reported the
existing large bundle-size warning; Playwright reported the existing Node
`NO_COLOR`/`FORCE_COLOR` warnings. An initial typecheck failure came from
nullable-field inference in the new adapter test fixture and was fixed with
explicit nullable types; a stale `apps/web/.next` dev artifact was cleaned before
typecheck.

## Safety Confirmation

No create payment UI, mark paid, cancel, refund, payment gateway, automatic
settlement, invoice PDF, finance ledger, commission, package payment gating,
clinical notes, WhatsApp, AI, production service, service-role browser client,
cloud Supabase link/push, secret, or production data was added. No card numbers,
bank account numbers, gateway tokens, or payment secrets are accepted or stored,
and notes text never enters the audit metadata. Direct browser writes remain
blocked for `payments`, `payment_status_history`, and `audit_logs`.

## Stop Point

Phase 6E stops here before the create payment UI (Phase 6F) and before any mark
paid, cancel, or refund status-transition phase.
