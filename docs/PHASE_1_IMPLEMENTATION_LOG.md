# Phase 1 Implementation Log

Date: 2026-05-25

## Scope Completed

Phase 1 created the code-first frontend foundation only:

- pnpm workspace root.
- Next.js app scaffolded in `apps/web`.
- Current scaffold defaults: Next.js `16.2.6`, React `19.2.4`, React DOM `19.2.4`.
- shadcn config with stone base color in `apps/web/components.json`.
- Tailwind v4 semantic tokens in `apps/web/src/app/globals.css`.
- App shell with dark sidebar, topbar, executive tabs, mock user card, and Motion.dev page transition.
- Reusable UI/state components.
- Mock routes with mock data only.
- Storybook config and component stories.
- Playwright config and smoke tests.
- Safe `.env.example` placeholders only.

No real Supabase auth, database migrations, AI Gateway, WhatsApp, finance, clinical notes, payroll, workers, n8n, FastAPI, Flask, VPS, or production service connections were added.

## Actual Commands Used

Corepack could prepare pnpm, but global shim creation failed in `C:\Program Files\nodejs` because of Windows permissions. The working command style for this machine is `corepack pnpm ...`.

```powershell
corepack pnpm create next-app@latest apps/web --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-pnpm --yes --disable-git
corepack pnpm install
corepack pnpm approve-builds sharp unrs-resolver
corepack pnpm install
```

The current shadcn CLI no longer accepts the older `--base-color` flag. The CLI config was initialized with the supported current preset flow, then `apps/web/components.json` was set to `"baseColor": "stone"`.

```powershell
corepack pnpm dlx shadcn@latest init --template next --preset nova --no-monorepo --css-variables --cwd apps/web -y
corepack pnpm --dir apps/web add clsx tailwind-merge shadcn@latest class-variance-authority tw-animate-css radix-ui lucide-react motion
corepack pnpm approve-builds msw
corepack pnpm install
```

Storybook was installed manually because the latest init flow attempted to add packages with `@^null` versions for optional features in this environment.

```powershell
corepack pnpm --dir apps/web add -D storybook@10.4.1 @storybook/nextjs-vite@10.4.1 @storybook/addon-docs@10.4.1
corepack pnpm approve-builds esbuild
corepack pnpm install
```

Playwright setup:

```powershell
corepack pnpm --dir apps/web add -D @playwright/test
corepack pnpm --dir apps/web exec playwright install chromium
```

## Current Developer Commands

Run from the repository root:

```powershell
corepack pnpm install
corepack pnpm dev
corepack pnpm typecheck
corepack pnpm lint
corepack pnpm build
corepack pnpm build-storybook
corepack pnpm test:e2e
```

Run Storybook locally:

```powershell
corepack pnpm storybook
```

## Mock Routes Added

- `/`
- `/dashboard/executive-command`
- `/appointments`
- `/clients`
- `/live-chat`
- `/knowledge-studio`
- `/behavior-intelligence`
- `/financials`
- `/ai-business-agent`
- `/approvals`
- `/settings`
- `/clinical-cases`
- `/team-attendance`

## Checks Run

```powershell
corepack pnpm typecheck
corepack pnpm lint
corepack pnpm build
corepack pnpm build-storybook
corepack pnpm test:e2e
```

Results:

- TypeScript passed.
- ESLint passed.
- Next.js production build passed.
- Storybook static build passed.
- Playwright smoke tests passed for 6 core routes.

## Known Limitations

- All data is mock data.
- Auth is visual only; no sessions, cookies, Supabase client, or RLS exists yet.
- Storybook uses a minimal manual config because the latest init command failed during optional dependency planning.
- The app shell is desktop-first; responsive refinement should continue before real operational screens.
- AI, WhatsApp, finance, clinical notes, payroll, workers, and production services remain blocked until later approved phases.

## Dependency Cleanup - 2026-05-26

Cleanup task completed before Phase 2:

- Inspected root `package.json` and `apps/web/package.json`.
- Confirmed `shadcn` was not imported by app, Storybook, or test code.
- Removed `shadcn` from `apps/web` runtime dependencies. Future shadcn usage should stay CLI-only through `corepack pnpm dlx shadcn@latest ...`.
- Confirmed `radix-ui` was not imported by app, Storybook, or test code.
- Removed `radix-ui` from `apps/web` runtime dependencies.
- Did not add `@radix-ui/react-slot` because no Slot usage exists yet.
- Removed stale `msw` build approval from `pnpm-workspace.yaml` after the removed shadcn CLI dependency path no longer required it.
- Kept `apps/web/components.json` because it is the shadcn configuration file and not a runtime dependency.
- Narrowed the web lint script to source, tests, Storybook config, and app config paths so ESLint does not spend time scanning generated artifacts.
- Set Playwright smoke tests to one worker to avoid transient nested-route 404s while the Next.js dev server compiles cold routes on Windows.

Cleanup command:

```powershell
corepack pnpm --dir apps/web remove shadcn radix-ui
```

Post-cleanup package result:

- `apps/web` runtime dependencies no longer include `shadcn`.
- `apps/web` runtime dependencies no longer include `radix-ui`.
- No app code imports `@radix-ui/react-slot`, so no replacement Radix package was added.

## Post-Cleanup Verification - 2026-05-26

Verification was run from the repository root after the dependency cleanup.

Commands run:

```powershell
corepack pnpm typecheck
corepack pnpm lint
corepack pnpm build
corepack pnpm build-storybook
corepack pnpm test:e2e
```

Results:

- `corepack pnpm typecheck`: passed. The web app ran `tsc --noEmit`.
- `corepack pnpm lint`: passed. ESLint checked `src`, `tests`, `.storybook`, `next.config.ts`, and `playwright.config.ts`.
- `corepack pnpm build`: passed. Next.js 16.2.6 built the static mock routes successfully.
- `corepack pnpm build-storybook`: passed. Storybook 10.4.1 completed a static build.
- `corepack pnpm test:e2e`: passed. Playwright ran 6 Chromium smoke tests using 1 worker and all 6 passed.

Warnings observed:

- Storybook/Vite reported plugin timing warnings during the static build.
- Storybook/Vite reported generated chunks larger than 500 kB after minification.
- Playwright's Next.js web server printed Node warnings that `NO_COLOR` was ignored because `FORCE_COLOR` was set.
- These warnings did not fail the verification run.

Fixes made during this post-cleanup verification:

- No code or dependency fixes were needed during this verification pass.
- No product features were added.

Phase 1 scope confirmation:

- Phase 1 still uses mock data only.
- No Supabase, AI Gateway, WhatsApp, finance implementation, clinical notes implementation, payroll implementation, workers, n8n, FastAPI, Flask, VPS deployment, production service connections, secrets, or production data were added.

## Phase 2 Boundary

Stop here before Phase 2. Phase 2 should be approved separately before adding Supabase, RBAC, migrations, domain modules, real API validation, audit logs, or backend behavior.
