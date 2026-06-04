# Phase 7H Staging Smoke Test Log

## Scope

Authenticated end-to-end smoke test of the staging app
(`https://hom-gamma.vercel.app`, project `pgokujwfwrxopgwhpluj`) signed in as the
staging super_admin, using only the four approved `STAGING` catalog records from
Phase 7G. The test exercised the appointment, package, and payment workflows through
the UI, then verified history/audit/RLS through the staging pooler (read-only).

Approved records used:

- Client: `STAGING Test Client`
- Practitioner: `STAGING Practitioner One`
- Service: `STAGING Test Service`
- Package: `STAGING Test Pack`

Not done (per rules): no `supabase/seed.sql`, no `db reset`, no `Mock`/production
data, no manual inserts into business/history/audit tables, no secrets printed or
committed, no production deploy. The browser writes were performed only through the
app UI (which calls the permission-checked, server-only RPCs); the only direct DB
access was read-only verification. Extra business rows created are solely those the
smoke-test UI workflow itself produced (see Warnings).

### Auth handling

The owner controls the staging super_admin password. The agent did not enter, see,
or store the password: the owner logged in manually in the connected browser, and the
agent reused that live authenticated session. The pooler DB password (for the
read-only DB verification) was used only as a transient `PGPASSWORD` inside a single
shell invocation and never printed or committed.

## Auth Verification

`GET /api/me` on the authenticated session returned:

- `meta.authMode = supabase`.
- `user.roles = ["super_admin"]`, `user.status = active`,
  `email = junadwi009@gmail.com`, `fullName = "HOM Studio Director"`.
- `user.permissions` includes all four required permissions —
  `can_manage_appointments`, `can_reschedule_appointments`,
  `can_manage_client_packages`, `can_manage_payments` — plus the full super_admin set.

(Earlier, unauthenticated `/api/me` and `/appointments` correctly returned `401` /
redirected to `/login`, confirming the auth guard.)

## Page Load Verification

All four read-only pages loaded without 500 errors, `Payment/Roster/Schedule source
= supabase`:

- `/appointments` — loaded (New Appointment action present).
- `/packages` — loaded; showed `STAGING Test Pack`.
- `/client-packages` — loaded (empty state before assignment; Assign Package action).
- `/payments` — loaded (empty state before creation; Create Payment action).

## Appointment Workflow Result

All through the UI as super_admin (all times Asia/Jakarta):

- Create appointment A — `STAGING Test Client` / `STAGING Practitioner One` /
  `STAGING Test Service`, 10 Jun 2026 10:00, duration auto-copied 60 min →
  created and listed as `scheduled`.
- Overlap protection — attempted a second appointment, same practitioner, 10:30
  (inside A's 10:00–11:00 slot) → blocked with inline error
  "This practitioner already has an appointment during that time." No duplicate
  created (loaded appointments stayed 1).
- Reschedule A → 11:00 (operational reason supplied) → succeeded, row shows
  `MODIFIED`, status `scheduled`, "Appointment rescheduled." confirmation.
- Complete A → status `completed`; action control changed to `Deduct Session`.
- Cancel appointment B (13:00, operational reason) → status `cancelled`, no further
  actions.
- Mark no-show appointment C (14:00) → status `no_show`, no further actions.

## Package Workflow Result

- Assigned `STAGING Test Pack` to `STAGING Test Client` via the Assign Package UI
  (assign RPC) → client package appears: purchased 2026-06-04, expires 2026-09-02
  (90-day validity derived by the RPC), total 5, **remaining 5 / 5**, status `active`.
- Deducted one session from completed appointment A → **remaining 4 / 5**.
- Duplicate-deduction protection: after deducting, appointment A's control changed
  from `Deduct Session` to **`Session Deducted`** (idempotent — no second deduction
  possible from the same appointment).

## Payment Workflow Result

- Created a **pending** payment for `STAGING Test Client` — Rp 100.000, cash,
  reference "STAGING smoke pending".
- Created a **paid** payment — Rp 1.000.000, bank transfer, linked to the assigned
  client package, reference "STAGING smoke paid".
- Marked the pending payment **paid** → status `paid` with paid date.
- Created another **pending** payment (Rp 50.000, cash) and **cancelled** it with a
  short operational reason → status `cancelled`.
- Terminal rows: both `paid` rows and the `cancelled` row show **no Mark Paid /
  Cancel actions** (action column `—`). The cancellation reason is **not** shown in
  the payments table (Reference column empty for the cancelled row).

## Audit / History Verification

Verified read-only through the staging pooler:

- `appointments` by status: `cancelled` 1, `completed` 1, `no_show` 1 (3 total).
- `appointment_status_history`: `(new)→scheduled` 3, `scheduled→completed` 1,
  `scheduled→cancelled` 1, `scheduled→no_show` 1, `scheduled→scheduled` 1 (reschedule
  keeps status `scheduled`) — 7 rows.
- `client_packages`: 1 row, total 5 / remaining 4 / `active`.
- `package_usage_history`: `assigned` 1, `deducted` 1.
- `payments` by status: `paid` 2, `cancelled` 1 (3 total).
- `payment_status_history`: `(new)→pending` 2, `(new)→paid` 1, `pending→paid` 1,
  `pending→cancelled` 1 — 5 rows (pending, paid, and cancelled all present).
- `audit_logs` actions (14 rows total) — all required actions present:
  `appointment.created` 3, `appointment.rescheduled` 1, `appointment.completed` 1,
  `appointment.cancelled` 1, `appointment.no_show_marked` 1,
  `client_package.assigned` 1, `package_usage.recorded` 1, `payment.created` 3,
  `payment.marked_paid` 1, `payment.cancelled` 1.

## Safety Confirmation

Audit metadata safety (verified against the live staging `audit_logs`):

- Metadata contains only structured operational fields — IDs (`clientId`,
  `serviceId`, `practitionerId`, `paymentId`, `clientPackageId`, `appointmentId`),
  `amountIdr`, `status`/`toStatus`/`fromStatus`, `paymentMethod`, `durationMinutes`,
  `before/afterRemaining`, `totalSessions`, and timestamps. No free-text.
- Reason text absent: a scan for the reason phrase ("smoke test") across all audit
  metadata returned **0**; and **0** audit rows contain a `reason`/`notes`/`note`/
  `cancellationReason` key. Cancellation and reschedule reasons live only in
  `*_status_history.reason`, never in audit metadata.
- No payment secrets, card numbers, bank account numbers, contact, clinical, or
  WhatsApp content. A broad token regex flagged exactly **1** row, which was the
  literal payment-method enum value `"paymentMethod": "bank_transfer"` (a method type,
  not a bank account number); excluding that enum, real sensitive matches = **0**.

Direct browser write blocks (live proof against staging):

- The `authenticated` role holds **SELECT only** on all seven sensitive tables
  (`appointments`, `client_packages`, `package_usage_history`, `payments`,
  `payment_status_history`, `audit_logs`, `appointment_status_history`).
- Every RLS policy on those tables is **SELECT-only** (no `INSERT`/`UPDATE`/`DELETE`/
  `ALL` policy exists), so the browser cannot write directly; all writes go through
  the permission-checked, server-only `security definer` RPCs. The UI corroborates
  this with its "read-only repository result" labels.

Repo / secret safety:

- No application code, migration, schema, or seed changed; `git status` shows only the
  untracked Phase 7A–7H docs. `supabase/.temp/project-ref` remains gitignored and
  uncommitted. No password, anon key, DB password, access token, DB URL, or secret was
  printed or committed.

## Warnings

- After each mutating action the `/appointments` and `/payments` lists showed a
  transient "not loaded / paused" (or "Loading payments") state and required a page
  reload to display the new row. Data was always persisted correctly (confirmed in the
  DB); this is a minor read-side UX behavior, not a functional failure.
- The smoke test created additional staging business rows through the UI/RPC
  workflow (3 appointments: completed/cancelled/no-show; 1 client_package; 3 payments:
  2 paid + 1 cancelled; plus their status-history and audit rows). All are
  `STAGING`-scoped, created via the app's own workflows as required to exercise the
  flows — no `Mock` or production data. Staging is therefore no longer empty of
  transactional data; a later clean-rehearsal would need a fresh staging reset (not
  performed here) or acceptance of these test rows.
- The broad audit-safety regex false-positived on the `bank_transfer` payment-method
  enum (documented above); it is not a real data leak.

## Stop Point

Phase 7H stops after this log. The staging app is verified end to end (auth, page
loads, appointment/package/payment lifecycles, history, audit, and audit-safety, plus
live confirmation that direct browser writes are blocked). No production deployment was
performed and none is initiated here; production rollout remains gated on separate
owner approval (Phase 7 remaining: production env/secrets, deploy pipeline, production
auth/bootstrap, data import, and production smoke test).
