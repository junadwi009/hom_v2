# Phase 4E Appointment Write Flow Plan

Status: planning only. Do not implement appointment writes until the owner approves the exact implementation slice.

## 1. Write-Flow Scope

Plan server-only use cases for:

- Create appointment.
- Reschedule appointment.
- Cancel appointment.
- Mark appointment completed.
- Mark appointment no-show.

Use existing appointment Zod contracts as the starting point. Keep the read-only repository separate from future mutation use cases.

## 2. Non-Goals

Do not implement yet:

- Appointment writes, UI buttons, route handlers, or server actions.
- Real Supabase Auth.
- Payment or packages.
- Clinical notes.
- WhatsApp.
- AI Gateway.
- Workers.
- Production services.

## 3. Required Server-Only Pattern

Every future write must:

1. Run server-side only.
2. Validate input with Zod.
3. Check the actor permission.
4. Check business rules and the current database row.
5. Check practitioner overlap in the database transaction.
6. Update or insert the appointment.
7. Insert `appointment_status_history`.
8. Write `audit_logs` through the Phase 4D server-only audit writer sink.
9. Commit all three writes atomically.
10. Return a safe result without raw database details.

Never trust UI-only validation. Never restore direct browser write policies.

The concrete transaction adapter is not approved yet. Before implementation, choose an audited server-side database path that can write the three tables atomically without exposing elevated credentials to browser code. Do not add a service-role client without separate approval.

## 4. Permission Rules

Proposed permissions:

| Permission | Allowed behavior |
| --- | --- |
| `can_view_appointments` | Read only |
| `can_manage_appointments` | Create, cancel, mark completed, mark no-show |
| `can_reschedule_appointments` | Reschedule |

Permission checks must run server-side for every mutation.

## 5. Status Transition Rules

Allowed:

- `scheduled -> confirmed`
- `scheduled -> cancelled`
- `confirmed -> cancelled`
- `confirmed -> completed`
- `confirmed -> no_show`
- `scheduled -> no_show`, only if owner approves
- Reschedule keeps the current appointment status as `scheduled` or `confirmed` and records the change in history.

Reject:

- `completed -> scheduled`
- `cancelled -> scheduled`
- `no_show -> scheduled`

Reopening terminal statuses requires a separately approved override flow.

## 6. No Double-Booking Strategy

Use database-side protection:

- `scheduled` and `confirmed` block practitioner time.
- `cancelled` does not block time.
- `completed` and `no_show` are historical.
- Adjacent appointments are allowed when one end time equals the next start time.
- Frontend-only checks are insufficient.

Recommended implementation direction: add a Postgres overlap exclusion constraint for blocking statuses, plus transaction-level validation for safe error messages. Test concurrent booking attempts.

## 7. Database Transaction Strategy

Each future mutation transaction must write:

1. `appointments`
2. `appointment_status_history`
3. `audit_logs` through the Phase 4D server-only writer sink

Suggested audit actions:

- `appointment.created`
- `appointment.rescheduled`
- `appointment.cancelled`
- `appointment.completed`
- `appointment.no_show_marked`

Audit metadata must remain operational and pass Phase 4D rejection/redaction rules.

## 8. UI Strategy

Plan future controls only:

- `New Appointment`
- `Reschedule`
- `Cancel`
- `Mark Completed`
- `Mark No-show`

Do not add controls until the corresponding server-only use case, permission check, transaction behavior, and audit tests are approved.

## 9. Tests Required

Add tests before exposing writes:

- Allowed and rejected status transitions.
- Overlap cases: identical, contained, partial, adjacent, cancelled, completed, and no-show.
- Concurrent overlap protection.
- Permission allow and deny cases.
- Zod validation failures.
- `appointment_status_history` insert.
- Audit writer call and sanitized metadata.
- Full transaction rollback when any write fails.
- Direct authenticated browser insert, update, and delete remain denied.
- Safe error responses without raw database details.

## 10. Open Questions

- Should `completed` or `no_show` be editable later through an override flow?
- Should same-day cancellation require a reason, or should every cancellation require one?
- Should every reschedule require a reason?
- Should `admin_frontdesk` be allowed to mark no-show?
- Should practitioners be allowed to mark completed for their own appointments?
- Should `scheduled -> no_show` be allowed?
- Should newly created appointments start as `scheduled` only, or may staff create them as `confirmed`?
- Which approved server-side transaction adapter should own atomic writes without adding browser write access?

## Approval Gate

Stop here. Implementation must not begin until the owner approves the exact first write-flow slice, transaction adapter, overlap protection, and answers to the open questions.
