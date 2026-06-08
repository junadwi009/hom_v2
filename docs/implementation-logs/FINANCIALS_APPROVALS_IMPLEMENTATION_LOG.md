# Implementation Log — Financials Overview Upgrade + Approval Center

## 1. Task title
Upgrade the existing REAL `/financials` ledger into a decision-focused **Financial
Overview**, and replace the mock/shell `/approvals` route with a functional
**Approval Center** (typed local/mock data + local-state workflow, integration-ready
for future Supabase RPC). Fix the navigation mismatch for Financials.

## 2. Implementation date
2026-06 (local-first dev session). Reference "today" for app data = 2026-06-08.

## 3. Current system context
HOM Studio OS v2 — Next.js 16 (App Router, Turbopack) · React 19 · TS · Tailwind ·
Supabase local (Docker) with RBAC + RLS + RPC SECURITY DEFINER mutation pattern.
`/financials` was already REAL (table `financial_entries`, RPC `create_financial_entry`
gated by `can_edit_financials`). `/approvals` was a `ModuleMockPage` "Segera hadir" shell.

## 4. Scope completed
- **Financials**: decision-focused overview (period selector, 6 KPI cards, rule-based
  insight, financial health score, revenue-vs-expense trend chart, income/expense
  category breakdown, category performance, local-filtered ledger table, permission-aware
  CSV export, quick actions). Existing real loader + create flow preserved.
- **Approval Center**: full UI with typed mock data, KPI cards, rule-based summary,
  domain tabs, local filters, request table, detail panel (with sensitive-hiding),
  local-state approve/reject/ask-info/escalate workflow + action modals, Approval Rules
  modal, permission-aware actions, related-record navigation.
- **Navigation fix**: Financials moved out of "Segera hadir" into the operational group;
  Approval Center added to the operational group.

## 5. Files created
- `apps/web/src/features/financials/financials-analytics.ts` — pure helpers (period filter,
  KPIs, category totals, trend buckets, health score, insight).
- `apps/web/src/features/financials/financials-charts.ts(x)` — `TrendBars`, `CategoryBars`
  (Tailwind/SVG, no chart library).
- `apps/web/src/features/approvals/approval-types.ts` — domain types.
- `apps/web/src/features/approvals/approval-helpers.ts` — labels/tones, permission helpers,
  KPI + insight + prioritisation.
- `apps/web/src/features/approvals/approvals-data.ts` — 15 typed mock requests + 14 rules.
- `apps/web/src/features/approvals/approval-table.tsx`
- `apps/web/src/features/approvals/approval-detail-panel.tsx`
- `apps/web/src/features/approvals/approval-action-modal.tsx`
- `apps/web/src/features/approvals/approval-rules-modal.tsx`
- `apps/web/src/features/approvals/approvals-page.tsx`
- `docs/implementation-logs/FINANCIALS_APPROVALS_IMPLEMENTATION_LOG.md` (this file).

## 6. Files modified
- `apps/web/src/features/financials/financials-page.tsx` — rewritten as the client
  Financial Overview orchestrator (was a simple server ledger page).
- `apps/web/src/features/financials/financials-loader.ts` — limit 50 → 365 (better
  aggregation). Shape unchanged.
- `apps/web/src/app/financials/page.tsx` — gate view on `can_view_financials`, pass
  `canExport` (`can_export_financial_report`); create still gated by `can_edit_financials`.
- `apps/web/src/app/approvals/page.tsx` — replaced `ModuleMockPage` shell with the real
  `ApprovalsPage`, gated by `canAccessApprovalCenter`.
- `apps/web/src/lib/format.ts` — added `formatCurrencyIDR`/`formatCompactIDR` aliases,
  `formatDateID`, `formatRelativeTimeID`, `formatDurationID`.
- `apps/web/src/lib/routes.ts` — Financials + Approval Center moved to operational nav;
  removed from `comingSoonNavigation` (now only Live Chat).

## 7. Routes affected
- `/financials` (REAL, upgraded) · `/approvals` (was mock → now functional UI).
- Sidebar grouping for both.

## 8. Components added
Financials: TrendBars, CategoryBars + the overview orchestrator.
Approvals: ApprovalsPage, ApprovalTable, ApprovalDetailPanel, ApprovalActionModal,
ApprovalRulesModal.

## 9. Data sources used
- **Financials**: REAL `financial_entries` via existing `loadFinancialEntries()` loader
  (server-only, Supabase). All KPIs/charts/health/insight computed from these rows.
- **Approvals**: typed LOCAL/MOCK data (`approvals-data.ts`). No DB.

## 10. Mock / local-state parts
- Entire Approval Center dataset + workflow (approve/reject/ask-info/escalate mutate
  React local state + append a local history event + toast; nothing persists).
- Approval Rules view (read-only mock).
- Approval Center "Export" and "Create Request" header buttons are toast-only stubs.
- Financials "Request Reimbursement Approval" quick action routes to `/approvals` (no real
  reimbursement mutation).
- Financial **trend bucketing reference date** = latest entry date (demo-friendly so MTD
  frames available seeded data regardless of machine clock).

## 11. Real Supabase / RPC-backed parts
- Financials data load (`financial_entries`) and the create-entry flow
  (`create_financial_entry` RPC, gated `can_edit_financials`, audit-logged) are unchanged
  and REAL. Permission gates read from the real `get_current_app_user_context` permissions.

## 12. Permission gates used
- Financials page view: `can_view_financials` (else permission-denied block).
- Create entry: `can_edit_financials` (existing).
- Export Report (CSV, client-side): `can_export_financial_report` (button disabled + tooltip
  otherwise).
- Approval Center view: `canAccessApprovalCenter` (owner role or any management/approval
  permission).
- Approval actions: `canApproveRequest(user, request)` — maps request type → permission
  (e.g. WhatsApp Blast → `can_approve_whatsapp_blast`, Unlock Note → `can_approve_note_unlock`,
  Reimbursement → `can_approve_reimbursements`, Export/Client-data → `can_export_financial_report`,
  Role → `can_manage_roles_permissions`, governance → `can_manage_users`; financial →
  `can_approve_reimbursements`/`can_edit_financials`; owner role overrides all).
- Sensitive clinical detail hidden unless `can_view_clinical_cases` / `can_approve_note_unlock`
  / owner (`canViewSensitive`).

## 13. Navigation changes
`routes.ts`: added `{ Financials → /financials }` and `{ Approval Center → /approvals }` to
`operationalNavigation` (after Payments); `comingSoonNavigation` reduced to Live Chat only.

## 14. Financials changes
See §4–§12. Existing ledger table retained (now with local search + type + category filters,
date formatted as Indonesian, formatted IDR). KPI/chart/insight/health all rule-based on
real entries. Empty states handled; charts safe on empty arrays.

## 15. Approval Center changes
Replaced shell with a functional center: 6 KPI cards, rule-based summary with top-3 priority,
domain tabs (All + 7 domains), local filters (search/risk/status/branch), selectable table,
right-side detail panel (desktop) / drawer (tablet/mobile), action modals with required notes
for reject/info and for high/critical approvals, escalate target select, Approval Rules modal,
permission-aware approve buttons, related-record navigation with safe fallback.

## 16. Known limitations
- Approval workflow is **local-state only** — refresh resets to seeded data; no persistence,
  no audit_logs entry for approvals yet.
- Approval "Export"/"Create Request" are stubs.
- Financials trend/category visuals are simple Tailwind bars (no chart lib, by design).
- Financials period math is anchored to the latest entry date (demo-friendly), not the wall
  clock.
- Payment pending/failed KPI cards were intentionally NOT added (no clean payments loader
  wired into financials; avoided forcing a join). Marked "optional" in spec.

## 17. Future backend/RPC plan for approvals
> **Future real approval engine** (do NOT implement migration unless requested).
Suggested tables: `approval_requests`, `approval_request_events`, `approval_request_comments`,
`approval_request_evidence`, `approval_rules`.
Suggested RPCs: `create_approval_request`, `approve_approval_request`, `reject_approval_request`,
`request_approval_more_info`, `escalate_approval_request`, `list_approval_requests`.
Must follow the existing pattern: server action → submit (Zod + permission gate) → Supabase
wrapper → RPC SECURITY DEFINER → `audit_logs` → `revalidatePath`. The current `approval-types.ts`
shapes map 1:1 to these tables; `approval-helpers.ts` permission mapping becomes the RPC gates.

## 18. Testing commands run
- `corepack pnpm --dir apps/web typecheck`
- `corepack pnpm --dir apps/web lint`
- (production build verified separately in this session: `corepack pnpm --dir apps/web build`)

## 19. Test results
- typecheck: **PASS** (tsc --noEmit, no errors).
- lint: **PASS** (eslint, exit 0). [see chat for run]
- build: **PASS** — `corepack pnpm --dir apps/web build`.
- No direct browser→Supabase writes introduced. Existing real modules untouched.

## 20. Manual QA checklist
1. Login `local.studio.director@example.invalid` / `LocalOnly-HOM-Phase4K-2026!`.
2. `/financials`: real entries load; KPIs/insight/health/charts render; period selector
   changes data; table search/type/category filters work; Export downloads CSV (permission
   present); Create Entry sheet still creates a real entry.
3. Sidebar: Financials NOT under "Segera hadir"; Approval Center visible in operational nav.
4. `/approvals`: KPI cards, summary, tabs, filters work; select row → detail panel; Approve
   (high/critical requires note), Reject (requires reason), Ask More Info, Escalate update
   local status + history + toast; Approval Rules modal opens; View Related Record navigates
   (e.g. payments/clients/clinical-cases) or shows safe fallback; sensitive clinical request
   hides details for users without clinical access.

## 21. Issues found
- Existing `lib/format.ts` already had `formatIdr`/`formatIdrCompact`/`formatNumber` — reused
  via aliases instead of duplicating.

## 22. Issues fixed
- Navigation mismatch (Financials under "Segera hadir") fixed.
- Approvals shell replaced.

## 23. Remaining TODOs
- Wire the future approval Supabase tables/RPCs (migration intentionally deferred).
- Optional Financials cards for pending/failed payments (needs a payments loader).
- Replace stub Export/Create-Request in Approval Center with real flows.
- Browser click-through QA in dev (production build has a known Suspense-streaming quirk; no
  route-level `loading.tsx` added here, per the shared UI requirement).

---

## UI Refinement Update (Approval Center)

Follow-up pass addressing UX feedback on `/approvals`. **No backend changes; all local-state
workflow behaviour preserved.**

**Changes**
1. **Desktop split 70/30** — grid changed from `xl:grid-cols-3` (66/33) to
   `xl:grid-cols-[minmax(0,1fr)_360px]`: table flexes (~70%), detail panel fixed 360px (~30%).
2. **Detail panel column is now sticky** (`xl:sticky xl:top-4 self-start`) and the panel is a
   flex column (`max-h-[calc(100vh-7rem)]`) with a **scrollable body + always-visible sticky
   footer action bar** → approval actions are above the fold regardless of scroll.
3. **Table simplified to 7 columns**: Request, Requester, Impact, Risk, Status, Menunggu, Aksi.
   `Domain` and `Branch` moved into the Request cell's secondary line; `relatedRecordLabel`
   moved to the detail panel. `min-w` reduced 920→640px so the **Action column is always
   visible** (now a clear "Detail ›" pill, highlighted when selected).
4. **Sticky footer action bar** inside the panel: `Reject · Info · Approve` (3-col grid). For
   **critical** requests an `Escalate (kritis)` button is shown above the row.
5. **Note requirements**: reject, ask-more-info, high/critical approve **and now critical
   escalate** require a note (enforced in `approval-action-modal.tsx`).
6. **Clinical-sensitive warning banner** — for `domain === "clinical"` or `sensitive === true`
   requests (when viewer is authorised), a rose banner warns before approval. Unauthorised
   viewers still get the "detail disembunyikan" banner (sensitive sections hidden).
7. **Redundant topbar button replaced** — on `/approvals`, the global quick action
   "Open approvals" becomes **"Approval Rules"** (`/approvals?rules=1`); the route reads the
   `rules` query param and opens the Rules modal initially (`defaultShowRules` prop).

**Files modified in this pass**
- `features/approvals/approval-table.tsx` (7 cols, secondary text, Detail pill, min-w 640)
- `features/approvals/approval-detail-panel.tsx` (flex column, sticky footer bar, clinical banner)
- `features/approvals/approval-action-modal.tsx` (critical-escalate note required)
- `features/approvals/approvals-page.tsx` (70/30 grid, sticky panel, `defaultShowRules` prop)
- `features/shell/topbar.tsx` (context-aware quick action on `/approvals`)
- `app/approvals/page.tsx` (read `searchParams.rules` → `defaultShowRules`)

**Preserved**: KPI cards, Approval Summary, domain tabs, all filters, local approve/reject/
ask-info/escalate workflow + history + toasts, Approval Rules modal, related-record nav,
permission awareness.

**Validation**: `typecheck` PASS · `lint` PASS. Verified in browser (production build).

---

## Final Verification & Demo Status

**Build**
- `corepack pnpm --dir apps/web build` = **PASS**.

**Screenshot / demo verification**
- **Financials**: verified with a **real test entry of Rp 8.500.000** (created via the
  `create_financial_entry` RPC flow; appears in the ledger and is reflected in the
  KPIs/charts).
- **Approval Center**: verified with the **local approve workflow** (select request →
  approve → local status + history event + toast). Local-state only; nothing persists.

**Test data note**
> One demo financial entry may remain in the local DB for verification.

## Next Recommended Phase — Approval Backend

Turn the local-state Approval Center into a persisted, audited engine. Follow the existing
pattern: server action → submit (Zod + permission gate) → Supabase wrapper → RPC
`SECURITY DEFINER` → `audit_logs` → `revalidatePath`.

- **`approval_requests`** schema — core request table (maps 1:1 to `approval-types.ts`).
- **`approval_events`** — append-only history/audit of each action on a request.
- **`approval_rules`** — configurable rules backing the Approval Rules view.
- **RPCs** — `approve` / `reject` / `escalate` (plus `request_more_info`, `create_approval_request`,
  `list_approval_requests`), each gated by the mapped permission in `approval-helpers.ts`.
- **`audit_logs` persistence** — every approval action written to `audit_logs` for the full trail.
