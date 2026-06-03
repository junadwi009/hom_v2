# Phase 5D Package Read-only UI Log

## Scope
Added read-only package and client package UI backed by mock repositories by default and Supabase read-only repositories when `HOM_DATA_MODE=supabase`.

## Files Changed
- `apps/web/src/lib/packages/**`
- `apps/web/src/features/packages/packages/**`
- `apps/web/src/features/packages/client-packages/**`
- `apps/web/src/app/packages/**`
- `apps/web/src/app/client-packages/**`
- `apps/web/src/lib/routes.ts`
- `apps/web/tests/unit/packages/repositories-and-loaders.test.ts`
- `apps/web/tests/e2e/app-shell.spec.ts`
- `docs/PHASE_5D_PACKAGE_READONLY_UI_LOG.md`

## Repository Behavior
- Added Supabase read-only repositories for `packages`, `client_packages`, and `package_usage_history`.
- `HOM_DATA_MODE=mock` uses Phase 5B mock repositories.
- `HOM_DATA_MODE=supabase` uses the existing anon/session-based Supabase server client and does not bypass RLS.
- Repositories expose only `list` and `getById`.
- No create, update, delete, assign, deduct, or reverse methods were added.

## UI Fields
- `/packages` renders package name, package type, total sessions, validity days, `priceIdr`, status, and updated date.
- `/client-packages` renders client name, package name, purchased date, expiry date, total sessions, remaining sessions, status, and updated date.
- No payment detail, clinical data, WhatsApp data, contact data, or package write controls are rendered.

## Tests
- Added unit tests for row mappers, repository factory behavior, Supabase query behavior, safe error conversion, loader ready/empty/error states, `priceIdr` formatting, remaining session display, no cents naming, and no sensitive fields.
- Added Playwright coverage for `/packages` and `/client-packages`, including no create/edit/delete/assign/deduct controls and no payment/clinical/WhatsApp/contact columns.
- Added Storybook stories for ready, empty, permission denied, configuration error, and generic error states for both pages.

## Final Checks
| Command | Result |
| --- | --- |
| `corepack pnpm typecheck` | Pass |
| `corepack pnpm lint` | Pass |
| `corepack pnpm test` | Pass, 91 domain tests and 145 web tests |
| `corepack pnpm build` | Pass |
| `corepack pnpm build-storybook` | Pass |
| `corepack pnpm test:e2e` | Pass, 23 passed and 1 guarded local-Supabase test skipped |

## Warnings
- Storybook reported existing Vite plugin timing and large chunk warnings.
- Playwright reported the existing `NO_COLOR` / `FORCE_COLOR` environment warning.
- One initial Playwright run had a strict locator issue for repeated `Mock Client Alpha`; the test was tightened with `.first()` and the final run passed.

## Safety Confirmation
No package writes, package assignment, session deduction, payment, finance, clinical notes, WhatsApp, AI, production services, production secrets, or production data were added. No route handlers or server actions were added for packages.

## Stop Point
Phase 5D stops here before package assignment, deduction, payment, finance, or write/audit phases.
