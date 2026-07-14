# Approval Backend — Staging-Readiness / PR Verification Log

## 1. Task title
Staging-readiness & PR verification pass for the Approval Backend branch (review only — no code
changes, no merge, no push to main).

## 2. Review date
2026-06-08.

## 3. Branch reviewed
`phase-approval-backend`.

## 4. Base branch
`main` (`origin/main` = `fb8a126`, production-tracking).

## 5. HEAD commit
`97c02f9` ("Harden approval backend pre-merge safeguards"). `origin/phase-approval-backend` =
`97c02f9` (in sync). Not merged into `main`.

## 6. PR status
Open, pushed, **not merged**. `main` unchanged by the branch.

## 7. Files changed summary (`origin/main...HEAD`)
13 files, +2430 / −18, all approval-scoped:
- UI/feature: `app/approvals/page.tsx`, `features/approvals/{approval-actions,approval-helpers,approvals-page}.tsx`.
- Server/lib: `lib/approvals/server/{approval-loader,submit-approval-action}.ts`,
  `lib/approvals/supabase/{approval-mutations,approval-queries}.ts`.
- Migrations: `20260608000100/000200/000300/000400_*.sql`.
- Docs: `APPROVAL_BACKEND_IMPLEMENTATION_LOG.md`.
- **Not present:** `.env`, secrets, `.claude/`, `.next`, `node_modules`, build artifacts, DB dumps,
  unrelated UI, production credentials, or real side-effect code.

## 8. Validation commands run
- `supabase migration up --local`
- `corepack pnpm --dir apps/web typecheck`
- `corepack pnpm --dir apps/web lint`
- `corepack pnpm --dir apps/web build`
- psql verification inside the local DB container (RLS/grants/policies, demo entry).

## 9. Validation results
- migration up: **PASS** ("Local database is up to date"; no reset; demo financial entry preserved).
- typecheck: **PASS**. lint: **PASS** (0 errors / 0 warnings). build: **PASS** (exit 0, compiled).

## 10. Migration readiness findings
- Order: `20260608000100–000400`, after the existing head `20260607000500`. ✅
- Forward-only, each migration transactional (Supabase CLI wraps per file). ✅
- Approval-specific tables present: `approval_requests`, `approval_events`, `approval_comments`,
  `approval_evidence`, `approval_rules` (+ sequence + private view + helpers). ✅
- **Deployment note (carried):** prod/staging DB migrations must be applied **before/with** the code
  deploy, or `/approvals` fails closed (loader returns `[]` → empty state, no crash). Documented in
  the implementation log.
- Demo seed (`…000200`) and the second-approval demo flag (`…000400`) are **local/dev-guarded**
  (keyed on the `…@example.invalid` seed user) → no-op on staging/production.

## 11. RLS / RPC security findings (live DB evidence)
- RLS **enabled** on all 5 approval tables. ✅
- **Only SELECT policies** exist (no INSERT/UPDATE/DELETE policies). ✅
- `authenticated` holds **SELECT only** on all 5 tables (no write grant). ✅
- ⇒ Direct browser writes are impossible; mutations only via SECURITY DEFINER RPCs.
- RPC safety: functions `set search_path = public, private`; null-check `auth.uid()`; require an
  **active** app_user; permission-check before write; `transition_approval_request` takes
  `FOR UPDATE` and guards `status in ('pending','need_more_info','escalated')` (closed requests
  cannot be re-approved/rejected); requester forced to actor. ✅

## 12. Sensitive redaction findings
- Enforced at the **data layer** (the `private.approval_request_rows` view), gated by
  `private.can_view_sensitive_approval_details()` (owner / `can_view_clinical_cases` /
  `can_approve_note_unlock`).
- For `sensitive = true OR domain = 'clinical'` and non-clinical callers: `title` →
  "Permintaan approval klinis"; `reason`, `risk_check`, `related_record_label` → placeholders;
  `client_name` → null; `evidence` → `[]`; event `note` → null.
- Verified (prior pass, same HEAD) via psql impersonation: owner full; `finance_admin` redacted;
  non-clinical rows intact. **Not UI-only.** ✅

## 13. Create gate findings
- `create_approval_request` uses `private.can_create_approval_request(type, domain)` (per-domain
  mapping; owner bypass) — **not** the broad read gate. ✅
- FK existence checks for branch / approver(active) / client; `client_id` references rejected for
  creators lacking client visibility (`CLIENT_REF_NOT_ALLOWED`). ✅
- Verified: `finance_admin` → financial create ALLOWED, clinical DENIED, admin DENIED. ✅

## 14. Second-approval (SoD) findings
- `requires_second_approval`: requester blocked from approve (`SECOND_APPROVAL_REQUIRED_APPROVE`)
  and reject (`SECOND_APPROVAL_REQUIRED_REJECT`); requester cannot be the escalation approver
  (`SECOND_APPROVAL_INVALID_APPROVER`). Guard raises **before any write**. ✅
- Verified: requester blocked; a different authorized owner approves successfully; blocked attempt
  wrote **no** event/audit (status unchanged). ✅

## 15. Audit log findings
- create + approve + reject + need_more_info + escalate write `audit_logs` (`approval_request.*`,
  with `secondApproval` metadata). `approval_events` written for successful transitions. Visible in
  `/settings/audit-logs`. ✅
- Intentional limitation: blocked/denied actions are **not** audited (fail-before-write).

## 16. Browser smoke results (localhost:3000, this pass)
- Route health: `/approvals`, `/settings/audit-logs`, `/financials`, `/payments`, `/clients` →
  all **HTTP 200**.
- `/approvals`: loads 4 real persisted `[DEMO]` requests; auto-selects highest-priority active
  request (Refund); detail panel renders. ✅
- (Same HEAD, prior pass) SoD self-approval blocked with clean error + no state change; sensitive
  clinical warning shown; `/settings/audit-logs` shows `approval_request.*`; `/financials` demo
  entry present; `/payments` business KPIs render; `/clients` renders. ✅
- **Data note:** demo rows reflect earlier QA on this HEAD — `Hard-delete` = Disetujui, `Unlock` =
  Ditolak, `Refund` = Menunggu + `requires_second_approval`. This review did **not** modify data.

## 17. Remaining limitations (documented, intentional)
- No real approval side-effects (status-only).
- Blocked/denied actions are not audited.
- Create gate is per-domain, not fully per-type.
- Only a basic single second-approval guard (no multi-stage / N-approver).
- Migrations must be applied before/with deploy.

## 18. Staging verdict
**SAFE to deploy to staging** and safe to keep open for review. RLS is fail-closed (RLS on, SELECT
only, no write grant/policy), all mutations are RPC-only and audited, PHI (incl. title) is redacted
at the data layer, access/create gates are aligned & per-domain, SoD is enforced, and demo/seed data
is local-only. Gates green; diff is scoped and clean.

## 19. Production verdict
**NOT production-ready.** Approvals are status-only; real domain side-effects are not implemented.
Merging to `main` auto-deploys code while DB migrations are manual.

## 20. Required steps before merge
- (Staging merge) none blocking. Ensure the reviewer/runbook applies the 4 migrations to the target
  DB before/with the deploy. Optionally seed demo approvals on staging via `create_approval_request`
  (the `[DEMO]` seed is local-only).

## 21. Required steps before production
1. Apply approval migrations to the production DB **before** the code deploy (manual; not auto).
2. Design + implement real approval side-effects (refund/note-unlock/role/export/blast) via each
   domain's own audited RPC — out of scope here.
3. Decide on multi-stage / N-approver if required; tighten create gate to per-type if desired.
4. Optionally audit denied/blocked actions.

## 22. Confirmation
- **No merge** performed. **No push to `main`.** **No real approval side-effects** implemented.
- **Demo financial entry not deleted** (`Penjualan Membership` / Rp 8.500.000 present).
- This pass made **no code changes**; the only file added is this review log.
