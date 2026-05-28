# Phase 2 Implementation Log

Date: 2026-05-26

Status: implemented Phase 2 foundation only. Stop here before Phase 3.

## Approved Scope Implemented

Phase 2 added the local-first Supabase, RBAC, auth boundary, audit, and unit-test foundation only.

Implemented:

- Minimal dependencies for Supabase client factories, Zod validation, Vitest unit tests, and local Supabase CLI tooling.
- Safe `.env.example` placeholders only.
- `packages/domain` workspace package.
- Canonical role constants, permission constants, and knowledge source status constants.
- Zod schemas for roles, permissions, knowledge source statuses, auth mode, current user, and audit log input.
- RBAC helpers:
  - `hasPermission`
  - `requirePermission`
  - `requireAnyPermission`
- Approved role-permission matrix.
- Mock auth boundary and mock Studio Director user.
- Audit metadata redaction helper.
- Unit tests for RBAC, auth, knowledge status enum, role permission matrix, permission helpers, and audit redaction.
- Root `supabase/` folder with local config, migration files, and seed data.
- Supabase browser and server client factories.
- Root `test` script for unit tests.
- Playwright smoke test isolation on port `3100`.

Not implemented:

- Real production auth.
- Cloud Supabase connection, linking, push, or migration application.
- Service-role admin Supabase client.
- `/api/me`.
- Clients, practitioners, services, appointments, finance, clinical notes, WhatsApp, payroll, AI Gateway, workers, n8n, FastAPI, Flask, VPS, or production services.
- Secrets or production data.

## Dependencies Added

Web app dependencies:

```text
@hom/domain
@supabase/ssr
@supabase/supabase-js
zod
```

Domain package dependencies:

```text
zod
```

Domain package dev dependencies:

```text
typescript
vitest
```

Root dev tooling:

```text
supabase
```

Supabase CLI installed version:

```text
2.101.0
```

## Environment Strategy

`.env.example` now includes mock-first mode flags:

```text
HOM_AUTH_MODE="mock"
HOM_DATA_MODE="mock"
```

It also includes empty local-first Supabase placeholders:

```text
NEXT_PUBLIC_SUPABASE_URL=""
NEXT_PUBLIC_SUPABASE_ANON_KEY=""
SUPABASE_SERVICE_ROLE_KEY=""
SUPABASE_DB_URL=""
```

No real secrets, cloud URLs, service-role keys, or production values were added.

## Domain Package

Created:

```text
packages/domain
```

Main areas:

```text
packages/domain/src/auth
packages/domain/src/rbac
packages/domain/src/audit
packages/domain/src/shared
packages/domain/tests
```

Canonical roles:

```text
super_admin
studio_director
admin_frontdesk
practitioner
finance_admin
marketing_admin
viewer
ai_agent_service
```

Canonical knowledge source statuses:

```text
uploaded
processing
extracted
review_needed
approved
embedded
tested
published
archived
failed
```

Approved role constraints are covered by unit tests:

- `can_manage_roles_permissions` is `super_admin` only.
- `can_approve_reimbursements` is `super_admin` and `studio_director` only.
- `can_manage_knowledge` is `super_admin` and `studio_director` only.
- `can_publish_knowledge` is `super_admin` and `studio_director` only.

## Supabase Local-First Files

Created:

```text
supabase/config.toml
supabase/migrations/20260526000100_foundation_extensions_and_schemas.sql
supabase/migrations/20260526000200_identity_rbac_audit.sql
supabase/migrations/20260526000300_rls_helpers_and_policies.sql
supabase/seed.sql
```

Migration contents:

- Foundation extension/schema migration:
  - `pgcrypto`
  - `private` helper schema
  - `knowledge_source_status` enum
- Identity/RBAC/audit migration:
  - `app_users`
  - `roles`
  - `permissions`
  - `user_roles`
  - `role_permissions`
  - `audit_logs`
  - indexes and update timestamp trigger
- RLS helper and policy migration:
  - `private.current_app_user_id()`
  - `private.has_permission(permission_key text)`
  - RLS enabled on Phase 2 tables
  - conservative profile, role, permission, role assignment, permission matrix, and audit log policies
- Local seed:
  - roles
  - permissions
  - role-permission matrix

No optional client, practitioner, service, appointment, finance, clinical note, WhatsApp, payroll, AI, or worker tables were created.

## Supabase Local Runtime Result

Docker CLI is installed:

```text
Docker version 28.4.0
```

Docker engine was not available:

```text
error during connect: open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified
```

Result:

- Local Supabase was not started.
- Migrations were not applied locally.
- No cloud Supabase project was linked.
- No cloud Supabase project was pushed to.
- No production service was contacted.

## Supabase Client Factories

Created:

```text
apps/web/src/lib/supabase/browser.ts
apps/web/src/lib/supabase/server.ts
apps/web/src/lib/supabase/index.ts
apps/web/src/lib/env/supabase.ts
```

Rules:

- Browser and server clients use public Supabase URL and anon key only.
- Missing Supabase environment values throw a beginner-friendly message only when a Supabase client factory is called.
- No service-role admin client was created.
- The app remains in mock mode by default.

## Auth Boundary

Created:

```text
packages/domain/src/auth
apps/web/src/lib/auth/boundary.ts
apps/web/src/lib/env/app-mode.ts
```

Current behavior:

- `HOM_AUTH_MODE=mock` returns the mock Studio Director boundary.
- `HOM_AUTH_MODE=supabase` intentionally throws because real Supabase auth is not enabled in this foundation step.
- No login UI, session handling, cookies, or production auth was implemented.

## Script Updates

Root scripts now include unit tests:

```powershell
corepack pnpm test
```

Root typecheck now runs workspace typechecks:

```powershell
corepack pnpm typecheck
```

Playwright was moved to a dedicated test port:

```text
http://127.0.0.1:3100
```

Reason:

- The first post-change Playwright run reused an unrelated existing server on port `3000`.
- The config now starts the HOM web app on port `3100` and does not reuse existing servers.

## Checks Run

Required commands:

```powershell
corepack pnpm typecheck
corepack pnpm lint
corepack pnpm test
corepack pnpm build
corepack pnpm build-storybook
corepack pnpm test:e2e
```

Latest result:

- `corepack pnpm typecheck`: passed.
- `corepack pnpm lint`: passed.
- `corepack pnpm test`: passed, 3 test files and 22 tests.
- `corepack pnpm build`: passed.
- `corepack pnpm build-storybook`: passed.
- `corepack pnpm test:e2e`: passed after isolating Playwright on port `3100`, 6 tests passed.

Warnings observed:

- Storybook/Vite reported plugin timing warnings.
- Storybook/Vite reported generated chunks larger than 500 kB after minification.
- Playwright/Next printed Node warnings that `NO_COLOR` was ignored because `FORCE_COLOR` was set.

These warnings did not fail the final verification run.

## Phase 2 Safety Confirmation

Confirmed:

- Phase 1 screens still use mock data only.
- No cloud Supabase project was linked or pushed.
- No production service was connected.
- No secrets were added.
- No service-role admin client was created.
- No prohibited tables or product features were added.
- No AI Gateway, WhatsApp, finance, clinical notes, payroll, worker, n8n, FastAPI, Flask, VPS, or production deployment was implemented.

## Next Boundary

Stop here.

Before Phase 3 or any next implementation step, the owner should review:

- `docs/PHASE_2_IMPLEMENTATION_LOG.md`
- `docs/PHASE_2_OPEN_QUESTIONS_AFTER_IMPLEMENTATION.md`
- The local migration SQL files
- The RBAC unit tests
