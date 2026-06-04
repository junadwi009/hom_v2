# Phase 7B Staging Supabase Setup Checklist

Planning / checklist only. This phase does not deploy production, does not create
production data, does not run the dummy seed against any cloud project, does not
link a cloud Supabase project, and does not modify application features. Execution
of any cloud command requires explicit owner approval (see Section 13).

## 1. Scope

- Staging Supabase project only.
- No production project.
- No production data.
- No dummy seed (`supabase/seed.sql`) in any cloud project.
- No feature/code work.

## 2. Required Staging Project Settings

- Region recommendation: a region close to the studio for latency, consistent with
  the planned Singapore deployment target (for example `ap-southeast-1`). Confirm
  the exact region with the owner (open question).
- Project naming: a clearly non-production name, for example `hom-studio-os-staging`,
  so it can never be confused with production.
- Database password handling: generate a strong password in the Supabase dashboard;
  store it only in the host secret manager / password manager. Never place it in
  the repo, `.env`, or any committed file.
- API keys handling: capture the staging `anon` key and `service_role` key from the
  dashboard. The `anon` key is for `NEXT_PUBLIC_SUPABASE_ANON_KEY`; the
  `service_role` key is server-only and must never reach the browser or the repo.
- Auth site URL placeholder: set the staging site URL (for example the Vercel
  staging URL) — to be filled in during execution, not committed here.
- Redirect URLs placeholder: add the staging app URLs to the allowed redirect list
  — to be filled in during execution.
- `enable_signup = false`: keep signup disabled in staging (matches the local
  `supabase/config.toml`). Verify it is false in the staging auth settings.
- Email template considerations: if invite/reset emails are tested in staging,
  configure the email provider and templates for staging only; otherwise leave
  email flows untested until approved (open question).

## 3. CLI Linking Strategy

- Link safely (only after approval): from the repo root, link the staging project
  with its project ref, for example `supabase link --project-ref <STAGING_REF>`.
  The ref and any password prompt come from the owner at execution time; do not
  hardcode them here.
- Do not commit `supabase/.temp/project-ref`: linking writes the project ref into
  `supabase/.temp/`. This file must never be committed.
- Confirmed gitignored: `.gitignore` already contains `supabase/.temp/`
  (verified — `git check-ignore` matches `supabase/.temp/project-ref`). Re-confirm
  with `git status --short` that nothing under `supabase/.temp/` is staged before
  any commit.
- Separate local and staging operations: never run staging cloud commands and local
  `supabase db reset` in a way that could cross environments. Keep the local Docker
  stack for development/tests and treat the linked staging project as a distinct,
  approval-gated target. Unlink (or re-verify the active link) before switching back
  to local-only work.

## 4. Migration Strategy

- Forward-only apply: apply `supabase/migrations/` to staging forward-only via
  `supabase db push` (or an equivalent reviewed CI step), only after owner approval.
- Never `db reset` on staging: `supabase db reset` is destructive and is reserved
  for the local Docker project only. It must never be run against a cloud project.
- Apply only after approval: do not run any staging migration command until the
  owner confirms the exact commands and the staging project ref.
- Record migration version before/after: capture `supabase migration list` (or the
  remote migration state) before and after applying, and record the latest applied
  migration timestamp in the execution log.
- Rehearse locally first: before any staging apply, run a clean local rehearsal
  (`supabase db reset` locally) to confirm all migrations apply cleanly from
  scratch, then apply forward-only to staging.

## 5. Seed Strategy

- Do not run `supabase/seed.sql` on staging: the seed is dummy local-only (all
  `Mock *` records) and must never run against a cloud project.
- No local fixture import: the local auth fixture
  (`local.studio.director@example.invalid`) and its mapped `app_users` row are
  local-only and must not be created in staging.
- Staging-safe minimal bootstrap (if needed, and only after approval): instead of
  the dummy seed, propose a separate, minimal staging bootstrap:
  - one staging `super_admin` auth user (real, owner-controlled credentials),
  - its mapped active `app_users` row plus the `super_admin` role mapping,
  - no `Mock` clients/practitioners/services/packages unless explicitly marked as
    staging dummy data and approved by the owner.
- The bootstrap must be a separate, reviewed script — never `seed.sql` — and must
  contain no real client PII unless the owner approves staging test data.

## 6. RLS Verification Strategy

- Adapt existing probes: adapt the rollback SQL probes under `supabase/tests/`
  (`phase_4k`, `phase_5c/5f/5i`, `phase_6c/6e/6g`) to run against staging in a
  read/assert-and-rollback manner, without leaving data behind.
- Verify direct writes denied: confirm direct authenticated insert/update/delete on
  `appointments`, `client_packages`, `package_usage_history`, `payments`, and
  `payment_status_history` remain denied.
- Verify audit insert denied: confirm direct authenticated insert into `audit_logs`
  remains denied.
- Verify role/permission reads work: confirm `get_current_app_user_context()` and
  `has_permission()` return the expected roles/permissions for the staging
  super_admin.
- Verify RPC boundaries: confirm the appointment, package (assign/deduct), and
  payment (create/mark paid/cancel) RPCs enforce permission, status, and ownership
  rules and write status history + audit atomically, exactly as locally verified.

## 7. Auth Verification Strategy

- Signup disabled: confirm an HTTP signup attempt against staging is rejected
  (`enable_signup = false`).
- Invited/admin-created user can log in: the staging super_admin (and any invited
  staging user) can log in through `/login`.
- `/api/me` returns the mapped user: a valid staging session returns the mapped
  `app_users` profile with the expected roles and permissions and `authMode:
  supabase`.
- Missing mapping denied safely: an auth user with no active `app_users` mapping is
  denied with a safe `401`/`403` and no raw database details.
- Permissions load correctly: confirm `currentUser.permissions` includes the
  expected canonical permissions (for example `can_manage_appointments`,
  `can_manage_client_packages`, `can_manage_payments` for the appropriate roles).

## 8. Environment Variables for Staging Vercel

Set on the staging Vercel project/environment only:

- `NEXT_PUBLIC_SUPABASE_URL` — staging project URL.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — staging anon key.
- `HOM_AUTH_MODE=supabase`.
- `HOM_DATA_MODE=supabase`.
- Any future server-only keys (for example `SUPABASE_SERVICE_ROLE_KEY` if a
  server-only admin/import action needs it) are set as server-only secrets and must
  never be exposed to the browser or prefixed `NEXT_PUBLIC_`.

The service-role key must never be added as a `NEXT_PUBLIC_*` variable.

## 9. Safety Gates Before Applying Migrations

All must pass before any staging migration is applied:

- Git clean: `git status --short` shows no unexpected changes, and nothing under
  `supabase/.temp/` is staged.
- Secret scan: re-run the secret scan
  (`SUPABASE_SERVICE_ROLE_KEY|API_KEY|SECRET|TOKEN|sk-|ghp_|github_pat_|BEGIN OPENSSH PRIVATE KEY|BEGIN RSA PRIVATE KEY`)
  and confirm only known-safe matches (placeholders, detection patterns, tests,
  docs).
- No cloud project-ref committed: confirm `supabase/.temp/project-ref` is not
  tracked.
- Full checks pass: `typecheck`, `lint`, `test`, `build`, `build-storybook`, and the
  mock `test:e2e` all pass.
- Owner confirms the staging project ref.
- Owner confirms there is no production data in the target project.

## 10. Staging Smoke Test Checklist

Run after migration + bootstrap, signed in as the staging super_admin:

- Login succeeds; unauthenticated routes redirect to `/login`.
- `/api/me` returns the mapped staging user with expected roles/permissions.
- `/appointments` loads.
- `/packages` loads.
- `/client-packages` loads.
- `/payments` loads.
- Create an appointment (with overlap protection).
- Assign a package to an eligible client.
- Deduct a session from a completed appointment.
- Create a manual payment (pending and paid).
- Mark a pending payment paid and cancel another pending payment.
- Audit/history verification: `audit_logs` and the status-history tables show the
  expected actions with safe metadata only (no payment secrets, card/bank numbers,
  cancellation reason text, notes, contact, clinical, or WhatsApp content).

If staging uses empty reference data, perform the smoke test against staging-safe
bootstrap records rather than dummy `Mock` data.

## 11. Rollback / Recovery Notes

- Frontend rollback: roll back the Vercel staging deployment to the previous
  successful deployment.
- Database rollback: a forward-only migration cannot be undone by `db reset` on
  staging; recovery requires either a restore from backup or a corrective
  forward-only migration.
- No destructive migration without backup: never run a destructive or data-losing
  migration on staging without a verified backup first.

## 12. Open Questions

- Staging region (for example `ap-southeast-1`)?
- Supabase plan for staging (free vs paid), given backup/PITR needs?
- Staging domain / URL (for site URL and redirect URLs)?
- Who owns the staging super_admin credentials?
- Does staging use approved fake demo data or empty reference data only?
- Should email invite/reset be tested in staging, and with which email provider?

## 13. Approval Gate

Do not create, link, or apply staging cloud migrations until the owner approves the
exact execution commands (project ref, link command, migration apply command, and
bootstrap script) and confirms there is no production data in the target project.
