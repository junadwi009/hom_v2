# Phase 3B.4 Implementation Log

Date: 2026-05-27

Status: implemented Phase 3B.4 only. Stop here before practitioner/service pages, catalog writes, API routes, real auth, or Phase 3B.5.

## Scope Completed

Phase 3B.4 connected the existing read-only catalog repository factory to the Clients page only.

Completed:

- Added Clients page state types.
- Added a server loader that calls `createCatalogRepositories().clients.list({ page: 1, pageSize: 20 })`.
- Added a presentational Clients catalog page.
- Added a Clients table component.
- Added a route-level loading state.
- Added ready, empty, permission-safe, configuration-safe, and generic error UI states.
- Updated `/clients` to use the server loader and presentational component.
- Added Storybook stories for the Clients catalog states.
- Added unit tests for loader behavior and safe table row mapping.
- Added Playwright smoke coverage for repository-fed mock Clients UI.

`HOM_DATA_MODE=mock` remains the default.

## Files Changed

- `apps/web/src/app/clients/page.tsx`
- `apps/web/src/app/clients/loading.tsx`
- `apps/web/src/components/hom/status-badge.tsx`
- `apps/web/src/features/catalog/clients/clients-page-state.ts`
- `apps/web/src/features/catalog/clients/clients-page-loader.ts`
- `apps/web/src/features/catalog/clients/clients-table.tsx`
- `apps/web/src/features/catalog/clients/clients-catalog-page.tsx`
- `apps/web/src/features/catalog/clients/clients-catalog-page.stories.tsx`
- `apps/web/tests/unit/catalog/clients-page-loader.test.ts`
- `apps/web/tests/e2e/app-shell.spec.ts`
- `docs/PHASE_3B_4_IMPLEMENTATION_LOG.md`

## Loader Behavior

The Clients page now uses `loadClientsCatalogPage()`.

Loader behavior:

- Calls `createCatalogRepositories()`.
- Calls `clients.list({ page: 1, pageSize: 20 })`.
- Returns `ready` when clients load.
- Returns `empty` when the repository succeeds with zero clients.
- Returns `permission_denied` for Supabase permission-style `CatalogRepositoryError` failures.
- Returns `configuration_error` when Supabase mode is selected but local public Supabase configuration is unavailable.
- Returns `error` for other safe failures.
- Does not expose raw Supabase error details, stack traces, environment variable details, phone numbers, emails, or secrets to UI state.

`apps/web/src/app/clients/page.tsx` is marked `dynamic = "force-dynamic"` so the server loader reads `HOM_DATA_MODE` per request instead of freezing the mock result at build time.

## UI States Added

Added Clients UI states:

- Ready state with repository-fed client rows.
- Empty state.
- Permission-safe state.
- Configuration-safe state.
- Generic error state.
- Route-level loading state.

Rendered table fields:

- Client name.
- Status.
- Primary practitioner.
- Updated date.

No phone or email columns were added, including masked contact columns.

## Storybook Stories Added

Added `Catalog/ClientsCatalogPage` stories:

- `Ready`
- `Empty`
- `PermissionDenied`
- `GenericError`
- `ConfigurationError`

Stories use static safe mock data and do not call repositories.

## Tests Added

Added `apps/web/tests/unit/catalog/clients-page-loader.test.ts`.

Coverage includes:

- Loader returns a ready state in mock mode.
- Invalid `HOM_DATA_MODE` still uses mock mode.
- Empty repository result returns an empty state.
- `CatalogRepositoryError` maps to a safe permission state without raw details.
- Missing local Supabase configuration maps to a safe configuration state.
- Client table row mapping does not include raw or masked phone/email fields.

Updated Playwright coverage in `apps/web/tests/e2e/app-shell.spec.ts`:

- `/clients` is part of shell smoke coverage.
- Repository-fed `Mock Client Alpha` row renders.
- Contact columns are not visible.
- Create/edit/delete controls are not visible.

## Commands Run

Final required checks:

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
rg --files supabase/migrations | sort
rg --files apps/web/src/app | sort
rg "use server|/api/clients|/api/practitioners|/api/services|service role|SERVICE_ROLE|audit writer|createClient\(|updateClient\(|deleteClient\(|upsert|insert\(|delete\(|\.insert|\.update|\.delete" apps/web/src/features/catalog apps/web/src/lib/catalog apps/web/src/app -n
```

Local Supabase reset was not run because Phase 3B.4 did not add or change database migrations and did not add local authenticated Supabase fixtures.

## Final Check Results

| Command | Result | Notes |
| --- | --- | --- |
| `corepack pnpm typecheck` | Passed | `packages/domain` and `apps/web` passed `tsc --noEmit`. |
| `corepack pnpm lint` | Passed | Full web ESLint passed with no warnings in the final run. |
| `corepack pnpm test` | Passed | Domain: 5 files, 44 tests. Web: 3 files, 22 tests. |
| `corepack pnpm build` | Passed | Next.js production build passed. `/clients` is dynamic/server-rendered on demand. |
| `corepack pnpm build-storybook` | Passed | Storybook static build completed successfully. |
| `corepack pnpm test:e2e` | Passed | Playwright: 9 Chromium tests passed. |

## Warnings

- Storybook/Vite reported plugin timing warnings.
- Storybook/Vite reported chunks larger than 500 kB after minification.
- Playwright/Next printed `NO_COLOR` ignored because `FORCE_COLOR` is set.
- A callable in-app Browser tool was not available in this session, so browser verification was covered by Playwright.

These warnings do not block Phase 3B.4.

## Safety Confirmation

Confirmed:

- UI integration is Clients page only.
- No practitioner page was added.
- No services page was added.
- No contact columns were added.
- No phone or email fields, raw or masked, are rendered in the Clients table.
- No catalog route handlers were added.
- No `/api/clients`, `/api/practitioners`, or `/api/services` route was added.
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
- No appointment, finance, clinical notes, WhatsApp, AI Gateway, workers, n8n, FastAPI, Flask, VPS, production services, secrets, or production data were added.

## Stop Point

Phase 3B.4 is complete and stops here.

Recommended next approval decision:

- Plan Phase 3B.5 separately for either practitioner/service read-only UI planning, catalog filters/pagination, or local auth fixture strategy.
