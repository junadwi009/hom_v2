# Implementation Log — Approval Backend Workflow

## 1. Task title
Build Approval Backend — turn the local-state Approval Center into a persisted, audited
workflow (tables + RLS + SECURITY DEFINER RPCs + server actions + real loader), keeping the
existing `/approvals` UI behaviour intact.

## 2. Implementation date
2026-06-08 (local-first dev session).

## 3. Starting branch and base commit
- Branch: `phase-approval-backend`
- Base commit: `fb8a126` ("Refine financial payments and approval UX"), created from `main`
  after `main` (`b27ef1d` + `fb8a126`) was pushed to origin.

## 4. Scope completed
- New DB schema for approvals (5 tables + sequence + view + helpers).
- Read-only RLS gated by approval-center access; **all writes via RPC only**.
- SECURITY DEFINER RPCs: list, list rules, create, approve, reject, request-more-info, escalate.
- Each mutation writes an `approval_events` row **and** an `audit_logs` row.
- TS server layer: queries (+ row→`ApprovalRequest` mapper), mutation wrappers, loader,
  submit function, and a single `runApprovalAction` server action.
- `/approvals` now loads **real** persisted requests/rules in Supabase mode; action modal
  persists via the audited RPC; UI behaviour (KPIs, auto-select, tabs, filters, detail panel,
  sticky action bar, clinical hiding, related-record nav) preserved.
- Idempotent local/demo seed (4 requests + 5 rules), clearly labeled `[DEMO]`.

## 5. Files created
- `supabase/migrations/20260608000100_approval_backend.sql` — schema, RLS, helpers, view, RPCs.
- `supabase/migrations/20260608000200_approval_demo_seed.sql` — LOCAL/DEMO idempotent seed.
- `apps/web/src/lib/approvals/supabase/approval-queries.ts` — list wrappers + row mapper.
- `apps/web/src/lib/approvals/supabase/approval-mutations.ts` — transition RPC wrappers + error class.
- `apps/web/src/lib/approvals/server/approval-loader.ts` — `loadApprovalCenterData()` (data-mode aware).
- `apps/web/src/lib/approvals/server/submit-approval-action.ts` — Zod + auth/mode gate + mapping.
- `apps/web/src/features/approvals/approval-actions.ts` — `"use server"` `runApprovalAction` + `revalidatePath`.
- `docs/implementation-logs/APPROVAL_BACKEND_IMPLEMENTATION_LOG.md` — this file.

## 6. Files modified
- `apps/web/src/app/approvals/page.tsx` — load real data + pass `runAction` / `dataSource` / `initialRequests` / `initialRules`.
- `apps/web/src/features/approvals/approvals-page.tsx` — real data seeding, server-action `applyAction` (with mock fallback), rules from DB.

## 7. Routes affected
- `/approvals` (now real Supabase-backed in Supabase data mode; mock fallback otherwise).
- `/settings/audit-logs` indirectly (now shows `approval_request.*` audit rows).

## 8. Database migrations created
- `20260608000100_approval_backend.sql`
- `20260608000200_approval_demo_seed.sql`
Applied locally via `supabase migration up --local` (no `db reset`, so the existing demo
financial entry was preserved).

## 9. Tables created
- `approval_requests`, `approval_events`, `approval_comments`, `approval_evidence`, `approval_rules`
  (+ sequence `approval_request_number_seq`, + private view `approval_request_rows`).
- Check constraints on domain / status / risk / event action / evidence_type.

## 10. RPCs created
- `public.list_approval_requests(p_limit, p_status, p_domain)` — risk-ordered list (aggregates
  events/evidence as jsonb, joins requester/approver/branch/client names).
- `public.list_approval_rules()`
- `public.create_approval_request(...)` — inserts request + `created` event + audit row.
- `public.approve_approval_request(p_request_id, p_note)`
- `public.reject_approval_request(p_request_id, p_note)`
- `public.request_approval_more_info(p_request_id, p_note)`
- `public.escalate_approval_request(p_request_id, p_note, p_new_approver_id)`
- Internal helper `private.transition_approval_request(...)` shared by the four transitions.

## 11. RLS policies added
- RLS enabled on all 5 tables; `revoke all` from public/anon/authenticated; `grant select` to
  authenticated; SELECT policies gated by `private.can_access_approvals()`.
- New private helpers: `private.has_owner_role()`, `private.can_access_approvals()`,
  `private.can_approve_request(type, domain)`.
- **No INSERT/UPDATE/DELETE policies** → direct browser writes are blocked; mutations only via
  SECURITY DEFINER RPCs (which run as owner and bypass RLS safely after permission checks).

## 12. Data sources used
- `/approvals`: **REAL** Supabase via `list_approval_requests` / `list_approval_rules` when
  `getDataMode() === 'supabase'`; otherwise labeled local seed fallback.

## 13. REAL Supabase/RPC-backed parts
- Approval request list + rules (loader → RPC).
- Approve / reject / request-more-info / escalate (server action → submit → RPC → audit_logs).
- Persisted `approval_events` history; persisted `audit_logs` (`approval_request.*`).

## 14. MOCK / local-state / demo-only parts still remaining
- `approvals-data.ts` (`approvalRequestsSeed`, `approvalRulesSeed`) kept as **fallback** for
  non-Supabase mode; not deleted (per instructions, removed only when the real loader is safe).
- Create-request and Export header buttons in the UI remain toast-only stubs (no create UI sheet
  added this phase).
- Escalate "Eskalasi ke" target is captured as note text only; mapping role→approver id is a TODO.
- `requiresSecondApproval` is stored but second-approval enforcement is not implemented.
- The `[DEMO]` seed rows are local demo data (idempotent; safe to skip/remove on production).

## 15. Permission gates used
- Open/list/read: `private.can_access_approvals()` (owner role OR any of can_manage_users,
  can_manage_roles_permissions, can_approve_whatsapp_blast, can_approve_note_unlock,
  can_approve_reimbursements, can_publish_knowledge, can_export_financial_report,
  can_edit_financials, can_view_financials, can_manage_clinical_cases, can_view_clinical_cases).
- Approve/reject/etc: `private.can_approve_request(type, domain)` mirroring
  `features/approvals/approval-helpers.ts` (owner override; per-type then per-domain mapping).
- Create: broad `can_access_approvals()` for now (stricter per-type mapping is a documented TODO).
- Server submit also re-checks Supabase data/auth mode + authenticated app user.

## 16. Audit log behavior
- `create_approval_request` → `audit_logs` action `approval_request.created`.
- transitions → `approval_request.approved | rejected | need_more_info | escalated`
  (target_type `approval_request`, target_id = request id, risk_level = request risk,
  metadata includes requestNumber/fromStatus/toStatus/hasNote). Verified visible in
  `/settings/audit-logs`.

## 17. Known limitations
- No real side effects yet (refund/payment/clinical-note actions are NOT executed) — only the
  approval lifecycle changes. Documented as a future phase.
- Note requirement parity with UI enforced in RPC (reject/more-info always; approve high/critical;
  escalate critical).
- List amount/event aggregation runs per request via the view subqueries (fine at MVP scale).
- Sensitive clinical detail hiding is enforced in the loader/UI layer (not field-level SQL).

## 18. Validation commands run
- `supabase migration up --local`
- `corepack pnpm --dir apps/web typecheck`
- `corepack pnpm --dir apps/web lint`
- `corepack pnpm --dir apps/web build`
- psql impersonation tests inside the local DB container (list + approve RPC).

## 19. Test results
- migration up: **PASS** (both migrations applied; no reset).
- typecheck: **PASS**. lint: **PASS** (0/0). build: **PASS** (exit 0).
- psql: list returned 4 risk-ordered rows with computed waiting hours; approve transitioned to
  `approved`.

## 20. Manual QA checklist (verified in active browser, localhost:3000)
1. `/approvals` loads 4 real `[DEMO]` requests from Supabase. ✅
2. Auto-select picks highest priority ("Hard-delete…", critical+overdue). ✅
3. Detail panel shows real joined data (requester/approver+role, branch, module, record, reason). ✅
4. Approve (critical → note required) persists; after **reload** status = "Disetujui". ✅
5. `approval_events` shows `created → approved` with the note. ✅
6. `audit_logs` has `approval_request.approved`; visible in `/settings/audit-logs`. ✅
7. Demo financial entry `Penjualan Membership` / Rp 8.500.000 still present. ✅
8. `/clients`, `/settings/audit-logs` render; no regression. ✅
9. No direct browser→Supabase writes (mutations go through server action → RPC). ✅

## 21. Issues found
- `returns setof private.approval_request_rows` failed when the row shaper was a FUNCTION
  (a function name is not a usable composite type).
- A `"use server"` module may only export async functions (type re-exports risk an error).

## 22. Issues fixed
- Converted `private.approval_request_rows` to a **view** (usable row type); RPCs filter from it.
- Moved shared types to `submit-approval-action.ts`; the `"use server"` file exports only the
  async action; the client imports types via `import type`.

## 23. Remaining TODOs
- Stricter per-type permission mapping for `create_approval_request`.
- Map escalate "Eskalasi ke" role → concrete approver id.
- Create-request UI sheet + real export.
- Optional: execute real side effects on approve (refund/payment/clinical-note) in a later phase.
- Enforce `requiresSecondApproval` (two-approver) flow.
- Add the demo seed into `supabase/seed.sql` for fresh resets (currently a separate migration).

## 24. Next recommended phase
Approval **side-effects & second-approval** — on approve, trigger the mapped domain action
(e.g. payment refund, note unlock) through that module's existing audited RPC, and implement the
two-approver flow for `requires_second_approval` requests.

---

# Security Hardening Pass — Sensitive Redaction + Access Alignment

## 1. Task title
Approval Backend security hardening: data-layer redaction of sensitive clinical fields (C1),
SQL↔TS access-gate alignment (M3), and demo-seed production safety (M4).

## 2. Implementation date
2026-06-08.

## 3. Branch name
`phase-approval-backend`.

## 4. Base commit
`ca89897` ("Build approval backend workflow").

## 5. Scope completed
- **C1** — sensitive clinical fields are now redacted **at the data layer** (the SQL view), so
  unauthorized approvers never receive them in the RPC/RSC/network payload (UI hiding is no longer
  the only barrier).
- **M3** — `private.can_access_approvals()` now mirrors the TypeScript `canAccessApprovalCenter`
  set exactly (documented single source of truth).
- **M4** — the `[DEMO]` seed migration now **no-ops outside local/dev**.
- No real approval side effects added; mutation RPCs unchanged.

## 6. Files created
- `supabase/migrations/20260608000300_approval_security_hardening.sql`.

## 7. Files modified
- `supabase/migrations/20260608000200_approval_demo_seed.sql` — wrapped in a local/dev guard
  (committed-but-unpushed migration, adjusted on-branch as permitted; see §13).
- `apps/web/src/features/approvals/approval-helpers.ts` — `canAccessApprovalCenter` now uses the
  exported `APPROVAL_CENTER_ACCESS_PERMISSIONS` canonical set (M3).

## 8. Migrations changed/added
- Added `20260608000300_approval_security_hardening.sql` (redaction helper + aligned gate +
  `create or replace view`). Applied locally via `migration up` (no reset).
- Edited `20260608000200_approval_demo_seed.sql` to add the local/dev guard (already applied
  locally → not re-run; only affects fresh applies on other environments).

## 9. RPCs changed
- No RPC signatures changed. `list_approval_requests` / `approve|reject|...` continue to
  `returns setof private.approval_request_rows`; the view they read is now redaction-aware, so all
  request-returning RPCs inherit redaction automatically.

## 10. RLS/helper changes
- New `private.can_view_sensitive_approval_details()` (owner role OR `can_view_clinical_cases` OR
  `can_approve_note_unlock`).
- `private.can_access_approvals()` replaced with the aligned canonical set (adds
  `can_view_audit_logs`, `can_request_note_unlock`, `can_export_financial_report`,
  `can_view_clinical_cases`, `can_manage_clinical_cases`, `can_manage_clients`,
  `can_manage_appointments`, `can_manage_practitioners`).
- `private.approval_request_rows` view rebuilt with per-row redaction CASE expressions (column
  names/types/order unchanged, so `create or replace view` + dependent RPCs stay valid).

## 11. Sensitive data redaction behavior
- A row is treated sensitive when `sensitive = true` **OR** `domain = 'clinical'`.
- For such rows, callers **without** clinical access receive:
  - `reason` → `Detail klinis disembunyikan. Membutuhkan akses Clinical Lead/Owner.`
  - `risk_check` → `Risk check disembunyikan karena data klinis sensitif.`
  - `related_record_label` → `Clinical record hidden`
  - `client_name` → `null`
  - `evidence` → `[]`
  - event `note` fields → `null` (history structure preserved)
- Non-redacted always: id, request_number, title, domain, status, risk, requester/approver,
  branch, created/waiting time, `sensitive` flag (so the UI still shows its warning).
- Demo/seeded titles are intentionally generic (`[DEMO] …`), so titles are not redacted.

## 12. SQL vs TS access gate alignment
- Canonical set defined once in TS as `APPROVAL_CENTER_ACCESS_PERMISSIONS`
  (`approval-helpers.ts`), mirrored verbatim in `private.can_access_approvals()` with a comment
  cross-referencing it. Both include owner roles (`super_admin`, `studio_director`).
- **Access ≠ approve:** opening the center does not grant approval; approval still uses the
  per-request `private.can_approve_request(type, domain)` mapping (unchanged).

## 13. Demo seed decision (M4)
- Chose **Option B (guard)**: the entire seed body runs only when the local studio director
  (`local.studio.director@example.invalid`) exists — i.e. the local Docker/dev DB. On
  staging/production (no `.invalid` seed user) the migration **inserts nothing** and `raise notice`
  logs the skip. Idempotency guards retained.
- The migration `20260608000200` was committed in `ca89897` but **not pushed**, so it was edited
  in place on this branch (permitted). It was already applied locally, so editing it does **not**
  re-run locally (verified: still exactly 4 demo requests, no duplication). To seed demo approvals
  on a non-local environment, do it deliberately via `create_approval_request` (not this migration).

## 14. REAL Supabase/RPC-backed parts
- Unchanged and still real: list/rules load, approve/reject/more-info/escalate persistence,
  `approval_events` history, `audit_logs` writes. Redaction is enforced server-side in SQL.

## 15. MOCK/demo/local-state parts remaining
- `approvals-data.ts` seed kept as non-Supabase-mode fallback.
- Create-request / Export header buttons remain toast stubs.
- `requires_second_approval` stored but not enforced; no real domain side effects executed.
- `[DEMO]` data is local-only (now guarded).

## 16. Permission gates used
- Read/list: `private.can_access_approvals()` (aligned set).
- Sensitive detail: `private.can_view_sensitive_approval_details()`.
- Approve/etc: `private.can_approve_request(type, domain)` (unchanged).

## 17. Audit log behavior
- Unchanged: create + each transition still writes `audit_logs`. Verified `approval_request.approved`
  and `approval_request.rejected` rows after this pass.

## 18. Validation commands run
- `supabase migration up --local` (applied `…000300`; `…000200` already applied → skipped).
- `corepack pnpm --dir apps/web typecheck | lint | build`.
- psql impersonation tests inside the local DB container (owner vs finance_admin).

## 19. Test results
- migration up: **PASS** (no reset; demo financial entry preserved).
- typecheck **PASS**; lint **PASS** (0/0); build **PASS** (exit 0).
- **Redaction (C1) PASS** — psql impersonation:
  - Owner (studio_director): clinical row returns the **full** reason.
  - `finance_admin` (has `can_view_financials`, no clinical access): clinical row reason/risk_check/
    related_record_label redacted, `client_name` null, `evidence` empty — **financial/admin/marketing
    rows stay intact** (no over-redaction).
- **M3 PASS** — `finance_admin` now passes `can_access_approvals()` (consistent with TS gate).
- Persistence regression **PASS** — rejected the clinical request in-browser; after reload status =
  "Ditolak"; `audit_logs` recorded `approval_request.rejected`.

## 20. Manual QA checklist (active browser, localhost:3000)
1. `/approvals` loads real `[DEMO]` requests; owner sees full clinical detail + sensitive warning. ✅
2. Reject (critical → note required) persists; after reload status = "Ditolak". ✅
3. `audit_logs` shows `approval_request.rejected`. ✅
4. Demo financial entry `Penjualan Membership` / Rp 8.500.000 still present. ✅
5. `/payments` KPIs + table render; `/financials` renders; no regression. ✅
6. Non-clinical redaction confirmed at data layer via psql (no seeded non-clinical browser login). ✅

## 21. Issues found
- Owner/clinical users must NOT be redacted (avoid over-redaction); non-sensitive rows must stay full.
- Editing an already-applied migration could risk local history mismatch.

## 22. Issues fixed
- Redaction predicate scoped to `(sensitive OR domain='clinical') AND NOT can_view_sensitive…`,
  verified owners and non-sensitive rows are unaffected.
- `migration up` confirmed it does not re-run the edited `…000200` (no duplication, history intact).

## 23. Remaining TODOs (unchanged + carried)
- Stricter per-type create gating (M2); enforce `requires_second_approval` (SoD) before side effects.
- Map escalate role → concrete approver id; create-request UI + real export.
- Optionally fold the demo seed into `supabase/seed.sql` for reset flows.
- Consider auditing sensitive reads.

## 24. Production-readiness verdict
- **Approval actions are persisted** (real RPC + audit). **Real approval side effects are NOT
  implemented** (status-only).
- **Demo seed is local/dev-only** (guarded; no production pollution).
- With C1 (data-layer redaction) and M3 (gate alignment) fixed, the branch is **safe to push for
  staging**. **Not production-ready** until segregation-of-duties (`requires_second_approval`) and
  stricter create gating are added — required before approvals execute real side effects.

---

# Pre-Merge Hardening Pass — Title Redaction, Create Gate, Second Approval

## 1. Task title
Approval Backend pre-merge hardening: redact sensitive **title**, tighten `create_approval_request`
with a per-domain gate + FK checks, and enforce `requires_second_approval` (segregation of duties).

## 2. Implementation date
2026-06-08.

## 3. Branch name
`phase-approval-backend`.

## 4. Base commit
`f7b4599` ("Harden approval backend data access").

## 5. Scope completed
- Sensitive **title** is now redacted at the data layer (extends the prior field redaction).
- `create_approval_request` replaced its broad read gate with a **per-domain create gate**, plus FK
  existence checks and a client-reference guard.
- **Segregation of duties** enforced: a request's requester cannot approve/reject their own
  `requires_second_approval` request, and cannot be set as the escalation approver.
- No real approval side effects added (status-only).

## 6. Files created
- `supabase/migrations/20260608000400_approval_premerge_hardening.sql`.

## 7. Files modified
- `apps/web/src/lib/approvals/supabase/approval-mutations.ts` — new known error codes.
- `apps/web/src/lib/approvals/server/submit-approval-action.ts` — clean messages for SoD blocks.

## 8. Migrations changed/added
- Added `20260608000400_approval_premerge_hardening.sql` (view rebuild + create gate + SoD).
  Applied locally via `migration up` (no reset; demo financial entry preserved).

## 9. RPCs changed
- `create_approval_request` — gate is now `private.can_create_approval_request(type, domain)`; adds
  `BRANCH_NOT_FOUND` / `APPROVER_NOT_FOUND` / `CLIENT_NOT_FOUND` / `CLIENT_REF_NOT_ALLOWED` checks.
- `private.transition_approval_request` (shared by approve/reject/more-info/escalate) — adds SoD
  guard raising `SECOND_APPROVAL_REQUIRED_APPROVE` / `_REQUIRED_REJECT` / `_INVALID_APPROVER`; audit
  metadata gains `secondApproval`.
- No RPC signatures changed (all `create or replace`).

## 10. SQL helper changes
- New `private.can_create_approval_request(p_request_type, p_domain)` — per-domain create mapping
  (owner bypass). All referenced permission keys exist in the catalog (no compromises).

## 11. RLS/permission behavior
- RLS unchanged (still read-only, RPC-only writes). Read gate (`can_access_approvals`) and per-request
  approve gate (`can_approve_request`) unchanged. **New, stricter create gate** is independent of the
  read gate: opening the center / reading no longer implies the ability to create any request type.

## 12. Sensitive title redaction behavior
- For rows where `sensitive = true OR domain = 'clinical'`, callers without clinical access now get
  `title` → **"Permintaan approval klinis"** (in addition to the already-redacted `reason`,
  `risk_check`, `related_record_label`, `client_name`, `evidence`, and event notes). Owners/clinical
  users and all non-sensitive rows are unaffected.

## 13. create_approval_request stricter gate
- Per-domain requirements (owner bypasses all):
  - financial → `can_edit_financials` / `can_approve_reimbursements` / `can_manage_payments`
  - clinical → `can_manage_clinical_cases` / `can_request_note_unlock` / `can_approve_note_unlock`
  - marketing → `can_approve_whatsapp_blast` / `can_publish_knowledge` / `can_manage_knowledge`
  - admin_governance → `can_manage_users` / `can_manage_roles_permissions`
  - client_membership → `can_manage_clients` / `can_manage_client_packages`
  - booking → `can_manage_appointments` / `can_reschedule_appointments`
  - team → `can_manage_practitioners`
- FK validation: branch/approver(active)/client must exist; `client_id` references are rejected
  (`CLIENT_REF_NOT_ALLOWED`) for creators who can't view clients (mitigates client-name enumeration).

## 14. requires_second_approval enforcement
- In `approve`: requester (== `requested_by`) is blocked (`SECOND_APPROVAL_REQUIRED_APPROVE`).
- In `reject`: requester is blocked (`SECOND_APPROVAL_REQUIRED_REJECT`).
- In `escalate`: cannot set the requester as the new approver (`SECOND_APPROVAL_INVALID_APPROVER`).
- `need_more_info` by the requester is still allowed. Guard raises **before** any write, so blocked
  attempts persist nothing (no status change, no event, no audit).
- UI surfaces these via the existing server-action error state (clean toast; no crash, no new flow).

## 15. REAL Supabase/RPC-backed parts
- All approval reads/writes remain real + audited. Redaction, create gate, and SoD are enforced in
  SQL (server-side), not the UI.

## 16. MOCK/demo/local-state parts remaining
- `approvals-data.ts` fallback (non-Supabase mode). Create-request/Export header buttons still stubs.
- `[DEMO]` seed local/dev-only; `…000400` also flips the financial demo row to
  `requires_second_approval = true` (local/dev-guarded) so SoD is browser-testable.
- **No real domain side-effects** (no refund/note-unlock/role-change/export/WhatsApp execution).

## 17. Audit log behavior
- Unchanged for successful transitions (now includes `secondApproval` in metadata). Blocked SoD
  attempts and denied creates write **no** audit row (fail-before-write). Verified.

## 18. Validation commands run
- `supabase migration up --local`; `corepack pnpm --dir apps/web typecheck | lint | build`;
  psql impersonation suite (owner / finance_admin / second owner) in rollback transactions.

## 19. Test results
- migration up **PASS** (no reset; demo financial entry preserved).
- typecheck **PASS**; lint **PASS** (0/0); build **PASS** (exit 0).
- **Title redaction PASS** — owner: full clinical title; `finance_admin`: title → "Permintaan
  approval klinis", details redacted; financial/admin/marketing rows intact.
- **Create gate PASS** — `finance_admin`: financial create ALLOWED (APR-00005), clinical DENIED,
  admin DENIED.
- **SoD PASS** — requester (director) approve → `SECOND_APPROVAL_REQUIRED_APPROVE`; a different
  authorized owner approve → success (audit `secondApproval=true`, event written).

## 20. Manual QA checklist (active browser, localhost:3000)
1. `/approvals` loads real requests; owner sees full clinical detail + sensitive warning. ✅
2. Refund demo row (now `requires_second_approval`) — owner (its requester) Approve with note →
   **blocked**; row stays "Menunggu"; clean error; **no** event/audit written. ✅
3. `/settings/audit-logs` still shows `approval_request.*`; `/financials` (demo entry present) and
   `/payments` render — no regression. ✅
4. Non-clinical title/detail redaction verified at the data layer via psql (no seeded non-clinical
   browser login). ✅

## 21. Issues found / fixed
- Initial SoD "different approver" test used `finance_admin`, which (correctly) lacks
  `can_approve_reimbursements` for the reimbursement-type request → re-tested with a second owner,
  which succeeded. Confirms per-type approve gate + SoD both hold.

## 22. Remaining TODOs
- Multi-stage / N-approver workflows (only single second-approval guard implemented).
- Stricter per-**type** create mapping (currently per-domain) + per-actor client-access for related
  records beyond `client_id`.
- Failed-action audit rows (currently denied/blocked actions are not audited).
- Create-request UI sheet + real export; escalate role→approver mapping.

## 23. Production-readiness verdict
- **Approval actions are persisted and audited**; **real side-effects are still NOT implemented**
  (status-only). Demo seed + the second-approval demo flag are **local/dev-only**.
- C1/M3/M4 + title redaction + stricter create gate + segregation of duties are now in place. The
  branch is **safe to push and safe to merge to staging**. **Production** still requires: real
  side-effect execution design (out of scope here), multi-stage approval if needed, and the
  remaining TODOs — and migrations must be applied to the target DB before/with the deploy.
