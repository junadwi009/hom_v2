# Client Detail Wiring — Design Spec

- **Date:** 2026-07-14
- **Sub-project:** SP-B slice 1 (wire real data into Client Management). Follows SP-A declutter.
- **Branch:** `phase-client-detail-wiring` off `main`
- **Status:** approved design, pending plan

## Context

The Client Management page (`apps/web/src/features/clients/management/`) presents a
detail panel with tabs (Overview/History/Notes/Communication) and a filter bar
(Status/Membership/Last Visit/Risk Level/Tag). Today almost all of it is
non-functional sample UI:

- The detail tabs are decorative — `ClientDetailPanel` renders `ClientTabs`
  with no `onChange` and no per-tab content switch.
- `managed-clients-loader.ts:36-64` fills every real client with hardcoded
  placeholders (`riskLevel: "Low"`, `healthScore: 70`, "Belum ada membership",
  Rp 0 spend, a generic AI line).
- Of 5 list filters only Status and Risk Level are wired (`client-management-page.tsx:97-100`);
  Membership/Last Visit/Tag are silent no-ops, and Risk Level is meaningless
  because every client is hardcoded `Low`.

A pipeline audit established what real per-client data exists (all clientId-filterable):
appointments, client_packages, payments, and clinical_cases (table exists,
no read repo yet). No backend exists for communication/messages, risk/health
scoring, or client↔tag assignment.

## Goal

Make the Client Management detail panel and filters reflect real data through
the real business flow: a light list you filter by basic attributes, and an
on-demand rich detail view for the selected client — with honest
loading/empty/error/permission states and sensitive data gated by its own
permission. Remove the controls that have no backend rather than faking them.

## Principles

- **Wire where the pipeline supports it; remove where it does not** (user directive).
- House architecture (AGENTS.md): business logic in server use-cases, not
  components; validate inputs with Zod; reads via repositories; every screen has
  loading/empty/error/permission-denied/success states; no fake zero values.
- Sensitive data (payments, clinical notes) gated by its OWN permission, checked
  server-side.
- No new tables/migrations — read against existing schema only.

## Decisions (user-approved)

- **Notes tab:** wire it. Build a read path for `clinical_cases` by client,
  shown ONLY to users with `can_view_clinical_cases` or
  `can_manage_clinical_cases`; others see an "akses terbatas" state.
- **Total Spend:** if the viewer lacks `can_view_payments`, HIDE the Spend card
  entirely (do not render "—").
- **Communication tab:** REMOVE (no backend).
- **Risk Level filter + Health/risk/AI cards:** REMOVE (fabricated, no model).
- **Tag filter:** REMOVE (no client↔tag junction table).
- **Membership & Last Visit:** surface as detail cards, NOT list filters (avoid
  enriching every list row).
- **List filters kept:** Search + Status (options trimmed to real values).

## Architecture

### Data flow
```
List (server-loaded, light)         Detail (on-demand per client)
clients.list({search,status})  -->  select client id
  → name, phone(masked), status     → server action loadClientDetail(clientId)
                                        ├ client_packages.list({clientId})   → Membership
                                        ├ appointments.list({clientId})      → Activity + History
                                        ├ payments.list({clientId,paid})     → Total Spend  [gated can_view_payments]
                                        └ clinical_cases (new read repo)      → Notes        [gated can_view_clinical_cases]
                                     → returns ClientDetail + capability flags
```

### New/changed units
1. **Clinical-cases read repository** (`apps/web/src/lib/clinical-cases/supabase/clinical-case-repository.ts`)
   — a `listByClient(clientId)` returning `ClientClinicalCase[]` (id, title,
   caseStatus, severity, summary, openedOn). Domain schema for the read shape in
   `packages/domain/src/clinical-cases/` (new, mirrors existing create types).
   RLS already gates SELECT by `can_view_clinical_cases`/`can_manage_clinical_cases`.
2. **Client-detail server loader/action** (`apps/web/src/features/clients/management/client-detail-loader.ts`,
   exposed via a `"use server"` action `loadClientDetailAction(clientId)`).
   Resolves the current user's permissions once, then fetches only the sources
   the caller may see. Returns:
   ```ts
   type ClientDetailResult =
     | { status: "ready"; detail: ClientDetail }
     | { status: "permission_denied" }
     | { status: "error" };
   type ClientDetail = {
     clientId: string;
     membership: MembershipSummary | null;      // from latest active client_package
     activity: { lastVisit: string | null; totalVisits: number };
     spend: SpendSummary | null;                 // null when !can_view_payments
     appointments: ClientAppointmentRow[];       // History tab
     notes:                                      // Notes tab
       | { access: "granted"; cases: ClientClinicalCase[] }
       | { access: "restricted" };
   };
   ```
   Aggregation (spend sum, last-visit derivation) lives here, server-side.
3. **Detail panel rewrite** (`client-detail-panel.tsx`) — becomes a client
   component that, on `clientId` change, calls the action, tracks
   loading/error, and renders the active tab. Tabs: **Overview**, **History**,
   **Notes** (Communication removed). `ClientTabs` now receives a real
   `onChange`. Skeleton loader while fetching; empty states per tab
   ("Belum ada kunjungan", "Belum ada catatan"); "akses terbatas" for
   restricted notes.
4. **List simplification** — `managed-clients-loader.ts` stops emitting the
   fabricated rich fields; the list needs only `{id, name, phone, status,
   initials}`. The rich `ManagedClient` placeholder fields are removed from the
   list path (detail comes from the loader). Mock-mode fallback
   (`management-data.ts`) is trimmed to match or kept behind the mock branch.
5. **Filter trim** (`client-management-page.tsx` + `managementFilters`) — filter
   bar renders only Status (Semua/Active/Trial/Dormant) and Search. Remove
   Membership/Last Visit/Risk Level/Tag entries and the dead `handleFilterChange`
   branches for them.

## Non-goals

- No new tables/migrations; no risk/health scoring model; no communication
  backend; no client↔tag assignment; no write actions from the detail panel.
- No visual redesign beyond what the tab/card changes require.
- Leads/Segments/Tags/other hidden modules are untouched.

## States (each must exist)

- Detail: loading (skeleton), ready, empty-per-tab, error, permission_denied.
- Spend card: rendered only with `can_view_payments`.
- Notes tab: granted (list or empty) vs restricted ("akses terbatas").
- List: existing empty/error states unchanged.

## Testing / verification

- Domain: schema tests for the new clinical-cases read shape and any mappers.
- Web unit: `loadClientDetail` — permission gating (spend hidden without
  `can_view_payments`; notes restricted without clinical perms), spend
  aggregation sums only `paid`, last-visit derivation picks max completed
  `startsAt`, error path returns `{status:"error"}`. Mock `server-only` per repo
  convention.
- Detail panel: story/render for each tab + loading + restricted-notes states.
- Gate: typecheck, lint, `next build`, domain + web test suites green. Update any
  client-management unit test that asserted the removed filters/fields.
- Manual (supabase mode, seeded studio director): select a client → Overview
  shows real membership/activity (and spend, since director has payments perm),
  History lists real appointments, Notes shows clinical cases or empty; tabs
  switch content; Status/Search filter the list; no Communication tab, no
  Risk/Tag/Membership/Last-Visit filters.

## Risks / notes

- **N+1 avoidance:** detail loads only for the selected client (one action call),
  not for every list row — keeps the list cheap.
- **Permission divergence:** `can_view_payments` and `can_view_clinical_cases`
  are separate from `can_view_clients`; a user can see the profile but not spend
  or notes. Gating is server-side; the client only receives what it may show.
- **Masked contact:** phone/email are already masked upstream; the detail panel
  shows masked values (no raw-contact getter exists — do not add one).
- **Mock mode:** the detail action needs a mock branch (or a
  `configuration_error`-style state) so the page still renders without Supabase,
  consistent with sibling loaders.
- Expired-package status derivation (from the separate audit-fixes branch) is not
  a dependency here; membership shows whatever status the repo returns.
