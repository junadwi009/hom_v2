# Phase 2.6 Audit Safety Patch

Date: 2026-05-27

## Scope

Phase 2.6 patches one safety issue found after Phase 2.5 local Supabase verification.

The issue was that authenticated browser/client users could insert rows directly into `public.audit_logs` through an RLS insert policy. That is not approved for HOM Studio OS v2. Audit logs must be written later through server-only backend code as part of validated mutation flows.

This phase did not implement a service-role admin client, audit writer API, `/api/me`, product tables, product features, workers, AI Gateway, WhatsApp, n8n, FastAPI, Flask, VPS deployment, production services, or secrets.

## Files Changed

- `supabase/migrations/20260526000300_rls_helpers_and_policies.sql`
- `docs/PHASE_2_6_AUDIT_SAFETY_PATCH.md`

## Migration Patch

Changed the audit log RLS migration to:

- Remove the authenticated-client audit insert policy.
- Explicitly revoke all direct `audit_logs` privileges from `public`, `anon`, and `authenticated`.
- Grant back only `SELECT` on `audit_logs` to `authenticated`.
- Keep the existing read policy that allows audit log reads only when `private.has_permission('can_view_audit_logs')` is true.
- Add a table comment explaining that direct client inserts are intentionally blocked and a server-only audit writer will be introduced later.

The remaining audit policy is:

```sql
create policy "audit viewers can read audit logs"
on public.audit_logs
for select
to authenticated
using (private.has_permission('can_view_audit_logs'));
```

No replacement client-side insert policy was added.

## Commands Run

Docker and Supabase reset:

```bash
docker info --format "{{.ServerVersion}}"
corepack pnpm exec supabase db reset
```

Database verification used local Docker `psql` commands:

```bash
docker exec supabase_db_hom-studio-os-v2 psql -U postgres -d postgres -At -c "<verification query>"
```

Rollback-only behavior probes used:

```bash
@'
begin;
-- temporary auth.users/app_users setup
-- temporary role assignment
-- temporary audit row for read testing
-- set local role authenticated
-- set local request.jwt.claim.sub
-- verify read/insert behavior
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

Additional local tooling recovery commands:

```bash
corepack pnpm --dir apps/web exec next typegen
corepack pnpm --dir apps/web exec next dev --hostname 127.0.0.1 --port 3101
```

These were used only to regenerate stale Next.js generated dev type files after an initial `typecheck` failure in `.next/dev/types/validator.ts`.

## Docker and Supabase Result

Initial `supabase db reset` failed because Docker Desktop was installed but the Docker Linux engine pipe was not running:

```text
open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified
```

Docker Desktop was started locally, then Docker became available:

- Docker server version: `28.4.0`

After Docker was available, `corepack pnpm exec supabase db reset` passed.

Applied migrations:

- `20260526000100_foundation_extensions_and_schemas.sql`
- `20260526000200_identity_rbac_audit.sql`
- `20260526000300_rls_helpers_and_policies.sql`

Seed data ran successfully from `supabase/seed.sql`.

## Audit RLS Verification

Verified `audit_logs` RLS is enabled:

```text
audit_logs:true
```

Verified audit policies:

```text
audit viewers can read audit logs:SELECT
```

Verified no authenticated insert policy exists:

```text
0
```

Verified authenticated browser role grants on `audit_logs`:

```text
authenticated:SELECT
```

No `INSERT`, `UPDATE`, `DELETE`, `TRUNCATE`, `REFERENCES`, or `TRIGGER` grant remains for `authenticated` on `audit_logs`.

Verified the audit table comment:

```text
Append-only audit trail. Direct client inserts are intentionally blocked by RLS; a server-only audit writer will be introduced later when backend mutation flows exist.
```

## Behavior Probes

Rollback-only read probe:

- Temporary `studio_director` user with `can_view_audit_logs` saw `director_audit_rows=1`.
- Temporary `viewer` user without `can_view_audit_logs` saw `viewer_audit_rows=0`.

Rollback-only insert probe:

- Temporary authenticated user attempted direct insert into `public.audit_logs`.
- Insert was denied with:

```text
ERROR: permission denied for table audit_logs
```

Cleanup checks after rollback:

- Temporary Phase 2.6 app users persisted: `0`
- Temporary Phase 2.6 audit rows persisted: `0`

## Final Checks

| Command | Result | Notes |
| --- | --- | --- |
| `corepack pnpm typecheck` | Pass | Initial run failed on stale generated `.next/dev/types/validator.ts`; Next dev types were regenerated, then the command passed. |
| `corepack pnpm lint` | Pass | One lint attempt appeared stuck and was stopped; clean rerun passed. |
| `corepack pnpm test` | Pass | Vitest passed: 3 files, 22 tests. |
| `corepack pnpm build` | Pass | Next.js production build completed successfully. |
| `corepack pnpm build-storybook` | Pass | Storybook build completed successfully. |
| `corepack pnpm test:e2e` | Pass | Playwright passed: 6 tests. |

Warnings observed:

- Storybook/Vite reported plugin timing warnings.
- Storybook/Vite reported chunks larger than 500 kB after minification.
- Playwright/Next printed `NO_COLOR` ignored because `FORCE_COLOR` is set.

These warnings do not block Phase 2.6.

## Cloud and Production Safety Confirmation

Confirmed:

- No cloud Supabase project was linked.
- `supabase/.temp/project-ref` is absent.
- No Supabase cloud push was run.
- No production services were connected.
- No production secrets were added.
- No service-role admin client was implemented.
- No audit writer API was implemented.
- No product tables or product features were added.
- No `/api/me`, clients, practitioners, services, appointments, finance, clinical notes, WhatsApp, AI Gateway, workers, n8n, FastAPI, Flask, VPS, or production deployment work was implemented.

## Phase 2.6 Result

Phase 2.6 audit safety patch passed.

`public.audit_logs` is now read-only for authenticated browser/client users, and direct client insertion is blocked. Future audit writing must be introduced through server-only backend mutation flows with validation, permissions, and audit writer ownership.
