# Phase 7A Production Readiness Plan

Planning only. This phase adds no code, migration, deployment, or production
service. It plans what is required to move HOM Studio OS v2 from the local
operational MVP to safe internal production usage. No deployment happens in
Phase 7A.

## 1. Current Baseline

Tagged at `operational-mvp-local-v0.2`, verified locally:

- Local Supabase auth: cookie-backed sessions, `enable_signup = false`, mapped
  `app_users` actors, `public.get_current_app_user_context()`, roles via
  `user_roles`, permissions via `role_permissions`, and `private.has_permission()`.
- Appointment lifecycle: create with overlap protection, reschedule, cancel,
  complete, no-show — all through server-only `security definer` RPCs with status
  history and audit.
- Package layer: catalog + client package assignment and one-session deduction on
  a completed appointment, with usage history and audit; idempotent per
  appointment.
- Manual payment: create (pending/paid), mark paid, cancel — server-only audited
  RPCs with `payment_status_history` and `payment.*` audit actions; cancellation
  reason kept only in status history, never in audit metadata.
- Audit/history: `audit_logs`, `appointment_status_history`,
  `package_usage_history`, `payment_status_history` with safe-metadata-only rules.
- RLS / direct-write protection: every sensitive table is RLS-enabled, read-only
  from the browser, with no direct browser insert/update/delete and no direct
  browser audit inserts; all writes go through permission-checked, atomic RPCs.
- Verification assets: rollback SQL probes under `supabase/tests/` and guarded
  local-Supabase Playwright specs gated by `HOM_E2E_LOCAL_SUPABASE`.
- Data mode switches: `HOM_AUTH_MODE` and `HOM_DATA_MODE` (`mock` default,
  `supabase` for local stack). Mock data is dummy-only.

Out of scope at baseline (still deferred): refund/failed payment transitions,
finance ledger, commission, invoice PDF, payment gateway, clinical notes,
WhatsApp, AI, package payment gating.

## 2. Production Risks

- Auth and invite flow: there is no production invite/admin-created-user flow yet;
  signup is disabled, so a safe way to provision real users is required.
- Environment separation: local, staging, and production must not share databases,
  secrets, or auth user pools.
- Secrets management: `SUPABASE_SERVICE_ROLE_KEY` and future provider keys must be
  server-only and stored in the host secret manager, never in the repo or browser.
- Database backup: no automated backup/restore is configured for a cloud project
  yet.
- Migration strategy: migrations are local-applied via `supabase db reset`; a
  forward-only, reviewed deployment path to staging/production is needed.
- Role/permission management: roles/permissions are seeded locally; production
  needs a controlled assignment process and a real super_admin bootstrap.
- Audit log retention: no retention/rotation policy or access controls beyond RLS
  exist for `audit_logs`.
- Monitoring: no uptime/health monitoring is configured.
- Error tracking: no Sentry (or equivalent) wiring exists yet.
- Deployment rollback: no documented rollback for frontend or database.
- Data import: real clients/practitioners/services/packages must be imported
  without dummy data leaking in.
- User training: studio staff need a short operating guide and safe-use rules.

## 3. Environment Plan

Three isolated environments, each with its own Supabase project, secrets, and
hosting target:

- Local: local Supabase + `pnpm dev`; dummy seed; `HOM_AUTH_MODE`/`HOM_DATA_MODE`
  toggled for development and the guarded E2E specs.
- Staging: a dedicated cloud Supabase project + a Vercel preview/staging
  deployment; real schema, no real client data, used for migration and smoke-test
  rehearsal.
- Production: a dedicated cloud Supabase project + the production Vercel
  deployment; real data, backups, monitoring, and restricted access.

Promotion flow: local → staging → production, never skipping staging for schema or
auth changes.

## 4. Supabase Plan

- Local project vs cloud project: keep the local Docker project for development and
  tests; create separate staging and production cloud projects (region close to
  the studio, consistent with the Singapore deployment target).
- Production Supabase setup: provision the project, set Postgres/auth config,
  capture the project ref and keys into the host secret manager (never the repo).
- Migration deployment: link the CLI per environment and apply
  `supabase/migrations/` forward-only via `supabase db push` (or CI), reviewed and
  rehearsed on staging first. Never `db reset` a cloud project.
- Seed strategy: `supabase/seed.sql` is dummy local-only and must not run against
  staging/production. Production gets real reference data through a separate,
  reviewed import (Section 7), not the dummy seed.
- Auth config: keep `enable_signup = false`; configure site URL, redirect URLs,
  password policy, and email templates per environment.
- RLS verification: after each environment migration, run the read/permission/
  denial assertions adapted from the `supabase/tests/` probes against that
  environment to confirm RLS and direct-write blocks hold.
- Backup/restore: enable automated daily backups and point-in-time recovery on the
  production project; document and rehearse a restore on staging.

## 5. Vercel / Hosting Plan

- Frontend deployment: deploy `apps/web` (Next.js) to Vercel per the locked stack;
  optional backend/worker later on Render only if justified.
- Env variables: set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  `HOM_AUTH_MODE=supabase`, `HOM_DATA_MODE=supabase` per environment; keep
  `SUPABASE_SERVICE_ROLE_KEY` and any provider keys as server-only secrets.
- Preview deployments: wire preview deployments to the staging Supabase project,
  never production.
- Production domain: configure the production domain and Supabase redirect/site
  URLs to match.
- Build checks: gate deploys on typecheck, lint, test, build, build-storybook, and
  the mock Playwright suite; treat the guarded local-Supabase specs as a manual
  pre-release rehearsal.

## 6. Auth Plan

- No public signup: keep `enable_signup = false` in every environment.
- Invite / admin-created users: provision users via an admin-created flow (Supabase
  admin invite or a server-only admin action), each mapped to an active `app_users`
  row with assigned roles.
- Password reset policy: define a controlled reset path (admin-triggered or
  email-based with a strong policy); no self-service signup.
- Role assignment process: roles are assigned only by a permitted admin
  (`can_manage_users` / `can_manage_roles_permissions`), recorded with audit.
- First production super_admin setup: a one-time, documented bootstrap that creates
  the initial super_admin (auth user + mapped active `app_users` + `super_admin`
  role) using server-only credentials, then verifies `/api/me` returns the expected
  roles/permissions.

## 7. Data Plan

- Dummy data must not go to production: `supabase/seed.sql`, the local auth fixture
  (`local.studio.director@example.invalid`), and all `Mock *` records are
  local-only and must never run against staging or production.
- Initial real reference import: import real clients, practitioners, services, and
  packages through a reviewed, idempotent import path (Section 10, Phase 7F),
  validated against the domain schemas before insert.
- Payment data import decision: decide whether to import historical payments or
  start payments fresh at go-live; if imported, only safe operational fields (no
  card/bank/gateway secrets) and a defined status mapping.
- Audit trail start date: production audit history starts at go-live; document the
  cutover date so the audit trail's beginning is unambiguous.

## 8. Security Checklist

- No service-role key in the browser: `SUPABASE_SERVICE_ROLE_KEY` stays server-only;
  the existing adapters already avoid a service-role browser client.
- No secrets in the repo: only `.env.example` placeholders; real secrets live in
  the host secret manager. Re-run the secret scan before each release.
- No direct browser writes: confirm RLS keeps `appointments`, `client_packages`,
  `package_usage_history`, `payments`, `payment_status_history`, and `audit_logs`
  read-only from the browser, with writes only via RPC.
- RLS probes: run the adapted `supabase/tests/` rollback probes against each
  environment after migration.
- Permission tests: confirm the domain RBAC matrix matches the DB
  `permissions_key_check` and role grants, and that permission-denied paths return
  safe states.
- Audit safety: confirm audit metadata excludes payment secrets, card/bank numbers,
  cancellation reason text, notes, contact, clinical, and WhatsApp content, and
  that direct audit inserts remain blocked.

## 9. Production MVP Acceptance Criteria

HOM may begin using production only when all of the following are true:

- Login works for invited real users; no public signup.
- Users and roles are set, including a verified super_admin and the operational
  roles the studio needs.
- Appointment lifecycle works end to end (create/overlap/reschedule/cancel/
  complete/no-show) with audit.
- Package deduction works on completed appointments with idempotency and audit.
- Payment tracking works (create, mark paid, cancel) with status history and audit.
- Audit/history is correct and contains no sensitive content.
- Backups are configured on the production Supabase project and a restore has been
  rehearsed on staging.
- A rollback plan exists and is documented for both frontend (Vercel) and database
  (migration/restore).

## 10. Recommended Implementation Breakdown

- Phase 7B: staging Supabase setup plan/checklist (project creation, CLI link,
  migration apply, RLS probe run, no dummy seed).
- Phase 7C: production environment and secrets checklist (secret manager, env
  separation, secret scan gate).
- Phase 7D: deployment pipeline (build checks, Vercel + Supabase promotion, preview
  → staging wiring, rollback steps).
- Phase 7E: production auth / invite flow (admin-created users, super_admin
  bootstrap, password/reset policy, role assignment with audit).
- Phase 7F: data import tooling (idempotent, schema-validated import of real
  clients/practitioners/services/packages; payment import decision).
- Phase 7G: production smoke test checklist (login, roles, appointment lifecycle,
  deduction, payment tracking, audit/history, backup/rollback verification).

Each phase stops for owner approval before the next, consistent with the prior
cadence.

## 11. Open Questions

- Which cloud region and Supabase plan tier for staging and production?
- Email provider for auth (reset/invite) emails, and its sending domain?
- Are historical payments imported, or do payments start fresh at go-live?
- Which monitoring and error-tracking tools are approved (e.g. Sentry, uptime)?
- Who holds production super_admin, and what is the break-glass process?
- What is the data retention policy for `audit_logs` and status history?

## 12. Approval Gate

Implementation must not begin until the owner approves the Phase 7B staging setup
scope and the open questions above. No cloud project, deployment, secret, or
production data is created in Phase 7A.
