# Phase 2 Open Questions After Implementation

Date: 2026-05-26

These questions should be resolved before applying migrations to any real project or starting the next product phase.

## Local Supabase Runtime

1. Docker is installed, but the Docker engine was not running during Phase 2 verification. Should Docker Desktop be started and local Supabase migrations tested before the next phase?
2. After Docker is available, should the next check be `corepack pnpm exec supabase start` followed by a local migration reset?

## Auth Boundary

3. Should Phase 3 add the read-only `/api/me` route, or should auth remain internal until real login UI is approved?
4. When real auth begins, should account creation be invite-only from the start?

## RLS And Permissions

5. Should normal authenticated users be able to read the permission matrix, or should `role_permissions` remain visible only to `can_manage_roles_permissions` users and backend routes?
6. Should `studio_director` be able to create/manage app users permanently, or should that later move to `super_admin` only?
7. Should `can_approve_whatsapp_blast` stay owner-level only, or should `marketing_admin` receive it later?

## Audit Logs

8. Should normal authenticated users be allowed to insert their own audit events directly, or should all audit inserts go through backend/server-only code later?
9. Should audit `ip_address` stay as `text`, or become Postgres `inet` once request handling is implemented?

## Phase 3 Scope

10. Should the next implementation phase test local Supabase migrations first, or begin with a read-only auth/profile route?
11. Should clients, practitioners, and services be introduced before appointment core, or bundled into the first appointment phase?
