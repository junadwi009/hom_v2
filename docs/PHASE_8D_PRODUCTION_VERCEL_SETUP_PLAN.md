# Phase 8D Production Vercel Setup Plan

Planning only. This phase performs no production Vercel deploy, no production Supabase
command, no production user creation, no real data import, no cloud mutation, and no
feature change. It documents the exact, reviewed configuration to apply later, only
after the owner provides production credentials and explicitly approves deployment
(see the Approval Gate).

## 1. Scope

- Vercel production setup planning only.
- No deployment execution.
- No production Supabase migration.
- No production data.
- No user creation.

## 2. Required Owner Inputs

Production deployment cannot start until the owner provides:

- Production Vercel project name (the project that will host the production
  deployment).
- Production Vercel URL, or explicit approval to use the temporary Vercel production
  URL until a final domain exists.
- Final production domain, if available (otherwise TBD).
- Production Supabase URL (`NEXT_PUBLIC_SUPABASE_URL` value).
- Production anon key (`NEXT_PUBLIC_SUPABASE_ANON_KEY` value).
- Confirmation that the source repo is `junadwi009/hom_v2`.
- Confirmation that the root directory is `apps/web`.

Credential values are supplied directly into the Vercel dashboard / secret store by
the owner; they are never pasted into chat, printed, or committed.

## 3. Vercel Source Configuration

- Source repo: `junadwi009/hom_v2`.
- Branch: `main` (production branch; reviewed promotion).
- Root directory: `apps/web`.
- Framework preset: Next.js (auto-detected; there is no `vercel.json`, so Vercel's
  Next.js preset governs build/output).
- Build command expectation: the workspace build (`next build` in `apps/web`). If
  Vercel needs an explicit monorepo build, use the pnpm workspace build for the web app
  (the repo pins `pnpm@11.3.0` via `packageManager`, so Corepack/Vercel should use
  pnpm). Default Next.js preset is expected to work without a custom command.
- Output expectation: standard Next.js output (`.next`) served by Vercel's Next.js
  runtime; routes include static pages plus dynamic server routes (`/api/me`,
  `/appointments`, `/packages`, `/client-packages`, `/payments`) and the proxy
  middleware, matching the verified local production build.
- Do NOT use any old/legacy `hom.git` repository unless the owner explicitly chooses
  it; the verified app lives in `junadwi009/hom_v2`, root `apps/web`.

## 4. Production Environment Variables

Set on the production Vercel environment only:

- `NEXT_PUBLIC_SUPABASE_URL` — production project URL.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — production anon key.
- `HOM_AUTH_MODE=supabase`.
- `HOM_DATA_MODE=supabase`.

Rules:

- Do not print env values (not in chat, logs, or this doc).
- Do not commit env values (only `.env.example` placeholders live in the repo).
- No service-role key in `NEXT_PUBLIC`: `SUPABASE_SERVICE_ROLE_KEY` must never be a
  `NEXT_PUBLIC_*` variable; if ever needed it is a server-only secret.
- No DB password in Vercel public env (never any `NEXT_PUBLIC_*` secret; DB password
  lives only in the host secret manager / password manager).
- Production values must be separate from staging values — different project URL,
  different anon key; staging credentials must never appear in the production
  environment.

## 5. Domain and Redirect Plan

- If no final domain yet: use the temporary Vercel production URL only if the owner
  approves; treat it as the interim production URL.
- Configure the Supabase Auth Site URL to match the production URL (temporary Vercel
  URL now, final domain later).
- Configure the Supabase Redirect URLs to include the production URL and any
  login/callback paths the auth flow needs (e.g. the app origin and `/login`), so
  authenticated redirects resolve correctly.
- Update both the Site URL and Redirect URLs when the final domain exists; re-verify
  login after the change.

## 6. Build and Deploy Gates

All must pass before a production deploy:

- Git clean (`git status --short` shows nothing unexpected; nothing under
  `supabase/.temp/` staged).
- Secret scan clean (only known-safe matches).
- `typecheck` pass.
- `lint` pass.
- `test` pass.
- `build` pass.
- `build-storybook` pass.
- `test:e2e` pass (mock suite; guarded local-Supabase specs are a manual rehearsal).
- Production Supabase migrations already applied (Phase 8C runbook completed, Local ==
  Remote through `20260603000600`).
- Production super_admin bootstrap completed (Phase 8E; one app_users + super_admin
  mapping, RBAC reference present).
- Production env vars set (Section 4) on the production environment.

## 7. Rollback Plan

- Vercel rollback to the previous successful deployment (instant promotion of the
  prior good build).
- Rollback owner identified (a named person authorized to roll back).
- If the production environment is wrong (e.g. env vars point at the wrong Supabase,
  or a missing var), roll back the deployment first, fix the env, then redeploy — do
  not leave a misconfigured production build live.

## 8. Verification After Deploy

Against the production URL:

- `/login` loads (Supabase sign-in form).
- An unauthenticated protected route (e.g. `/appointments`) redirects to `/login`.
- Unauthenticated `/api/me` returns a safe `401`
  (`{"ok":false,"error":{"code":"UNAUTHORIZED",...}}`), no raw DB details.
- After the owner logs in as the production super_admin, `/api/me` returns the mapped
  user with `authMode: supabase`, role `super_admin`, and expected permissions.
- `/appointments`, `/packages`, `/client-packages`, `/payments` load without 500.

(The full create/assign/deduct/payment smoke test belongs to the production smoke-test
phase, 8G; Section 8 here is the post-deploy sanity check.)

## 9. Abort Conditions

Abort the deploy (do not proceed) if any of these are true:

- The Vercel source repo is not `hom_v2` (`junadwi009/hom_v2`).
- The root directory is not `apps/web`.
- Production env values are missing.
- Production env accidentally points to the staging Supabase (staging URL/anon key in
  the production environment).
- A service-role key is exposed to the browser / public env (any `NEXT_PUBLIC_*`
  secret).
- Production Supabase migration / bootstrap is not complete.
- The owner has not approved the temporary production URL or a final domain.

## 10. Approval Gate

Do NOT deploy production until the owner provides the production Supabase credentials
(production Supabase URL and anon key), the production Vercel URL / domain decision (or
approval to use the temporary Vercel production URL), and explicit approval for
production deployment.

## Stop Point

Phase 8D stops after writing this plan. No production Vercel project, deployment, env
value, domain, user, or data was created or changed. The next phase (8E, Production
auth / bootstrap plan) remains planning-only and is also approval-gated.
