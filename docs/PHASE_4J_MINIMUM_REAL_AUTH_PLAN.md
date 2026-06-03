# Phase 4J Minimum Real Auth Plan

Status: planning only. Do not implement until the owner approves the exact Phase 4K slice.

## 1. Scope

Add the minimum local-first Supabase Auth integration needed to use create appointment safely:

- Map a real Supabase `auth.users` session to `public.app_users`.
- Load the current app user, roles, and permissions from Postgres.
- Replace the Supabase-mode `/api/me` `501` placeholder with a safe real response.
- Allow create appointment only for an authenticated mapped user with `can_manage_appointments`.
- Keep `HOM_AUTH_MODE=mock` as the fallback mode.

## 2. Non-Goals

Do not add public signup, open registration, production deployment, cloud Supabase linking, payment, packages, clinical notes, WhatsApp, AI, workers, role-management UI, or a browser service-role client.

## 3. Auth Strategy

- Keep Supabase Auth invite-only. Local `supabase/config.toml` already has `enable_signup = false`.
- Seed one clearly local-only test identity with an `example.invalid` email, mapped active `app_users` row, and `studio_director` role.
- Use a reproducible local-only fixture credential or bootstrap script. Never reuse it outside local Supabase.
- Add a minimal `/login` form and sign-out action for local email/password session testing. Do not add signup.
- In `HOM_AUTH_MODE=supabase`, use the existing SSR Supabase client and cookie flow. Validate the session with `auth.getUser()`, not UI state alone.
- Protect the app shell in Supabase mode: unauthenticated users go to `/login`; mock mode continues to load the mock Studio Director.

## 4. App User Context

Add one narrow authenticated RPC, such as `public.get_current_app_user_context()`, returning:

- `app_users.id`
- `auth_user_id`
- `full_name`
- `email`
- `status`
- role names
- permission keys

The RPC should:

- Require `auth.uid()`.
- Return only the caller's active mapped `app_users` profile.
- Use a reviewed `security definer` implementation with a fixed `search_path`.
- Be executable by `authenticated` only.
- Avoid broadening direct RLS access to the full `role_permissions` matrix.

Update the Supabase auth boundary to map this safe RPC result into the existing `CurrentUser` schema.

## 5. `/api/me`

Keep mock behavior unchanged.

For `HOM_AUTH_MODE=supabase`:

- Return `200` with the safe mapped `CurrentUser` for a valid local session.
- Return `401` for a missing session.
- Return a safe `401` or `403` for missing, inactive, or suspended `app_users` mapping.
- Return a safe configuration or internal error without raw Supabase details.
- Remove the current Supabase-mode `NOT_IMPLEMENTED` response.

## 6. Permission Strategy

- Read caller roles and permissions from the database through the narrow context RPC.
- `super_admin`, `studio_director`, or any future role may create appointments only when the database grants `can_manage_appointments`.
- The UI may hide or disable create controls based on loaded permissions for ergonomics.
- The create server action and `public.create_appointment(...)` RPC remain authoritative. Never trust UI visibility alone.
- Do not weaken existing RLS or direct-write denials.

## 7. Testing

Add local-only verification for:

- `/api/me` mock mode still returns the mock Studio Director.
- `/api/me` Supabase mode returns the mapped local test user with roles and permissions.
- Missing or invalid session is denied safely.
- Missing or inactive `app_users` mapping is denied safely.
- Create appointment succeeds only with `can_manage_appointments`.
- Create appointment is denied without the permission.
- Successful create inserts appointment history and `appointment.created` audit row.
- Direct authenticated writes to appointments, history, and audit logs remain denied.
- Signup remains disabled.
- No service-role key reaches browser code.

Run the existing full quality checks and local Supabase reset.

## 8. Risks

- SSR cookie refresh and login redirect handling can break the app shell if split inconsistently.
- `auth.users` and `app_users` mapping must be deterministic and verified after reset.
- Local fixture credentials must remain clearly dummy and local-only.
- Public anon keys are allowed in browser configuration; service-role keys must never be exposed.
- Permission loading must not broaden RLS access to role assignments or the permission matrix.

## 9. Recommended Phase 4K Slice

Implement minimum local auth only:

1. Add the local-only seeded auth fixture, `app_users` mapping, and `studio_director` role assignment.
2. Add and verify `public.get_current_app_user_context()`.
3. Implement the Supabase auth boundary with SSR session validation.
4. Update `/api/me` Supabase mode.
5. Add minimal local `/login` and sign-out flows with no signup.
6. Gate create-appointment UI ergonomically while preserving RPC permission enforcement.
7. Add local auth, permission, audit, RLS, unit, and Playwright checks.

Stop before production auth, invitations, password recovery, role management, or any unrelated feature.
