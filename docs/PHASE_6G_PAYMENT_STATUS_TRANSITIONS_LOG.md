# Phase 6G Payment Status Transitions Log

## Scope

Implemented manual payment status transitions through server-only, audited, atomic
flows: `pending -> paid` (mark paid) and `pending -> cancelled` (cancel). Mark paid
requires a paid date; cancel requires a safe reason (max 280). `paid`, `cancelled`,
`refunded`, and `failed` are terminal for this phase. No refund, failed transition,
payment gateway, settlement, invoice PDF, finance ledger, commission, package
payment gating, clinical, WhatsApp, AI, production service, service-role browser
client, or cloud Supabase link/push was added.

## Files Changed

New:

- `supabase/migrations/20260603000600_payment_status_transitions_rpc.sql`
- `supabase/tests/phase_6g_payment_status_transitions_rpc.sql`
- `apps/web/src/lib/payments/server/payment-rpc-row.ts`
- `apps/web/src/lib/payments/server/mark-payment-paid.ts`
- `apps/web/src/lib/payments/server/cancel-payment.ts`
- `apps/web/src/lib/payments/server/submit-mark-payment-paid.ts`
- `apps/web/src/lib/payments/server/submit-cancel-payment.ts`
- `apps/web/src/features/payments/payment-transition-types.ts`
- `apps/web/src/features/payments/payment-transition-dialog.tsx`
- `apps/web/src/features/payments/payment-transition-dialog.stories.tsx`
- `apps/web/src/features/payments/mark-paid-payment-action.ts`
- `apps/web/src/features/payments/cancel-payment-action.ts`
- `apps/web/tests/unit/payments/payment-transitions.test.ts`
- `apps/web/tests/e2e/local-supabase-payment-transitions.spec.ts`
- `docs/PHASE_6G_PAYMENT_STATUS_TRANSITIONS_LOG.md`

Modified:

- `packages/domain/src/payments/schemas.ts`, `types.ts`, `index.ts`
- `packages/domain/tests/payments.test.ts`
- `apps/web/src/lib/payments/server/index.ts`
- `apps/web/src/features/payments/payments-page.tsx`
- `apps/web/src/features/payments/payments-table.tsx`
- `apps/web/src/app/payments/page.tsx`
- `apps/web/tests/e2e/app-shell.spec.ts`

No route handler and no service-role browser client were added.

## Domain Schema

Added `markPaymentPaidInputSchema` (`paymentId`, `paidAt`) and
`cancelPaymentInputSchema` (`paymentId`, safe `reason` max 280). Both are strict;
the cancel reason rejects card/bank/gateway/contact/secret content.

## RPC Behavior

Added `public.mark_payment_paid(p_payment_id, p_paid_at)` and
`public.cancel_payment(p_payment_id, p_reason)` as `security definer` functions
with `search_path = public, private`. Each:

- requires `auth.uid()` (`AUTH_REQUIRED`),
- resolves the active mapped `app_users` actor (`APP_USER_REQUIRED`),
- requires `can_manage_payments` (`PERMISSION_DENIED`),
- locks the payment and requires it exists (`PAYMENT_NOT_FOUND`) and is `pending`
  (`PAYMENT_NOT_PENDING`),
- mark paid requires `p_paid_at` (`PAYMENT_PAID_AT_REQUIRED`) and sets `status =
  paid` with `paid_at`,
- cancel requires a non-empty reason within 280 characters
  (`CANCEL_REASON_REQUIRED`/`CANCEL_REASON_INVALID`) and sets `status =
  cancelled`,
- inserts a `payment_status_history` row (cancel keeps the reason in history),
- inserts the atomic `payment.marked_paid` or `payment.cancelled` audit row,
- returns a safe payment read model.

All writes commit atomically or roll back together. Execute is granted to
`authenticated` only. No direct browser insert/update/delete policies were added
for `payments`, `payment_status_history`, or `audit_logs`.

## Server Adapter Behavior

Added server-only `markPaymentPaid` and `cancelPayment` adapters that validate
input, run the existing server audit guard over safe metadata (cancel excludes the
reason text), call the RPC through the existing Supabase server client, map known
database errors to safe `MarkPaymentPaidRpcError`/`CancelPaymentRpcError` codes,
and parse the result through `paymentSchema`. Added the `submit*` form paths and
`/payments` server actions, which require Supabase auth and data mode and map RPC
errors to safe states (`success`, `validation_error`, `payment_unavailable`,
`invalid_transition`, `permission_denied`, `configuration_error`, `unknown_error`).
No service-role client was added.

## UI Behavior

- The `/payments` table now has an Actions column. Pending rows expose `Mark Paid`
  and `Cancel` controls; terminal rows (`paid`, `cancelled`, `failed`, `refunded`)
  show a neutral `—`.
- The Mark Paid dialog collects a required Asia/Jakarta paid date; the Cancel
  dialog collects a required safe reason (max 280, no card/bank/contact details).
- Both controls are disabled for users without `can_manage_payments`, and
  submission is enabled only in Supabase data mode.

## Mock Mode

Mock mode can open the Mark Paid and Cancel dialogs and preview fields, but
submission is disabled and the server path returns a `configuration_error` instead
of faking persistence.

## Audit Behavior

Audit rows use actions `payment.marked_paid` and `payment.cancelled`, `target_type
= payment`, `risk_level = high`, with metadata `paymentId`, `clientId`,
`amountIdr`, `paymentMethod`, `fromStatus`, and `toStatus`. Audit metadata never
includes the cancellation reason, notes, reference number, card/bank/gateway,
contact, clinical, WhatsApp data, secrets, or raw database errors. The cancellation
reason is stored only in `payment_status_history`.

## Verification

- `corepack pnpm exec supabase db reset` applied the new migration cleanly.
- The rollback SQL probe passed and verified: function privileges; mark paid sets
  paid with `paid_at`; cancel sets cancelled with the reason kept in history; safe
  audit metadata without reason/notes/reference; denial of marking/cancelling a
  paid payment (`PAYMENT_NOT_PENDING`), mark paid without paid date, cancel without
  reason, and a missing payment; denial of direct table and audit writes; denial
  for a no-permission user; and full rollback when the audit insert fails.
- The guarded local-Supabase Playwright spec passed in Supabase auth/data mode,
  marking one seeded pending payment paid and cancelling another with a reason.
- Local container `psql` confirmed the paid and cancelled statuses, the initial
  status-history rows (reason retained for cancel), and the `payment.marked_paid`
  and `payment.cancelled` audit rows carrying `fromStatus`/`toStatus` and no
  reason/notes/reference keys. The local demo transitions were then cleared by
  restoring the seed baseline.

## Final Checks

| Command | Result |
| --- | --- |
| `corepack pnpm exec supabase db reset` | Pass |
| `phase_6g_payment_status_transitions_rpc.sql` rollback probe | Pass |
| `corepack pnpm typecheck` | Pass |
| `corepack pnpm lint` | Pass |
| `corepack pnpm test` | Pass (117 domain, 215 web) |
| `corepack pnpm build` | Pass |
| `corepack pnpm build-storybook` | Pass |
| `corepack pnpm test:e2e` | Pass (30 passed, 5 guarded local-Supabase specs skipped) |
| Guarded local-Supabase payment transitions spec | Pass |
| Transition verification via local DB `psql` | Pass |

Warnings: Supabase CLI reported that v2.104.0 is available; Storybook reported the
existing large bundle-size warning; Playwright reported the existing Node
`NO_COLOR`/`FORCE_COLOR` warnings. The guarded spec was adjusted to assert the row
status change (and dialog close) rather than the success toast, because a
transitioned row becomes terminal and unmounts its row-scoped dialog and toast on
refresh; it was also pointed at seeded pending rows that sort onto page one. A
stale `apps/web/.next` dev artifact was cleaned before typecheck.

## Safety Confirmation

No refund, failed transition, payment gateway, automatic settlement, invoice PDF,
finance ledger, commission, package payment gating, clinical notes, WhatsApp, AI,
production service, service-role browser client, cloud Supabase link/push, secret,
or production data was added. The cancellation reason never enters audit metadata,
and no card/bank/gateway/contact data is accepted. Direct browser writes remain
blocked for `payments`, `payment_status_history`, and `audit_logs`.

## Stop Point

Phase 6G stops here. Refund and failed transitions, finance ledger, and any
production integration remain deferred.
