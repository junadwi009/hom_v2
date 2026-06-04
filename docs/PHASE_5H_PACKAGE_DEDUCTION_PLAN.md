# Phase 5H Package Deduction Plan

Planning only. This phase adds no migration, RPC, adapter, UI, or write. It plans
how to deduct one package session when an appointment is completed, grounded in the
existing `assign_client_package`, `complete_appointment`, and `mark_appointment_no_show`
RPC conventions.

## 1. Scope

Plan the first package deduction slice:

- Deduct exactly one session from an active client package.
- Tie each deduction to a completed appointment.
- Create one `package_usage_history` row with `change_type = 'deducted'`.
- Create one audit row with action `package_usage.recorded`.
- Link usage to the originating `appointment_id`.
- No payment or finance work.

Deduction quantity is fixed at one session for this slice. Variable quantities,
multi-session services, and adjustments are deferred.

## 2. Non-Goals

Do not implement in this phase or its first slice:

- Payment.
- Finance ledger.
- Package reversal.
- Package cancellation.
- Package extension.
- Clinical notes.
- WhatsApp.
- AI.
- Production services.

No-show and cancelled appointment deduction behavior is also out of scope and
stays a deferred owner decision (see Open Questions).

## 3. Deduction Trigger Decision

Three candidate triggers were considered.

### Option A — Automatic inside `complete_appointment`

Deduction runs inside the existing `complete_appointment` RPC transaction.

- Pros: fully atomic with completion; one user action.
- Cons: completing an appointment is currently a pure status change gated by
  `can_manage_appointments`. Coupling it to package mutation forces an automatic
  package choice when a client owns multiple active packages, which the owner has
  not approved. It also widens the blast radius of the appointment flow and mixes
  two permissions (`can_manage_appointments` vs `can_manage_client_packages`).
  Reversal becomes harder because completion and deduction are entangled.

### Option B — Manual separate Deduct Session action

A standalone action deducts from a selected package, independent of appointment
state.

- Pros: explicit and simple to permission.
- Cons: lets deduction happen without a completed appointment, which breaks the
  "deduction follows a real attended session" rule and weakens the audit trail.

### Option C — Hybrid: complete first, then deduct a selected package (Recommended)

Completion stays unchanged. A separate `Deduct Session` action operates only on an
already-completed appointment and requires explicit selection of one eligible
package belonging to that appointment's client.

- Pros: keeps `complete_appointment` untouched and low-risk; makes deduction
  explicit, permission-scoped to `can_manage_client_packages`, and auditable;
  handles the multiple-active-packages case through human selection instead of a
  guessed default; idempotency is easy to enforce per appointment; reversal later
  is cleaner because deduction is its own recorded event.
- Cons: two user actions instead of one.

### Recommendation

Adopt **Option C** as the safest first slice. It satisfies the scope (deduction
tied to a completed appointment, usage history, and audit) without coupling
package mutation into the appointment lifecycle and without forcing an unapproved
automatic package choice. Automatic deduction (Option A) may be revisited only
after the owner approves exact selection and no-show/cancel rules.

## 4. Package Selection Rules

A package is eligible for a one-session deduction only if all hold:

- The appointment exists and `status = 'completed'`.
- The client package `client_id` equals the appointment `client_id`
  (a package must belong to the appointment's client).
- The client package `status = 'active'`.
- `remaining_sessions > 0`.
- The package is not expired: `expires_at is null or expires_at >= now()`.
- The same appointment has not already deducted a session (idempotency).

Additional rules:

- A client may own multiple active packages; the eligible package is chosen
  explicitly by the operator, never auto-picked in this slice.
- Exactly one session is deducted per call.
- Selection eligibility is enforced server-side in the RPC, not trusted from the
  UI.

## 5. Atomic Transaction Strategy

Plan a narrow `security definer` Postgres RPC, for example
`public.deduct_client_package_session(p_appointment_id uuid, p_client_package_id uuid)`,
mirroring the existing package and appointment RPCs:

1. Require `auth.uid()` (`AUTH_REQUIRED`).
2. Resolve the active mapped `app_users` actor (`APP_USER_REQUIRED`).
3. Check `private.has_permission('can_manage_client_packages')`
   (`PERMISSION_DENIED`).
4. Load the appointment `for update`; require it exists (`APPOINTMENT_NOT_FOUND`)
   and is `completed` (`APPOINTMENT_NOT_COMPLETED`).
5. Load the client package `for update`; require it exists, belongs to the
   appointment client, is `active`, not expired, and has `remaining_sessions > 0`
   (`CLIENT_PACKAGE_UNAVAILABLE`).
6. Enforce idempotency: reject if a `deducted` `package_usage_history` row already
   exists for this `appointment_id` (`ALREADY_DEDUCTED`).
7. Compute `before_remaining` and `after_remaining = before_remaining - 1`.
8. Update `client_packages.remaining_sessions = after_remaining`.
9. If `after_remaining = 0`, set `client_packages.status = 'depleted'`.
10. Insert one `package_usage_history` row: `change_type = 'deducted'`,
    `quantity = 1`, before/after remaining, `appointment_id`, `actor_app_user_id`.
11. Insert one `audit_logs` row with action `package_usage.recorded`.
12. Return a safe client package read model (id, remaining_sessions, status).

All steps commit atomically or roll back together. Row locks (`for update`) on the
appointment and client package prevent concurrent double deduction. A partial
unique index on `package_usage_history (appointment_id)
where change_type = 'deducted'` is recommended as a database-level idempotency
backstop in addition to the explicit pre-check.

Grant execute on the RPC to `authenticated` only; keep `anon` and direct browser
insert/update/delete on `client_packages`, `package_usage_history`, and
`audit_logs` blocked, exactly as today.

## 6. Audit Strategy

- Audit action: `package_usage.recorded`.
- `target_type`: `client_package`; `target_id`: the client package id.
- `risk_level`: `high`, consistent with `client_package.assigned`.
- Metadata may include:
  - `clientPackageId`
  - `appointmentId`
  - `beforeRemaining`
  - `afterRemaining`
  - `quantity`
- Metadata must not include:
  - payment detail
  - contact data
  - clinical data
  - WhatsApp content
  - raw secrets
  - raw database error details

Direct browser audit inserts must remain blocked; the audit row is written only
inside the RPC transaction.

## 7. Permission

- Require `can_manage_client_packages` (already canonical since Phase 5F).
- `can_manage_appointments` alone must not deduct a package. Completion stays
  gated by `can_manage_appointments`; deduction is a separate, explicitly
  permissioned action.
- Automatic deduction inside completion is deferred and would require explicit
  owner approval before mixing these permissions.
- UI visibility is not security; the RPC enforces permission server-side.

## 8. UI Strategy

Plan later, not in this phase:

- Add a `Deduct Session` action on completed appointment rows only.
- Open a sheet/dialog showing the appointment's client and an eligible-package
  selector (active, not expired, `remaining_sessions > 0`, belonging to the
  client).
- Show a remaining-sessions preview: current remaining and remaining after
  deduction.
- Disable the action when the appointment is not completed or already deducted,
  with safe states for validation, permission denied, no eligible package,
  already deducted, configuration error, and unknown error.
- No payment fields, no clinical data, no WhatsApp data.
- Mock mode previews only; it must not fake a successful deduction.

## 9. Tests

The implementation phase should test:

- Active package allowed; `remaining_sessions` decrements by exactly one.
- Expired package denied.
- Depleted package denied.
- Package belonging to a different client denied.
- Non-completed appointment denied (scheduled, confirmed, cancelled, no-show).
- Duplicate deduction for the same appointment denied (idempotency).
- `client_packages.status` becomes `depleted` when remaining reaches zero.
- `package_usage_history` `deducted` row inserted with correct before/after and
  `appointment_id`.
- `audit_logs` `package_usage.recorded` row inserted with safe metadata only.
- Transaction rolls back fully if the audit insert fails (no partial decrement,
  no usage row).
- Direct browser/client insert/update/delete on `client_packages`,
  `package_usage_history`, and `audit_logs` remain denied.
- User without `can_manage_client_packages` denied.
- Concurrent double deduction blocked by row locking / unique index.

## 10. Recommended Next Implementation Slice

- **Phase 5I** — deduction RPC and server-only adapter only:
  add `public.deduct_client_package_session(...)`, the idempotency unique index,
  the server-only TypeScript adapter, domain schema/types updates, SQL rollback
  probe, and unit tests. No UI.
- **Phase 5J** — deduction UI:
  add the `Deduct Session` action on completed appointment rows, eligible-package
  selector, remaining-sessions preview, safe states, Storybook, and Playwright
  coverage, after Phase 5I is approved.

## 11. Open Questions

- Should a no-show ever consume a session?
- Should a cancelled appointment ever consume or reserve a session?
- Should deduction ever be reversible, and under what permission?
- When a client owns multiple eligible packages, should there be a default
  ordering suggestion (for example earliest expiry) even though selection stays
  explicit?
- Should completion eventually auto-suggest (not auto-commit) a deduction?
- Should deduction require a payment reference once finance is introduced?

## 12. Approval Gate

Implementation must not begin until the owner approves the exact Phase 5I scope,
the Option C trigger decision, and the no-show/cancel deduction stance. No
deduction code is written in Phase 5H.
