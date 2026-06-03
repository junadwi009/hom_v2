# Phase 5A Package / Membership Foundation Plan

## 1. Purpose

Package and membership comes after the Appointment MVP because appointments are the operational event that will eventually consume package value.

The package layer prepares HOM Studio OS v2 for:

- Session balance tracking.
- Package ownership per client.
- Future payment tracking.
- Future attendance-based session deduction.
- Future client lifetime value reporting.
- Future commission and finance workflows.

Phase 5A is planning only. It does not add package code, migrations, UI, or writes.

## 2. Scope

Plan only:

- Package catalog.
- Client package ownership.
- Session balance.
- Package status.
- Package usage history.

## 3. Non-Goals

Do not implement in Phase 5A:

- Payment gateway.
- Online checkout.
- Finance ledger.
- Clinical notes.
- WhatsApp.
- AI.
- Commission.
- Production deployment.

## 4. Proposed Tables

Future local-first tables:

- `packages`
- `client_packages`
- `package_usage_history`

Use `app_users` for internal actor references, following the current implemented identity model.

## 5. Package Fields

Proposed `packages` fields:

- `id uuid primary key`
- `name text not null`
- `type text not null`
- `total_sessions integer`
- `validity_days integer`
- `price_idr bigint`
- `status text not null`
- `created_at timestamptz not null`
- `updated_at timestamptz not null`

Notes:

- Use `price_idr`, not cents naming.
- `total_sessions` may become nullable only if unlimited packages are approved later.
- `type` should stay simple at first, for example `session_pack`, `membership`, or `intro`.

## 6. Client Package Fields

Proposed `client_packages` fields:

- `id uuid primary key`
- `client_id uuid not null references clients(id)`
- `package_id uuid not null references packages(id)`
- `purchased_at timestamptz not null`
- `expires_at timestamptz`
- `total_sessions integer not null`
- `remaining_sessions integer not null`
- `status text not null`
- `created_at timestamptz not null`
- `updated_at timestamptz not null`

Rules to plan later:

- `remaining_sessions` must never go below zero.
- `remaining_sessions` must not exceed `total_sessions` unless an extension/adjustment flow is approved.
- Expiry should be calculated from `purchased_at + validity_days`, unless manually overridden by an approved server-only flow later.

## 7. Usage History Fields

Proposed `package_usage_history` fields:

- `id uuid primary key`
- `client_package_id uuid not null references client_packages(id)`
- `appointment_id uuid references appointments(id)`
- `change_type text not null`
- `quantity integer not null`
- `before_remaining integer not null`
- `after_remaining integer not null`
- `reason text`
- `actor_app_user_id uuid references app_users(id)`
- `created_at timestamptz not null`

Suggested `change_type` values for later:

- `assigned`
- `deducted`
- `reversed`
- `adjusted`
- `cancelled`
- `expired`

## 8. Status Proposal

Package catalog statuses:

- `active`
- `inactive`
- `archived`

Client package statuses:

- `active`
- `expired`
- `depleted`
- `cancelled`

Status rules should be enforced server-side, not trusted from UI state.

## 9. Relationship To Appointments

Appointments are the future trigger for package usage.

- An appointment may later consume one session from an active client package.
- A completed appointment may trigger package deduction later.
- Cancelled and no-show behavior needs explicit business approval before deduction rules are implemented.
- No package deduction happens in Phase 5A.
- No payment tracking happens in Phase 5A.

Important future rule:

- Package deduction must be atomic with appointment completion, usage history, and audit logs if it is introduced in a later phase.

## 10. RLS Strategy

Plan:

- Enable RLS on `packages`, `client_packages`, and `package_usage_history`.
- Package catalog read should be available to users with appointment/package operational permission.
- Client package read should be limited to operational roles that need client package context.
- No direct browser insert/update/delete policies at first.
- Future writes must be server-only, permission-checked, validated, transactional, and audited.

Possible future permissions:

- `can_view_packages`
- `can_manage_packages`
- `can_view_client_packages`
- `can_manage_client_packages`

Open decision:

- Whether to add package-specific permissions immediately or temporarily reuse appointment/client management permissions for the first local-only slice.

## 11. Audit Strategy

Future audit actions:

- `package.created`
- `client_package.assigned`
- `package_usage.recorded`
- `package_usage.reversed`
- `client_package.cancelled`

Audit safety:

- Direct browser audit inserts must remain blocked.
- Server-only audit writer rules must continue to reject clinical, payment, WhatsApp, contact, secret, and raw sensitive metadata.
- Package usage audit metadata should include safe IDs and before/after counts, not payment details.

## 12. Recommended Implementation Breakdown

Recommended next phases:

- Phase 5B: package domain schemas and mock repository.
- Phase 5C: local package database tables, dummy seed data, and read-only RLS verification.
- Phase 5D: read-only package UI.
- Phase 5E: assign package to client through a server-only audited flow.
- Phase 5F: deduct session on completed appointment through a server-only audited transaction.

Phase 5F should wait until the owner approves exact deduction rules.

## 13. Open Questions

- Should package deduction happen when appointment is completed?
- Can one client own multiple active packages?
- Can package validity be extended?
- Can expired packages be manually reactivated?
- Should package price connect to finance immediately or later?
- Should package support unlimited sessions?
- Should no-show consume a session?
- Should cancelled appointments ever consume or reserve a session?
- Should package assignment require a payment reference later?
- Which roles should manage package catalog and client package assignment?

## 14. Approval Gate

Implementation must not begin until the owner approves the exact Phase 5B scope.
