# Declutter & Honesty Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the app show only modules that actually work and remove every toast-only dead-end button, by subtraction — no visual redesign, no new backend.

**Architecture:** Nav is data-driven from `apps/web/src/lib/routes.ts`; hiding a module = removing its entry there. Placeholder actions use `DemoButton`/`DemoIconButton`/`DemoLink` from `features/shell/demo-action.tsx`; removing an instance and any container it empties is the core edit. `features/overview/` is unrouted dead code and is deleted outright.

**Tech Stack:** Next.js (App Router), React, TypeScript strict, Tailwind, shadcn/Radix, Vitest, Playwright. Run scripts with `npx --yes pnpm@11.3.0 --dir apps/web <script>` (pnpm is not on PATH in non-interactive shells).

## Global Constraints

- This is a **subtraction-only** pass: do not restyle, do not add modals/flows, do not change REAL feature internals beyond removing dead buttons. Verbatim from spec §Non-goals.
- Hide routes by removing nav entries only — **do not delete** the hidden routes' `page.tsx` or feature code (except `features/overview/`, which is dead). Verbatim from spec §Principles.
- Keep buttons that perform a real action or deep-link to a working page (`?export=1`/`?create=1`, an existing modal, a real route). Remove only toast-only ones. Verbatim from spec §Changes/3.
- When removing a button empties its container (a table "Aksi" column, a toolbar, a card footer), remove the now-empty container too. Verbatim from spec §Changes/3.
- Follow the house design system (Tailwind + shadcn/Radix + tokens + Motion.dev). No Framer Motion, no font/motion changes.
- This is a UI subtraction task: the per-task "test" is a completeness grep (target count → 0) plus `typecheck` + `build`, since there is no unit surface to assert. The e2e app-shell spec is updated in the final task.

---

### Task 1: Reclassify navigation in `lib/routes.ts`

**Files:**
- Modify: `apps/web/src/lib/routes.ts`

**Interfaces:**
- Produces: `operationalNavigation`, `comingSoonNavigation` (removed), `primaryNavigation`, `executiveTabs`, `quickActions`, `getQuickActions` — consumed by `sidebar-navigation.tsx`, `topbar.tsx`, and the executive dashboard.

- [ ] **Step 1: Collapse the Clients group and drop the Behavior Intelligence child**

In `operationalNavigation`, replace the whole `Clients` group object:

```ts
  {
    label: "Clients",
    icon: Users,
    children: [
      { label: "Client Management", href: "/clients" },
      { label: "Leads", href: "/clients/leads" },
      { label: "Segments", href: "/clients/segments" },
      { label: "Tags", href: "/clients/tags" },
    ],
  },
```

with a single link:

```ts
  { label: "Clients", href: "/clients", icon: Users },
```

And in the Settings group's `AI Management` sub-group, remove the Behavior Intelligence child so it reads:

```ts
      {
        label: "AI Management",
        children: [
          { label: "AI Business Agent", href: "/settings/ai-management/business-agent" },
          { label: "Knowledge Studio", href: "/settings/ai-management/knowledge-studio" },
        ],
      },
```

- [ ] **Step 2: Remove `comingSoonNavigation` and fix `primaryNavigation`**

Delete this block entirely:

```ts
// Modules whose backend is not built yet — shown muted under a "Coming soon" group.
export const comingSoonNavigation = [
  { label: "Live Chat", href: "/live-chat", icon: MessageSquareText },
];
```

Change `primaryNavigation` to no longer spread it:

```ts
export const primaryNavigation = [...operationalNavigation];
```

Remove the now-unused `MessageSquareText` import from the top `lucide-react` import.

- [ ] **Step 3: Trim `executiveTabs`**

Remove the `Chronic Case Registry` and `Team Attendance` entries so `executiveTabs` becomes:

```ts
export const executiveTabs = [
  { label: "Strategic Overview", href: "/dashboard/executive-command" },
  { label: "Financial Strategy", href: "/financials" },
  { label: "Client LTV & Milestones", href: "/clients" },
  { label: "User Management", href: "/settings/user-management" },
  { label: "Approvals & Payroll", href: "/approvals" },
];
```

- [ ] **Step 4: Drop the `comingSoonNavigation` import in the sidebar**

In `apps/web/src/features/shell/sidebar-navigation.tsx`, change:
```ts
import {
  comingSoonNavigation,
  operationalNavigation,
} from "@/lib/routes";
```
to:
```ts
import { operationalNavigation } from "@/lib/routes";
```

- [ ] **Step 5: Remove the "Segera hadir" render block in the sidebar**

In `SidebarNavigation`, delete the entire trailing block that renders `comingSoonNavigation`:

```tsx
      <div className="pt-3">
        {collapsed ? (
          <div className="mx-2 mb-2 border-t border-white/10" aria-hidden="true" />
        ) : (
          <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-normal text-[var(--sidebar-muted)] opacity-70">
            Segera hadir
          </p>
        )}
        <div className="space-y-1 opacity-70">
          {(comingSoonNavigation as NavLink[]).map((item) => (
            <NavLinkItem
              collapsed={collapsed}
              item={item}
              key={item.href}
              pathname={pathname}
            />
          ))}
        </div>
      </div>
```

The `<nav>` now renders only the `operationalNavigation` map that precedes it.

- [ ] **Step 6: Verify no nav entry points to a hidden route**

Run:
```bash
grep -nE "/live-chat|/clinical-cases|/team-attendance|/clients/leads|/clients/segments|/clients/tags|behavior-intelligence|comingSoonNavigation" apps/web/src/lib/routes.ts apps/web/src/features/shell/sidebar-navigation.tsx
```
Expected: no matches.

- [ ] **Step 7: Typecheck + build (must be green — coupled change complete)**

Run: `npx --yes pnpm@11.3.0 --dir apps/web typecheck && npx --yes pnpm@11.3.0 --dir apps/web build`
Expected: both clean.

- [ ] **Step 8: Commit**

```bash
git add apps/web/src/lib/routes.ts apps/web/src/features/shell/sidebar-navigation.tsx
git commit -m "refactor(nav): hide sample modules and remove coming-soon section"
```

---

### Task 2: Delete unrouted dead sample dashboard (`features/overview`)

**Files:**
- Delete: `apps/web/src/features/overview/` (entire directory)

- [ ] **Step 1: Confirm it is unreferenced**

Run:
```bash
grep -rn "features/overview" apps/web/src
```
Expected: no matches (nothing imports it).

- [ ] **Step 2: Delete the directory and any co-located stories**

```bash
git rm -r apps/web/src/features/overview
```

- [ ] **Step 3: Typecheck + Storybook build**

Run: `npx --yes pnpm@11.3.0 --dir apps/web typecheck && npx --yes pnpm@11.3.0 --dir apps/web build-storybook`
Expected: both succeed (no orphaned story imports). If `build-storybook` is not a script, run `npx --yes pnpm@11.3.0 --dir apps/web build` instead.

- [ ] **Step 4: Commit**

```bash
git add -A apps/web/src/features/overview
git commit -m "chore: remove unrouted sample overview dashboard (dead code)"
```

---

### Task 3: Remove toast-only buttons on Approvals

**Files:**
- Modify: `apps/web/src/features/approvals/approvals-page.tsx`

- [ ] **Step 1: Remove the `Export` and `Create Request` buttons**

In the `PageHeader` `actions` prop, delete these two buttons:

```tsx
            <Button onClick={() => notify("Ekspor antrean persetujuan belum tersedia.")} size="sm" type="button" variant="secondary">
              <Download aria-hidden="true" className="size-4" /> Export
            </Button>
            <Button onClick={() => notify("Pembuatan request manual segera hadir.")} size="sm" type="button">
              Create Request
            </Button>
```

Leave the `Approval Rules` button (opens a real modal). The `actions` wrapper now contains only that button.

- [ ] **Step 2: Remove the now-unused `Download` icon import**

If `Download` is no longer referenced anywhere in the file (verify with `grep -n "Download" apps/web/src/features/approvals/approvals-page.tsx`), remove it from the `lucide-react` import.

- [ ] **Step 3: Typecheck**

Run: `npx --yes pnpm@11.3.0 --dir apps/web typecheck`
Expected: clean (no unused-import or missing-symbol errors).

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/features/approvals/approvals-page.tsx
git commit -m "refactor(approvals): remove toast-only Export and Create Request buttons"
```

---

### Task 4: Remove the toast-only "Review Expense" button on Financials

**Files:**
- Modify: `apps/web/src/features/financials/financials-page.tsx`

- [ ] **Step 1: Delete the Review Expense button**

Remove this button (the working `Export Report` and `Open Payments` buttons beside it stay):

```tsx
          <Button onClick={() => notify("Tinjau kategori pengeluaran terbesar di bawah.")} size="sm" type="button" variant="secondary">
            Review Expense
          </Button>
```

- [ ] **Step 2: Remove `notify`/`useToast` only if now unused**

Run `grep -n "notify(" apps/web/src/features/financials/financials-page.tsx`. If no other usage remains, remove the `notify` variable and its `useToast()` call and import; otherwise leave them.

- [ ] **Step 3: Typecheck**

Run: `npx --yes pnpm@11.3.0 --dir apps/web typecheck`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/features/financials/financials-page.tsx
git commit -m "refactor(financials): remove toast-only Review Expense button"
```

---

### Task 5: Strip demo actions in Catalog

**Files:**
- Modify: `apps/web/src/features/catalog/service-package/product-card.tsx` (`DemoIconButton` at line 58)
- Modify: `apps/web/src/features/catalog/service-package/service-catalog-page.tsx` (`DemoButton` at line 81)
- Modify: `apps/web/src/features/catalog/service-package/service-filter-panel.tsx` (`DemoLink` line 13, `DemoButton` lines 28 & 54; import line 3)

**Rule (applies to every site):** remove the `<DemoButton>`/`<DemoIconButton>`/`<DemoLink>` element. If it was the only child of a container (an "actions" row, a card footer, a `<td>` cell + its `<th>` header), remove that container too. Then remove the now-unused `demo-action` import from the file.

- [ ] **Step 1: Read each file and remove its demo elements per the rule**

Open each of the three files, remove the demo elements at the lines above, clean up emptied containers, and delete the `from "@/features/shell/demo-action"` import line where nothing from it remains.

- [ ] **Step 2: Verify no demo action remains in catalog**

Run:
```bash
grep -rn "DemoButton\|DemoIconButton\|DemoLink\|demo-action" apps/web/src/features/catalog
```
Expected: no matches.

- [ ] **Step 3: Typecheck + build**

Run: `npx --yes pnpm@11.3.0 --dir apps/web typecheck && npx --yes pnpm@11.3.0 --dir apps/web build`
Expected: clean (unused-import removal verified; no dangling references).

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/features/catalog
git commit -m "refactor(catalog): remove placeholder demo actions"
```

---

### Task 6: Strip demo actions in Clients Management + shared toolbar

**Files:**
- Modify: `apps/web/src/features/clients/management/client-detail-panel.tsx` (import line 11; `DemoLink` 82, `DemoButton` 158, `DemoLink` 182)
- Modify: `apps/web/src/features/clients/management/client-management-page.tsx` (`DemoButton` 115 & 157)
- Modify: `apps/web/src/features/clients/management/client-table.tsx` (`DemoIconButton` 96, 103, 110)
- Modify: `apps/web/src/features/clients/shared/clients-toolbar.tsx` (`DemoButton` 83)

**Rule:** same as Task 6. In `client-table.tsx`, the three `DemoIconButton`s are the row "Aksi" controls — if removing them empties the actions `<td>`, remove that cell and its column header `<th>`. Keep all read affordances (search, filters, the row-open/detail navigation).

- [ ] **Step 1: Remove demo elements per the rule in all four files**

Clean up emptied containers (action cells/columns, toolbar wrappers, card footers) and unused `demo-action` imports.

- [ ] **Step 2: Verify none remain in clients management + shared**

Run:
```bash
grep -rn "DemoButton\|DemoIconButton\|DemoLink\|demo-action" apps/web/src/features/clients/management apps/web/src/features/clients/shared
```
Expected: no matches.

- [ ] **Step 3: Typecheck + build**

Run: `npx --yes pnpm@11.3.0 --dir apps/web typecheck && npx --yes pnpm@11.3.0 --dir apps/web build`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/features/clients/management apps/web/src/features/clients/shared
git commit -m "refactor(clients): remove placeholder demo actions on management pages"
```

---

### Task 7: Strip demo actions in Settings (audit logs, branch management, user detail)

**Files:**
- Modify: `apps/web/src/features/settings/audit-logs/audit-log-detail-panel.tsx` (`DemoButton` 77 & 86)
- Modify: `apps/web/src/features/settings/audit-logs/audit-log-table.tsx` (`DemoIconButton` 121)
- Modify: `apps/web/src/features/settings/branch-management/branch-detail-panel.tsx` (`DemoButton` 118 & 127)
- Modify: `apps/web/src/features/settings/branch-management/branch-table.tsx` (`DemoIconButton` 105)
- Modify: `apps/web/src/features/settings/user-detail-panel.tsx` (import line 8; `DemoButton` 78 & 88, `DemoLink` 99)

**Rule:** same as Task 6. Table `DemoIconButton`s that empty an "Aksi" cell → remove the cell and its header. Keep detail-view read content.

- [ ] **Step 1: Remove demo elements per the rule in all five files**

Clean up emptied containers and unused imports.

- [ ] **Step 2: Verify none remain in settings**

Run:
```bash
grep -rn "DemoButton\|DemoIconButton\|DemoLink\|demo-action" apps/web/src/features/settings
```
Expected: no matches.

- [ ] **Step 3: Confirm the whole app is demo-action-free except the component definition**

Run:
```bash
grep -rn "<DemoButton\|<DemoIconButton\|<DemoLink" apps/web/src
```
Expected: no matches (every consumer removed; `features/shell/demo-action.tsx` itself remains but is now unused — leave it for potential reuse, or note it as removable in the final task).

- [ ] **Step 4: Typecheck + build**

Run: `npx --yes pnpm@11.3.0 --dir apps/web typecheck && npx --yes pnpm@11.3.0 --dir apps/web build`
Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/features/settings
git commit -m "refactor(settings): remove placeholder demo actions"
```

---

### Task 8: Update e2e app-shell spec + final verification gate

**Files:**
- Modify: `apps/web/tests/e2e/app-shell.spec.ts`

**Interfaces:**
- Consumes: the pruned `operationalNavigation` from Task 1.

- [ ] **Step 1: Read the current app-shell spec and its nav assertions**

Run: `grep -nE "Live Chat|Leads|Segments|Tags|Behavior|Segera hadir|Clinical|Team Attendance|nav|sidebar" apps/web/tests/e2e/app-shell.spec.ts`

- [ ] **Step 2: Update assertions to the new nav**

Remove/adjust any assertion that expects a now-hidden nav label (`Live Chat`, `Leads`, `Segments`, `Tags`, `Behavior Intelligence`, the `Segera hadir` heading) and any that expects the Clients group to expand into children. Assert instead that the sidebar shows the KEEP set (e.g. `Overview`, `Appointments`, `Clients`, `Approval Center`, `Knowledge Studio`) and does NOT show `Segera hadir`.

- [ ] **Step 3: Run the e2e app-shell spec (mock mode)**

Run: `HOM_AUTH_MODE=mock HOM_DATA_MODE=mock npx --yes pnpm@11.3.0 --dir apps/web test:e2e -- app-shell`
Expected: PASS. (If corepack/PATH blocks Playwright in this shell, record that and fall back to the manual check in Step 5.)

- [ ] **Step 4: Full static gate**

Run:
```bash
npx --yes pnpm@11.3.0 --dir packages/domain test
npx --yes pnpm@11.3.0 --dir apps/web test
npx --yes pnpm@11.3.0 --dir apps/web typecheck
npx --yes pnpm@11.3.0 --dir apps/web lint
npx --yes pnpm@11.3.0 --dir apps/web build
```
Expected: all green.

- [ ] **Step 5: Manual honesty check (supabase mode, logged in)**

With the dev server running and logged in as the seeded studio director: the sidebar shows only KEEP modules, there is no "Segera hadir" section, and every visible button either acts or deep-links (no toast-only dead-ends). Hidden routes (e.g. `/live-chat`) are unreachable from any in-app link (direct URL still renders — by design).

- [ ] **Step 6: Commit**

```bash
git add apps/web/tests/e2e/app-shell.spec.ts
git commit -m "test(e2e): update app-shell nav assertions for decluttered sidebar"
```

---

## Notes for the executor

- Task 1 is a single coupled change across `routes.ts` + `sidebar-navigation.tsx`; it must end green (both files edited together).
- Tasks 5, 6, 7 (catalog / clients / settings demo removal) are independent of each other and of Tasks 2–4 — any order, or parallel worktrees.
- Task 8's Step 3 (final `grep -rn "<DemoButton\|<DemoIconButton\|<DemoLink" apps/web/src` → no matches) is the completeness gate proving Tasks 3–7 removed every consumer.
- Do not "improve while you're there" — layout/spacing polish is SP-C, tracked separately.
