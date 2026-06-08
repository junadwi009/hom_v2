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
