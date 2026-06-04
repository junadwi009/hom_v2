# Phase 6A Manual Payment Foundation Plan

Planning only. This phase adds no migration, schema, RPC, adapter, UI, or write.
It plans a manual payment / payment-tracking foundation, grounded in the existing
appointment and package conventions (server-only `security definer` RPCs, the
`app_users` actor model, `audit_logs`, status-history tables, and read-only RLS).

## 1. Purpose

Manual payment tracking comes after appointments and packages because it depends
on both and unlocks the next operational and financial layers:

- Client package assignment may later need a payment status (was this package
  paid for?), so payment must exist before package payment gating is possible.
- A future finance ledger needs a clean, audited source of payment events.
- A future revenue dashboard needs structured paid amounts and dates.
- Future package lifetime value (LTV) needs payments linked to clients and
  packages.
- Future commission and reconciliation flows need an auditable record of what was
  paid, by whom, and when.

Starting with manual records keeps the studio operational immediately (cash and
transfer are recorded by hand) without introducing a payment gateway.

## 2. Scope

Plan only:

- Manual payment records.
- Payment status.
- Payment method.
- Optional reference number.
- Linking a payment to a client and optionally to a `client_package`.
- No online payment gateway.

## 3. Non-Goals

Do not implement in this phase or its first slices:

- Midtrans / Xendit / any payment gateway.
- Automatic settlement or webhook reconciliation.
- Invoice PDF generation.
- Finance ledger.
- Commission.
- Clinical notes.
- WhatsApp.
- AI.
- Production deployment.

## 4. Proposed Tables

Future local-first tables, mirroring the appointment/package table style:

- `payments`
- `payment_status_history` (mirrors `appointment_status_history` and the
  `package_usage_history` audit-trail pattern)

Use `app_users` for internal actor references, consistent with the implemented
identity model.

## 5. Payment Fields

Proposed `payments` fields:

- `id uuid primary key`
- `client_id uuid not null references clients(id)`
- `client_package_id uuid references client_packages(id)` (nullable)
- `amount_idr bigint not null`
- `payment_method text not null`
- `status text not null`
- `paid_at timestamptz` (nullable; set when status becomes `paid`)
- `reference_number text` (nullable; safe operational reference only)
- `notes text` (nullable; max 280 safe operational characters)
- `created_by_app_user_id uuid references app_users(id)`
- `updated_by_app_user_id uuid references app_users(id)`
- `created_at timestamptz not null`
- `updated_at timestamptz not null`

Notes:

- Use `amount_idr` (whole rupiah, `bigint`), consistent with `price_idr` — no
  cents naming.
- `reference_number` is a human reference (for example a transfer slip number),
  not gateway metadata and not a secret.
- `updated_at` should be maintained by the existing `private.set_updated_at()`
  trigger pattern.

Proposed `payment_status_history` fields:

- `id uuid primary key`
- `payment_id uuid not null references payments(id) on delete cascade`
- `from_status text` (nullable for the first row)
- `to_status text not null`
- `reason text` (nullable; max 280 safe operational characters)
- `actor_app_user_id uuid references app_users(id)`
- `metadata jsonb` (safe IDs/counts only)
- `created_at timestamptz not null`

## 6. Payment Statuses

Catalog of `payments.status`:

- `pending`
- `paid`
- `failed`
- `refunded`
- `cancelled`

Status rules should be enforced server-side, not trusted from UI state. Allowed
transitions will be defined in the create/mark phases (for example `pending ->
paid`, `pending -> cancelled`, `paid -> refunded`).

## 7. Payment Methods

Catalog of `payments.payment_method`:

- `cash`
- `bank_transfer`
- `card`
- `e_wallet`
- `other`

`card` and `e_wallet` record only the method label. No card numbers, no wallet
account identifiers, and no gateway tokens are stored.

## 8. Rules

- `amount_idr > 0` (enforced by a check constraint).
- `payment_method` required and constrained to the catalog above.
- `client_id` required.
- A payment may optionally link to one `client_package` belonging to the same
  client (the link rule is validated server-side when the link is set).
- No payment gateway metadata is stored.
- No card details are stored.
- No bank account secrets are stored.
- `reference_number` and `notes` must not contain payment-secret, contact,
  clinical, WhatsApp, or secret content, and `notes` is capped at 280 characters,
  reusing the existing safe-operational-text constraint pattern.

## 9. RLS Strategy

Plan:

- Enable RLS on `payments` and `payment_status_history`.
- Grant `select` to `authenticated`, with read policies limited to finance and
  operational leadership roles (for example users holding `can_view_payments` or
  `can_manage_payments`); `super_admin` and `studio_director` inherit through the
  canonical permission set.
- No direct browser insert/update/delete policies at first.
- Future writes must be server-only (`security definer` RPC), permission-checked,
  validated, transactional, and audited — identical to the assign/deduct package
  RPCs.

## 10. Permission Strategy

Plan two canonical permissions, added to the domain RBAC constants/schema, the
Supabase `permissions_key_check` constraint, the local seed, and the relevant
role grants:

- `can_view_payments`
- `can_manage_payments`

Open decision: which exact roles receive `can_manage_payments` first (see Open
Questions). UI visibility is not security; RPCs must enforce permission
server-side.

## 11. Audit Strategy

Future audit actions (written only inside RPC transactions):

- `payment.created`
- `payment.marked_paid`
- `payment.cancelled`
- `payment.refunded`

Audit safety:

- `target_type = payment`, `target_id = payment id`, `risk_level = high`.
- Metadata may include safe IDs and amounts: `paymentId`, `clientId`,
  `clientPackageId`, `amountIdr`, `paymentMethod`, `status`, and status
  transitions.
- Metadata must not include card details, bank account numbers, gateway tokens,
  raw secrets, contact data, clinical data, WhatsApp content, or raw database
  error details.
- Direct browser audit inserts must remain blocked.

## 12. UI Strategy (Later)

Plan later, not in this phase:

- A `/payments` read-only table first (loading, empty, error, permission-denied
  states), backed by mock repositories by default and Supabase read-only
  repositories under `HOM_DATA_MODE=supabase`.
- A payment status badge (reuse the existing `StatusBadge` pattern).
- A link to the client.
- A link to the linked `client_package` when present.
- No gateway controls, no card fields, no bank secrets, no payment-link buttons.

## 13. Recommended Implementation Breakdown

- **Phase 6B** — payment domain schemas, types, read-only repository interfaces,
  and safe mock repositories.
- **Phase 6C** — local payment database tables, dummy seed, and read-only RLS
  verification.
- **Phase 6D** — read-only payments UI.
- **Phase 6E** — create manual payment through a server-only audited RPC and
  adapter (no UI).
- **Phase 6F** — create manual payment UI.
- **Phase 6G** — mark payment paid / cancelled (and the approved refund stance)
  through server-only audited transitions with status history.

Each phase stops for approval before the next, consistent with the Phase 5
cadence.

## 14. Open Questions

- Should a payment be required before assigning a package?
- Can a package be assigned before its payment is marked paid?
- Should partial payments be supported (for example a deposit then balance)?
- Should refunds be included in the MVP, or deferred to a later finance phase?
- Which roles can manage payments (studio director only, or also a finance role)?
- Should payments connect to a finance ledger immediately or later?

## 15. Approval Gate

Implementation must not begin until the owner approves the exact Phase 6B scope,
the table/field shape, the status and method catalogs, and the answers to the
open questions above. No payment code is written in Phase 6A.
