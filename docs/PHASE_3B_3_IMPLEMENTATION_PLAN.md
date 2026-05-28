# Phase 3B.3 Implementation Plan

Date: 2026-05-27

Status: planning only. Do not implement until the owner approves this plan.

## Goal

Phase 3B.3 should integrate the read-only catalog repository foundation with a safe local Supabase adapter path for:

- Clients
- Practitioners
- Services

The default data mode must remain mock. Supabase mode must remain local-first and must not link, push, or connect to any cloud Supabase project.

## Current Source of Truth

Phase 3B.1 already created:

- Domain schemas for clients, practitioners, services, and shared catalog list metadata.
- Read-only repository interfaces:
  - `ClientRepository`
  - `PractitionerRepository`
  - `ServiceRepository`
- Mock repositories with only:
  - `list`
  - `getById`
- Masked read model fields for client and practitioner contact data.
- No mutation repository methods.

Phase 3B.2 already created:

- Local catalog tables:
  - `public.practitioners`
  - `public.clients`
  - `public.services`
- Safe local dummy seed data:
  - 8 practitioners
  - 40 clients
  - 12 services
- RLS enabled on all catalog tables.
- Read-only RLS policies.
- No authenticated insert, update, or delete policies.

Phase 2.6 remains the audit source of truth:

- Direct client/browser inserts into `public.audit_logs` are blocked.
- Future audit writing must be server-only.
- No audit writer API or service-role admin client exists yet.

## Exact Phase 3B.3 Scope

Implement after approval:

1. Add read-only Supabase repository adapters for the existing domain interfaces.
2. Add a repository mode selector:
   - `HOM_DATA_MODE=mock` uses existing mock repositories.
   - `HOM_DATA_MODE=supabase` uses local Supabase repositories.
   - Missing or invalid `HOM_DATA_MODE` falls back to `mock`.
3. Add safe mappers from Supabase rows to domain read models.
4. Add tests for mappers, repository selection, mock mode, and safe Supabase-mode behavior.
5. Keep UI unchanged unless the owner explicitly approves UI integration.
6. Do not add mutation routes, mutation repositories, write policies, or write UI.

## Explicit Non-Goals

Do not implement:

- Catalog create, update, delete, upsert, import, or archive flows.
- Appointment core.
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
- Cloud Supabase linking or pushing.
- Secrets or production data.
- Service-role admin client.
- Audit writer API.
- New catalog migrations unless a blocking schema mismatch is discovered and separately approved.

## Recommended UI Option

Recommendation: Option A.

### Option A: Keep UI Unchanged

Keep the current UI pages on existing mock module data and test the repository integration below the UI surface.

Why this is safest:

- Real Supabase Auth is not implemented yet.
- Catalog RLS correctly requires authenticated users with permissions.
- The current app has a `/clients` page but no dedicated practitioner or service pages.
- Switching UI now would either show permission failures in `HOM_DATA_MODE=supabase` or require auth/test fixtures that are outside the current approved product scope.
- This keeps Phase 3B.3 small, reviewable, and focused on data access correctness.

### Option B: Switch Read-Only UI Pages to Repository Data

This would change catalog screens to use repository-fed data.

This is not recommended for Phase 3B.3 because:

- It increases UI scope.
- It may require new practitioner and service pages.
- It would expose Supabase-mode auth/session behavior before real auth is approved.
- It would require Playwright updates for UI states and permission-denied behavior.

Option B should be planned separately after repository adapters are stable and the owner approves catalog UI integration.

## Proposed File Structure

Keep Supabase-specific adapters in the Next.js app, not in `packages/domain`.

Recommended new files after approval:

```text
apps/web/src/lib/catalog/contact-masking.ts
apps/web/src/lib/catalog/errors.ts
apps/web/src/lib/catalog/repository-factory.ts
apps/web/src/lib/catalog/supabase/client-repository.ts
apps/web/src/lib/catalog/supabase/client-row-mapper.ts
apps/web/src/lib/catalog/supabase/practitioner-repository.ts
apps/web/src/lib/catalog/supabase/practitioner-row-mapper.ts
apps/web/src/lib/catalog/supabase/service-repository.ts
apps/web/src/lib/catalog/supabase/service-row-mapper.ts
apps/web/src/lib/catalog/supabase/types.ts
apps/web/src/lib/catalog/index.ts
```

Recommended test files after approval:

```text
apps/web/src/lib/catalog/__tests__/contact-masking.test.ts
apps/web/src/lib/catalog/__tests__/repository-factory.test.ts
apps/web/src/lib/catalog/supabase/__tests__/client-row-mapper.test.ts
apps/web/src/lib/catalog/supabase/__tests__/practitioner-row-mapper.test.ts
apps/web/src/lib/catalog/supabase/__tests__/service-row-mapper.test.ts
apps/web/src/lib/catalog/supabase/__tests__/repository-behavior.test.ts
```

Optional documentation after implementation:

```text
docs/PHASE_3B_3_IMPLEMENTATION_LOG.md
```

## Repository Mode Selector

Add a server-side repository factory that reads `getDataMode()`.

Behavior:

- `mock`: return `createMockClientRepository`, `createMockPractitionerRepository`, and `createMockServiceRepository`.
- `supabase`: create a Supabase server client with the existing `createSupabaseServerClient()` and return Supabase-backed repositories.
- Invalid or missing mode: continue using the existing default/fallback behavior, which is `mock`.

Recommended shape:

```ts
type CatalogRepositories = {
  clients: ClientRepository;
  practitioners: PractitionerRepository;
  services: ServiceRepository;
};
```

The selector should be server-only in practice. Catalog reads should not use the browser Supabase client because the UI must not directly own database access patterns.

## Supabase Repository Strategy

Create one adapter per domain:

- `createSupabaseClientRepository`
- `createSupabasePractitionerRepository`
- `createSupabaseServiceRepository`

Each adapter should implement only:

- `list`
- `getById`

No mutation methods should be added.

### Client Repository

Read from `public.clients`.

Select only required fields:

```text
id
full_name
phone
email
status
primary_practitioner_id
created_by_app_user_id
created_at
updated_at
practitioners:primary_practitioner_id(display_name)
```

Mapping:

- `full_name` -> `fullName`
- `primary_practitioner_id` -> `primaryPractitionerId`
- joined `practitioners.display_name` -> `primaryPractitionerName`
- `created_by_app_user_id` -> `createdByAppUserId`
- `phone` -> `maskedPhone`
- `email` -> `maskedEmail`
- timestamps remain ISO strings if already compatible, otherwise normalize to ISO strings before Zod validation.

List behavior:

- Parse input with `clientListQuerySchema`.
- Filter by `status` when provided.
- Search only safe display fields in the first implementation, preferably `full_name`.
- Paginate with Supabase range based on `page` and `pageSize`.
- Request `count: "exact"` so `total` matches the list result contract.
- Order by `full_name` ascending for predictable local behavior.

### Practitioner Repository

Read from `public.practitioners`.

Select only required fields:

```text
id
app_user_id
display_name
email
status
created_at
updated_at
```

Mapping:

- `app_user_id` -> `appUserId`
- `display_name` -> `displayName`
- `email` -> `maskedEmail`

List behavior:

- Parse input with `practitionerListQuerySchema`.
- Filter by `status` when provided.
- Search `display_name`.
- Paginate with Supabase range.
- Request `count: "exact"`.
- Order by `display_name` ascending.

### Service Repository

Read from `public.services`.

Select only required fields:

```text
id
name
category
default_duration_minutes
default_price_idr
status
created_at
updated_at
```

Mapping:

- `default_duration_minutes` -> `defaultDurationMinutes`
- `default_price_idr` -> `defaultPriceIdr`
- Do not introduce cents-based naming.

List behavior:

- Parse input with `serviceListQuerySchema`.
- Filter by `status` when provided.
- Filter by `category` when provided.
- Search `name` and optionally `category`.
- Paginate with Supabase range.
- Request `count: "exact"`.
- Order by `name` ascending.

## Contact Masking Strategy

Raw database `phone` and `email` values must not be passed directly to UI read models.

Add a small masking helper with behavior like:

- `maskEmail(null)` -> `null`
- `maskEmail("mock.client.001@example.invalid")` -> masked local-part plus visible domain, for example `m***@example.invalid`
- `maskPhone(null)` -> `null`
- `maskPhone("+62 000-0000-0002")` -> last 2 to 4 digits visible, rest masked, for example `+62 ***-***-0002`
- Unknown or malformed contact values should return a generic masked value, not the raw input.

The mappers should be tested to prove raw phone and email fields are never exposed in domain read models.

## API and Server Strategy

Recommendation: use server loaders later; do not add route handlers in Phase 3B.3.

For this planning phase, the safest implementation target is repository integration only. If UI integration is approved later, server components or server loaders can call the repository factory and pass already-mapped read models into client components.

Do not add:

- `/api/clients`
- `/api/practitioners`
- `/api/services`
- POST, PATCH, PUT, DELETE routes
- Server actions for catalog writes
- Service-role admin client
- Audit writer API

Reason:

- Read-only route handlers would create a public app API surface before auth, permission, error, and UI behavior are fully settled.
- Server loaders keep the data path internal to the app until the owner approves a public/internal API contract.

## Supabase Auth and RLS Reality Check

`HOM_DATA_MODE=supabase` should use the existing Supabase server client and the anon key, relying on Supabase Auth cookies and RLS.

Important limitation:

- Real Supabase Auth is not implemented yet.
- Without an authenticated Supabase session mapped to `public.app_users`, catalog RLS should deny reads.
- This is correct and should not be bypassed with a service-role client.

Phase 3B.3 should not seed durable local auth users just to make app UI reads work. If allowed-read repository integration tests need local authenticated fixtures, that should be a separate owner-approved test fixture decision.

## Testing Plan

Add unit tests for:

- Email masking.
- Phone masking.
- Client row mapper.
- Practitioner row mapper.
- Service row mapper.
- Mappers reject invalid statuses through existing Zod schemas.
- Mappers never expose raw `phone` or `email` as read model fields.
- Service mapper uses `defaultPriceIdr`, not `defaultPriceCents`.
- Repository factory returns mock repositories when `HOM_DATA_MODE` is missing or `mock`.
- Repository factory chooses Supabase repositories when `HOM_DATA_MODE=supabase`.
- Repository interfaces still expose only `list` and `getById`.

Add Supabase repository behavior tests using mocked Supabase clients:

- `list` applies status filters.
- `list` applies category filter for services.
- `list` applies pagination range.
- `list` requests exact counts.
- `getById` queries by `id`.
- Supabase errors are converted to safe app-side errors without leaking raw database details to UI-level messages.

Optional local Supabase behavior tests if Docker and local Supabase are available:

- With no authenticated session, Supabase repository reads fail safely or return a permission-safe error.
- Do not use service-role keys.
- Do not create persistent local auth fixtures unless separately approved.

Playwright:

- If Option A is approved, no Playwright changes are required beyond running the existing smoke tests.
- If Option B is approved later, add Playwright checks for read-only catalog UI states.

## Error Handling Plan

Because current repository interfaces return data directly, Supabase adapters should either:

- Throw a small safe `CatalogRepositoryError`, or
- Return a domain-compatible empty result only when the query genuinely succeeds with zero rows.

Recommendation:

- Throw `CatalogRepositoryError` for Supabase query failures.
- Keep raw Supabase error details out of UI-facing messages.
- Preserve enough internal context for tests and local debugging, without logging secrets or raw PII.

Do not silently convert permission failures into fake empty data. A permission failure is different from a valid empty catalog.

## Verification Plan

Before implementation:

```powershell
Test-Path supabase/.temp/project-ref
```

Expected result: `False`.

Run local Supabase reset only if a local integration check requires database state:

```powershell
corepack pnpm exec supabase db reset
```

Required final checks after implementation approval:

```powershell
corepack pnpm typecheck
corepack pnpm lint
corepack pnpm test
corepack pnpm build
corepack pnpm build-storybook
corepack pnpm test:e2e
```

Document all results in `docs/PHASE_3B_3_IMPLEMENTATION_LOG.md`.

## Risks

- Supabase-mode reads will not show seeded catalog rows through the app until real Supabase Auth or approved local auth fixtures exist.
- Accidentally using a service-role client would bypass RLS and violate the current safety model.
- Exposing raw `phone` or `email` from repository mappers would weaken the masked contact contract from Phase 3B.1.
- Adding route handlers too early could create an API surface before permission and error semantics are settled.
- Switching UI in this phase would expand scope and likely require new loading, empty, error, and permission-denied states.

## Open Questions

1. Should Phase 3B.3 implement Option A exactly: repository adapters and tests only, with UI unchanged?
2. Should local authenticated Supabase test fixtures be planned later, or should Supabase-mode tests stay limited to mocked clients plus unauthenticated safe-failure behavior for now?
3. Should masked emails preserve the domain, or should the whole email be hidden behind a generic label like `masked email`?
4. Should masked phones show the last 4 digits, the last 2 digits, or no digits?
5. Should a future `can_view_services` permission be added, or should service reads continue using the current Phase 3B.2 policy of `can_manage_services`, `can_view_appointments`, or `can_manage_appointments`?
6. Should practitioner and service UI pages be planned separately before any repository-fed UI work?

## Proposed Implementation Steps After Approval

1. Confirm no cloud Supabase project is linked.
2. Add contact masking helpers and tests.
3. Add Supabase row types for clients, practitioners, and services.
4. Add row mappers and mapper tests.
5. Add Supabase repository adapters with only `list` and `getById`.
6. Add repository factory for `HOM_DATA_MODE=mock` and `HOM_DATA_MODE=supabase`.
7. Add repository factory and mocked Supabase client tests.
8. Optionally run local Supabase reset if local behavior tests are approved and Docker is available.
9. Run all required checks.
10. Create `docs/PHASE_3B_3_IMPLEMENTATION_LOG.md`.
11. Stop and ask before any UI integration or Phase 3B.4 work.

## Approval Gate

Stop here.

Phase 3B.3 implementation must not begin until the owner approves:

- Option A or Option B.
- Whether any local authenticated Supabase test fixture is allowed.
- The contact masking policy.
