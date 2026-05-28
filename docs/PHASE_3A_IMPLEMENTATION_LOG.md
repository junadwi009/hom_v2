# Phase 3A Implementation Log

Date: 2026-05-27

Status: implemented Phase 3A only. Stop here before Phase 3B.

## Scope Completed

Phase 3A added the read-only current-user foundation:

- Standard API response helpers in `packages/domain/src/api`.
- `NOT_IMPLEMENTED` in the canonical API error code union.
- Read-only `GET /api/me`.
- `/api/me` uses the existing auth boundary.
- `HOM_AUTH_MODE=mock` remains the default and returns the mock Studio Director.
- `HOM_AUTH_MODE=supabase` returns a safe `501 NOT_IMPLEMENTED` response.
- Server-side current-user loader for the app shell.
- Safe `ShellUser` display model passed into client shell components.
- Removed the app shell dependency on `mockUser` from `routes.ts`.
- Product screens remain on mock data.

## Files Changed

- `packages/domain/package.json`
- `packages/domain/src/index.ts`
- `packages/domain/src/api/constants.ts`
- `packages/domain/src/api/index.ts`
- `packages/domain/src/api/responses.ts`
- `packages/domain/src/api/schemas.ts`
- `packages/domain/src/api/types.ts`
- `packages/domain/src/auth/index.ts`
- `packages/domain/src/auth/shell-user.ts`
- `packages/domain/tests/api.test.ts`
- `packages/domain/tests/auth.test.ts`
- `apps/web/package.json`
- `apps/web/vitest.config.ts`
- `apps/web/src/app/api/me/route.ts`
- `apps/web/src/app/layout.tsx`
- `apps/web/src/features/shell/app-shell.tsx`
- `apps/web/src/lib/auth/current-user.ts`
- `apps/web/src/lib/routes.ts`
- `apps/web/tests/unit/api-me.test.ts`
- `apps/web/tests/e2e/app-shell.spec.ts`
- `pnpm-lock.yaml`
- `docs/PHASE_3A_IMPLEMENTATION_LOG.md`

## Dependency Change

Added `vitest` as a dev dependency for `apps/web` so the Next.js route handler can be tested without real Supabase Auth.

Command:

```powershell
corepack pnpm --dir apps/web add -D vitest
```

No runtime product dependency was added.

## API Behavior

`GET /api/me` in mock mode returns:

- `200`
- `ok: true`
- `data.user` containing the mock Studio Director
- `meta.authMode: "mock"`

`GET /api/me` in Supabase mode returns:

- `501`
- `ok: false`
- `error.code: "NOT_IMPLEMENTED"`
- safe message: `Supabase auth mode is not enabled in Phase 3A. Keep HOM_AUTH_MODE=mock until real auth is approved.`

No real Supabase Auth, cookies, login UI, production services, or secrets were added.

## Shell Behavior

The root layout now loads the current user on the server through the auth boundary and passes a small safe display object into the client app shell:

```text
fullName
email
initials
roleLabel
```

The visible shell user now comes from the mock Studio Director auth boundary instead of `mockUser` in `routes.ts`.

## Commands Run

```powershell
corepack pnpm --dir apps/web add -D vitest
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
| `corepack pnpm lint` | Pass | Clean rerun passed after one silent Windows-local lint run was stopped/retried. |
| `corepack pnpm test` | Pass | Domain: 4 files, 27 tests. Web: 1 file, 2 tests. |
| `corepack pnpm build` | Pass | Next.js build passed; `/api/me` is dynamic server-rendered on demand. |
| `corepack pnpm build-storybook` | Pass | Storybook static build completed successfully. |
| `corepack pnpm test:e2e` | Pass | Playwright passed 7 Chromium tests, including `/api/me` mock current-user check. |

## Test Coverage Added

- API response helper success shape.
- API response helper error shape.
- `NOT_IMPLEMENTED` error code and schema shape.
- Shell user display mapping.
- `/api/me` success in mock mode.
- `/api/me` safe `501 NOT_IMPLEMENTED` response in Supabase mode.
- Playwright check that the app shell displays the mock Studio Director.
- Playwright check that `/api/me` returns the mock current user.

## Warnings

- Storybook/Vite reported plugin timing warnings.
- Storybook/Vite reported chunks larger than 500 kB after minification.
- Playwright/Next printed `NO_COLOR` ignored because `FORCE_COLOR` is set.
- One lint run became silent for several minutes on Windows; a clean rerun passed.

These warnings did not fail Phase 3A verification.

## Phase 2.6 Audit Policy Confirmation

Phase 2.6 remains the source of truth for audit logs:

- Direct browser/client insert into `public.audit_logs` is blocked.
- `audit_logs` remains readable only through the approved `can_view_audit_logs` policy.
- Phase 3A did not add an audit writer API.
- Phase 3A did not add a service-role admin client.

## Safety Confirmation

Confirmed:

- No Phase 3B work was implemented.
- No clients, practitioners, or services tables were added.
- No catalog repositories were added.
- No catalog migrations were added.
- No real login UI was added.
- No production Supabase Auth was implemented.
- No cloud Supabase project was linked or pushed.
- No service-role admin client was added.
- No audit writer API was added.
- No appointment booking was added.
- No finance, clinical notes, WhatsApp, AI Gateway, workers, n8n, FastAPI, Flask, VPS, production services, secrets, or production data were added.

## Next Boundary

Stop here.

Phase 3B should not begin until the owner separately approves catalog domain/repository planning and the later local-only catalog migration/RLS scope.
