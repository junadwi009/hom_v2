# Phase 7C Staging Execution Command Plan

Planning only. This document is the exact, safe command runbook for staging
Supabase setup. It is NOT executed in Phase 7C. No cloud commands run, no
`supabase link`, no `supabase db push`, no cloud data, no Vercel deploy, and no
product feature changes happen here. Execution is gated on owner approval and the
required inputs below (see Section 10).

All commands assume the repository root on Windows PowerShell and the project's
`corepack pnpm exec supabase ...` CLI usage. Placeholders in `<ANGLE_BRACKETS>` are
supplied by the owner at execution time and must never be committed.

## 1. Required Owner Inputs

Collect and confirm before any execution (do not commit these values):

- `STAGING_PROJECT_REF` — the staging Supabase project reference.
- `STAGING_SUPABASE_URL` — `https://<STAGING_PROJECT_REF>.supabase.co`.
- `STAGING_ANON_KEY` — staging anon (publishable) key.
- `STAGING_SITE_URL` — staging app URL (Vercel staging).
- `STAGING_REDIRECT_URLS` — allowed auth redirect URLs for staging.
- `STAGING_SUPERADMIN_EMAIL` — the staging super_admin email (owner-controlled).
- Written confirmation that the target project contains NO production data.

If any input is missing or unclear, stop (see Section 9).

## 2. Preflight Local Commands

Run locally; all must pass before touching any cloud target.

```powershell
git status --short
git branch --show-current
git remote -v
git rev-parse HEAD
```

Secret scan (expect only known-safe matches: `.env.example` placeholders,
detection patterns in `packages/domain/src/payments/schemas.ts`, test assertions,
and docs):

```powershell
rg -n "SUPABASE_SERVICE_ROLE_KEY|API_KEY|SECRET|TOKEN|sk-|ghp_|github_pat_|BEGIN OPENSSH PRIVATE KEY|BEGIN RSA PRIVATE KEY" . --glob '!node_modules/**' --glob '!.git/**'
```

Confirm no cloud project ref is present/tracked:

```powershell
Test-Path supabase/.temp/project-ref
```

Full checks (all must pass):

```powershell
corepack pnpm typecheck
corepack pnpm lint
corepack pnpm test
corepack pnpm build
corepack pnpm build-storybook
corepack pnpm test:e2e
```

Pass criteria: git clean (or only the expected docs), secret scan clean,
`Test-Path` returns `False`, and all checks green.

## 3. Local Migration Rehearsal

Rehearse the full migration chain from scratch against the LOCAL Docker project
only. This never touches any cloud target.

```powershell
corepack pnpm exec supabase db reset
```

- This resets the LOCAL Docker database only.
- Confirm the output applies every migration under `supabase/migrations/` cleanly
  and seeds the local dummy data.
- Do NOT pass `--linked` and do NOT run this against a cloud target. `supabase db
  reset` is local-only by design here; `--linked` is destructive and is forbidden
  for staging/production.

## 4. Safe Cloud Link Command (gated)

Only after Sections 1–3 pass and the owner approves the exact ref:

```powershell
corepack pnpm exec supabase link --project-ref <STAGING_PROJECT_REF>
```

- Warning: this writes the project ref into `supabase/.temp/project-ref`.
- That path is already gitignored (`.gitignore` line `supabase/.temp/`).
- Immediately verify it remains untracked:

```powershell
git check-ignore -v supabase/.temp/project-ref
git status --short
```

`git status --short` must show nothing under `supabase/.temp/`. If it does, stop and
do not commit.

## 5. Staging Migration Commands (gated)

Only after a successful, owner-approved link:

```powershell
# Record the remote migration state BEFORE applying.
corepack pnpm exec supabase migration list

# Apply migrations forward-only to staging.
corepack pnpm exec supabase db push

# Record the remote migration state AFTER applying.
corepack pnpm exec supabase migration list
```

- Record the latest applied migration timestamp before and after in the execution
  log (expected newest local migration: `20260603000600_payment_status_transitions_rpc`).
- NEVER run `supabase db reset` (or `db reset --linked`) against staging. It is
  destructive and forbidden for cloud targets.
- If `migration list` shows unexpected remote migrations or drift, stop (Section 9).

## 6. Staging Bootstrap Strategy

Plan a separate, reviewed bootstrap (NOT `supabase/seed.sql`) that creates only the
minimum to operate staging. It must be reviewed and owner-approved before running.

Bootstrap contents (staging-safe only):

- One staging `super_admin` auth user for `STAGING_SUPERADMIN_EMAIL`. Preferred
  path: create/invite the auth user via the Supabase dashboard (or admin API), so
  no raw credentials live in the repo.
- One mapped active `public.app_users` row for that auth user.
- A `public.user_roles` mapping granting the `super_admin` role.

Bootstrap exclusions:

- Do NOT run the dummy `supabase/seed.sql`.
- Do NOT import the local fixture `local.studio.director@example.invalid`.
- Do NOT insert `Mock` clients/practitioners/services/packages unless explicitly
  marked as staging dummy data and approved by the owner.

The bootstrap mapping SQL (app_users + user_roles) is authored and reviewed as a
separate Phase 7E artifact and is not part of this command plan; this section only
fixes the scope and exclusions.

## 7. Staging Verification Commands

After migration + bootstrap, verify staging mirrors the local guarantees.

Auth signup disabled (expect a non-success status such as `422`):

```powershell
# Attempt a signup against staging auth; it must be rejected.
# (Use the staging auth signup endpoint with STAGING_SUPABASE_URL + STAGING_ANON_KEY.)
```

`/api/me` after login: sign in as the staging super_admin through `/login`, then
confirm `/api/me` returns the mapped user with the expected roles/permissions and
`authMode: supabase`.

RLS / direct-write probes adapted for staging (read/assert-and-rollback only,
leaving no data behind): adapt the rollback probes under `supabase/tests/`
(`phase_4k`, `phase_5c/5f/5i`, `phase_6c/6e/6g`) and confirm:

- direct authenticated insert/update/delete on `appointments`, `client_packages`,
  `package_usage_history`, `payments`, and `payment_status_history` remain denied,
- direct authenticated insert into `audit_logs` remains denied,
- `get_current_app_user_context()` / `has_permission()` return the expected
  roles/permissions,
- appointment/package/payment RPC permission, status, and ownership boundaries
  hold.

Smoke test checklist (Phase 7B, Section 10): login, `/api/me`, appointments,
packages, client packages, payments, create appointment, assign package, deduct
session, create payment, mark paid/cancel payment, and audit/history verification
with safe metadata only.

## 8. Unlink / Cleanup Notes

- Confirm `supabase/.temp/project-ref` is not committed:

```powershell
git status --short
git check-ignore -v supabase/.temp/project-ref
```

- Return to local-only workflow safely: local `corepack pnpm exec supabase db
  reset` and `supabase start` always target the LOCAL Docker project regardless of
  any link, so they remain safe. To fully detach from staging, delete
  `supabase/.temp/project-ref` (it is gitignored) before resuming local-only work,
  and never run remote/`--linked`/`db push` commands without re-confirming the
  intended target.

## 9. Abort Conditions

Abort the execution immediately if any of the following occur:

- The target project contains production data (or this cannot be confirmed).
- The secret scan finds a real secret value (not a placeholder/detection
  pattern/test/doc).
- The working tree is dirty with unrelated changes, or anything under
  `supabase/.temp/` is staged.
- The staging project ref is unclear, unconfirmed, or mismatched.
- `supabase migration list` shows unexpected remote migrations or drift.
- The owner has not approved the exact commands and inputs.

On abort: do not link, do not push, do not bootstrap; report the blocking condition
and wait for owner direction.

## 10. Approval Gate

Do not execute this plan until the owner provides the staging project ref and the
required inputs in Section 1 and approves command execution.
