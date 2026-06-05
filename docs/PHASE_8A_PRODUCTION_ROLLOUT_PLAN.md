# Phase 8A Production Rollout Plan

Planning only. This phase adds no code, migration, cloud project, deployment, secret,
user, or data. It plans the safe path from the verified staging MVP to a production
deployment of HOM Studio OS v2. No production action is executed in Phase 8A. Every
subsequent production phase stops for explicit owner approval before the next.

## Verified Baseline (entry condition)

- Local Operational MVP tagged: `operational-mvp-local-v0.2`.
- Staging Supabase migrated through `20260603000600_payment_status_transitions_rpc`
  (16 migrations, Local = Remote).
- Staging app: `https://hom-gamma.vercel.app`, project ref `pgokujwfwrxopgwhpluj`.
- Staging super_admin (`junadwi009@gmail.com`) works; staging smoke test passed
  (auth, page loads, appointment/package/payment lifecycles, audit/history, RLS
  direct-write denial).
- Phase 7 staging-readiness docs committed at
  `811c48dba2eef4853203dbefd7e6de1ef24d6bc1`.

## 1. Purpose

Production rollout must be planned and gated separately from staging because the
risks and irreversibility are categorically different from a throwaway staging
project:

- Production data risk: production will hold real client PII, real practitioner/staff
  records, and real payment status data. A mistake (wrong project, dummy seed, bad
  import) corrupts real business records, not disposable test rows.
- User access risk: real staff will log in and act on real clients. Wrong roles or an
  over-privileged account become a live access-control and privacy problem.
- Irreversible migration risk: cloud migrations are forward-only. `supabase db reset`
  is forbidden on a cloud project, so a bad migration cannot be undone by reset — only
  by a restore or a corrective forward migration. This must be rehearsed before
  production.
- Backup/restore requirement: staging had no real data to protect; production needs
  automated backups (and ideally PITR) and a rehearsed restore before go-live.
- Domain/env separation: production needs its own Supabase project, its own Vercel
  environment, its own domain, and its own secrets — never shared with or reused from
  staging.
- Operational training: real staff need a short operating guide and safe-use rules
  (no signup, how invites work, what not to enter into free-text fields) before they
  touch production.

## 2. Production Scope

Phase 8 plans (and later, with approval, executes) only:

- Production Supabase setup (project, config, backups, migrations).
- Production Vercel environment setup (env vars, domain, build gates).
- Production auth / bootstrap (one owner-controlled super_admin, RBAC reference).
- Real data import approach (idempotent, schema-validated, dry-run first).
- Production smoke test (the staging smoke test, repeated against production).
- Rollback / recovery (Vercel rollback, DB backup/restore, corrective migration).
- Owner approval gates between every step.

## 3. Non-Goals

Phase 8 does NOT implement or enable any new product capability. Explicitly out of
scope:

- New product features of any kind.
- Finance ledger / commission.
- Payment gateway integration.
- Invoice PDF generation.
- WhatsApp messaging.
- AI features (business agent, knowledge studio automation).
- Clinical notes / clinical case content.
- Production execution within this planning phase (8A).

The production rollout ships the *existing, verified* MVP feature set
(appointments, packages, manual payments, audit/history, RBAC) — nothing new.

## 4. Production Environment Requirements

- Production Supabase project must be a separate cloud project from staging
  (`pgokujwfwrxopgwhpluj`). Different ref, different database, different auth user
  pool.
- Production Vercel environment must be separate from staging — a dedicated Production
  environment (and/or a separate project), never the staging preview wired to
  production data.
- Production domain: a dedicated production domain/URL (decided with the owner),
  distinct from `hom-gamma.vercel.app`.
- Production redirect URLs: Supabase auth site URL and allowed redirect URLs set to
  the production domain only.
- Production secrets stored only in the host secret manager (Vercel encrypted env +
  the owner's secret store). Never in the repo, `.env`, or any committed file; only
  `.env.example` placeholders remain in the repo.
- No staging credentials reused in production: new database password, new anon key,
  new service-role key, new access token, new super_admin credentials. Staging keys
  must never grant any access to production.

## 5. Production Supabase Checklist

- Project naming: a clearly production name (for example `hom-studio-os-prod`) that
  cannot be confused with `...-staging`.
- Region decision: choose a region close to the studio (Singapore target, for example
  `ap-southeast-1`); confirm with owner (open question).
- Plan tier decision: choose free vs paid based on backup/PITR needs (paid is required
  for daily backups + PITR); confirm with owner (open question).
- Backup / PITR decision: enable automated daily backups and, if on a supporting tier,
  point-in-time recovery; document retention.
- Auth signup disabled: `enable_signup = false` in production auth settings (matches
  local/staging); verify it is false.
- Migration apply strategy: link the production project and apply
  `supabase/migrations/` forward-only via `supabase db push` (reviewed, rehearsed on
  staging first). Capture `supabase migration list` before/after; record the latest
  applied migration version.
- No `seed.sql`: the dummy `supabase/seed.sql` must never run on production.
- No `db reset`: `supabase db reset` is forbidden on the cloud project.
- RLS verification: after migration, run the adapted `supabase/tests/` probes against
  production to confirm read/permission/denial behavior holds.
- Direct-write denial verification: confirm authenticated direct
  insert/update/delete on `appointments`, `client_packages`, `package_usage_history`,
  `payments`, and `payment_status_history` remain denied (writes only via RPC).
- Audit insert denial verification: confirm authenticated direct insert into
  `audit_logs` remains denied.

## 6. Production Vercel Checklist

- Source repo confirmation: deploy from `junadwi009/hom_v2`, production branch
  (`main`) with reviewed promotion.
- Root directory confirmation: `apps/web`.
- Environment variables (Production environment only):
  - `NEXT_PUBLIC_SUPABASE_URL` — production project URL.
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — production anon key.
  - `HOM_AUTH_MODE=supabase`.
  - `HOM_DATA_MODE=supabase`.
- No service-role key in `NEXT_PUBLIC`: `SUPABASE_SERVICE_ROLE_KEY` (and any provider
  keys) are server-only secrets, never prefixed `NEXT_PUBLIC_`, never in the browser.
- Production domain: configure the production domain and align Supabase site/redirect
  URLs to it.
- Build gates: deploy only when `typecheck`, `lint`, `test`, `build`,
  `build-storybook`, and the mock `test:e2e` pass; treat the guarded local-Supabase
  specs as a manual pre-release rehearsal.
- Rollback to previous deployment: confirm the ability to instantly roll back to the
  prior successful Vercel deployment.

## 7. Production Auth / Bootstrap Plan

- Owner-controlled production super_admin: the owner creates the production
  super_admin auth user manually (owner holds the password); automation never handles
  the password.
- No public signup: `enable_signup = false` in production.
- Admin-created / invited users only: all other users are provisioned by a permitted
  admin (Supabase admin invite or a server-only admin action), each mapped to an
  active `app_users` row with assigned roles.
- Password / reset policy: a controlled reset path (admin-triggered or email-based
  with a strong policy); no self-service signup.
- Role assignment process: roles assigned only by a permitted admin
  (`can_manage_users` / `can_manage_roles_permissions`), recorded with audit.
- Bootstrap must create ONLY (via a separate reviewed script, never `seed.sql`):
  - the canonical RBAC reference (roles, permissions, role_permissions),
  - exactly one `app_users` mapping for the super_admin,
  - exactly one `super_admin` `user_roles` mapping.
- No business data in bootstrap: no clients/practitioners/services/packages, no
  `Mock` data, no transactional rows. (This mirrors the verified Phase 7E staging
  bootstrap.)

## 8. Real Data Import Plan

A separate, reviewed import path (Phase 8F), idempotent and schema-validated, never
the dummy seed:

- Clients import: real client directory (name, status, optional safe fields) validated
  against the client domain schema.
- Practitioners import: real practitioner directory validated against the practitioner
  schema; optional mapping to `app_users` where the practitioner is also a user.
- Services import: real service catalog (name, category, duration, IDR price)
  validated against the service schema.
- Packages import: real package catalog (type, sessions, validity, price) validated
  against the package schema.
- Optional existing package ownership import: if needed, import current
  `client_packages` balances (client, package, purchased/expires, total/remaining,
  status) — only if the owner approves and balances are authoritative.
- Payment historical import decision: decide import-vs-start-fresh (open question); if
  imported, only safe operational fields and a defined status mapping.
- Validation against domain schemas: every row validated by the existing domain
  schemas before insert; invalid rows are reported, never silently dropped.
- Idempotent import: re-running the import does not duplicate rows (natural-key or
  guarded upsert); safe to re-run after fixing a source error.
- Dry-run report before insert: a no-write dry run produces a report (counts,
  validation failures, would-insert vs would-skip) that the owner approves before any
  real insert.
- No card / bank / gateway secrets imported.
- No WhatsApp / clinical data imported.

## 9. Production Smoke Test Plan

After production migration + bootstrap + import, signed in as the production
super_admin (owner-performed login), repeat the verified staging smoke test:

- Login succeeds; unauthenticated routes redirect to `/login`.
- `/api/me` returns the mapped production super_admin with `authMode: supabase` and
  expected roles/permissions.
- Page loads (no 500): `/appointments`, `/packages`, `/client-packages`, `/payments`.
- Create an appointment (with overlap protection).
- Reschedule / cancel / complete / no-show appointments (on separate rows; do not
  disturb a completed row needed for deduction).
- Assign a package to an eligible client.
- Deduct a session from a completed appointment (idempotent; duplicate blocked).
- Create a manual payment (pending and paid).
- Mark a pending payment paid; cancel another pending payment.
- Audit / history verification: `audit_logs` and the status-history tables show the
  expected actions with safe metadata only (no payment secrets, card/bank numbers,
  cancellation reason text, notes, contact, clinical, or WhatsApp content).
- Direct browser write denial: confirm authenticated role is read-only on the
  sensitive tables (writes only via RPC), as verified on staging.

If production smoke testing is done against real imported data, prefer the smallest
non-destructive checks, or use a clearly-labeled production test client created by the
owner, to avoid polluting real records.

## 10. Rollback / Recovery Plan

- Vercel rollback: roll back the production deployment to the previous successful
  deployment instantly if a release regresses.
- Database backup before import: take a verified backup immediately before any real
  data import (and before any risky migration).
- Restore rehearsal: rehearse a restore from backup on staging (or a scratch project)
  before relying on it for production.
- Corrective migration strategy: because `db reset` is forbidden on cloud, a bad
  schema change is recovered by a reviewed forward-only corrective migration or a
  restore from backup.
- No destructive migration without backup: never run a destructive or data-losing
  migration on production without a verified, recent backup first.

## 11. Go / No-Go Checklist

Production may go live only when ALL are true:

- Staging remains verified (smoke test still passes on staging).
- Production backup (and PITR if applicable) is configured and verified.
- Production migration is applied and verified (RLS + direct-write/audit denial
  probes pass).
- Production auth is verified (super_admin login + `/api/me` roles/permissions;
  signup disabled; invited-user path works).
- Real data import dry-run is approved by the owner (validation clean).
- Production smoke test passed.
- Rollback is documented (Vercel + database) and a restore has been rehearsed.
- Owner signs off.

## 12. Recommended Next Phases

Each stops for owner approval before the next:

- Phase 8B: Production environment checklist (env separation, secret manager, secret
  scan gate).
- Phase 8C: Production Supabase execution plan (project creation, link, forward-only
  migration apply, backup/PITR, RLS probes).
- Phase 8D: Production Vercel setup plan (env vars, domain, build gates, rollback).
- Phase 8E: Production auth / bootstrap plan (super_admin bootstrap, invite flow,
  reset policy, role assignment with audit).
- Phase 8F: Real data import plan / tooling (idempotent, schema-validated, dry-run
  report, payment import decision).
- Phase 8G: Production smoke test checklist.
- Phase 8H: Go-live approval checklist (final sign-off).

## 13. Open Questions (for the owner)

- Production Supabase region (for example `ap-southeast-1`)?
- Supabase plan — free vs paid (paid required for daily backups + PITR)?
- Production domain / URL (for site URL and redirect URLs)?
- Who owns the production super_admin credentials (and the break-glass process)?
- Do we import existing real clients / practitioners / services / packages, or start
  some catalogs fresh?
- Do historical payments get imported, or do payments start fresh at go-live?
- Who can access production on day one (which staff, which roles)?
- Backup / PITR budget (drives the plan tier)?
- Who is the rollback owner (who is authorized to roll back Vercel / restore the DB)?

## Stop Point

Phase 8A stops after writing this plan. No production project, deployment, secret,
user, or data was created. Implementation must not begin until the owner approves the
Phase 8B scope and answers the open questions above.
