# Phase 3 Implementation Plan

Date: 2026-05-27

Status: planning only. Do not implement until approved.

## Source Documents Read

- `AGENTS.md`
- `docs/PHASE_1_IMPLEMENTATION_LOG.md`
- `docs/PHASE_2_IMPLEMENTATION_LOG.md`
- `docs/PHASE_2_5_LOCAL_SUPABASE_VERIFICATION.md`
- `docs/PHASE_2_6_AUDIT_SAFETY_PATCH.md`
- `docs/01_PRD.md`
- `docs/02_SYSTEM_BLUEPRINT.md`
- `docs/04_DATABASE_SCHEMA.md`
- `docs/05_API_CONTRACTS.md`
- `docs/10_SECURITY_AND_GOVERNANCE.md`
- `docs/17_SCREEN_SPECIFICATIONS.md`
- `docs/23_CODEX_RULES_ROBUST_STACK.md`
- `docs/24_TECH_STACK_LOCKFILE.md`

## Phase 2.6 Safety Baseline

Phase 2.6 is the latest source of truth for `audit_logs`.

Rules that Phase 3 must preserve:

- Browser/client users must not insert directly into `public.audit_logs`.
- `audit_logs` may be read only by authenticated users with `can_view_audit_logs`.
- Future audit writes must be server-only, through backend mutation flows.
- No service-role admin client should be added unless explicitly approved and justified.

## Exact Phase 3 Scope

Phase 3 should be split into two small reviewable parts.

Phase 3A is the next safest implementation step:

- Add a read-only `/api/me` route.
- Keep `HOM_AUTH_MODE=mock` as the default.
- Return the current mock user through the existing auth boundary.
- Update the app shell to receive current user data from the auth boundary instead of hardcoded route mock data.
- Keep existing mock screens and mock business data.
- Do not add real login UI.
- Do not enable production Supabase Auth.

Phase 3B is the catalog foundation plan after Phase 3A review:

- Prepare local-only clients, practitioners, and services catalog foundation.
- Add domain schemas, repository interfaces, and mock repositories first.
- Add local Supabase migrations for catalog tables only after explicit approval.
- Add Supabase repositories behind `HOM_DATA_MODE=supabase` later.
- Do not implement appointment core.

Recommended approval sequence:

1. Approve and implement Phase 3A.
2. Review Phase 3A log and checks.
3. Approve Phase 3B domain/mock repository work.
4. Separately approve Phase 3B local catalog migrations and RLS verification.

## Phase 3A - Current User API And Shell Integration

### Route

Create:

```text
apps/web/src/app/api/me/route.ts
```

Behavior:

- Method: `GET`.
- Read current user through `getAuthBoundary()`.
- Validate returned user with `currentUserSchema`.
- Return the standard API shape from `docs/05_API_CONTRACTS.md`.
- Do not expose secrets, Supabase keys, cookies, raw errors, or stack traces.
- Do not write audit logs for `/api/me`; it is a low-risk self-profile read.
- Do not call Supabase when `HOM_AUTH_MODE=mock`.
- Do not implement a real Supabase auth provider yet.

Proposed success response:

```json
{
  "ok": true,
  "data": {
    "user": {
      "id": "00000000-0000-4000-8000-000000000001",
      "authUserId": null,
      "email": "owner@example.local",
      "fullName": "Studio Director",
      "status": "active",
      "roles": ["studio_director"],
      "permissions": ["can_view_clients"]
    }
  },
  "meta": {
    "authMode": "mock"
  }
}
```

The permissions array above is shortened in the example only. The actual mock `studio_director` user should return its full canonical permission list.

Proposed error behavior:

| Situation | Status | Response code |
| --- | --- | --- |
| No current user from boundary | `401` | `UNAUTHORIZED` |
| `HOM_AUTH_MODE=supabase` before real auth is approved | `501` | `NOT_IMPLEMENTED` or `INTERNAL_ERROR` with a safe message |
| Schema validation fails | `500` | `INTERNAL_ERROR` with a safe beginner-friendly message |
| Non-GET method | Next.js default method handling is acceptable |

Open decision before implementation:

- Add `NOT_IMPLEMENTED` to the API error code union now, or map unsupported auth mode to `INTERNAL_ERROR` until the API error list is expanded.

### Auth Boundary Integration

Current state:

- `packages/domain/src/auth` already defines `AuthBoundary`.
- `createMockAuthBoundary()` returns the mock Studio Director.
- `apps/web/src/lib/auth/boundary.ts` selects mock auth by default.
- `HOM_AUTH_MODE=supabase` intentionally throws.
- `AppShell` is currently a client component and reads `mockUser` from `apps/web/src/lib/routes.ts`.

Phase 3A plan:

- Keep `getAuthBoundary()` server-side friendly.
- Add a small server-side loader, for example:

```text
apps/web/src/lib/auth/current-user.ts
```

- Use the loader from the root layout or a server wrapper around the app shell.
- Pass a safe display model into client shell components:

```ts
type ShellUser = {
  fullName: string;
  roleLabel: string;
  initials: string;
};
```

- Keep `SidebarNavigation` and `Topbar` client components if needed.
- Remove shell dependence on `mockUser` from `routes.ts`.
- Keep mock route data in place for product screens.

Beginner-friendly reason:

The app shell should not care whether the user came from mock data today or Supabase Auth later. It should ask the auth boundary for "current user" and render only safe display fields.

## Phase 3B - Catalog Foundation Plan

Phase 3B should create the domain and data foundation for clients, practitioners, and services without booking, scheduling, payments, clinical records, or WhatsApp.

### Catalog Tables Proposed

Use the existing `app_users` table name from Phase 2 instead of the older `users` table name from `docs/04_DATABASE_SCHEMA.md`.

Proposed table: `clients`

```sql
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text,
  email text,
  status text not null default 'active'
    check (status in ('active', 'inactive', 'prospect', 'archived')),
  primary_practitioner_id uuid references public.practitioners(id) on delete set null,
  created_by_app_user_id uuid references public.app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Proposed table: `practitioners`

```sql
create table public.practitioners (
  id uuid primary key default gen_random_uuid(),
  app_user_id uuid unique references public.app_users(id) on delete set null,
  display_name text not null,
  email text,
  status text not null default 'active'
    check (status in ('active', 'inactive', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Proposed table: `services`

```sql
create table public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  default_duration_minutes integer not null
    check (default_duration_minutes > 0 and default_duration_minutes <= 480),
  default_price_cents bigint,
  status text not null default 'active'
    check (status in ('active', 'inactive', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Indexes to propose later:

- `clients(status)`
- `clients(primary_practitioner_id)`
- `clients(lower(full_name))`
- `practitioners(status)`
- `services(status)`
- `services(category)`

Deferred from Phase 3B:

- `client_profiles`
- `client_conditions`
- `practitioner_attendance`
- appointments
- packages/payments
- clinical case records

Reason:

Those tables add higher sensitivity or workflow behavior. Phase 3B should prove catalog foundations before operational transactions.

### Catalog RLS Strategy

Enable RLS on all catalog tables.

Proposed read policies:

- `clients`: users with `can_view_clients`.
- `practitioners`: users with `can_view_practitioners`, `can_manage_practitioners`, `can_view_appointments`, or `can_manage_appointments`.
- `services`: authenticated users may read active services, or restrict to users with appointment/service permissions if preferred.

Proposed write policies:

- Do not allow direct browser/client writes in Phase 3B unless explicitly approved.
- Prefer server-side route handlers/use cases for mutations later.
- If Phase 3B remains read-only, no insert/update/delete policy should be added.
- If local-only create/update endpoints are approved later, they must perform backend permission checks first and write audit logs server-side.

Important:

RLS is defense-in-depth. Backend permission checks are still required.

### Catalog Audit Strategy

Read audit:

- Basic catalog list reads do not need audit logs.
- Future sensitive reads, such as detailed clinical-adjacent client profile or condition data, must be audited.
- Clinical case and session note reads remain outside Phase 3B.

Write audit:

- Creating or editing clients, practitioners, and services should eventually write server-side audit events.
- No client-side direct audit inserts are allowed.
- Do not implement the audit writer API in Phase 3A.
- For Phase 3B, either defer catalog writes or introduce a server-only audit writer only if the owner approves catalog mutations.

Suggested future actions:

- `catalog.client_created`
- `catalog.client_updated`
- `catalog.practitioner_created`
- `catalog.practitioner_updated`
- `catalog.service_created`
- `catalog.service_updated`

Audit metadata must be redacted and must not include raw clinical notes, payment data, secrets, or unnecessary PII.

## Zod Schemas And Domain Package Structure

Phase 3A domain additions:

```text
packages/domain/src/api
packages/domain/src/api/response.ts
packages/domain/src/api/errors.ts
```

Purpose:

- Define standard API success/error response helpers.
- Keep `/api/me` response typed and predictable.

Phase 3B domain additions:

```text
packages/domain/src/clients
packages/domain/src/practitioners
packages/domain/src/services
packages/domain/src/catalog
```

Suggested schema exports:

```text
clientStatusSchema
clientSchema
clientListQuerySchema
createClientInputSchema
updateClientInputSchema

practitionerStatusSchema
practitionerSchema
practitionerListQuerySchema
createPractitionerInputSchema
updatePractitionerInputSchema

serviceStatusSchema
serviceSchema
serviceListQuerySchema
createServiceInputSchema
updateServiceInputSchema
```

Repository interfaces:

```ts
type ClientRepository = {
  listClients(query: ClientListQuery): Promise<ClientListResult>;
  getClientById(id: string): Promise<Client | null>;
};

type PractitionerRepository = {
  listPractitioners(query: PractitionerListQuery): Promise<PractitionerListResult>;
  getPractitionerById(id: string): Promise<Practitioner | null>;
};

type ServiceRepository = {
  listServices(query: ServiceListQuery): Promise<ServiceListResult>;
  getServiceById(id: string): Promise<Service | null>;
};
```

Mutation interfaces should wait until catalog writes are approved.

## Mock-To-Real Data Transition

Current default:

```text
HOM_AUTH_MODE=mock
HOM_DATA_MODE=mock
```

Phase 3A:

- `/api/me` uses `HOM_AUTH_MODE=mock` by default.
- App shell reads current user through the auth boundary.
- Product screens continue using mock data.

Phase 3B:

- Add mock repositories first.
- UI may read catalog data from repository interfaces while `HOM_DATA_MODE=mock`.
- Supabase repositories may be added later behind `HOM_DATA_MODE=supabase`.
- If `HOM_DATA_MODE=supabase` is set before repositories are ready, fail with a clear safe error.

Do not connect to a cloud Supabase project.

## UI Changes Allowed

Phase 3A allowed UI changes:

- App shell current user card may display the auth-boundary user.
- Settings may show a non-sensitive auth mode indicator if useful.
- Loading/error/unauthorized states may be added around shell user loading.

Phase 3B allowed UI changes after approval:

- Clients page can switch from hardcoded mock rows to mock repository rows.
- A read-only practitioner catalog surface may be added if it uses mock data.
- A read-only services catalog surface may be added if it uses mock data.
- Storybook stories should remain mock-data based.

Not allowed:

- Login form.
- Sign-up or invite flow.
- Appointment create/reschedule/cancel flows.
- Finance, clinical note, WhatsApp, AI Gateway, worker, or production service UI.

## Tests Required

Phase 3A tests:

- Unit tests for API response helpers if added.
- Unit tests for shell user display mapping, especially initials and role labels.
- Route handler tests for `/api/me` if the local test setup supports it cleanly.
- Playwright smoke test that verifies the shell displays the mock current user.
- Existing required checks:

```bash
corepack pnpm typecheck
corepack pnpm lint
corepack pnpm test
corepack pnpm build
corepack pnpm build-storybook
corepack pnpm test:e2e
```

Phase 3B tests:

- Unit tests for client, practitioner, and service Zod schemas.
- Unit tests for repository interfaces using mock repositories.
- Unit tests for permission checks once read/write use cases are introduced.
- Local Supabase reset and RLS probes only after catalog migrations are approved.
- Playwright smoke tests for any catalog UI that changes route behavior.

Catalog RLS tests after migration approval:

- User with `can_view_clients` can read clients.
- User without `can_view_clients` cannot read clients.
- User with practitioner permissions can read practitioners.
- User without practitioner permissions cannot read practitioners.
- Services read behavior matches the approved policy.
- Direct client insert/update/delete into catalog tables is denied unless a specific policy is approved.
- No direct client insert into `audit_logs` exists.

## Exact Proposed Implementation Steps

### Phase 3A Steps

1. Add small API response helpers in `packages/domain/src/api` if approved.
2. Add `/api/me` route in `apps/web/src/app/api/me/route.ts`.
3. Return mock auth-boundary user while `HOM_AUTH_MODE=mock`.
4. Add safe unsupported-mode behavior for `HOM_AUTH_MODE=supabase`.
5. Add a server-side current-user loader for the app shell.
6. Pass safe shell user display data into client shell components.
7. Remove app shell dependency on `mockUser` from `routes.ts`.
8. Add or update tests.
9. Run all required checks.
10. Update a Phase 3A implementation log.
11. Stop before Phase 3B.

### Phase 3B Steps

1. Add catalog domain folders and Zod schemas.
2. Add read-only repository interfaces for clients, practitioners, and services.
3. Add mock repositories and unit tests.
4. Optionally switch read-only catalog UI to repository-fed mock data.
5. Draft local catalog migration files only after approval.
6. Add catalog RLS policies only after approval.
7. Reset local Supabase and run catalog RLS probes only after migration approval.
8. Keep `HOM_DATA_MODE=mock` as default.
9. Add Supabase repositories behind `HOM_DATA_MODE=supabase` only after the local schema and RLS pass.
10. Update a Phase 3B implementation log.
11. Stop before appointment core.

## Risks

- `/api/me` can accidentally become the start of real auth. Keep it mock-first and read-only.
- Putting user loading directly inside client components can blur server/client boundaries. Prefer a server loader that passes safe display data down.
- Catalog tables can accidentally expand into appointment booking. Keep Phase 3B read-only until catalog schema and RLS are reviewed.
- Client contact data is PII. Avoid logging full phone/email values and avoid exposing unnecessary fields.
- RLS can be too permissive if direct client writes are added too early.
- Audit logging can regress if anyone re-adds client-side `audit_logs` insert policies.
- The older schema doc uses `users`; Phase 3 should keep using Phase 2's approved `app_users`.

## Open Questions

1. Should `/api/me` unsupported Supabase mode return `501 NOT_IMPLEMENTED`, or should it return the existing `INTERNAL_ERROR` code with a safe message until API error codes are expanded?
2. Should Phase 3A add `packages/domain/src/api` helpers, or keep API response helpers local to `apps/web` until more routes exist?
3. Should the app shell render unauthenticated state in mock mode, or can Phase 3A assume the mock Studio Director always exists?
4. Should services be readable by all authenticated users, or only users with appointment/service permissions?
5. Should Phase 3B include only read/list repositories, or should create/update schemas be added without routes?
6. Should catalog write endpoints wait until a server-only audit writer is approved?
7. Should client phone and email be shown on read-only catalog screens in Phase 3B, or masked until permission-specific detail views exist?
8. Should catalog migrations be one file or split into tables, indexes, and RLS migrations for easier review?

## Explicit Non-Goals

Do not implement in Phase 3 unless a later approval explicitly changes scope:

- Real login UI.
- Production Supabase Auth.
- Cloud Supabase linking or pushing.
- Service-role admin client.
- Audit writer API.
- Appointment booking, reschedule, cancel, no-show, or completion flows.
- Finance.
- Clinical notes.
- Clinical case workflows.
- WhatsApp.
- AI Gateway.
- Workers.
- n8n.
- FastAPI.
- Flask.
- VPS.
- Production services.
- Secrets or production data.

## Approval Gate

Stop here.

Before implementation, the owner should approve:

1. Whether Phase 3A is approved as the next implementation step.
2. The exact `/api/me` error behavior for unsupported Supabase auth mode.
3. Whether Phase 3B should be planned as a separate implementation phase after Phase 3A.
4. Whether catalog migrations should be deferred until after mock repositories are reviewed.
