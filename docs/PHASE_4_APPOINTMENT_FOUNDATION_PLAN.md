# Phase 4 Appointment Foundation Plan

Date: 2026-05-28

Status: planning only. No appointment implementation is approved by this document.

## 1. Purpose

Appointments are the first high-risk operational module for HOM Studio OS v2.

This module can affect:

- Scheduling accuracy.
- Practitioner availability.
- Client experience.
- Future payment and package workflows.
- Future session note workflows.
- Future reminders and WhatsApp workflows.

Because of that risk, appointments must be built more carefully than a normal read-only catalog page. Frontend convenience is not enough. Appointment behavior needs domain validation, backend permission checks, database protections, status history, and audit logs before write flows are allowed.

## 2. Current Baseline

Phase 3B.5 completed read-only catalog UI for:

- Clients.
- Practitioners.
- Services.

Current safety baseline:

- Catalog writes are not implemented.
- Catalog route handlers are not implemented.
- Catalog server actions are not implemented.
- Direct browser/client audit inserts remain blocked by the Phase 2.6 audit safety patch.
- No service-role admin client exists.
- No real Supabase Auth exists.
- `HOM_DATA_MODE=mock` remains the default.
- The existing catalog repository factory can select mock repositories by default and Supabase read-only repositories when explicitly configured.
- Client, practitioner, and service UI avoids unnecessary contact exposure.

Phase 4 must preserve this baseline until the owner approves each implementation step.

## 3. Appointment Domain Model

The appointment domain should introduce these core concepts:

- `appointment`: the scheduled operational record connecting one client, one practitioner, and one service to a time window.
- `appointment status`: the current lifecycle state of the appointment.
- `appointment status history`: the append-style record of status transitions, actor, reason, and metadata.
- `client`: an existing catalog client. Appointments must reference `public.clients`.
- `practitioner`: an existing catalog practitioner. Appointments must reference `public.practitioners`.
- `service`: an existing catalog service. Appointments must reference `public.services`.
- `scheduled start/end time`: the planned time window for the appointment.
- `duration`: the stored appointment duration in minutes. This may default from the selected service but should be copied to the appointment when created.
- `cancellation reason`: an operational reason captured when an appointment is cancelled.
- `reschedule reason`: an operational reason captured when an appointment is moved.
- `notes summary`: optional non-clinical operational context. This must not become clinical notes.

Appointment data must not include full clinical notes, payment details, WhatsApp message content, AI output, or package ownership data in Phase 4.

## 4. Appointment Statuses

Proposed canonical statuses:

```text
draft
scheduled
confirmed
rescheduled
completed
cancelled
no_show
```

Recommended Phase 4 foundation behavior:

- Allow the domain enum to include all statuses above so future schemas and history can be stable.
- In a read-only first phase, allow mock and database rows to display any canonical status.
- Treat `scheduled`, `confirmed`, `completed`, `cancelled`, and `no_show` as the safest initial display statuses.
- Treat `draft` as an open product decision because it may create ambiguous time-blocking behavior.
- Treat `rescheduled` carefully. It may be better as a status history event rather than a long-lived current status.

No status transition mutations should be implemented until transition rules are explicitly approved and tested.

## 5. Appointment Table Proposal

Future local-only table proposal:

```sql
create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id),
  practitioner_id uuid not null references public.practitioners(id),
  service_id uuid not null references public.services(id),
  status text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  duration_minutes integer not null,
  source text not null,
  cancellation_reason text,
  reschedule_reason text,
  notes_summary text,
  created_by_app_user_id uuid references public.app_users(id) on delete set null,
  updated_by_app_user_id uuid references public.app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint appointment_time_valid check (ends_at > starts_at),
  constraint appointment_duration_valid check (
    duration_minutes > 0
    and duration_minutes <= 480
  ),
  constraint appointment_status_valid check (
    status in (
      'draft',
      'scheduled',
      'confirmed',
      'rescheduled',
      'completed',
      'cancelled',
      'no_show'
    )
  )
);
```

Important:

- Do not implement this migration now.
- Use `app_users`, not `users`, for app identity references.
- Keep `notes_summary` operational and non-clinical.
- Keep package, payment, and session note references out of the first appointment table unless explicitly approved later.

## 6. Appointment Status History Table Proposal

Future table proposal:

```sql
create table public.appointment_status_history (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  from_status text,
  to_status text not null,
  reason text,
  actor_app_user_id uuid references public.app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);
```

Status history matters because appointments are operational promises. The studio needs to know what changed, when it changed, why it changed, and who changed it.

This supports:

- Reschedule accountability.
- Cancellation accountability.
- No-show tracking.
- Future finance/package reconciliation.
- Future client experience review.
- Future audit investigations.

Status history should be append-only from approved server-side flows.

## 7. Relationship To Clients, Practitioners, And Services

An appointment must require valid references to:

- One client.
- One practitioner.
- One service.

Future backend/domain checks must enforce:

- Client exists.
- Client is not archived.
- Practitioner exists.
- Practitioner is active.
- Service exists.
- Service is active.
- Service duration can provide the default appointment duration.

These are backend/domain rules, not client-side assumptions. The UI may help the user select valid records, but the backend must still validate everything.

## 8. No Double-Booking Strategy

Phase 4 must plan for practitioner overlap prevention before appointment writes are allowed.

Future strategy:

- Prevent overlapping appointments for the same practitioner.
- Use a database exclusion constraint, transactional backend validation, or both.
- Treat this as high-risk business logic.
- Test overlap behavior heavily with edge cases.
- Consider `cancelled`, `no_show`, and `completed` behavior separately.
- Decide whether `draft` appointments block time before implementing drafts.

Frontend-only overlap checks are insufficient because two users or jobs can submit conflicting writes at nearly the same time.

## 9. Read-Only First Strategy

Phase 4 should probably start with a read-only foundation:

- Appointment domain schemas.
- Appointment mock repository.
- Read-only appointment list UI.
- No create, reschedule, cancel, complete, or no-show mutation yet.

Mutations should wait until:

- Server-only audit writer is planned and approved.
- Backend permission checks are settled.
- RLS strategy is verified locally.
- Status transition rules are tested.
- No double-booking strategy is approved.

## 10. RLS Strategy

Future RLS plan:

- Enable RLS on `public.appointments`.
- Enable RLS on `public.appointment_status_history`.
- Allow appointment reads for users with `can_view_appointments` or `can_manage_appointments`.
- Allow status history reads for users with appointment read permission.
- Do not add direct browser/client insert, update, or delete policies at first.
- Future appointment writes must go through server-side flows.
- Future status history writes must be server-only.

RLS is defense-in-depth. Backend permission checks are still required.

## 11. Audit Strategy

Phase 4 must preserve the Phase 2.6 audit rule:

- Direct client insert into `audit_logs` remains blocked.
- No browser/client audit insert policy should be reintroduced.
- Future appointment write flows must write audit events server-side.

Suggested future audit actions:

```text
appointment.created
appointment.rescheduled
appointment.cancelled
appointment.completed
appointment.no_show_marked
```

Do not implement an audit writer API now.

## 12. Server-Only Write Strategy

Future write flows:

- Create appointment.
- Reschedule appointment.
- Cancel appointment.
- Mark completed.
- Mark no-show.

Each future mutation must:

- Validate input with Zod.
- Check permission.
- Validate business rules.
- Check appointment status transition rules.
- Check practitioner availability.
- Use a database transaction.
- Write appointment status history.
- Write audit log server-side.
- Never trust UI-only validation.
- Never expose service-role credentials to client code.

Recommended permission direction:

- `can_view_appointments` for read-only access.
- `can_manage_appointments` for create, cancel, complete, and no-show marking.
- `can_reschedule_appointments` for reschedule, unless the owner decides `can_manage_appointments` includes rescheduling.

## 13. Zod Schema Plan

Future domain folder:

```text
packages/domain/src/appointments
```

Suggested schemas:

- `appointmentStatusSchema`
- `appointmentSchema`
- `appointmentListQuerySchema`
- `appointmentListResultSchema`
- `createAppointmentInputSchema`
- `rescheduleAppointmentInputSchema`
- `cancelAppointmentInputSchema`
- `updateAppointmentStatusInputSchema`

Recommended schema rules:

- Parse timestamps as ISO strings first.
- Require `endsAt` after `startsAt`.
- Require positive `durationMinutes`.
- Keep cancellation and reschedule reasons bounded in length.
- Keep `notesSummary` optional, short, and non-clinical.
- Reject unknown fields with strict schemas.

Do not implement these schemas now.

## 14. Repository Interface Plan

Read-only first interface:

```ts
export interface AppointmentRepository {
  list(query?: AppointmentListQuery): Promise<AppointmentListResult>;
  getById(id: string): Promise<Appointment | null>;
}
```

Future mutation behavior should not be casually added to this read interface.

Mutation repository or use-case methods should be separate, server-only, and designed around transactions, permissions, status history, audit logs, and overlap prevention.

## 15. Mock Repository Plan

Use safe fake appointment data only:

- Mock Client names only.
- Mock Practitioner names only.
- Mock Service names only.
- Local development timestamps only.
- No clinical data.
- No medical history.
- No payment data.
- No WhatsApp data.
- No production data.

Example safe mock row:

```text
Mock Client Alpha | Mock Practitioner One | Mock Intro Assessment | scheduled | 2026-06-01 10:00-11:00
```

## 16. UI Planning

Future UI should start with `/appointments` list first.

Recommended first read-only screen:

- Appointment date/time.
- Client display name.
- Practitioner display name.
- Service name.
- Duration.
- Status badge.
- Source.

Later UI:

- Calendar view.
- Practitioner schedule view.
- Filters.
- Detail page.
- Status timeline.

Required states:

- Loading.
- Empty.
- Permission denied.
- Configuration error.
- Generic error.
- Ready.

Do not add create, edit, reschedule, cancel, complete, no-show, or delete buttons until write flows are approved.

## 17. Testing Plan

Future tests should include:

- Appointment status enum tests.
- Date validation tests.
- `endsAt` after `startsAt` tests.
- Duration validation tests.
- Appointment list query default tests.
- Mock repository `list` and `getById` tests.
- Overlap rule unit tests.
- Status transition rule tests.
- RLS read allow and deny tests.
- Direct browser/client insert, update, and delete deny tests.
- Audit safety tests confirming direct client audit insert remains blocked.
- Server-only audit writer tests once that writer exists.
- Playwright smoke tests for read-only appointment list later.

Overlap tests should cover:

- Exact same start and end.
- One appointment inside another.
- Partial overlap at the start.
- Partial overlap at the end.
- Adjacent appointments where one ends exactly when the next starts.
- Cancelled appointment behavior.
- No-show appointment behavior.
- Draft appointment behavior if drafts are approved.

## 18. Explicit Non-Goals

Do not implement in this planning phase:

- Appointment migrations.
- Appointment domain schemas.
- Appointment repositories.
- Appointment UI.
- Appointment writes.
- Create appointment.
- Reschedule appointment.
- Cancel appointment.
- Mark completed.
- Mark no-show.
- Payment.
- Packages.
- Clinical notes.
- WhatsApp reminders.
- AI Gateway.
- Workers.
- Real Supabase Auth.
- Service-role admin client.
- Production services.
- Cloud Supabase linking or pushing.

## 19. Recommended Phase 4 Breakdown

Recommended small phases:

1. Phase 4A: appointment domain schemas and mock repository only.
2. Phase 4B: local appointment migrations and read-only RLS verification.
3. Phase 4C: read-only appointment list UI.
4. Phase 4D: server-only audit writer planning.
5. Phase 4E: create, reschedule, and cancel planning.

This order keeps the first appointment work understandable and reviewable while delaying high-risk writes until the safety foundation is ready.

## 20. Open Questions

- Should appointments allow `draft` status?
- Should appointment duration be copied from service at creation time?
- Should `no_show` be a status or a separate attendance flag?
- Should cancelled appointments still block time?
- Should reschedule create a new appointment or update the existing appointment with history?
- Should appointment writes wait for real Supabase Auth?
- Who can create appointments?
- Who can reschedule appointments?
- Who can cancel appointments?
- Who can mark appointments completed or no-show?
- Should appointment view include contact info or not?
- Should `rescheduled` be a current status or only a status history event?
- Should practitioners be able to see all appointments or only their own?
- Should appointment source include `admin`, `whatsapp`, `import`, and `ai_draft`, or stay narrower at first?

## 21. Approval Gate

Implementation must not begin until the owner approves the exact Phase 4A scope.
