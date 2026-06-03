# Phase 4G Create Appointment Write Plan

Status: planning only. Do not implement create appointment until the owner approves the exact Phase 4H slice.

## 1. Scope

Plan create appointment only.

Do not add reschedule, cancel, complete, no-show, or appointment UI in this slice.

## 2. Transaction Strategy Options

| Option | Strength | Risk |
| --- | --- | --- |
| A. Narrow Postgres RPC function | One atomic database transaction; preserves blocked browser table writes; can validate permissions, catalog rows, overlap, history, and audit together. | Requires a carefully reviewed SQL migration and local RLS verification. |
| B. Server-side Supabase client with multiple writes | Familiar TypeScript calling style. | Multiple calls are not reliably atomic without an approved transaction wrapper; partial writes are unacceptable. |
| C. Future service-role or server DB adapter | Flexible for a future backend service. | Elevated credentials and deployment ownership are not approved yet. |

Recommendation: use Option A for local-first Phase 4H. Add one narrow RPC for create only. Do not add a service-role client. Do not grant direct browser insert access to `appointments`, `appointment_status_history`, or `audit_logs`.

## 3. Required Create Flow

Future RPC and server wrapper must:

1. Validate input with Zod before calling the RPC.
2. Require authenticated actor identity.
3. Check `can_manage_appointments`.
4. Verify client exists and is not `archived`.
5. Verify practitioner exists and is `active`.
6. Verify service exists and is `active`.
7. Copy `durationMinutes` into the appointment. Validate it against the selected service and decide whether staff may override the service default.
8. Create the appointment as `scheduled` only.
9. Reject practitioner overlap with blocking appointments.
10. Insert `appointments`.
11. Insert initial `appointment_status_history` with `from_status = null` and `to_status = scheduled`.
12. Insert `audit_logs` through a transaction-owned sink wrapped by the Phase 4D server-only audit writer.
13. Commit atomically.
14. Return a safe appointment read model without contact or sensitive fields.

No UI-only rule may be trusted.

## 4. Overlap Strategy

Use Phase 4F rules:

- `scheduled` and `confirmed` block practitioner time.
- `cancelled`, `completed`, and `no_show` do not block future time.
- Adjacent appointments are allowed when one end equals the next start.
- Frontend-only overlap checks are insufficient.

Phase 4H should add:

- A database exclusion constraint for blocking statuses.
- A readable RPC pre-check for a safe conflict result.
- Tests for concurrent create attempts.

## 5. Audit Strategy

Audit action:

```text
appointment.created
```

Requirements:

- Keep direct browser insert into `audit_logs` blocked.
- Use the Phase 4D server-only audit writer before invoking the transaction sink.
- Store operational metadata only, such as source, duration, and selected record IDs.
- Do not log contact data, clinical details, payment details, WhatsApp content, or secrets.

## 6. Permission Strategy

- `can_manage_appointments` is required.
- `can_view_appointments` remains read-only.
- Do not allow practitioner self-create yet.
- Do not infer permission from UI visibility.

## 7. Test Strategy

Phase 4H tests must cover:

- Permission allow and deny.
- Invalid or archived client.
- Invalid or inactive practitioner.
- Invalid or inactive service.
- Duration validation and approved override behavior.
- Overlap denied.
- Adjacent appointment allowed.
- Initial status history inserted.
- Audit writer called with safe metadata.
- Full rollback when history or audit write fails.
- Concurrent create collision denied safely.
- Direct authenticated browser writes remain denied.
- No raw database details in safe errors.

## 8. Non-Goals

Do not add:

- Appointment UI.
- Reschedule, cancel, complete, or no-show flows.
- Route handlers or server actions.
- Real auth.
- Service-role client unless separately justified and approved.
- Payment or packages.
- Clinical notes.
- WhatsApp.
- AI.
- Workers.
- Production services.

## 9. Recommendation: Exact Phase 4H Slice

Implement local-only create appointment infrastructure:

1. Add a migration with the blocking-status overlap exclusion constraint and one `private.create_appointment(...)` RPC.
2. Keep table writes denied for browser/client roles.
3. Grant authenticated users execute access to the RPC only.
4. Validate actor permission, catalog rows, duration, and overlap inside the RPC.
5. Insert appointment, initial history, and audit row atomically.
6. Add a server-only TypeScript create-appointment adapter that validates Zod input, prepares sanitized audit input with the Phase 4D writer, calls the RPC, and returns a safe read model.
7. Add local rollback-only SQL verification and unit tests.
8. Do not add UI, route handlers, server actions, service-role client, or cloud Supabase work.

Before Phase 4H implementation, confirm:

- May staff override the service default duration?
- Should the RPC live in `private` with explicitly granted execute access, or should a reviewed `public` wrapper call a private implementation?
