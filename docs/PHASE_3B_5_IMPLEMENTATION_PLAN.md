# Phase 3B.5 Implementation Plan

Date: 2026-05-27

Status: planning only. Do not implement until the owner approves this plan.

## Goal

Phase 3B.5 should add read-only UI integration for practitioners and services using the existing catalog repository factory.

This should follow the Phase 3B.4 Clients page pattern:

- Server loader only.
- Repository factory only.
- `HOM_DATA_MODE=mock` remains default.
- Supabase mode remains RLS-respecting and does not bypass auth.
- No route handlers.
- No server actions.
- No catalog writes.

## Recommendation: Implement Together

Recommendation: implement practitioners and services together in Phase 3B.5.

Why this is acceptable:

- Both domains already have read-only repository interfaces and mock/Supabase repositories.
- Both are simple catalog lists.
- Neither requires sensitive clinical, finance, appointment, WhatsApp, or payroll behavior.
- Both can reuse the Clients page implementation pattern.
- The implementation can stay small if it avoids filters, detail pages, actions, and writes.

Keep the work reviewable by using parallel folder structure and matching state/loader/component patterns for both pages.

Fallback option:

- If the owner wants the smallest possible review, split into Phase 3B.5A `/practitioners` and Phase 3B.5B `/services`.
- The safer default recommendation is still to do both together because the surface area is repetitive and read-only.

## Proposed Routes

Add:

```text
/practitioners
/services
```

Recommended route files:

```text
apps/web/src/app/practitioners/page.tsx
apps/web/src/app/practitioners/loading.tsx
apps/web/src/app/services/page.tsx
apps/web/src/app/services/loading.tsx
```

Both `page.tsx` files should be server components and should export:

```ts
export const dynamic = "force-dynamic";
```

This keeps `HOM_DATA_MODE` runtime-aware instead of freezing mock output during build.

## Navigation Plan

Recommended: add both pages to `primaryNavigation` after `Clients`.

Suggested labels:

- `Practitioners`
- `Services`

Reason:

- Hidden routes are confusing for a beginner solo developer and for internal users.
- Practitioners and services are operational catalog surfaces, not settings-only pages.
- No create/edit/delete controls will be present, so adding navigation does not imply mutation capability.

## Proposed File Structure

Practitioners:

```text
apps/web/src/features/catalog/practitioners/practitioners-page-state.ts
apps/web/src/features/catalog/practitioners/practitioners-page-loader.ts
apps/web/src/features/catalog/practitioners/practitioners-table.tsx
apps/web/src/features/catalog/practitioners/practitioners-catalog-page.tsx
apps/web/src/features/catalog/practitioners/practitioners-catalog-page.stories.tsx
apps/web/tests/unit/catalog/practitioners-page-loader.test.ts
```

Services:

```text
apps/web/src/features/catalog/services/services-page-state.ts
apps/web/src/features/catalog/services/services-page-loader.ts
apps/web/src/features/catalog/services/services-table.tsx
apps/web/src/features/catalog/services/services-catalog-page.tsx
apps/web/src/features/catalog/services/services-catalog-page.stories.tsx
apps/web/tests/unit/catalog/services-page-loader.test.ts
```

Optional shared helper if duplication becomes distracting:

```text
apps/web/src/features/catalog/shared/catalog-page-errors.ts
apps/web/src/features/catalog/shared/date-format.ts
```

Only add shared helpers if they reduce real duplication without making the code harder for a beginner to follow.

## Server Loader Strategy

Use server loaders only.

Practitioners flow:

1. `apps/web/src/app/practitioners/page.tsx` calls `loadPractitionersCatalogPage()`.
2. The loader calls `createCatalogRepositories()`.
3. The loader calls `repositories.practitioners.list({ page: 1, pageSize: 20 })`.
4. The loader maps `Practitioner` domain read models into table rows.
5. The page renders a presentational component.

Services flow:

1. `apps/web/src/app/services/page.tsx` calls `loadServicesCatalogPage()`.
2. The loader calls `createCatalogRepositories()`.
3. The loader calls `repositories.services.list({ page: 1, pageSize: 20 })`.
4. The loader maps `Service` domain read models into table rows.
5. The page renders a presentational component.

Do not add:

- Client-side Supabase calls.
- Route handlers.
- Server actions.
- API route surface.
- Service-role access.
- Local authenticated Supabase fixtures.

## UI State Strategy

Use the same state categories as Clients:

- `ready`
- `empty`
- `permission_denied`
- `configuration_error`
- `error`

Add route-level loading files for:

- `/practitioners`
- `/services`

Loading state:

- Use existing `LoadingSkeleton`, `DashboardCard`, and `PageHeader`.
- Do not show fake counts.

Empty state:

- Use `EmptyState`.
- Copy should say the read-only catalog returned no practitioners/services.

Permission-safe state:

- Use `PermissionDeniedState` or a catalog-specific wrapper if needed.
- This state is expected if `HOM_DATA_MODE=supabase` is enabled before real Supabase Auth exists.
- Do not silently fall back to mock if Supabase mode was explicitly selected.
- Do not pretend permission failure is an empty catalog.

Configuration-safe state:

- Use `ErrorState` with safe copy.
- Do not expose raw env var names, stack traces, Supabase details, or secrets.

Generic error state:

- Use `ErrorState`.
- Keep messages operational and safe.

## Safe Fields To Render

### Practitioners

Render:

- Display name.
- Status.
- App user link indicator:
  - `Linked` when `appUserId` is present.
  - `Not linked` when `appUserId` is null.
- Updated date.

Do not render:

- Raw email.
- Masked email.
- Any contact columns.
- App user UUID.
- Auth user ID.

Reason:

- The first practitioner UI pass should prove roster visibility without expanding identity/contact exposure.
- The app user link indicator is enough to show whether the practitioner has an app profile without exposing internal IDs.

### Services

Render:

- Service name.
- Category.
- Duration, for example `60 min`.
- `defaultPriceIdr`, formatted as Indonesian rupiah when present.
- Status.
- Updated date.

Price behavior:

- If `defaultPriceIdr` is `null`, display `Not set`.
- Do not display null as `Rp 0`.
- Do not introduce `defaultPriceCents` or cents-based naming.

Do not render:

- Appointment availability.
- Package balances.
- Payment data.
- Finance ledger information.

## Metrics Strategy

Use only loaded repository data.

Recommended metrics for practitioners:

- Loaded practitioners: `result.total`.
- Visible rows: `result.items.length`.
- Roster source: `mock` or `supabase`.

Recommended metrics for services:

- Loaded services: `result.total`.
- Visible rows: `result.items.length`.
- Roster source: `mock` or `supabase`.

Do not show fake zero values when loading fails.

## Storybook Story Plan

Add stories for both presentational pages.

Practitioners:

- `Ready`
- `Empty`
- `PermissionDenied`
- `GenericError`
- `ConfigurationError`

Services:

- `Ready`
- `Empty`
- `PermissionDenied`
- `GenericError`
- `ConfigurationError`

Stories should:

- Use static safe mock data.
- Not call repositories.
- Not connect to Supabase.
- Not show create/edit/delete controls.

## Unit Test Plan

Practitioner loader tests:

- Mock mode returns `ready` with mock practitioner rows.
- Missing or invalid `HOM_DATA_MODE` still uses mock mode.
- Empty repository result returns `empty`.
- Permission-style `CatalogRepositoryError` maps to `permission_denied`.
- Missing Supabase configuration maps to `configuration_error`.
- Table row mapping does not include raw or masked email.
- Table row mapping does not expose `appUserId`; it exposes only a linked/not-linked label.

Service loader tests:

- Mock mode returns `ready` with mock service rows.
- Missing or invalid `HOM_DATA_MODE` still uses mock mode.
- Empty repository result returns `empty`.
- Permission-style `CatalogRepositoryError` maps to `permission_denied`.
- Missing Supabase configuration maps to `configuration_error`.
- Table row mapping uses `defaultPriceIdr`.
- Table row mapping does not include `defaultPriceCents`.
- Null price displays `Not set`, not `Rp 0`.

Existing catalog repository tests from Phase 3B.3 should remain unchanged unless a small shared helper requires adjustment.

## Playwright Smoke Test Plan

Update Playwright smoke coverage to include:

```text
/practitioners
/services
```

Practitioners assertions:

- App shell renders.
- `Practitioners` heading renders.
- Repository-fed mock practitioner row renders, for example `Mock Practitioner One`.
- Column headers include display/status/app profile/updated style fields.
- No create/edit/delete buttons are visible.
- No email/contact columns are visible.

Services assertions:

- App shell renders.
- `Services` heading renders.
- Repository-fed mock service row renders, for example `Mock Intro Assessment`.
- Column headers include service/category/duration/default price/status/updated style fields.
- No create/edit/delete buttons are visible.
- No appointment booking controls are visible.

Do not add Playwright tests that require:

- Cloud Supabase.
- Real auth.
- Local authenticated Supabase fixtures.
- Appointment booking.
- Catalog writes.

## Required Verification

Before implementation:

```powershell
Test-Path supabase/.temp/project-ref
```

Expected result:

```text
False
```

After implementation approval, run:

```powershell
corepack pnpm typecheck
corepack pnpm lint
corepack pnpm test
corepack pnpm build
corepack pnpm build-storybook
corepack pnpm test:e2e
```

Local Supabase reset is not required unless implementation changes database files. Phase 3B.5 should not change database files.

## Explicit Non-Goals

Do not implement:

- Catalog writes.
- Create/edit/delete buttons.
- Practitioner create/update/delete.
- Service create/update/delete.
- Catalog import/export.
- Detail pages.
- Search/filter/pagination controls.
- Appointment booking.
- Appointment availability.
- Route handlers.
- `/api/practitioners`.
- `/api/services`.
- Server actions.
- Real Supabase Auth.
- Local authenticated Supabase fixtures.
- Service-role admin client.
- Audit writer API.
- Finance.
- Clinical notes.
- WhatsApp.
- AI Gateway.
- Workers.
- n8n.
- FastAPI.
- Flask.
- VPS deployment.
- Production services.
- Secrets.
- Production data.
- Cloud Supabase linking or pushing.

## Risks

- Adding two routes at once could become noisy if the implementation creates too many abstractions. Keep the pages explicit and beginner-readable.
- Showing practitioner email, even masked, expands the contact data surface. Keep contact columns out.
- Showing internal app user IDs would leak implementation details. Use only a linked/not-linked indicator.
- Displaying null service prices as `Rp 0` could mislead operations. Use `Not set`.
- Adding route handlers too early would create an API contract before auth and permission behavior are approved.
- Adding create/edit/delete controls would imply writes that are not approved.

## Proposed Implementation Steps After Approval

1. Confirm no cloud Supabase project is linked.
2. Add `/practitioners` route and loading state.
3. Add practitioner page state, loader, table, and presentational component.
4. Add practitioner Storybook stories.
5. Add practitioner unit tests.
6. Add `/services` route and loading state.
7. Add service page state, loader, table, and presentational component.
8. Add service Storybook stories.
9. Add service unit tests.
10. Add `Practitioners` and `Services` to primary navigation if approved with this plan.
11. Add Playwright smoke tests for `/practitioners` and `/services`.
12. Run all required checks.
13. Create `docs/PHASE_3B_5_IMPLEMENTATION_LOG.md`.
14. Stop before writes, filters, detail pages, appointment booking, real auth, or Phase 3B.6.

## Approval Gate

Stop here.

Phase 3B.5 implementation must not begin until the owner approves:

- Implementing practitioners and services together.
- Adding `/practitioners` and `/services`.
- Adding both pages to primary navigation.
- No contact columns for practitioners.
- No create/edit/delete controls.
