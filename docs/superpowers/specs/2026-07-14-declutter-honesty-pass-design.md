# Declutter & Honesty Pass — Design Spec

- **Date:** 2026-07-14
- **Sub-project:** SP-A (first of three; SP-B = build real modals, SP-C = visual redesign — each its own spec later)
- **Branch (proposed):** `phase-declutter-honesty` off `main`
- **Status:** approved design, pending plan

## Context

`hom_v2` was scaffolded with a lot of sample surface. A deliberate placeholder
pattern (`features/shell/demo-action.tsx` → `DemoButton` / `DemoIconButton` /
`DemoLink`) fires an honest toast so "no button is dead," but the net effect is
that a first-time user cannot tell which modules actually work. Audit found:

- **~57** `DemoButton`/`DemoIconButton`/`DemoLink` instances: clients (33),
  overview (10), settings (9), catalog (5).
- **3** inline toast-only buttons on the real Approvals page (`Export`,
  `Create Request`, `View Related`) + 1 on Financials.
- `features/overview/` — a 10-placeholder sample dashboard that is **unrouted
  dead code** (nothing imports it; the real landing is `features/executive-command`).
- Nav (`lib/routes.ts`) mislabels several sample modules as `operationalNavigation`.

This SP makes the visible surface honest by **subtraction only** — no visual
restyle, no new backend, no new flows. Routes/code are hidden, not deleted, so
each module can be re-enabled when its backend is built.

## Goal

A user who logs in sees only modules that actually work, and every visible
button either performs a real action or deep-links to a working destination.
No misleading sample data, no toast-only dead-ends.

## Principles

- **Honesty over completeness** — align with AGENTS.md: "Do not show fake zero
  values"; every screen has real loading/empty/error/permission states.
- **House design system only** — Tailwind + shadcn/Radix + design tokens +
  restrained Motion.dev. No Framer Motion, no font/motion changes here.
- **YAGNI / reversible** — hide from nav; keep routes + code intact.
- **No scope creep** — do not touch REAL feature internals beyond removing dead
  buttons; no redesign (that is SP-C).

## Classification (final)

**KEEP (real, working flows):**
Overview `/`, Appointments `/appointments`, Clients Management `/clients`,
Practitioners `/practitioners`, Service & Paket `/catalog` (strip demo
buttons/cards; show only real services), Client Packages `/client-packages`,
Payments `/payments`, Financials `/financials`, Approval Center `/approvals`,
Settings → User Management, Roles & Permissions, Audit Logs, Branch Management,
AI Business Agent, Knowledge Studio.

**HIDE from nav (sample; backend not built; routes/code retained):**
Clients → Leads `/clients/leads`, Segments `/clients/segments`, Tags
`/clients/tags`; Behavior Intelligence `/settings/ai-management/behavior-intelligence`;
Live Chat `/live-chat`; Clinical Cases `/clinical-cases`; Team Attendance
`/team-attendance`.

## Changes by surface

### 1. `apps/web/src/lib/routes.ts` (single nav source of truth)
- `operationalNavigation`:
  - Collapse the `Clients` group into a single top-level link
    `{ label: "Clients", href: "/clients", icon: Users }` (drop Leads/Segments/Tags children).
  - In Settings → AI Management, remove the Behavior Intelligence child (keep
    AI Business Agent + Knowledge Studio).
- Remove `comingSoonNavigation` entirely (its only entry, Live Chat, is hidden).
  Update `primaryNavigation` to no longer spread it.
- `executiveTabs`: remove `Chronic Case Registry` (`/clinical-cases`) and
  `Team Attendance` (`/team-attendance`).
- `quickActions` / `getQuickActions`: keep only entries whose destination
  performs real work (`/appointments`, `/approvals`, `/approvals?rules=1`,
  `/financials?export=1`, `/financials?create=1`, `/payments`, `/payments?create=1`,
  `/payments?export=1`, `Review knowledge` → Knowledge Studio). No entry may
  point to a hidden sample route.

### 2. `apps/web/src/features/shell/sidebar-navigation.tsx`
- With `comingSoonNavigation` removed, delete the "Segera hadir" block
  (the `<div className="pt-3">…</div>` rendering `comingSoonNavigation`) and its
  import. The nav now renders only `operationalNavigation`.

### 3. Toast-only buttons on REAL (KEEP) pages
**General rule:** on KEEP pages, remove every `DemoButton` / `DemoIconButton` /
`DemoLink` (and inline `onClick={() => notify(...)}`-only buttons) that has no
real destination. Keep buttons that perform a real action or deep-link to a
working page (`?export=1` / `?create=1`, an existing modal, a real route). When
removing a button empties its container (a table "Aksi" column, a toolbar, a
card footer), remove the now-empty container too so no orphan chrome remains.

Concretely, this touches:
- **Approvals** (`features/approvals/approvals-page.tsx`): remove `Export` and
  `Create Request` (toast-only). Keep `Approval Rules` (real modal); `View
  Related` stays (navigates when `relatedRoute` exists, honest toast otherwise).
- **Financials** (`features/financials/financials-page.tsx:271`): remove the
  toast-only review button; working Export/Catat deep-links remain.
- **Catalog** (`features/catalog/service-package/*`): remove demo buttons/cards
  in product-card, service-catalog-page, service-filter-panel; show only real
  services.
- **Clients Management** (`features/clients/management/*`: client-table,
  client-detail-panel, client-management-page) and **shared**
  (`features/clients/shared/clients-toolbar.tsx`): remove demo row/toolbar
  actions.
- **Settings** (`features/settings/audit-logs/*`, `branch-management/*`,
  `user-detail-panel.tsx`): remove demo row/detail actions.

**Consequence (intended):** stripping unbuilt write actions leaves some KEEP
pages effectively read-only until SP-B builds the real flows. That is the honest
state we want — a read-only page that loads real data beats a page full of
buttons that only toast. Real read actions (filters, search, detail view,
pagination) are unaffected.

### 4. Dead code removal
- Delete `apps/web/src/features/overview/` (unrouted 10-placeholder sample
  dashboard) and any now-orphaned imports. Confirm nothing references it before
  deletion (`grep -r "features/overview"` → none).

## Non-goals

- No visual restyle, spacing/typography/motion changes (SP-C).
- No new modals, forms, RPCs, or flows (SP-B).
- No deletion of hidden routes' page/feature code — hide only.
- No changes to REAL feature internals beyond removing dead buttons.

## Testing / verification

- `typecheck`, `lint`, `next build` all green.
- Update e2e **app-shell** specs (`apps/web/tests/e2e/app-shell.spec.ts`) that
  assert nav items — hiding items changes expected nav; these were already
  flagged stale vs the UI revamp.
- Storybook still builds (stories for removed `features/overview` components, if
  any, are deleted with the folder).
- Manual (supabase mode, logged in as seeded studio director): sidebar shows
  only KEEP modules; no "Segera hadir" section; every visible button either acts
  or deep-links; hidden routes are not reachable via any in-app link (direct URL
  still renders, by design).

## Risks / notes

- Hidden routes remain directly navigable by URL (acceptable — they are just
  unlinked, not deleted). If a user bookmarks one, they still see the sample
  page; a later SP can add a "not yet available" guard if desired.
- Removing `features/overview` may remove Storybook stories; verify the
  Storybook build after deletion.
- Deep-link quick actions (`?export=1` etc.) must be re-verified to still be
  handled on their destination pages after any button removal.
