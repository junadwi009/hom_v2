# Phase 8F Presentation Demo Data Refresh Log

## Scope

On the temporary-production / soft-launch environment (Supabase project
`pgokujwfwrxopgwhpluj`, app `https://hom-gamma.vercel.app`), this phase: (1) removed
the previous Phase 7G/7H `STAGING` smoke-test catalog and transactional rows, and
(2) created a clean, presentation-ready `DEMO` dataset exercising the full MVP
workflow (appointments, package assignment + session deduction, manual payments +
status transitions, and audit/history).

Guardrails honored: no `supabase db reset`, no `supabase/seed.sql`, no RBAC/auth
deletion, no `auth.users` change, no production/real data, no local `Mock` seed, no
manual `audit_logs` insert, no Vercel deploy, no feature change. Transactional demo
state was created through the app UI / server RPCs (so history + audit are generated
properly), never by raw SQL. Catalog rows were inserted by reviewed idempotent SQL.
No secrets were printed or committed; the DB password was used only as a transient
`PGPASSWORD`. Project ref guarded on every SQL run (aborts unless
`pgokujwfwrxopgwhpluj`).

## Cleanup Dry-Run Counts

Read-only dry-run confirmed the `STAGING` set was the only business data and there
was no unexpected non-`STAGING`/`DEMO` or `Mock` data (abort checks all 0):

| Category | Count |
|---|---|
| clients (STAGING) | 1 |
| practitioners (STAGING) | 1 |
| services (STAGING) | 1 |
| packages (STAGING) | 1 |
| appointments | 3 |
| client_packages | 1 |
| package_usage_history | 2 |
| payments | 3 |
| payment_status_history | 5 |
| appointment_status_history | 7 |
| audit_logs (targeting those rows) | 14 |

## Cleanup Execution Summary

Single `ON_ERROR_STOP` transaction, FK-safe child→parent order, scoped strictly to
`STAGING`-prefixed entities, guarded by a super_admin-exists precheck. Deleted:
14 audit_logs, 2 package_usage_history, 5 payment_status_history,
7 appointment_status_history, 3 payments, 1 client_package, 3 appointments,
1 package, 1 service, 1 practitioner, 1 client (matches the dry-run exactly).

Post-clean: all business + history + audit tables = 0. RBAC/auth intact
(roles 8, permissions 32, role_permissions 88, app_users 1, super_admin grant 1,
auth super_admin 1).

## Demo Records Inserted (catalog)

Idempotent inserts; no phone/email/contact/clinical/WhatsApp/payment-secret fields.

Clients (5):
- `DEMO Client Active` — `b912ed0f-3ed4-4add-a0fd-72d7bb1a005b`
- `DEMO Client Package Holder` — `d5fc19df-c952-4466-b869-e88824c89b8a`
- `DEMO Client Payment Pending` — `c6f60cec-c1d7-4e3c-bb41-c144cfe9451f`
- `DEMO Client Cancelled Case` — `3f8863b0-8bd7-4a0e-8e4e-b5ffa55a4398`
- `DEMO Client No Show Case` — `6db6c74f-523e-46fe-b14b-2e71756ca0d8`

Practitioners (2):
- `DEMO Practitioner Yoga` — `750f8419-a383-4ab5-a2e6-3247ade07610`
- `DEMO Practitioner Pilates` — `a51d03eb-cedd-4444-a35f-e0588c59808c`

Services (2):
- `DEMO Yoga Class 60 min` (yoga, 60 min, Rp 150.000) — `3dcaf0bb-4269-4c2f-854b-60a679c45227`
- `DEMO Pilates Private 60 min` (pilates, 60 min, Rp 250.000) — `791d5f90-3d62-489b-91d5-ead4a89d39bb`

Packages (2):
- `DEMO 5 Session Pack` (session_pack, 5 sessions, 90 days, Rp 1.000.000) — `7328e629-ca21-4fa3-8811-98757b8fc9e3`
- `DEMO 10 Session Pack` (session_pack, 10 sessions, 120 days, Rp 1.800.000) — `c7ce1046-cea3-4409-a71d-237cdfad09c0`

## Demo Workflows Created (via UI / RPCs)

Appointments (5 created; 1 overlap attempt correctly blocked, no row):
- 11 Jun 2026 10:00 — `DEMO Client Active` / Yoga — **scheduled** (upcoming).
- 12 Jun 2026 → rescheduled to 11:00 — `DEMO Client Active` / Yoga — **scheduled**, shows `MODIFIED`.
- 13 Jun 2026 10:00 — `DEMO Client Package Holder` / Pilates — **completed** (used for deduction).
- 14 Jun 2026 10:00 — `DEMO Client Cancelled Case` / Yoga — **cancelled**.
- 15 Jun 2026 10:00 — `DEMO Client No Show Case` / Yoga — **no_show**.
- Overlap attempt (Yoga, 11 Jun 10:30, inside the 10:00 slot) → blocked with
  "This practitioner already has an appointment during that time."

Packages:
- Assigned `DEMO 5 Session Pack` → `DEMO Client Package Holder` (5/5, expires 2026-09-02).
- Deducted one session from the completed 13 Jun appointment → **4/5**.
- Duplicate deduction blocked (control became `Session Deducted`).
- Assigned `DEMO 10 Session Pack` → `DEMO Client Active` (10/10 active balance).

Payments (4):
- P1 — `DEMO Client Payment Pending`, Rp 150.000, cash — **pending** (left pending).
- P2 — `DEMO Client Package Holder`, Rp 1.000.000, bank transfer, linked to `DEMO 5 Session Pack` — **paid**.
- P3 — `DEMO Client Active`, Rp 250.000, cash — created pending then **marked paid**.
- P4 — `DEMO Client Cancelled Case`, Rp 150.000, cash — created pending then **cancelled** (reason supplied).
- Terminal `paid`/`cancelled` rows show no Mark Paid / Cancel actions; the cancellation
  reason is not shown in the table.

## Verification Results

Pages load (source `supabase`): `/appointments`, `/packages`, `/client-packages`,
`/payments` all render with the demo data (e.g. `/client-packages` shows Package
Holder 4/5 and Active 10/10).

Database (read-only via pooler):
- appointments: scheduled 2, completed 1, cancelled 1, no_show 1.
- appointment_status_history: (new)→scheduled 5, scheduled→completed 1,
  scheduled→cancelled 1, scheduled→no_show 1, scheduled→scheduled 1 (reschedule).
- client_packages: Package Holder 5/4 active; Active 10/10 active.
- package_usage_history: assigned 2, deducted 1.
- payments: pending 1, paid 2, cancelled 1.
- payment_status_history: (new)→pending 3, (new)→paid 1, pending→paid 1,
  pending→cancelled 1.
- audit_logs (all required actions present): appointment.created 5,
  appointment.rescheduled 1, appointment.completed 1, appointment.cancelled 1,
  appointment.no_show_marked 1, client_package.assigned 2, package_usage.recorded 1,
  payment.created 4, payment.marked_paid 1, payment.cancelled 1.

Safety:
- Audit metadata contains no reason/notes text (reason-phrase scan = 0; no
  `reason`/`notes`/`note`/`cancellationReason` keys = 0). Reschedule/cancellation
  reasons live only in `*_status_history.reason`.
- No payment secrets, card/bank account numbers, contact, clinical, or WhatsApp
  content. The only token-scan hit is the `bank_transfer` payment-method enum;
  excluding it, real sensitive matches = 0.
- No `Mock` rows (0); no non-`DEMO` business rows (0).
- RBAC/auth intact (roles 8, permissions 32, role_permissions 88, super_admin grant 1,
  auth super_admin 1).
- Direct browser writes blocked: the `authenticated` role has SELECT-only on all
  seven sensitive tables (writes only via RPC).

## Cleanup Manifest / How To Clean Demo Data Later

All demo rows are `DEMO`-prefixed (catalog) plus their linked transactional/history
rows. To remove them later, run a single `ON_ERROR_STOP` transaction, FK-safe order,
scoped to `DEMO` entities (mirrors the Phase 8F cleanup; not `db reset`, not
`seed.sql`):

```sql
-- DEMO cleanup (review before running; preserves RBAC/auth)
delete from public.audit_logs where target_id in (
  select id from public.appointments where client_id in (select id from public.clients where full_name like 'DEMO%')
  union select id from public.payments where client_id in (select id from public.clients where full_name like 'DEMO%')
  union select id from public.client_packages where client_id in (select id from public.clients where full_name like 'DEMO%'));
delete from public.package_usage_history where client_package_id in (select id from public.client_packages where client_id in (select id from public.clients where full_name like 'DEMO%'));
delete from public.payment_status_history where payment_id in (select id from public.payments where client_id in (select id from public.clients where full_name like 'DEMO%'));
delete from public.appointment_status_history where appointment_id in (select id from public.appointments where client_id in (select id from public.clients where full_name like 'DEMO%'));
delete from public.payments        where client_id in (select id from public.clients where full_name like 'DEMO%');
delete from public.client_packages where client_id in (select id from public.clients where full_name like 'DEMO%');
delete from public.appointments    where client_id in (select id from public.clients where full_name like 'DEMO%');
delete from public.packages        where name like 'DEMO%';
delete from public.services        where name like 'DEMO%';
delete from public.practitioners   where display_name like 'DEMO%';
delete from public.clients         where full_name like 'DEMO%';
```

## Safety Confirmation

- No `db reset`, no `seed.sql`, no `Mock`/production data, no manual `audit_logs`
  insert, no Vercel deploy, no feature change.
- RBAC reference, `auth.users` super_admin, `app_users`, and `user_roles` were never
  touched.
- Transactional demo data was created via the app's permission-checked RPCs (proper
  audit/history); only catalog rows were inserted by reviewed idempotent SQL.
- No passwords, anon keys, DB password, DB URLs, access tokens, or secrets printed or
  committed; project ref guarded on every SQL run.

## Warnings

- Mid-run, Docker Desktop (used as the local `psql` client to reach the remote
  pooler) and the connected browser tab both restarted (environment hiccup). No data
  impact: cleanup and catalog inserts had already committed before the restart, the
  browser session persisted after re-navigation, and the read-only verification ran
  after Docker came back healthy.
- The known post-mutation UX issue persists: `/appointments` and `/payments` lists
  show a transient "not loaded / paused" (or "Loading") state after a mutation and
  need a reload to display new rows. Data always persisted correctly (confirmed in DB).
- Free Supabase plan: no managed backups / PITR. Recommend a manual export
  (`pg_dump` / CSV) of this known-good demo snapshot before any presentation, and an
  upgrade before real production data accumulates.

## Stop Point

Phase 8F stops after this log. The environment now holds a clean `DEMO` dataset for
presentation. No production deployment was performed and none is initiated here.
