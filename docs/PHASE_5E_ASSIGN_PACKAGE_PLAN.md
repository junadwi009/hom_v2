# Phase 5E Assign Package Plan

## 1. Scope

Plan the first package write flow:

- Assign an existing active package to an existing eligible client.
- Create one `client_packages` row.
- Create one `package_usage_history` row with `change_type = 'assigned'`.
- Create one audit row with action `client_package.assigned`.

## 2. Non-Goals

Do not implement in this phase:

- Payment.
- Finance ledger.
- Package deduction.
- Package reversal.
- Package cancellation.
- Package extension.
- Clinical notes.
- WhatsApp.
- AI.
- Production services.

## 3. Rules

- Package must exist and have `status = 'active'`.
- Client must exist and must not be `archived`.
- `total_sessions` is copied from `packages.total_sessions`.
- `remaining_sessions` starts equal to copied `total_sessions`.
- `purchased_at` is required.
- `expires_at` is calculated as `purchased_at + packages.validity_days`.
- One client may own multiple active packages.
- No unlimited package support yet.
- No payment reference is required yet.
- No package assignment may include contact, clinical, WhatsApp, payment, secret, or production data.

## 4. Permission

- Require `can_manage_client_packages`.
- This permission does not exist yet in the canonical RBAC list.
- Phase 5F should add it safely to:
  - domain RBAC permission constants/schema,
  - Supabase permission check constraints,
  - local seed data,
  - local `studio_director` role permissions,
  - local auth context tests.
- UI visibility is not security. The RPC must enforce permission server-side.

## 5. Transaction Strategy

- Use a narrow Postgres RPC, for example `public.assign_client_package(...)`.
- Grant RPC execute only to `authenticated`.
- Do not add direct browser insert/update/delete policies on `client_packages`, `package_usage_history`, or `audit_logs`.
- RPC transaction steps:
  1. Require `auth.uid()`.
  2. Resolve active mapped `app_users` actor.
  3. Check `can_manage_client_packages`.
  4. Validate active package.
  5. Validate client is not archived.
  6. Insert `client_packages`.
  7. Insert `package_usage_history`.
  8. Insert `audit_logs`.
  9. Return safe client package read model.
- All inserts must commit atomically or rollback together.

## 6. Audit

- Audit action: `client_package.assigned`.
- Metadata may include:
  - `clientId`
  - `packageId`
  - `clientPackageId`
  - `totalSessions`
  - `remainingSessions`
  - `purchasedAt`
  - `expiresAt`
- Metadata must not include:
  - payment detail
  - contact data
  - clinical data
  - WhatsApp content
  - raw secrets
  - raw DB error details

## 7. UI Strategy

Plan later, not in Phase 5F:

- Add `Assign Package` button on the client package page or client detail area.
- Use a sheet/dialog.
- Fields:
  - client selector
  - package selector
  - `purchased_at` date/time
- Show preview:
  - calculated expiry
  - copied total sessions
  - starting remaining sessions
- Do not add payment fields.
- Keep safe states for validation, permission denied, unavailable package/client, configuration error, and unknown error.

## 8. Tests

Phase 5F should test:

- Active package allowed.
- Inactive package denied.
- Archived package denied.
- Archived client denied.
- `remaining_sessions` initializes equal to copied `total_sessions`.
- `expires_at` is calculated from `purchased_at + validity_days`.
- `package_usage_history` assigned row is inserted.
- `audit_logs` row is inserted.
- Transaction rolls back if audit insert fails.
- Direct browser/client writes remain denied for `client_packages`, `package_usage_history`, and `audit_logs`.
- User without `can_manage_client_packages` is denied.

## 9. Recommended Next Slice

- Phase 5F: add `can_manage_client_packages`, assign package RPC, server-only adapter, SQL/unit verification, and concise log.
- Phase 5G: add assign package UI after Phase 5F is approved.

Stop here. Do not implement assignment until the owner approves Phase 5F scope.
