# Phase 8C Production Supabase Execution Plan

Planning only. This phase creates no production Supabase project, runs no
`supabase link` / `supabase db push` / any cloud command, creates no production users,
imports no real data, and deploys no production Vercel. It documents the exact,
reviewed runbook to be executed later, only after the owner provides the production
project ref / URL / anon key and explicitly approves command execution (see the
Approval Gate).

## 1. Resolved Owner Inputs

- Production Supabase region = `ap-south-1` / Mumbai.
- Supabase plan tier = Free first.
- Production domain = TBD (no domain yet; temporary Vercel production URL to be used
  later if approved).
- Production super_admin email = `junadwi009@gmail.com` (owner-controlled password).
- Historical payments = start fresh (do NOT import).
- Existing package balances / `client_packages` = start fresh (do NOT import).
- Production transactional data = start fresh.
- Staff users = build a day-one staff access matrix first; do NOT create dummy
  production users yet.

## 2. Critical Risk Note — Free Plan

The owner selected the Supabase Free tier first. This is acceptable only with eyes
open:

- Free is acceptable only for early rehearsal / soft launch with little or no
  irreplaceable real data.
- Free is NOT ideal for real business production, because automated daily backups and
  point-in-time recovery (PITR) are not available / are insufficient on Free. If real
  client and payment data accumulates, a mistake or data loss may be unrecoverable.
- Before serious real-data usage, the owner should either upgrade to a paid tier
  (enabling daily backups + PITR) or define and rehearse a manual backup/export process
  (for example scheduled `pg_dump` / CSV export of the business tables) with a tested
  restore path.
- This risk must be explicitly acknowledged by the owner as a Go/No-Go precondition
  (Section 10) before any real data is entered into production.

## 3. Production Project Requirements

- A new Supabase project, separate from staging.
- The production project ref MUST NOT equal the staging ref `pgokujwfwrxopgwhpluj`
  (the runbook aborts if they match).
- Project name suggestion: `hom-studio-os-prod` (clearly production; never confusable
  with `...-staging`).
- Region: `ap-south-1` / Mumbai.
- `enable_signup = false` (verify in production auth settings).
- No `seed.sql` ever on production.
- No `db reset` ever on production.
- No staging credential reuse: new DB password, anon key, service-role key, and access
  token.

## 4. Production Command Runbook (planning only — DO NOT EXECUTE)

These are the exact commands to run later, in order, only after owner approval.
`<PRODUCTION_PROJECT_REF>` and credentials are provided by the owner at execution
time and are never hardcoded or committed. Connection follows the verified Phase 7D/7E
pattern: a Supabase access token + DB password supplied only as transient, server-only
environment variables, never printed or committed.

```bash
# 0. Preflight — clean tree, no secrets, green checks, local rehearsal
git status --short                       # expect clean / only intended docs
rg -n "SUPABASE_SERVICE_ROLE_KEY|API_KEY|SECRET|TOKEN|sk-|ghp_|github_pat_|BEGIN OPENSSH PRIVATE KEY|BEGIN RSA PRIVATE KEY" . \
  --glob '!node_modules/**' --glob '!.git/**'    # expect only known-safe matches
corepack pnpm typecheck && corepack pnpm lint && corepack pnpm test \
  && corepack pnpm build && corepack pnpm build-storybook && corepack pnpm test:e2e

# 1. Local migration rehearsal (local Docker only — NEVER against cloud)
supabase db reset      # LOCAL project only, confirms all migrations apply clean from scratch

# 2. Link the PRODUCTION project (writes supabase/.temp/project-ref — gitignored)
supabase link --project-ref <PRODUCTION_PROJECT_REF>
#    ABORT if <PRODUCTION_PROJECT_REF> == pgokujwfwrxopgwhpluj (that is staging)

# 3. Migration state BEFORE
supabase migration list                  # expect empty Remote column (fresh project)

# 4. Forward-only apply (NO seed, NO reset)
supabase db push                         # applies supabase/migrations/ forward-only

# 5. Migration state AFTER
supabase migration list                  # expect Local == Remote through 20260603000600

# 6. Verify temp files remain ignored / uncommitted
git check-ignore -v supabase/.temp/project-ref supabase/.temp/pooler-url
git status --short                       # expect nothing under supabase/.temp staged

# NEVER on production:
#   supabase db reset        (destructive — local only)
#   psql ... -f supabase/seed.sql   (dummy data — never on cloud)
```

After `db push`, run the RLS / direct-write-denial / audit-insert-denial probes
(adapted from `supabase/tests/`) against production read-only, exactly as verified on
staging.

## 5. Production Vercel Plan

- Source repo: `junadwi009/hom_v2`.
- Root directory: `apps/web`.
- Production environment variables (Production environment only):
  - `NEXT_PUBLIC_SUPABASE_URL` — production project URL.
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — production anon key.
  - `HOM_AUTH_MODE=supabase`.
  - `HOM_DATA_MODE=supabase`.
- No service-role key in `NEXT_PUBLIC`: `SUPABASE_SERVICE_ROLE_KEY` (if ever needed)
  stays server-only.
- Production domain = TBD; with owner approval, use the Vercel production URL
  temporarily until a final domain exists, and set the Supabase site/redirect URLs to
  that temporary URL in the meantime.
- Rollback: confirm instant roll back to the previous successful Vercel deployment.

## 6. Production Super_admin Bootstrap Plan (planning only)

Mirrors the verified Phase 7E staging bootstrap:

- The owner manually creates the auth user for `junadwi009@gmail.com` in the Supabase
  dashboard (Authentication → Users → Add user). Automation never creates the auth user
  and never handles its password.
- A separate, reviewed bootstrap script (never `seed.sql`), applied as a single
  `ON_ERROR_STOP` transaction, inserts only:
  - the canonical `roles`,
  - the canonical `permissions`,
  - the canonical `role_permissions`,
  - exactly one `app_users` mapping for the super_admin,
  - exactly one `user_roles` mapping granting `super_admin`.
- No business data in the bootstrap (no clients/practitioners/services/packages, no
  `Mock` data, no transactional rows).
- Verify post-bootstrap: super_admin holds the four operational permissions
  (`can_manage_appointments`, `can_reschedule_appointments`,
  `can_manage_client_packages`, `can_manage_payments`) and
  `get_current_app_user_context()` resolves correctly.

## 7. Day-One Staff Access Matrix (proposed — DO NOT create users)

Permissions below are taken from the canonical RBAC reference (`supabase/seed.sql`
roles/permissions/role_permissions). This is a proposal; the owner supplies real emails
later, and users are created only in the approved auth/bootstrap phase.

| Role | Email | Purpose | Likely permissions (canonical) | Day-one? | Can manage payments? |
|---|---|---|---|---|---|
| `super_admin` | `junadwi009@gmail.com` | Technical/system owner; bootstrap + break-glass | ALL permissions | Yes (required) | Yes |
| `studio_director` | owner to provide | Business owner/director; broad operations + approvals | clients, practitioners, services, appointments (manage/reschedule), client packages, payments (view/manage), audit view, financials, + approvals | Recommended | Yes |
| `admin_frontdesk` | owner to provide | Daily front-desk: clients, appointments, support | view/manage clients, view practitioners, view team attendance, appointments (view/manage/reschedule), whatsapp inbox/send | Likely (core daily ops) | No |
| `finance_admin` | owner to provide | Finance views and manual payment operations | view clients, payments (view/manage), financials (view/edit/export) | Optional day-one | Yes |
| `practitioner` | owner to provide | Practitioner: assigned schedule + clinical-adjacent (later) | view clients, view appointments, view clinical cases, view/edit session notes, request note unlock | Optional day-one | No |

Notes:

- Only `super_admin`, `studio_director`, and `finance_admin` carry
  `can_manage_payments`. `admin_frontdesk` and `practitioner` cannot manage payments.
- `practitioner` is read-mostly for the current MVP (clinical notes features are NOT
  enabled in this rollout; the role exists but its clinical permissions back unbuilt
  features).
- Minimum viable day-one: `super_admin` plus `studio_director` and/or
  `admin_frontdesk` for real operations. `finance_admin` and `practitioner` can be
  added when needed.

## 8. Start-Fresh Data Plan

Per the owner's decision, production starts fresh for transactional data:

- No historical payments import.
- No existing package balance (`client_packages`) import.
- Production starts with empty transactional data (`appointments`, `client_packages`,
  `package_usage_history`, `payments`, `payment_status_history`, `audit_logs` all
  empty; audit trail begins at go-live).
- Still required: a real reference-data decision for `clients`, `practitioners`,
  `services`, and `packages` — whether to import existing real records or enter them
  manually in-app. (Reference data is distinct from transactional data; "start fresh"
  for transactions does not by itself decide the catalogs.)
- Recommendation: handle real reference data via a separate Phase 8F import with a
  dry-run report (schema-validated, idempotent) approved by the owner before insert —
  not the dummy seed, not `Mock` data.

## 9. Production Verification Plan

After production migration + bootstrap + (later) reference import, signed in as the
production super_admin (owner-performed login):

- Login succeeds; unauthenticated routes redirect to `/login`.
- `/api/me` returns the mapped production super_admin with `authMode: supabase` and
  expected roles/permissions.
- Page loads (no 500): `/appointments`, `/packages`, `/client-packages`, `/payments`.
- Create an appointment (with overlap protection).
- Assign a package to an eligible client.
- Deduct a session from a completed appointment (idempotent; duplicate blocked).
- Create a manual payment (pending and paid).
- Mark a pending payment paid; cancel another pending payment.
- Audit / history verification: `audit_logs` and status-history tables show expected
  actions with safe metadata only (no payment secrets, card/bank numbers, cancellation
  reason text, notes, contact, clinical, or WhatsApp content).
- Direct browser write denial: confirm the authenticated role is read-only on the
  sensitive tables (writes only via RPC).

## 10. Abort Conditions

Abort the execution (do not proceed) if any of these are true:

- The production project ref equals the staging ref `pgokujwfwrxopgwhpluj`.
- The target project already contains unexpected data (not an empty fresh project).
- Owner inputs are incomplete (Section 2 of Phase 8B not fully answered).
- The Free-tier backup risk (Section 2) has not been acknowledged by the owner.
- The secret scan finds any real secret (not a known-safe match).
- Migration drift exists (Local != Remote, or migrations do not apply cleanly in the
  local rehearsal).
- The production domain / environment is unclear and no temporary URL is approved.
- The owner has not approved the exact commands to run.

## 11. Approval Gate

Do NOT execute this production plan until the owner provides:

- the production project ref,
- the production Supabase URL,
- the production anon key,
- the Vercel production URL / domain decision (or approval to use the temporary Vercel
  production URL),

and gives explicit approval for production command execution.

## Stop Point

Phase 8C stops after writing this plan. No production project, link, migration, user,
secret, or data was created or changed. The next phase (8D, Production Vercel setup
plan) remains planning-only and is also approval-gated.
