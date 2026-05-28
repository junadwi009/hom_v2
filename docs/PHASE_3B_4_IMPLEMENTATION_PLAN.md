# Phase 3B.4 Implementation Plan

Date: 2026-05-27

Status: planning only. Do not implement until the owner approves this plan.

## Goal

Phase 3B.4 should connect the existing read-only catalog repository factory to the first catalog UI surface while keeping `HOM_DATA_MODE=mock` as the default.

This phase should prove the app can render real domain read models from the catalog repository boundary without adding writes, API routes, server actions, real Supabase Auth, or service-role access.

## Current Source of Truth

Phase 3B.1 added:

- Domain schemas and types for clients, practitioners, and services.
- Read-only repository interfaces with only `list` and `getById`.
- Mock repositories using safe mock data.
- Masked contact fields in catalog read models.

Phase 3B.2 added:

- Local-only Supabase tables for `clients`, `practitioners`, and `services`.
- Safe dummy seed data.
- RLS read policies only.
- No direct insert, update, or delete policies for authenticated browser/client users.

Phase 3B.3 added:

- Contact masking helpers.
- `CatalogRepositoryError`.
- `createCatalogRepositories`.
- Supabase read-only repository adapters.
- Supabase row mappers that do not expose raw phone/email fields.
- Tests proving repository method shape remains read-only.

Phase 2.6 remains the audit source of truth:

- Direct client inserts into `audit_logs` are blocked.
- Future audit writing must be server-only.
- No audit writer API or service-role admin client exists yet.

## Recommended Phase 3B.4 Scope

Recommendation: start with the existing `/clients` page only.

Why:

- `/clients` already exists in the app and navigation.
- There are no current `/practitioners` or `/services` routes.
- Adding practitioner/service pages would require route, navigation, and product UX decisions that are bigger than a first repository-fed UI step.
- Clients are the most natural first catalog surface and already use a mock page today.
- This keeps the phase small, reviewable, and easy for a beginner solo developer to understand.

Do not include practitioner or service pages in Phase 3B.4. Plan those later after the clients page proves the pattern.

## UI Pages To Read From Repositories First

Phase 3B.4 should update:

- `apps/web/src/app/clients/page.tsx`

The page should stop using `modulePages.clients` directly and instead load clients through `createCatalogRepositories().clients.list(...)`.

Recommended default query:

```ts
{
  page: 1,
  pageSize: 20,
}
```

Do not add search, filter, pagination controls, or URL query parameter handling yet unless explicitly approved. Those are useful, but they expand the UI surface.

## Proposed File Structure

Recommended new files:

```text
apps/web/src/features/catalog/clients/clients-catalog-page.tsx
apps/web/src/features/catalog/clients/clients-page-loader.ts
apps/web/src/features/catalog/clients/clients-page-state.ts
apps/web/src/features/catalog/clients/clients-table.tsx
apps/web/src/features/catalog/clients/clients-catalog-page.stories.tsx
apps/web/tests/unit/catalog/clients-page-loader.test.ts
```

Possible route-level loading file:

```text
apps/web/src/app/clients/loading.tsx
```

Do not add:

```text
apps/web/src/app/api/clients/route.ts
apps/web/src/app/api/practitioners/route.ts
apps/web/src/app/api/services/route.ts
```

## Server Loader Strategy

Use a server loader, not client-side database access.

Recommended flow:

1. `apps/web/src/app/clients/page.tsx` remains a server component.
2. The page calls a server-side `loadClientsCatalogPage()` function.
3. `loadClientsCatalogPage()` calls `createCatalogRepositories()`.
4. The loader calls `repositories.clients.list({ page: 1, pageSize: 20 })`.
5. The loader returns a small discriminated union page state.
6. The page passes that state to a presentational component.

Recommended state shape:

```ts
type ClientsPageState =
  | { status: "ready"; total: number; rows: ClientTableRow[]; source: "mock" | "supabase" }
  | { status: "empty"; source: "mock" | "supabase" }
  | { status: "permission_denied"; source: "supabase" }
  | { status: "configuration_error"; source: "supabase" }
  | { status: "error"; source: "mock" | "supabase" };
```

The exact type can be adjusted during implementation, but it should keep raw repository errors out of UI components.

No route handlers are justified in Phase 3B.4 because:

- The UI can read data from server components.
- A route handler would create an API surface before auth, permissions, and catalog API contracts are ready.
- No external caller needs catalog data yet.

No server actions are justified because:

- Phase 3B.4 is read-only.
- There are no approved mutations.

## Data Display Strategy

Render only safe fields in the first repository-fed Clients page:

- Client name.
- Status.
- Primary practitioner name.
- Created date or updated date if useful.

Do not display raw phone or raw email.

Recommendation for Phase 3B.4: do not show contact columns yet. Even though repository read models expose `maskedPhone` and `maskedEmail`, leaving contact details out of the first UI pass keeps the privacy surface smaller. A later phase can add explicitly designed masked contact display.

Avoid fake metrics. Metrics should come from actual loaded repository data only.

Safe first metrics:

- Loaded clients: `result.total`.
- Current page size: number of rows currently rendered.
- Data mode: `mock` or `supabase`.

If loading fails, do not show fake zero values.

## Loading, Empty, Error, And Permission-Safe States

### Loading

Use `apps/web/src/app/clients/loading.tsx` with existing `LoadingSkeleton` components.

The loading state should look like part of the app shell and avoid fake client counts.

### Empty

If the repository succeeds and returns `total = 0`, render `EmptyState`.

Message should explain that no clients are available for the current read-only catalog view.

### Error

If an unexpected error occurs, render `ErrorState` with a safe message.

Do not render raw Supabase error messages, SQL details, environment variable names, stack traces, or secrets.

### Permission-Safe

If `HOM_DATA_MODE=supabase` is enabled before real Supabase Auth is approved, reads may fail because RLS correctly requires an authenticated app user with permissions.

Expected behavior:

- Do not bypass RLS.
- Do not use service-role keys.
- Do not silently fall back to mock data after Supabase mode was explicitly selected.
- Do not pretend the catalog is empty.
- Render `PermissionDeniedState` or a catalog-specific permission-safe state explaining that catalog data is unavailable in Supabase mode until approved auth/session setup exists.

### Configuration Error

If `HOM_DATA_MODE=supabase` is set but local Supabase public environment variables are missing, render a safe configuration state.

The UI should not expose secret names or raw thrown messages. The implementation log can document the behavior in beginner-friendly language.

## Mock Mode Behavior

`HOM_DATA_MODE=mock` remains the default.

In default local development:

- `/clients` should render repository-fed mock clients.
- The data should come from `createMockClientRepository()` through `createCatalogRepositories()`.
- The page should still clearly avoid real production data.
- Existing shell and navigation should continue to work.

Missing or invalid `HOM_DATA_MODE` already falls back to mock through `getDataMode()` and the repository factory. Phase 3B.4 should preserve that.

## Supabase Mode Behavior

`HOM_DATA_MODE=supabase` should use the Supabase read-only repositories from Phase 3B.3.

Important:

- Supabase mode must use the existing anon/session-based server client.
- Supabase mode must not use a service-role admin client.
- Supabase mode must not bypass RLS.
- Real Supabase Auth is still not approved.
- Local authenticated fixtures are not approved for this phase unless the owner changes scope.

If Supabase mode is accidentally enabled before real auth exists, the page should show a safe unavailable/permission state.

## Storybook Plan

Add a Storybook story for the presentational clients catalog component.

Recommended stories:

- Ready with mock rows.
- Empty state.
- Permission denied state.
- Generic error state.
- Configuration error state if implemented separately.

Stories should use static safe mock data and should not call repositories.

## Test Plan

### Unit Tests

Add unit tests for the server loader and row mapping helpers if implementation creates them:

- Mock mode returns a ready state with mock client rows.
- Invalid or missing `HOM_DATA_MODE` still uses mock mode.
- Empty repository result returns an empty state.
- `CatalogRepositoryError` in Supabase mode returns permission-safe or error state without raw details.
- Missing Supabase configuration in Supabase mode returns a safe configuration state.
- Table row mapping does not include raw `phone` or `email`.
- UI row fields are derived from `Client` read models, not from database rows.

Do not add local authenticated Supabase fixtures.

### Playwright Smoke Tests

Update Playwright smoke coverage to include `/clients`.

Recommended assertions:

- App shell renders.
- `Clients` heading renders.
- Repository-fed mock client name renders, for example `Mock Client Alpha`.
- No create/edit/delete client controls are visible.
- No raw production-like client data is present.
- Optional: no raw phone/email column is present if the first UI pass omits contact details.

Do not add Playwright tests that require cloud Supabase, real auth, or local durable auth fixtures.

### Required Final Checks

After implementation approval, run:

```powershell
corepack pnpm typecheck
corepack pnpm lint
corepack pnpm test
corepack pnpm build
corepack pnpm build-storybook
corepack pnpm test:e2e
```

Local Supabase reset is not required unless implementation changes database files, which Phase 3B.4 should not do.

## Explicit Non-Goals

Do not implement:

- Catalog create, update, delete, upsert, import, or archive flows.
- Catalog write repository methods.
- Catalog write UI.
- Appointment core.
- Real Supabase Auth.
- Local authenticated Supabase fixtures.
- Service-role admin client.
- API route surface for catalog data.
- Catalog route handlers.
- Server actions.
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

- If the Clients page catches every error as generic empty data, it could hide RLS or configuration problems. The implementation must keep empty and failure states separate.
- If the page displays mock email fields directly, it may weaken the contact-masking design. The first UI pass should omit contact columns.
- If route handlers are added too early, the app gains an API contract before auth and permission behavior are approved.
- If Supabase mode silently falls back to mock after a Supabase failure, developers may miss permission or configuration issues.
- If practitioner/service pages are added now, the phase grows into navigation and UX design instead of a focused integration step.

## Proposed Implementation Steps After Approval

1. Confirm no cloud Supabase project is linked with `Test-Path supabase/.temp/project-ref`.
2. Add Clients page state types.
3. Add a server loader that calls `createCatalogRepositories().clients.list`.
4. Add a presentational `ClientsCatalogPage` component with ready, empty, error, permission, and configuration states.
5. Update `apps/web/src/app/clients/page.tsx` to use the loader and presentational component.
6. Add `apps/web/src/app/clients/loading.tsx` if useful for route-level loading.
7. Add Storybook stories for the presentational component states.
8. Add unit tests for loader behavior and safe row mapping.
9. Add `/clients` to Playwright smoke tests and assert mock repository data appears.
10. Run all required checks.
11. Create `docs/PHASE_3B_4_IMPLEMENTATION_LOG.md`.
12. Stop before practitioner/service pages, catalog writes, API routes, real auth, or Phase 3B.5.

## Approval Gate

Stop here.

Phase 3B.4 implementation must not begin until the owner approves:

- Clients page only.
- No practitioner or service pages in this phase.
- No route handlers or server actions.
- No contact columns in the first repository-fed Clients UI.
