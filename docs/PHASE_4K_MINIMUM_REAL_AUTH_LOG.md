# Phase 4K Minimum Real Auth Log

## Scope

Implemented minimum local-first Supabase Auth for a mapped studio user. Mock auth remains the default fallback.

## Files Changed

- Added `supabase/migrations/20260602000100_minimum_local_auth_context.sql`.
- Updated `supabase/seed.sql` with one local-only Auth fixture and `studio_director` mapping.
- Added Supabase auth boundary, safe auth errors, proxy protection, `/login`, and sign-out.
- Updated `/api/me`, shell loading, and appointment create permission gating.
- Added auth unit tests and `supabase/tests/phase_4k_minimum_local_auth.sql`.

## Auth Behavior

- `HOM_AUTH_MODE=mock` keeps the existing mock Studio Director.
- `HOM_AUTH_MODE=supabase` requires a real cookie-backed local Supabase session.
- `public.get_current_app_user_context()` returns the caller's active app profile, roles, and permissions only.
- Execute access is granted to `authenticated`, not `anon`.

## Local Fixture

- Added one deterministic local-only user: `local.studio.director@example.invalid`.
- The mapped `app_users` profile has the `studio_director` role and `can_manage_appointments`.
- Supabase config keeps `enable_signup = false`; an HTTP signup attempt returned `422`.

## /api/me Behavior

- Mock mode still returns the mock Studio Director.
- Supabase mode returns the mapped local user for a valid session.
- Missing or inactive mappings return safe `401` or `403` responses without raw database details.

## Login/Sign-out Behavior

- Added email/password `/login` with no signup or recovery path.
- Added shell sign-out control in Supabase mode.
- Browser verification confirmed unauthenticated redirect to `/login`, local login, signed-in shell, and sign-out control rendering.

## Create Appointment Verification

- Browser verification confirmed real local appointment rows and an enabled New Appointment control for the mapped `studio_director`.
- Rollback-only SQL verified RPC create success, status history insertion, atomic audit insertion, unmapped/inactive denial, and direct authenticated table-write denial.
- Direct audit log insert remains blocked.

## Final Checks

| Command | Result |
| --- | --- |
| `corepack pnpm exec supabase db reset` | Applied migrations and seed; local Storage health reported a transient restart delay, then recovered healthy |
| `corepack pnpm typecheck` | Pass |
| `corepack pnpm lint` | Pass |
| `corepack pnpm test` | Pass |
| `corepack pnpm build` | Pass |
| `corepack pnpm build-storybook` | Pass with existing Vite chunk-size and plugin-timing warnings |
| `corepack pnpm test:e2e` | Pass, 15 tests |
| Phase 4H RPC rollback probe | Pass |
| Phase 4K auth rollback probe | Pass |

## Safety Confirmation

- No public signup, cloud Supabase link/push, service-role browser client, or production credentials were added.
- No payment, clinical, WhatsApp, AI, or worker features were added.
- Direct browser table writes remain blocked.
- Direct browser audit insertion remains blocked.

## Stop Point

Phase 4K stops after minimum local auth. Production auth, role management UI, and unrelated feature work remain deferred.
