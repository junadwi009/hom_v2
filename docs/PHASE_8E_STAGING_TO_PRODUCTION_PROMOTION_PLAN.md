# Phase 8E Staging-to-Temporary-Production Promotion Plan

Planning only. This phase executes no cleanup SQL, no data deletion, no data import, no
`db reset`, no `seed.sql`, no Vercel deploy, no production user creation, no feature
change, and no cloud mutation. It plans how to promote the current verified staging
environment into a temporary production / soft-launch environment.

## 1. Decision Summary

- The owner chose to use the current staging Supabase + Vercel as the temporary
  production / soft-launch environment.
- This replaces the previous separate-production-project path (Phases 8C/8D execution)
  for now; that path is paused, not cancelled.
- After promotion (naming update + demo-data refresh), this environment should be
  treated as production for operational purposes.

## 2. Current Verified State

- Supabase project ref: `pgokujwfwrxopgwhpluj`.
- App URL: `https://hom-gamma.vercel.app` (repo `junadwi009/hom_v2`, root `apps/web`).
- Migrations applied: all 16, through `20260603000600_payment_status_transitions_rpc`
  (Local == Remote).
- Super_admin works: `junadwi009@gmail.com` (owner-controlled password); `/api/me`
  returns `authMode: supabase`, role `super_admin`, full permissions.
- Smoke test passed: Phase 7H verified auth, page loads, appointment/package/payment
  lifecycles, audit/history, and direct-write denial.
- Known smoke-test data exists: the Phase 7G/7H `STAGING`-prefixed catalog plus the
  smoke-test transactional rows (3 appointments, 1 client package, 3 payments, and
  their status-history + audit rows) remain in the database.

## 3. Risks

- Staging smoke-test data remains in the DB and would appear as "real" once this is
  called production.
- Free Supabase plan: no automated daily backups / PITR, so data loss may be
  unrecoverable.
- Temporary Vercel URL (`hom-gamma.vercel.app`) instead of a final production domain.
- Naming confusion: the same project is "staging" historically and "production" going
  forward; documents and people may disagree on which it is.
- Staff may use the wrong environment if labels are unclear (there is no separate
  staging anymore once this becomes production).

## 4. Required Cleanup Decision

- Option A — Clean up the `STAGING` smoke-test data using reviewed SQL, so temporary
  production starts with a clean, presentation-ready dataset.
- Option B — Keep the `STAGING` smoke-test data as historical test evidence.

Recommendation: **Option A.** A soft-launch / presentation environment should not carry
leftover `STAGING` test rows that look like real business records. Cleanup is scoped,
reviewed, reversible-by-recreation, and preserves all RBAC/auth. (Executed under
Phase 8F, not here.)

## 5. Cleanup Scope Proposal

If the owner approves cleanup (executed in Phase 8F), remove ONLY the data created by
the staging smoke test and the Phase 7G minimal catalog:

- `STAGING Test Client`
- `STAGING Practitioner One`
- `STAGING Test Service`
- `STAGING Test Pack`
- related `appointments`
- related `client_packages`
- related `package_usage_history`
- related `payments`
- related `payment_status_history`
- related `appointment_status_history`
- related `audit_logs` targeting those rows

Rules:

- No `db reset`.
- No `seed.sql`.
- Single transaction.
- `ON_ERROR_STOP`.
- Dry-run counts before deletion.
- Owner approval before deletion.
- Backup / export before deletion if practical (see Section 9; limited on Free).

## 6. What Must Remain

Cleanup must never touch:

- migrations,
- the RBAC reference (`roles`, `permissions`, `role_permissions`),
- the super_admin auth user (`auth.users` for `junadwi009@gmail.com`),
- its `app_users` mapping,
- its `user_roles` mapping.

## 7. Production Env Naming Update

- Update docs to call this environment "temporary production / soft-launch", not
  "staging".
- Keep the technical project ref unchanged (`pgokujwfwrxopgwhpluj`).
- Avoid saying "staging" to non-technical staff (use "the HOM Studio app" / "soft
  launch").
- Later, when a final domain exists, update the Supabase Auth Site URL and Redirect
  URLs to the final domain and re-verify login.

## 8. Vercel Plan

- Continue using `https://hom-gamma.vercel.app` temporarily if the owner approves.
- Env vars already point to the chosen Supabase project (`pgokujwfwrxopgwhpluj`);
  `HOM_AUTH_MODE=supabase`, `HOM_DATA_MODE=supabase`.
- Confirm production branch `main` and root `apps/web`.
- No service-role key in `NEXT_PUBLIC`.
- No redeploy required unless configuration changes.

## 9. Backup / Safety Plan

Because Supabase Free is in use:

- Document the Free-plan risk (no managed daily backups / PITR).
- Recommend a manual export (for example `pg_dump` of the business tables, or CSV
  export) before real operations begin, and after the demo refresh as a known-good
  snapshot.
- Recommend upgrading to a paid tier before serious production data accumulates.
- Define who is responsible for the backup/export (the rollback owner / a named
  person).

## 10. Day-One Access

- Keep only `super_admin` (`junadwi009@gmail.com`) at first.
- Do not create dummy production users.
- The owner must provide real staff emails before any staff user is added.
- Proposed roles (created later, with real emails): `studio_director`,
  `admin_frontdesk`, `finance_admin`, and `practitioner` only if needed. (Payment
  management is held only by `super_admin`, `studio_director`, and `finance_admin`.)

## 11. Go / No-Go Checklist

Before staff use:

- Cleanup decision approved.
- Login works.
- `/api/me` works (super_admin role/permissions).
- No `STAGING` test data remains (if cleanup chosen).
- Backup / export done.
- Staff access plan approved.
- User guide prepared.
- Owner accepts the Free-plan risk.

## 12. Recommended Next Phases

- Phase 8F: Presentation demo data refresh (cleanup + clean DEMO dataset).
- Phase 8G: Temporary production readiness checklist.
- Phase 8H: Day-one staff access plan.

## Safety Blocker Assessment

No safety blocker prevents proceeding to the Phase 8F demo refresh: the target project
ref is the known `pgokujwfwrxopgwhpluj`, the data to remove is the identifiable
`STAGING` smoke-test set, and RBAC/auth are explicitly preserved. Phase 8F begins with
a read-only dry-run and aborts if the project ref is wrong or unexpected
non-`STAGING`/non-`DEMO` business data is present.

## Stop Point

Phase 8E stops after writing this plan. No data was deleted, imported, or changed.
Proceeding to Phase 8F (demo data refresh) per the owner's instruction, beginning with
a read-only dry-run.
