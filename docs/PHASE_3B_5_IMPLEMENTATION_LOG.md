# Phase 3B.5 Implementation Log

Date: 2026-05-27

Status: implemented Phase 3B.5 only. Stop here before catalog writes, route handlers, server actions, real auth, Supabase fixtures, appointment work, or Phase 4 planning.

## Scope Completed

Phase 3B.5 connected the existing read-only catalog repository factory to the Practitioners and Services pages.

Completed:

- Added `/practitioners` route.
- Added `/services` route.
- Added Practitioners and Services to primary navigation.
- Added server loaders for practitioners and services.
- Added presentational catalog pages and tables for practitioners and services.
- Added route-level loading states for both routes.
- Added ready, empty, permission-safe, configuration-safe, and generic error states for both pages.
- Added Storybook stories for both presentational pages.
- Added unit tests for loader behavior and safe table row mapping.
- Updated Playwright smoke coverage for `/practitioners` and `/services`.

`HOM_DATA_MODE=mock` remains the default.

## Files Changed

- `apps/web/src/app/practitioners/page.tsx`
- `apps/web/src/app/practitioners/loading.tsx`
- `apps/web/src/app/services/page.tsx`
- `apps/web/src/app/services/loading.tsx`
- `apps/web/src/features/catalog/practitioners/practitioners-page-state.ts`
- `apps/web/src/features/catalog/practitioners/practitioners-page-loader.ts`
- `apps/web/src/features/catalog/practitioners/practitioners-table.tsx`
- `apps/web/src/features/catalog/practitioners/practitioners-catalog-page.tsx`
- `apps/web/src/features/catalog/practitioners/practitioners-catalog-page.stories.tsx`
- `apps/web/src/features/catalog/services/services-page-state.ts`
- `apps/web/src/features/catalog/services/services-page-loader.ts`
- `apps/web/src/features/catalog/services/services-table.tsx`
- `apps/web/src/features/catalog/services/services-catalog-page.tsx`
- `apps/web/src/features/catalog/services/services-catalog-page.stories.tsx`
- `apps/web/src/lib/routes.ts`
- `apps/web/tests/unit/catalog/practitioners-page-loader.test.ts`
- `apps/web/tests/unit/catalog/services-page-loader.test.ts`
- `apps/web/tests/e2e/app-shell.spec.ts`
- `docs/PHASE_3B_5_IMPLEMENTATION_LOG.md`

## Routes Added

Added:

- `/practitioners`
- `/services`

Both routes are server-rendered and include:

```ts
export const dynamic = "force-dynamic";
```

This keeps repository mode selection request-time safe instead of freezing `HOM_DATA_MODE` during the production build.

## Navigation Changes

Added two primary navigation items:

- `Practitioners`
- `Services`

Both point to the new read-only catalog pages.

## Practitioner UI Fields

The Practitioners UI renders only:

- Display name.
- Status.
- App profile link indicator: `Linked` or `Not linked`.
- Updated date.

The Practitioners UI does not render:

- Raw email.
- Masked email.
- Contact columns.
- App user UUID.
- Auth user ID.
- Create, edit, or delete controls.

## Service UI Fields

The Services UI renders only:

- Service name.
- Category.
- Duration, such as `60 min`.
- `defaultPriceIdr` formatted as Indonesian rupiah.
- Status.
- Updated date.

Service price behavior:

- `defaultPriceIdr: null` displays `Not set`.
- Null price is not displayed as `Rp 0`.
- No `defaultPriceCents` or cents-based naming was introduced.

## Loader Behavior

Practitioners use `loadPractitionersCatalogPage()`.

Services use `loadServicesCatalogPage()`.

Both loaders:

- Call `createCatalogRepositories()`.
- Use the repository selected by `HOM_DATA_MODE`.
- Default to mock repositories when `HOM_DATA_MODE` is missing or invalid.
- Request page 1 with a page size of 20.
- Return `ready` when rows load.
- Return `empty` when the repository succeeds with zero rows.
- Return `permission_denied` for safe permission-style `CatalogRepositoryError` failures.
- Return `configuration_error` when Supabase mode is selected but local public Supabase configuration is unavailable.
- Return `error` for other safe failures.
- Do not expose raw Supabase error details, stack traces, secrets, email addresses, contact values, app user UUIDs, or auth IDs to UI state.

## Storybook Stories Added

Added `Catalog/PractitionersCatalogPage` stories:

- `Ready`
- `Empty`
- `PermissionDenied`
- `GenericError`
- `ConfigurationError`

Added `Catalog/ServicesCatalogPage` stories:

- `Ready`
- `Empty`
- `PermissionDenied`
- `GenericError`
- `ConfigurationError`

Stories use static safe mock data and do not call repositories.

## Tests Added

Added `apps/web/tests/unit/catalog/practitioners-page-loader.test.ts`.

Coverage includes:

- Mock mode returns a ready state.
- Missing `HOM_DATA_MODE` still uses mock mode.
- Invalid `HOM_DATA_MODE` still uses mock mode.
- Empty repository result returns an empty state.
- `CatalogRepositoryError` maps to `permission_denied`.
- Missing Supabase configuration maps to `configuration_error`.
- Practitioner table row mapping does not include raw email or masked email.
- Practitioner table row mapping does not expose `appUserId`; it exposes only `Linked` or `Not linked`.

Added `apps/web/tests/unit/catalog/services-page-loader.test.ts`.

Coverage includes:

- Mock mode returns a ready state.
- Missing `HOM_DATA_MODE` still uses mock mode.
- Invalid `HOM_DATA_MODE` still uses mock mode.
- Empty repository result returns an empty state.
- `CatalogRepositoryError` maps to `permission_denied`.
- Missing Supabase configuration maps to `configuration_error`.
- Service table row mapping uses `defaultPriceIdr`.
- Service table row mapping does not include `defaultPriceCents`.
- Null service price displays `Not set`, not `Rp 0`.

Updated Playwright coverage in `apps/web/tests/e2e/app-shell.spec.ts`:

- `/practitioners` is part of app shell smoke coverage.
- `/practitioners` renders the `Practitioners` heading.
- Repository-fed `Mock Practitioner One` renders.
- `/practitioners` does not show create, edit, or delete controls.
- `/practitioners` does not show email or contact columns.
- `/services` is part of app shell smoke coverage.
- `/services` renders the `Services` heading.
- Repository-fed `Mock Intro Assessment` renders.
- `/services` does not show create, edit, or delete controls.
- `/services` does not show booking or appointment controls.

## Commands Run

Required checks:

```powershell
corepack pnpm typecheck
corepack pnpm lint
corepack pnpm test
corepack pnpm build
corepack pnpm build-storybook
corepack pnpm test:e2e
```

Safety checks:

```powershell
Test-Path supabase/.temp/project-ref
rg --files apps/web/src/app apps/web/src/features/catalog apps/web/tests/e2e apps/web/tests/unit | sort
rg "use server|/api/practitioners|/api/services|SERVICE_ROLE|service-role|audit writer|\\.insert|\\.update|\\.delete|createPractitioner|updatePractitioner|deletePractitioner|createService|updateService|deleteService|defaultPriceCents" apps/web/src/app apps/web/src/features/catalog apps/web/src/lib/catalog apps/web/tests -n
rg --files supabase/migrations | sort
```

Local Supabase reset was not run because Phase 3B.5 did not add or change database migrations and did not add local authenticated Supabase fixtures.

## Final Check Results

| Command | Result | Notes |
| --- | --- | --- |
| `Test-Path supabase/.temp/project-ref` | Passed | Output was `False`; no cloud Supabase project link marker exists. |
| `corepack pnpm typecheck` | Passed | `packages/domain` and `apps/web` passed `tsc --noEmit`. |
| `corepack pnpm lint` | Passed | Full web ESLint passed in the final run. |
| `corepack pnpm test` | Passed | Domain: 5 files, 44 tests. Web: 5 files, 38 tests. |
| `corepack pnpm build` | Passed | Next.js production build passed. `/practitioners` and `/services` are dynamic/server-rendered on demand. |
| `corepack pnpm build-storybook` | Passed | Storybook static build completed successfully. |
| `corepack pnpm test:e2e` | Passed | Playwright: 13 Chromium tests passed. |

## Warnings

- An earlier lint attempt produced no diagnostics but did not return promptly; it was rerun and passed cleanly.
- Storybook/Vite reported plugin timing warnings.
- Storybook/Vite reported chunks larger than 500 kB after minification.
- Playwright/Next printed `NO_COLOR` ignored because `FORCE_COLOR` is set.
- This folder is not currently a Git repository, so `git status --short` is not available.

These warnings do not block Phase 3B.5.

## Safety Confirmation

Confirmed:

- UI integration is limited to Practitioners and Services pages for this phase.
- No contact columns were added for practitioners.
- No raw or masked practitioner email is rendered.
- No app user UUID or auth user ID is rendered.
- No create, edit, or delete controls were added.
- No booking or appointment controls were added.
- No catalog route handlers were added.
- No `/api/practitioners` or `/api/services` route was added.
- No server actions were added.
- No catalog writes were added.
- No catalog create/update/delete/upsert UI was added.
- No catalog write repository methods were added.
- No migrations were added.
- No local authenticated Supabase fixtures were added.
- No real Supabase Auth was added.
- No service-role admin client was added.
- No audit writer API was added.
- No cloud Supabase project was linked or pushed.
- `supabase/.temp/project-ref` is absent.
- Existing Phase 2.6 audit safety remains intact; direct client audit inserts are still not reintroduced.
- No appointment, finance, clinical notes, WhatsApp, AI Gateway, workers, n8n, FastAPI, Flask, VPS, production services, secrets, or production data were added.

## Stop Point

Phase 3B.5 is complete and stops here.

Recommended next approval decision:

- Plan the next phase separately before any catalog filtering, pagination controls, detail pages, catalog write flows, real auth, or appointment work.
