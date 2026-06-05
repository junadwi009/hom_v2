# Phase 8B Production Environment Checklist

Planning / checklist only. This phase creates no production Supabase project, no
production Vercel deployment, no production users, no real data import, and runs no
cloud commands. It defines what must be true (and what inputs the owner must provide)
before any production execution begins. Execution remains gated on later,
separately-approved phases.

## 1. Scope

- Production environment planning only.
- No execution.
- No production project creation.
- No real data import.
- No production deploy.

This checklist is the readiness gate between the approved Phase 8A rollout plan and
the first production execution phase (8C onward). Nothing here mutates any cloud
resource.

## 2. Required Owner Inputs

Production execution cannot start until the owner provides all of the following
(these resolve the Phase 8A open questions):

- Production Supabase project name (a clearly production name, e.g.
  `hom-studio-os-prod`).
- Production Supabase region (e.g. `ap-southeast-1`, close to the studio).
- Supabase plan tier (free vs paid — paid required for daily backups + PITR).
- Backup / PITR decision (daily backups; PITR yes/no per tier and budget).
- Production domain (the public URL for the studio app).
- Production Vercel project / environment (dedicated Production environment, separate
  from staging).
- Production super_admin email (owner-controlled credentials).
- List of day-one staff users and their roles (who logs in on go-live, with which
  role each).
- Decision: import historical payments, or start payments fresh at go-live.
- Decision: import existing package balances (`client_packages`), or start fresh.

No production phase proceeds with any of these left blank.

## 3. Production Supabase Requirements

- Separate project from staging: a distinct cloud project, not
  `pgokujwfwrxopgwhpluj`; different database and auth user pool.
- No staging credentials reused: new database password, anon key, service-role key,
  and access token; staging keys must grant no access to production.
- `enable_signup = false` in production auth settings (verify it is false).
- Backup / PITR decision documented before any real data exists.
- Migration forward-only only: apply `supabase/migrations/` via `supabase db push`
  (reviewed, rehearsed on staging first); capture migration list before/after.
- No `seed.sql`: the dummy seed must never run on production.
- No `db reset`: forbidden on the cloud project.
- RLS verification required after migration (adapted `supabase/tests/` probes).
- Direct write denial verification required: authenticated direct
  insert/update/delete denied on `appointments`, `client_packages`,
  `package_usage_history`, `payments`, `payment_status_history`.
- Audit insert denial required: authenticated direct insert into `audit_logs` denied.

## 4. Production Vercel Requirements

- Source repo confirmation: `junadwi009/hom_v2`.
- Root directory: `apps/web`.
- Production environment variables (Production environment only):
  - `NEXT_PUBLIC_SUPABASE_URL` — production project URL.
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — production anon key.
  - `HOM_AUTH_MODE=supabase`.
  - `HOM_DATA_MODE=supabase`.
- No service-role key in `NEXT_PUBLIC`: `SUPABASE_SERVICE_ROLE_KEY` and any provider
  keys stay server-only, never `NEXT_PUBLIC_`-prefixed, never in the browser.
- Production domain configured, with Supabase site/redirect URLs aligned to it.
- Rollback path to previous deployment confirmed (instant roll back to the last
  successful Vercel deployment).

## 5. Secrets Policy

- No secrets in the repo (only `.env.example` placeholders).
- No `.env` committed.
- No credential files committed (e.g. the owner's credential list stays out of the
  repo).
- Service-role key server-only if ever needed; never exposed to the browser or
  `NEXT_PUBLIC_`.
- DB password stored only in a password manager / host secret manager; supplied to
  tooling only as a transient environment variable, never printed or committed.
- Secret scan before each release
  (`SUPABASE_SERVICE_ROLE_KEY|API_KEY|SECRET|TOKEN|sk-|ghp_|github_pat_|BEGIN OPENSSH PRIVATE KEY|BEGIN RSA PRIVATE KEY`),
  confirming only known-safe matches (placeholders, the detection pattern itself,
  tests, docs).

## 6. Data Policy

- Staging data must not be copied to production (staging now holds smoke-test
  transactional rows; none of it goes to production).
- Local `Mock` data must not be copied to production.
- Production import must be schema-validated against the domain schemas before insert.
- Dry-run report required before insert (counts, validation failures, would-insert vs
  would-skip), approved by the owner.
- No card / bank / gateway secrets imported.
- No WhatsApp / clinical data imported.

## 7. Auth Policy

- No public signup (`enable_signup = false`).
- Owner-created production super_admin: the owner creates the auth user and holds the
  password; automation never handles it.
- Admin-created / invited users only: all other users provisioned by a permitted
  admin, each mapped to an active `app_users` row with roles.
- Role assignment process: roles assigned only by a permitted admin
  (`can_manage_users` / `can_manage_roles_permissions`), recorded with audit.
- Break-glass owner: a named owner of the emergency access path, with a documented
  procedure.
- Password reset policy: controlled reset (admin-triggered or email-based with a
  strong policy); no self-service signup.

## 8. Backup and Recovery Checklist

- Backup enabled before real data import (and before any risky migration).
- Restore rehearsal on staging or a scratch project before relying on backups.
- Vercel rollback documented (roll back to previous successful deployment).
- Database rollback via restore from backup or a reviewed forward-only corrective
  migration (never `db reset` on cloud).
- No destructive migration without a verified recent backup first.

## 9. Go / No-Go Preconditions

Production execution may start only if ALL are true:

- Staging remains verified (smoke test still passes on staging).
- Owner inputs complete (Section 2 fully answered).
- Supabase production target confirmed empty / no production data yet.
- Backup decision approved.
- Data import decision approved (payments import vs fresh; package balances import vs
  fresh).
- Production domain decided.
- Rollback owner assigned (who may roll back Vercel / restore the DB).

## 10. Recommended Next Phase

Phase 8C should be the Production Supabase Execution Plan only — still planning, not
execution. It will detail the exact, reviewed commands (project link, forward-only
migration apply, backup/PITR enablement, RLS and denial probes) to be run later, and
will itself stop for owner approval before any command is executed.

## Stop Point

Phase 8B stops after writing this checklist. No production project, deployment, user,
secret, or data was created. Implementation must not begin until the owner completes
the Section 2 inputs and the Section 9 preconditions are met and approved.
