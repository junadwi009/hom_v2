# Phase 3B.1 Implementation Log

Date: 2026-05-27

Status: implemented Phase 3B.1 only. Stop here before migrations, Supabase repositories, writes, or appointment core.

## Scope Completed

Phase 3B.1 added read-only catalog domain foundations for clients, practitioners, and services:

- Domain folders for `catalog`, `clients`, `practitioners`, and `services`.
- Zod schemas and TypeScript types for catalog read models, list queries, list results, and future mutation contracts.
- Read-only repository interfaces with only `list` and `getById`.
- Safe mock repositories using clearly fake data.
- Unit tests for status enums, schema validation, invalid inputs, query defaults, mock repositories, IDR service pricing, and no mutation repository methods.
- Clean package exports from `@hom/domain`.

No UI pages were changed.

## Files Changed

- `packages/domain/package.json`
- `packages/domain/src/index.ts`
- `packages/domain/src/catalog/index.ts`
- `packages/domain/src/catalog/mock-utils.ts`
- `packages/domain/src/catalog/schemas.ts`
- `packages/domain/src/catalog/types.ts`
- `packages/domain/src/clients/index.ts`
- `packages/domain/src/clients/mock-repository.ts`
- `packages/domain/src/clients/repository.ts`
- `packages/domain/src/clients/schemas.ts`
- `packages/domain/src/clients/types.ts`
- `packages/domain/src/practitioners/index.ts`
- `packages/domain/src/practitioners/mock-repository.ts`
- `packages/domain/src/practitioners/repository.ts`
- `packages/domain/src/practitioners/schemas.ts`
- `packages/domain/src/practitioners/types.ts`
- `packages/domain/src/services/index.ts`
- `packages/domain/src/services/mock-repository.ts`
- `packages/domain/src/services/repository.ts`
- `packages/domain/src/services/schemas.ts`
- `packages/domain/src/services/types.ts`
- `packages/domain/tests/catalog.test.ts`
- `docs/PHASE_3B_1_IMPLEMENTATION_LOG.md`

## Schemas Added

Shared catalog schemas:

- `catalogIdSchema`
- `catalogTimestampSchema`
- `catalogSearchSchema`
- `catalogPageSchema`
- `catalogPageSizeSchema`
- `catalogListQueryBaseSchema`
- `catalogListResultMetaSchema`

Client schemas:

- `clientStatusSchema`
- `clientSchema`
- `clientListQuerySchema`
- `clientListResultSchema`
- `createClientInputSchema`
- `updateClientInputSchema`

Practitioner schemas:

- `practitionerStatusSchema`
- `practitionerSchema`
- `practitionerListQuerySchema`
- `practitionerListResultSchema`
- `createPractitionerInputSchema`
- `updatePractitionerInputSchema`

Service schemas:

- `serviceStatusSchema`
- `serviceSchema`
- `serviceListQuerySchema`
- `serviceListResultSchema`
- `createServiceInputSchema`
- `updateServiceInputSchema`

Important naming decisions preserved:

- Practitioner identity uses `appUserId`, not `userId`.
- Client creator identity uses `createdByAppUserId`, not `createdBy`.
- Services use `defaultPriceIdr`, not `defaultPriceCents` or cents-based naming.
- Client and practitioner read models use masked contact fields and do not expose raw phone/email values.

Mutation schemas exist only as future contracts. No mutation routes, repository methods, server actions, or UI writes were added.

## Repository Interfaces Added

Read-only repository interfaces:

- `ClientRepository`
- `PractitionerRepository`
- `ServiceRepository`

Each interface exposes only:

```text
list
getById
```

No `create`, `update`, `delete`, `insert`, `upsert`, or mutation repository methods were added.

## Mock Repository Behavior

Mock repositories added:

- `createMockClientRepository`
- `createMockPractitionerRepository`
- `createMockServiceRepository`

Mock behavior:

- Uses fake records clearly named `Mock ...`.
- Uses reserved `.invalid` email examples.
- Uses masked phone/email fields where contact display is needed.
- Contains no real client names, real phone numbers, real emails, clinical details, payment data, or production data.
- Supports simple filtering by search/status and basic pagination.
- `getById` returns the matching mock record or `null`.

## Tests Added

Added `packages/domain/tests/catalog.test.ts`.

Coverage includes:

- Shared list query defaults.
- Invalid paging input.
- Client status enum validation.
- Client schema validation.
- Client invalid raw `phone` field rejection in read model.
- Client create/update contract validation.
- Client mock repository `list` and `getById`.
- Client repository method list contains only `list` and `getById`.
- Practitioner status enum validation.
- Practitioner `appUserId` naming and `userId` rejection.
- Practitioner create/update contract validation.
- Practitioner mock repository `list` and `getById`.
- Practitioner repository method list contains only `list` and `getById`.
- Service status enum validation.
- Service `defaultPriceIdr` validation.
- Service `defaultPriceCents` rejection.
- Service create/update contract validation.
- Service mock repository `list` and `getById`.
- Service repository method list contains only `list` and `getById`.

## Commands Run

```powershell
corepack pnpm typecheck
corepack pnpm lint
corepack pnpm test
corepack pnpm build
corepack pnpm build-storybook
corepack pnpm test:e2e
```

## Test Results

| Command | Result | Notes |
| --- | --- | --- |
| `corepack pnpm typecheck` | Pass | `packages/domain` and `apps/web` passed `tsc --noEmit`. |
| `corepack pnpm lint` | Pass | Web ESLint passed. |
| `corepack pnpm test` | Pass | Domain: 5 files, 44 tests. Web: 1 file, 2 tests. |
| `corepack pnpm build` | Pass | Next.js build completed successfully. |
| `corepack pnpm build-storybook` | Pass | Storybook static build completed successfully. |
| `corepack pnpm test:e2e` | Pass | Playwright passed 7 Chromium tests. |

## Warnings

- Storybook/Vite reported plugin timing warnings.
- Storybook/Vite reported chunks larger than 500 kB after minification.
- Playwright/Next printed `NO_COLOR` ignored because `FORCE_COLOR` is set.

These warnings do not block Phase 3B.1.

## Safety Confirmation

Confirmed:

- No database migrations were added.
- No Supabase repositories were added.
- No cloud Supabase project was linked or pushed.
- No catalog tables were created.
- No catalog write endpoints were added.
- No catalog create/update/delete repository methods were added.
- No UI product pages were changed.
- No appointment implementation was added.
- No finance implementation was added.
- No clinical notes implementation was added.
- No WhatsApp implementation was added.
- No AI Gateway implementation was added.
- No workers were added.
- No n8n, FastAPI, Flask, VPS, production services, secrets, or production data were added.

Phase 2.6 remains the source of truth for audit safety:

- Direct client inserts into `public.audit_logs` stay blocked.
- Future catalog writes must use server-only backend flows with permission checks and audit writing after explicit approval.

## Next Boundary

Stop here.

The next step should be reviewed and approved separately. Recommended next approval choices:

- Phase 3B.2: optional read-only UI integration using mock catalog repositories.
- Phase 3B.3: local-only catalog migration and RLS planning/implementation.

Do not start migrations, Supabase repositories, catalog writes, or appointment core without explicit approval.
