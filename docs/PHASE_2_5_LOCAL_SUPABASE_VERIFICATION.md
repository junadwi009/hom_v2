# Phase 2.5 Local Supabase Verification

Date: 2026-05-26

## Scope

Phase 2.5 verifies the local-first Supabase foundation created in Phase 2.

This phase did not add product features, production service connections, cloud Supabase links, secrets, or Phase 3 implementation work.

## Commands Run

Required Supabase commands:

```bash
docker info --format "{{.ServerVersion}}"
corepack pnpm exec supabase start
corepack pnpm exec supabase db reset
```

Local database verification commands used `docker exec` against the local database container:

```bash
docker ps --format "{{.Names}}"
docker exec supabase_db_hom-studio-os-v2 psql -U postgres -d postgres -At -c "<verification query>"
```

Rollback-only RLS policy probes were run by piping temporary SQL into local `psql`:

```bash
@'
begin;
-- create temporary auth.users/app_users records
-- assign a temporary role
-- set local role authenticated
-- set a local request.jwt.claim.sub
-- query RLS-protected tables
rollback;
'@ | docker exec -i supabase_db_hom-studio-os-v2 psql -U postgres -d postgres -v ON_ERROR_STOP=1 -At
```

Required final checks:

```bash
corepack pnpm typecheck
corepack pnpm lint
corepack pnpm test
corepack pnpm build
corepack pnpm build-storybook
corepack pnpm test:e2e
```

## Docker Status

Docker engine was available.

- Docker server version: `28.4.0`
- Local Supabase database container: `supabase_db_hom-studio-os-v2`
- Local Supabase support containers were running for Studio, auth, storage, REST, realtime, analytics, Kong, and related local services.
- An unrelated container named `n8n-citco` was present on the machine. It was not started, configured, linked, or used by this project.

## Supabase CLI Output Summary

`corepack pnpm exec supabase start` completed successfully.

The CLI started the local development stack and printed local service URLs for:

- Studio
- Mailpit
- local API gateway
- local REST endpoint
- local GraphQL endpoint
- local database
- local storage

The CLI also printed local development keys and local storage credentials. These were not copied into project files and are intentionally omitted from this report.

Warnings observed:

- Supabase analytics on Windows warns that Docker daemon exposure on `tcp://localhost:2375` is required for analytics.
- Supabase local development warns that services bind to `0.0.0.0`, local keys are shared defaults, and local Studio/pgMeta/analytics have no authentication. This is expected for local development only and must not be used as a production setup.

## Migration Result

`corepack pnpm exec supabase db reset` completed successfully.

Applied migrations:

- `20260526000100_foundation_extensions_and_schemas.sql`
- `20260526000200_identity_rbac_audit.sql`
- `20260526000300_rls_helpers_and_policies.sql`

Observed migration note:

- `pgcrypto` already existed locally, so Postgres printed `extension "pgcrypto" already exists, skipping`.

No migration code changes were needed.

## Seed Result

`supabase/seed.sql` ran successfully during `supabase db reset`.

Seeded foundation data verified:

- Roles: 8
- Permissions: 29
- Role-permission rows: 80

Seeded roles verified:

- `admin_frontdesk`
- `ai_agent_service`
- `finance_admin`
- `marketing_admin`
- `practitioner`
- `studio_director`
- `super_admin`
- `viewer`

## Tables Verified

The local `public` schema contains only the Phase 2 foundation tables:

- `app_users`
- `audit_logs`
- `permissions`
- `role_permissions`
- `roles`
- `user_roles`

The product-table absence query returned no rows for names or patterns related to:

- clients
- practitioners
- services
- appointments
- finance or ledgers
- reimbursements
- payroll
- clinical notes or session notes
- WhatsApp
- AI Gateway
- worker jobs or event outbox

Supabase internal schemas for auth, storage, migrations, and local platform services exist as part of the normal local Supabase stack.

## RLS Helpers Verified

The expected private helper functions exist:

- `private.current_app_user_id()`
- `private.has_permission(permission_key text)`

RLS is enabled on all Phase 2 foundation tables:

- `app_users`
- `audit_logs`
- `permissions`
- `role_permissions`
- `roles`
- `user_roles`

Policies verified in `pg_policies`:

- `app users can read their own profile`
- `role reference data is readable by authenticated users`
- `permission reference data is readable by authenticated users`
- `users can read their own role assignments`
- `role managers can read all role assignments`
- `role managers can read the permission matrix`
- `audit viewers can read audit logs`
- `authenticated users can insert their own audit events`

Rollback-only behavior probes passed:

- Temporary `super_admin` user saw `own_user_role_rows=1`.
- Temporary `super_admin` user saw `visible_role_permission_rows=80`.
- Temporary `viewer` user saw `own_user_role_rows=1`.
- Temporary `viewer` user saw `visible_role_permission_rows=0`.
- Temporary authenticated audit insert succeeded for the user's own `actor_user_id` and `actor_auth_user_id`.
- Follow-up cleanup checks confirmed `0` temporary app users and `0` audit probe rows persisted after rollback.

## Final Checks

| Command | Result | Notes |
| --- | --- | --- |
| `corepack pnpm typecheck` | Pass | `packages/domain` and `apps/web` passed `tsc --noEmit`. |
| `corepack pnpm lint` | Pass | `apps/web` ESLint completed successfully. |
| `corepack pnpm test` | Pass | Vitest passed: 3 files, 22 tests. |
| `corepack pnpm build` | Pass | Next.js production build completed successfully. |
| `corepack pnpm build-storybook` | Pass | Storybook build completed successfully. |
| `corepack pnpm test:e2e` | Pass | Playwright passed: 6 tests. |

Final-check warnings observed:

- Storybook/Vite reported plugin timing warnings.
- Storybook/Vite reported some chunks larger than 500 kB after minification.
- Playwright/Next printed `NO_COLOR` ignored because `FORCE_COLOR` is set.

These warnings do not block Phase 2.5 verification.

## Errors or Warnings

One manual RLS probe attempt failed because PowerShell quoting split a long inline SQL command into extra `psql` arguments. No database change was applied by that failed command.

Fix made:

- Reran the probe by piping SQL into `psql` with `docker exec -i`.
- No repository code, migration, schema, dependency, or product feature change was needed.

## Cloud and Production Safety Confirmation

Confirmed:

- No cloud Supabase project was linked.
- `supabase/.temp/project-ref` is absent.
- No Supabase cloud push was run.
- No production services were connected.
- No production secrets were added.
- No product feature tables were added.
- No clients, practitioners, services, appointments, finance, clinical notes, WhatsApp, AI Gateway, worker, n8n, FastAPI, Flask, VPS, or production deployment work was implemented.

## Phase 2.5 Result

Phase 2.5 local Supabase verification passed.

The local-first Supabase foundation can start, reset, apply migrations, seed roles and permissions, expose the expected RLS helpers, enforce the expected foundation policies, and pass the existing application quality checks.
