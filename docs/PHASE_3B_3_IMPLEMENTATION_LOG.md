# Phase 3B.3 Implementation Log

Date: 2026-05-27

Status: implemented Phase 3B.3 Option A only. Stop here before UI integration, route handlers, server actions, catalog writes, or Phase 3B.4.

## Scope Completed

Phase 3B.3 added read-only catalog repository integration below the UI surface.

Completed:

- Contact masking helpers.
- Safe catalog repository error class.
- Repository factory for `HOM_DATA_MODE=mock` and `HOM_DATA_MODE=supabase`.
- Supabase row types and safe mappers for clients, practitioners, and services.
- Supabase read-only repositories for clients, practitioners, and services.
- Unit tests for masking, mappers, factory selection, repository method shape, mocked Supabase query behavior, and safe error conversion.

Option A was followed: UI remained unchanged.

## Files Changed

- `apps/web/src/lib/catalog/contact-masking.ts`
- `apps/web/src/lib/catalog/errors.ts`
- `apps/web/src/lib/catalog/repository-factory.ts`
- `apps/web/src/lib/catalog/supabase/types.ts`
- `apps/web/src/lib/catalog/supabase/client-row-mapper.ts`
- `apps/web/src/lib/catalog/supabase/practitioner-row-mapper.ts`
- `apps/web/src/lib/catalog/supabase/service-row-mapper.ts`
- `apps/web/src/lib/catalog/supabase/client-repository.ts`
- `apps/web/src/lib/catalog/supabase/practitioner-repository.ts`
- `apps/web/src/lib/catalog/supabase/service-repository.ts`
- `apps/web/tests/unit/catalog/repositories.test.ts`
- `docs/PHASE_3B_3_IMPLEMENTATION_LOG.md`

## Repository Adapters Added

Added read-only Supabase adapters:

- `createSupabaseClientRepository`
- `createSupabasePractitionerRepository`
- `createSupabaseServiceRepository`

Each adapter implements only:

```text
list
getById
```

No `create`, `update`, `delete`, `insert`, `upsert`, or archive methods were added.

Repository behavior:

- Parses list query input with the existing domain list query schemas.
- Applies status filters when provided.
- Applies service category filtering when provided.
- Applies search only to safe display fields:
  - clients: `full_name`
  - practitioners: `display_name`
  - services: `name` and `category`
- Uses Supabase range pagination.
- Requests `count: "exact"`.
- Orders predictably:
  - clients by `full_name`
  - practitioners by `display_name`
  - services by `name`
- Throws `CatalogRepositoryError` for Supabase query failures instead of returning fake empty data.

## Repository Factory

Added `createCatalogRepositories`.

Behavior:

- Missing, invalid, or `mock` `HOM_DATA_MODE` returns existing mock repositories.
- `HOM_DATA_MODE=supabase` returns Supabase read-only repositories.
- Supabase mode uses the existing `createSupabaseServerClient()`.
- Supabase mode does not use a service-role client and does not bypass RLS.

## Mapper Behavior

Client mapper:

- `full_name` -> `fullName`
- `primary_practitioner_id` -> `primaryPractitionerId`
- joined practitioner `display_name` -> `primaryPractitionerName`
- `created_by_app_user_id` -> `createdByAppUserId`
- `phone` -> `maskedPhone`
- `email` -> `maskedEmail`
- raw `phone` and `email` are not present on the domain read model.

Practitioner mapper:

- `app_user_id` -> `appUserId`
- `display_name` -> `displayName`
- `email` -> `maskedEmail`
- raw `email` is not present on the domain read model.

Service mapper:

- `default_duration_minutes` -> `defaultDurationMinutes`
- `default_price_idr` -> `defaultPriceIdr`
- no cents-based naming was introduced.

All mappers validate through existing domain Zod schemas.

## Masking Policy

Implemented approved contact masking:

- `maskEmail(null)` returns `null`.
- Valid emails preserve only a masked local-part and visible domain, for example `m***@example.invalid`.
- `maskPhone(null)` returns `null`.
- Valid phones show at most the last 4 digits.
- Malformed emails return `masked email`.
- Malformed phones return `masked phone`.
- Malformed contact values are not returned raw.

## Tests Added

Added `apps/web/tests/unit/catalog/repositories.test.ts`.

Coverage includes:

- Email masking.
- Phone masking.
- Malformed masking input.
- Client row mapper.
- Practitioner row mapper.
- Service row mapper.
- Invalid status rejection.
- Raw phone/email absence from domain read models.
- `defaultPriceIdr` naming and absence of `defaultPriceCents`.
- Repository factory mock fallback for invalid data mode.
- Repository factory Supabase selection.
- Repository method shape contains only `list` and `getById`.
- Mocked Supabase client list and `getById` query behavior.
- Supabase errors converted to `CatalogRepositoryError`.
- Raw Supabase error details are not exposed through the public error message.

## Commands Run

```powershell
corepack pnpm typecheck
corepack pnpm test
corepack pnpm --dir apps/web exec eslint src/lib/catalog tests/unit/catalog/repositories.test.ts
corepack pnpm lint
corepack pnpm build
corepack pnpm build-storybook
corepack pnpm test:e2e
```

Safety checks:

```powershell
Test-Path supabase/.temp/project-ref
rg --files supabase/migrations
rg --files apps/web/src/app | sort
rg "create|update|delete|upsert|insert|server action|use server|service role|SERVICE_ROLE|audit writer|/api/clients|/api/practitioners|/api/services" apps/web/src/lib/catalog apps/web/src/app -n
```

Local Supabase reset was not run because Phase 3B.3 did not add migrations and did not require durable local auth fixtures.

## Final Check Results

| Command | Result | Notes |
| --- | --- | --- |
| `corepack pnpm typecheck` | Passed | `packages/domain` and `apps/web` passed `tsc --noEmit`. |
| `corepack pnpm lint` | Passed | Full web lint passed after a clean rerun. New catalog files also passed isolated ESLint. |
| `corepack pnpm test` | Passed | Domain: 5 files, 44 tests. Web: 2 files, 16 tests. |
| `corepack pnpm build` | Passed | Next.js production build completed successfully. |
| `corepack pnpm build-storybook` | Passed | Storybook static build completed successfully. |
| `corepack pnpm test:e2e` | Passed | Playwright: 7 Chromium tests passed. |

## Warnings

- Two full lint attempts appeared wedged with no output and were stopped. An isolated lint run for the new catalog files passed, and a final full `corepack pnpm lint` rerun passed.
- Storybook/Vite reported plugin timing warnings.
- Storybook/Vite reported chunks larger than 500 kB after minification.
- Playwright/Next printed `NO_COLOR` ignored because `FORCE_COLOR` is set.

These warnings do not block Phase 3B.3.

## Safety Confirmation

Confirmed:

- UI was unchanged.
- No catalog route handlers were added.
- No catalog server actions were added.
- No catalog write methods were added.
- No catalog migrations were added.
- No local authenticated Supabase fixtures were added.
- No service-role admin client was added.
- No audit writer API was added.
- No cloud Supabase project was linked or pushed.
- `supabase/.temp/project-ref` is absent.
- Existing services read policy permissions remain unchanged: `can_manage_services`, `can_view_appointments`, and `can_manage_appointments`.
- No `can_view_services` permission was added.
- No appointment, finance, clinical notes, WhatsApp, AI Gateway, workers, n8n, FastAPI, Flask, VPS, production services, secrets, or production data were added.

## Stop Point

Phase 3B.3 is complete and stops here.

Recommended next approval decision:

- Plan Phase 3B.4 separately for either read-only UI integration or local authenticated Supabase test fixture strategy.
