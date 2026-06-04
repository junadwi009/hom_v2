# Phase 7F Staging Smoke Test Prep Log

## Scope

Staging-only smoke-test **preparation** after the Phase 7E super_admin bootstrap.
This phase verifies what can be checked safely without credentials, documents the
data gap, and proposes (but does **not** insert) a minimal staging-safe dataset for
the eventual smoke test. No business data was written.

Explicitly out of scope and not performed in Phase 7F:

- No `supabase/seed.sql` run anywhere.
- No `supabase db reset` on staging.
- No local `Mock *` seed data inserted.
- No production data inserted.
- No production deploy.
- No secret exposure (no anon/service-role keys, DB password, access token, or
  Postgres URL printed or committed).
- No `supabase/.temp/project-ref` committed (remains gitignored).
- **No business data inserted** — insertion is deferred to a separately approved step.

- Staging project ref: `pgokujwfwrxopgwhpluj`.
- Staging app: `https://hom-gamma.vercel.app`.
- Bootstrapped super_admin email: `junadwi009@gmail.com`.

## Login Verification

What was verified in the browser against staging (unauthenticated, no password
entered):

- `GET /login` renders the Supabase-backed sign-in form: email field, password
  field, and a "Sign in" submit button. The staging app is reachable and serving.
- Unauthenticated guard works: navigating to the protected route `/appointments`
  while signed out **redirected to `/login`**.
- `GET /api/me` while unauthenticated returns the correct safe `401`:
  `{"ok":false,"error":{"code":"UNAUTHORIZED","message":"Authentication is required."}}`
  — no raw database details leaked.

What was **not** performed here, and why:

- Actual authenticated login (entering the super_admin password), the
  authenticated `/api/me` super_admin/permissions assertion, and the authenticated
  empty-state page checks were **not** done by the agent. Two reasons: (1) the agent
  does not hold the super_admin password — per Phase 7E the owner created the auth
  user manually and the agent never handled its credentials; (2) entering a password
  to authenticate is an owner-only action. These steps are listed below as an
  owner-performed manual checklist.

### Owner manual login checklist (to run when ready)

Signed in at `https://hom-gamma.vercel.app/login` as `junadwi009@gmail.com`:

- Login succeeds and lands in the app.
- `GET /api/me` returns the mapped super_admin profile with `authMode: supabase`
  and the expected permissions, including `can_manage_appointments`,
  `can_reschedule_appointments`, `can_manage_client_packages`, and
  `can_manage_payments` (matches the Phase 7E DB verification).

## Empty Page Verification

The four read-only pages are behind authentication, so their authenticated
empty-state rendering could not be checked by the agent without logging in. They are
deferred to the owner manual pass:

- `/appointments` — expected to load with an empty appointment list.
- `/packages` — expected to load with an empty package catalog.
- `/client-packages` — expected to load with an empty client-package list.
- `/payments` — expected to load with an empty payment list.

Indirectly confirmed: all four are auth-gated (the `/appointments` redirect to
`/login` demonstrates the guard), and the Phase 7E verification confirmed every
business table (`clients`, `practitioners`, `services`, `packages`,
`client_packages`, `appointments`, `payments`) and `audit_logs` are empty (0 rows),
so these pages will render true empty states when first opened.

## Data Gap

The staging database has a migrated schema and populated RBAC reference, but **all
business tables are empty**. The smoke-test checklist (Phase 7B Section 10) requires
exercising create-appointment, assign-package, deduct-session, and create-payment
flows, none of which can run without minimal catalog data:

- Create an appointment needs at least one `client`, one `practitioner`, and one
  `service`.
- Assign a package needs at least one `client` and one `package`.
- Deduct a session needs a `client_package` (created by assigning a package to the
  client) plus a completed appointment.
- Create a manual payment needs at least one `client`.

So the minimum to unblock the full smoke test is: **1 client, 1 practitioner,
1 service, 1 package**. The `client_package` is created during the smoke test itself
via the assign-package flow, so it does not need to be pre-seeded.

## Proposed Minimal Staging-Safe Data

All records are clearly staging-only (each name prefixed `STAGING`), contain no real
client/staff PII (no real phone/email), and are **not** the local `Mock *` seed and
**not** production data. Proposed for a separate, reviewed, owner-approved
server-side script — applied the same safe way as Phase 7E (transient `PGPASSWORD`
via the pooler, single transaction, `ON_ERROR_STOP`), never via `seed.sql` or
`db reset`. Column shapes match the migrations
(`20260527000100_catalog_tables_and_read_rls.sql`,
`20260603000100_package_tables_and_read_rls.sql`).

```sql
-- PROPOSAL ONLY — not executed in Phase 7F. Apply only after separate owner approval.
-- Idempotent guards so a re-run is a no-op.

-- 1 practitioner (no app_user mapping required; no real email)
insert into public.practitioners (display_name, status)
select 'STAGING Practitioner One', 'active'
where not exists (
  select 1 from public.practitioners where display_name = 'STAGING Practitioner One'
);

-- 1 client (no real PII: no phone, no email)
insert into public.clients (full_name, status)
select 'STAGING Test Client', 'active'
where not exists (
  select 1 from public.clients where full_name = 'STAGING Test Client'
);

-- 1 service (duration drives appointment slot length)
insert into public.services (name, category, default_duration_minutes, default_price_idr, status)
select 'STAGING Test Service', 'general', 60, 100000, 'active'
where not exists (
  select 1 from public.services where name = 'STAGING Test Service'
);

-- 1 package (session pack so deduction can be exercised)
insert into public.packages (name, package_type, total_sessions, validity_days, price_idr, status)
select 'STAGING Test Pack', 'session_pack', 5, 90, 1000000, 'active'
where not exists (
  select 1 from public.packages where name = 'STAGING Test Pack'
);
```

`client_package` (optional, only if needed): **do not raw-insert.** During the smoke
test, create it through the assign-package flow, which calls the
`public.assign_client_package(client_id, package_id, purchased_at)` RPC. The RPC
derives `expires_at`, `total_sessions`, and `remaining_sessions` from the package and
writes `package_usage_history` + audit atomically — pre-seeding a raw row would
bypass that audited path and is unnecessary, since assignment is itself a smoke-test
step.

## Safety Confirmation

- No `supabase/seed.sql` run; no `supabase db reset` on staging; no Vercel deploy.
- No business data inserted (proposal above is not executed); no `Mock`/local fixture
  data; no production data.
- No password was entered; authenticated actions are deferred to the owner.
- No secrets printed or committed — no anon/service-role keys, DB password, access
  token, or Postgres URL appear in this log.
- `supabase/.temp/project-ref` remains gitignored and uncommitted.
- Browser checks were read-only navigations against staging (`/login`,
  `/appointments` redirect, unauthenticated `/api/me`); nothing was written.

## Stop Point

Phase 7F stops here, before inserting any business data. Completed: safe
unauthenticated verification (login page renders, protected-route redirect,
unauthenticated `/api/me` 401), the data-gap analysis, and the proposed minimal
staging-safe dataset. Pending separate owner approval: (1) run the proposed
bootstrap insert above, and (2) the owner-performed authenticated smoke-test pass
(login, authenticated `/api/me`, the four empty-state pages, then the create /
assign / deduct / payment flows with audit verification per Phase 7B Section 10).
