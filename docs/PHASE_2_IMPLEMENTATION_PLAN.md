# Phase 2 Implementation Plan

Date: 2026-05-26

Status: planning only. Do not implement until the owner approves this plan.

## Purpose

Phase 2 should prepare the source-of-truth foundation for HOM Studio OS v2:

- Supabase setup strategy.
- Real auth transition plan.
- RBAC model.
- Roles and permissions.
- Audit log foundation.
- Domain and database package structure.
- Zod validation strategy.
- First migration plan.
- RLS plan.
- Mock-to-real data transition plan.
- Tests for permissions and audit logs.

Phase 2 must stay small and reviewable. It should not build operational product features yet.

## Sources Read

- `AGENTS.md`
- `CONTRIBUTING.md`
- `docs/01_PRD.md`
- `docs/02_SYSTEM_BLUEPRINT.md`
- `docs/03_ARCHITECTURE_DECISIONS.md`
- `docs/04_DATABASE_SCHEMA.md`
- `docs/05_API_CONTRACTS.md`
- `docs/10_SECURITY_AND_GOVERNANCE.md`
- `docs/20_ROBUST_STACK_DECISION.md`
- `docs/23_CODEX_RULES_ROBUST_STACK.md`
- `docs/24_TECH_STACK_LOCKFILE.md`
- `docs/PHASE_1_IMPLEMENTATION_LOG.md`

Official Supabase references checked for planning:

- Supabase local development and migrations: https://supabase.com/docs/guides/cli/local-development
- Supabase CLI local stack: https://supabase.com/docs/guides/cli
- Supabase RLS: https://supabase.com/docs/guides/database/postgres/row-level-security

## Phase 2 Non-Goals

Do not implement these in Phase 2 planning or before explicit implementation approval:

- Production Supabase connection.
- Production auth rollout.
- Real migrations applied to a cloud project.
- AI Gateway.
- WhatsApp integration.
- Finance workflows.
- Clinical notes workflows.
- Payroll.
- Workers.
- n8n.
- FastAPI.
- Flask.
- VPS.
- Production service connections.
- Secrets or production data.

## Current Baseline From Phase 1

The repository currently has:

- pnpm workspace root.
- Next.js app in `apps/web`.
- Mock app shell and mock routes.
- Storybook.
- Playwright smoke tests.
- `.env.example` placeholders only.
- No Supabase client, auth, migrations, RLS, API mutations, backend worker, or production services.

## Proposed Phase 2 Decisions To Approve

These decisions should be approved before coding begins.

### 1. Canonical Role Names

Use the role names from `docs/10_SECURITY_AND_GOVERNANCE.md` as canonical:

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

Role intent:

| Role | Intent |
|---|---|
| `super_admin` | Technical/system owner with all permissions, including role and permission management. |
| `studio_director` | Business owner/director with broad operational visibility and approvals. |
| `admin_frontdesk` | Daily operations user for clients, appointments, basic support, and non-sensitive admin work. |
| `practitioner` | Practitioner user with own schedule, assigned client context, and permitted clinical-adjacent access later. |
| `finance_admin` | Finance user for finance views and later finance operations. |
| `marketing_admin` | Marketing and communication user for later WhatsApp and campaign workflows. |
| `viewer` | Read-only internal user with limited visibility. |
| `ai_agent_service` | Non-human service identity for read-only AI helper access through approved backend use cases only. |

### 2. Canonical Permission List

Use this permission list as the Phase 2 canonical seed list. It includes the security document permissions plus missing permissions already referenced by API contracts or needed for safe administration.

```text
can_manage_users
can_manage_roles_permissions
can_view_audit_logs

can_view_clients
can_manage_clients

can_view_practitioners
can_manage_practitioners
can_manage_services
can_view_team_attendance

can_view_appointments
can_manage_appointments
can_reschedule_appointments

can_view_clinical_cases
can_manage_clinical_cases
can_view_session_notes
can_edit_session_notes
can_request_note_unlock
can_approve_note_unlock

can_view_financials
can_edit_financials
can_export_financial_report
can_approve_reimbursements

can_view_whatsapp_inbox
can_send_whatsapp_message
can_approve_whatsapp_blast

can_use_ai_business_agent
can_view_ai_logs

can_manage_knowledge
can_publish_knowledge
```

Notes:

- `can_manage_users` appears in `docs/05_API_CONTRACTS.md` but was missing from `docs/10_SECURITY_AND_GOVERNANCE.md`.
- `can_view_whatsapp_inbox` appears in `docs/05_API_CONTRACTS.md` and `docs/OPEN_QUESTIONS.md` but was missing from the security permission list.
- `can_manage_roles_permissions`, `can_view_audit_logs`, `can_view_practitioners`, `can_manage_services`, and `can_view_appointments` are recommended to avoid overloading broader permissions.
- Adding permission keys does not mean implementing those feature modules in Phase 2.

### 3. Initial Role Permission Matrix

Seed permissions should be conservative and editable later through migrations.

| Role | Initial permission posture |
|---|---|
| `super_admin` | All permissions. |
| `studio_director` | All business permissions, including audit log viewing and approvals, but not necessarily low-level role/permission mutation unless owner approves. |
| `admin_frontdesk` | Clients, practitioners read, services read/manage if approved, appointments, team attendance read, WhatsApp inbox later, no finance edit, no clinical note edit. |
| `practitioner` | Own practitioner context later, appointment read later, session note permissions later, no finance, no role management. |
| `finance_admin` | Finance permissions, finance export, reimbursement approval if approved, client read only if needed, no clinical notes. |
| `marketing_admin` | WhatsApp inbox/send later, WhatsApp blast approval if approved, knowledge manage only if owner approves, no finance or clinical notes. |
| `viewer` | Minimal read-only permissions only. |
| `ai_agent_service` | Read-only AI-specific permissions only, no mutation permissions. |

Before coding, confirm whether `studio_director` should receive `can_manage_roles_permissions` or whether that should stay `super_admin` only.

### 4. Canonical Knowledge Source Status Enum

Use the status names from `docs/06_AI_KNOWLEDGE_STUDIO.md` as canonical for `knowledge_sources.status`:

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

Rules:

- Use `review_needed`, not `review_required`.
- `published` is the only active status for retrieval.
- `archived`, `failed`, and all pre-published statuses are not active for retrieval.
- `draft` can remain a chunk-level status later, but should not be a `knowledge_sources.status` value unless approved separately.

### 5. Supabase Start Mode

Recommendation: start local-first.

Local-first means:

- Add Supabase CLI setup for local development.
- Write migrations in the repository.
- Run migrations against the local Supabase stack first.
- Seed only fake local data.
- Generate database types from local schema.
- Do not link or push to a cloud Supabase project until a later explicit approval.

Reason:

- The system handles sensitive operational, financial, and clinical-adjacent data.
- Local-first keeps Phase 2 safe, repeatable, beginner-friendly, and reviewable.
- Official Supabase docs recommend local development with migrations before deploying changes to a linked platform project.

### 6. Should Phase 2 Create Migrations?

Recommendation: yes, Phase 2 should create local migration files after approval.

However, Phase 2 should only create foundation migrations:

- Auth profile / app user mapping.
- RBAC tables.
- Audit log table.
- Optional low-risk operational catalog tables: clients, practitioners, services.
- RLS helper functions and initial policies.
- Local seed data for roles, permissions, and fake users.

Phase 2 should not create finance, clinical notes, payroll, WhatsApp, worker, AI Gateway, or production integration migrations.

## Supabase Client Strategy

Phase 2 should use Supabase only through clear, named client factories.

Recommended files after approval:

```text
apps/web/src/lib/supabase/browser.ts
apps/web/src/lib/supabase/server.ts
apps/web/src/lib/supabase/admin.ts
```

Strategy:

- Browser client uses `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Server client uses the Supabase SSR pattern for route handlers, server components, and server actions.
- Admin/service-role client must be server-only and must not be imported by browser code.
- Do not create a service-role client unless Phase 2 actually needs it.
- Sensitive operations should go through backend use cases, not direct UI writes.
- Client components should not own sensitive business mutations.

Safety rule:

```text
Browser code may use only public Supabase values.
Service role keys stay server-only.
```

## Environment Variable Strategy

Use `.env.example` for placeholders only. Do not commit `.env`, `.env.local`, real Supabase keys, service-role keys, or production URLs.

Recommended placeholders:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_DB_URL=
HOM_AUTH_MODE=mock
HOM_DATA_MODE=mock
```

Rules:

- `NEXT_PUBLIC_` values are public and must never contain secrets.
- `SUPABASE_SERVICE_ROLE_KEY` is server-only.
- `SUPABASE_DB_URL` is server-only and should be used only by tooling or backend scripts.
- `HOM_AUTH_MODE=mock` keeps Phase 1 behavior intact until real auth is explicitly enabled.
- `HOM_DATA_MODE=mock` keeps mock UI data as the default until individual screens are transitioned.
- Environment parsing should use Zod and fail with beginner-friendly messages only when a feature actually needs the missing variable.

## Auth Placeholder-To-Real-Auth Transition

Phase 1 currently has a visual mock user only. Phase 2 should introduce an auth boundary before replacing UI behavior.

Recommended transition:

1. Keep the current mock user as the default.
2. Create a `CurrentUser` type in the domain/auth layer.
3. Create an auth provider interface:

```text
getCurrentUser()
getCurrentUserPermissions()
requireAuthenticatedUser()
```

4. Implement a mock auth provider first.
5. Add a Supabase auth provider behind `HOM_AUTH_MODE=supabase`.
6. Add a read-only `/api/me` route only after the auth provider is stable.
7. Update the app shell to read user/role data through the auth boundary, not directly from mock data.
8. Add login/logout UI only after the backend auth path is approved.

Important:

- Real Supabase Auth should use Supabase `auth.users` for identity.
- App-specific profile and roles should live in app tables.
- Prefer `app_users` or `user_profiles` over a plain public `users` table to reduce confusion with Supabase `auth.users`.

## RBAC Model

Recommended tables:

```text
app_users
roles
permissions
user_roles
role_permissions
```

Recommended relationships:

```text
auth.users.id
  -> app_users.auth_user_id
  -> user_roles.user_id
  -> roles.id
  -> role_permissions.role_id
  -> permissions.id
```

Recommended TypeScript boundary:

```text
packages/domain/src/auth
packages/domain/src/rbac
```

Recommended RBAC functions:

```text
getUserPermissions(actor)
hasPermission(actor, permission)
requirePermission(actor, permission)
requireAnyPermission(actor, permissions)
```

Rules:

- Permission keys should be represented as a TypeScript union and a Zod enum.
- Role names should be represented as a TypeScript union and a Zod enum.
- Backend use cases must call `requirePermission` before sensitive reads or writes.
- RLS must reinforce permission rules, but RLS is not a replacement for backend checks.

## Audit Log Foundation

Recommended table:

```text
audit_logs
```

Recommended fields:

```text
id
actor_user_id
actor_auth_user_id
action
target_type
target_id
risk_level
metadata
request_id
ip_address
user_agent
created_at
```

Rules:

- Audit logs should be append-only from app code.
- Do not store raw clinical notes, payment details, full WhatsApp messages, uploaded file contents, API keys, or secrets in audit metadata.
- Use structured action names such as `appointment.created`, `clinical_case.viewed`, `finance_ledger.created`, and `knowledge_source.published`.
- Phase 2 should implement only the foundation and tests. It should not implement the sensitive feature actions yet.

## Domain Module Folder Structure

Follow the approved modular monolith structure while keeping Phase 2 focused.

Recommended structure after approval:

```text
apps/web/src/app
apps/web/src/features
apps/web/src/components
apps/web/src/lib/env
apps/web/src/lib/supabase
apps/web/src/lib/auth

packages/domain/src/auth
packages/domain/src/rbac
packages/domain/src/audit
packages/domain/src/clients
packages/domain/src/practitioners
packages/domain/src/services
packages/domain/src/shared

packages/db/src
packages/db/src/generated
packages/db/src/migrations
```

Supabase CLI note:

- The official CLI expects a root `supabase/` directory by default.
- Recommended beginner-friendly approach: use root `supabase/` for CLI config, migrations, and seed files, then use `packages/db` for generated TypeScript types, query helpers, and database-facing utilities.

## Zod Validation Strategy

Use Zod at every boundary:

- Environment variables.
- API inputs.
- Server action inputs.
- Route params.
- Query params.
- Domain command inputs.
- Role names.
- Permission keys.
- Knowledge statuses.

Recommended package ownership:

```text
packages/domain/src/rbac/schema.ts
packages/domain/src/auth/schema.ts
packages/domain/src/audit/schema.ts
packages/domain/src/shared/schema.ts
apps/web/src/lib/env/schema.ts
```

Rules:

- Domain schemas should not import React or Next.js.
- UI forms may reuse schemas, but business rules stay in domain/use-case functions.
- API handlers should validate input before permission checks when validation is safe.
- Permission checks should happen before returning sensitive data.

## First Database Migration Plan

Recommended migration set after approval:

### Migration 001 - Foundation Extensions And Schemas

Purpose:

- Enable required safe database extensions.
- Create a private schema for helper functions if needed.

Possible contents:

```text
create extension if not exists pgcrypto;
create schema if not exists private;
```

Do not enable `vector` yet unless Knowledge Studio embedding work is explicitly included later.

### Migration 002 - Identity, RBAC, And Audit

Purpose:

- Create app identity and RBAC tables.
- Seed canonical roles and permissions.
- Create audit log table.
- Add indexes.

Tables:

```text
app_users
roles
permissions
user_roles
role_permissions
audit_logs
```

Indexes:

```text
app_users(auth_user_id)
permissions(key)
roles(name)
audit_logs(target_type, target_id)
audit_logs(actor_user_id, created_at desc)
```

### Migration 003 - RLS Helpers And Initial Policies

Purpose:

- Enable RLS on Phase 2 tables.
- Add private helper functions for permission checks.
- Add conservative policies.

Recommended helpers:

```text
private.current_app_user_id()
private.has_permission(permission_key text)
```

RLS policy posture:

- Authenticated users can read their own app profile.
- Role/permission tables are readable only through approved policies or backend route logic.
- Audit logs can be read only by users with `can_view_audit_logs`.
- Audit logs cannot be updated or deleted by normal app users.

### Migration 004 - Optional Low-Risk Catalog Foundation

Only include this migration if the owner wants Phase 2 to create basic operational tables:

```text
clients
practitioners
services
```

This would prepare later appointment work without implementing appointment features.

If approved, keep these tables minimal and do not add finance, clinical notes, WhatsApp, payroll, AI, or worker tables.

## RLS Planning

RLS should be enabled on every Phase 2 app table in the exposed schema.

RLS rules:

- Use `to authenticated` in policies.
- Use `auth.uid()` to link Supabase identity to app users.
- Use private helper functions for permission checks.
- Keep service-role usage server-only.
- Prefer least privilege.
- Test denied access, not only successful access.

Beginner reminder:

```text
RLS protects database rows.
Backend permission checks protect business workflows.
Use both.
```

## Mock-To-Real Data Transition Plan

Keep mock data as the default until a screen has real data, error handling, and permission behavior.

Recommended transition:

1. Keep `apps/web/src/lib/mock-data.ts` in place.
2. Add repository interfaces per domain.
3. Add mock repositories first.
4. Add Supabase repositories behind `HOM_DATA_MODE=supabase`.
5. Convert one screen at a time from mock data to backend data.
6. Each converted screen must show loading, empty, error, permission-denied, and success states.
7. Do not show fake zero values if real data fails to load.
8. Keep Storybook stories on mock data so UI remains testable without Supabase.

Phase 2 should not convert dashboards to real operational metrics yet.

## Testing Plan For Permissions And Audit Logs

Recommended test layers:

### Unit Tests

Use for pure logic:

- Role enum accepts only canonical role names.
- Permission enum accepts only canonical permission keys.
- `hasPermission` returns expected values.
- `requirePermission` blocks missing permissions.
- Default role-permission matrix is conservative.
- Audit metadata redaction removes sensitive fields.

### Database / RLS Tests

Use local Supabase only:

- Seed fake users and roles.
- Confirm a user can read only allowed app profile data.
- Confirm a user without `can_view_audit_logs` cannot read audit logs.
- Confirm a user with `can_view_audit_logs` can read audit logs.
- Confirm normal app users cannot update or delete audit logs.
- Confirm permission helper functions return expected results.

### API / Route Tests

Add only if Phase 2 includes read-only route handlers:

- `/api/me` returns current user, roles, and permissions.
- Unauthorized requests return `UNAUTHORIZED`.
- Authenticated but under-permissioned requests return `FORBIDDEN`.
- Errors use the standard API response shape.

### Existing Quality Gates

Continue to run from repository root:

```powershell
corepack pnpm typecheck
corepack pnpm lint
corepack pnpm build
corepack pnpm build-storybook
corepack pnpm test:e2e
```

If unit or database tests are added in Phase 2, add a root script and include it in the required checks.

## Exact Proposed Phase 2 Implementation Steps

Do these only after approval.

1. Confirm the canonical decisions in this plan.
2. Add Phase 2 dependencies in the smallest possible set:

```powershell
corepack pnpm --dir apps/web add @supabase/supabase-js @supabase/ssr
corepack pnpm add -D -w supabase
```

Add `zod` and a unit test runner only in the package that needs them during implementation.

3. Update `.env.example` with safe Supabase and mode placeholders.
4. Create `packages/domain` with auth, RBAC, audit, and shared schema folders.
5. Create canonical role, permission, and knowledge status constants plus Zod schemas.
6. Add unit tests for role and permission behavior if a test runner is approved.
7. Create `packages/db` for generated database types and database helpers.
8. Initialize local Supabase config without linking a cloud project.
9. Add first local migration files for identity, RBAC, audit logs, RLS helpers, and policies.
10. Add local seed data for fake roles, permissions, and fake development users.
11. Generate database types from the local Supabase schema.
12. Add Supabase client factories with strict server/browser separation.
13. Add mock auth provider and the real Supabase auth provider interface behind `HOM_AUTH_MODE`.
14. Optionally add a read-only `/api/me` route if approved as Phase 2 foundation.
15. Add RLS smoke tests against the local Supabase stack if Docker/local Supabase is available.
16. Keep app screens on mock data unless a specific read-only transition is approved.
17. Run the required root checks.
18. Update docs with actual commands, warnings, and any decisions changed during implementation.
19. Stop before Phase 3.

## Assumptions

- Phase 2 implementation will be local-first unless the owner explicitly chooses cloud-first.
- No production Supabase project is connected during planning.
- `app_users` is preferable to `users` for app profile data to avoid confusion with Supabase `auth.users`.
- The canonical role names from the security document are acceptable unless the owner provides real studio role names.
- Permission keys may include future modules even when those modules are not implemented yet.
- Storybook should continue to use mock data.
- Existing Playwright smoke tests should continue to pass while backend foundation is introduced.

## Risks

- The database schema document uses a `users` table name, which can confuse beginners because Supabase already has `auth.users`.
- The security document and API contracts do not fully agree on permission keys.
- If Phase 2 tries to implement real auth, migrations, RLS, and route handlers all at once, the change may become too large to review safely.
- RLS policies can silently block valid use cases if helper functions are wrong.
- Service-role keys are dangerous if imported into browser code.
- Cloud-first setup could accidentally touch production or staging data before the schema is reviewed.
- Adding too many domain tables in Phase 2 could pull appointments, finance, clinical notes, or WhatsApp work forward too early.

## Open Questions Before Coding

1. Should `studio_director` be allowed to manage roles and permissions, or should `can_manage_roles_permissions` stay `super_admin` only?
2. Should Phase 2 create the optional `clients`, `practitioners`, and `services` tables, or stop at identity, RBAC, and audit logs?
3. Should the app profile table be named `app_users`, `user_profiles`, or keep the older `users` name from the database blueprint?
4. Should Phase 2 add a unit test runner such as Vitest for RBAC/audit tests?
5. Is Docker available and approved on this Windows machine for local Supabase?
6. Does a Supabase cloud project already exist, and should it remain untouched until after local migrations are reviewed?
7. Should the initial `studio_director` seed user receive all business permissions except role management?
8. Should `marketing_admin` receive `can_manage_knowledge`, or should knowledge publishing stay owner/director only?
9. Should `finance_admin` be allowed to approve reimbursements, or should reimbursement approval stay director-only?
10. Should the first read-only route be `/api/me`, or should Phase 2 keep auth providers internal until login UI is approved?

## Approval Gate

Stop here before coding. Phase 2 implementation should begin only after the owner approves:

- canonical role names,
- canonical permission list,
- canonical knowledge status enum,
- local-first or cloud-first Supabase setup,
- whether Phase 2 creates migrations or only prepares schemas,
- whether optional low-risk catalog tables are included.
