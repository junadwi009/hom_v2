# Phase 5G Assign Package UI Log

## Scope
Added a read/write UI slice for assigning an active package to an eligible client through the existing server-only adapter and `public.assign_client_package(...)` RPC.

## Files Changed
- `apps/web/src/app/client-packages/page.tsx`
- `apps/web/src/features/packages/client-packages/assign-client-package-action.ts`
- `apps/web/src/features/packages/client-packages/assign-client-package-options-loader.ts`
- `apps/web/src/features/packages/client-packages/assign-client-package-sheet.tsx`
- `apps/web/src/features/packages/client-packages/assign-client-package-sheet.stories.tsx`
- `apps/web/src/features/packages/client-packages/assign-client-package-types.ts`
- `apps/web/src/features/packages/client-packages/client-packages-page.tsx`
- `apps/web/src/features/packages/client-packages/client-packages-page.stories.tsx`
- `apps/web/src/lib/packages/server/index.ts`
- `apps/web/src/lib/packages/server/submit-assign-client-package.ts`
- `apps/web/tests/e2e/app-shell.spec.ts`
- `apps/web/tests/unit/packages/assign-client-package-ui.test.ts`
- `docs/PHASE_5G_ASSIGN_PACKAGE_UI_LOG.md`

## UI Behavior
`/client-packages` now shows an `Assign Package` header button. The sheet includes eligible client selector, active package selector, purchase date/time, and a read-only preview for total sessions, starting remaining sessions, and calculated expiry.

Mock mode can preview the form but cannot submit or fake persistence.

## Server Action Behavior
Added a narrow server action path that validates form data, converts purchase date/time to the studio-local timestamp, calls the existing server-only assign package adapter, revalidates `/client-packages` on success, and maps failures to safe UI states.

No route handler or service-role client was added.

## Tests
- Unit coverage for option filtering, form input mapping, mock-mode persistence blocking, safe error mapping, expiry preview, and sensitive-field exclusions.
- Storybook coverage for ready, validation error, unavailable package, permission denied, configuration error, submitting, and success states.
- Playwright coverage for opening/closing the sheet, previewing expiry/session values, mock-mode disabled submit, and absence of payment/clinical/contact/WhatsApp fields.

## Final Checks
| Command | Result |
| --- | --- |
| `corepack pnpm typecheck` | Pass |
| `corepack pnpm lint` | Pass |
| `corepack pnpm test` | Pass |
| `corepack pnpm build` | Pass |
| `corepack pnpm build-storybook` | Pass |
| `corepack pnpm test:e2e` | Pass |

Warnings: the first Playwright attempt timed out waiting for its web server; manual dev-server startup was healthy, and the full rerun passed. Storybook reported existing bundle-size/plugin-timing warnings. Playwright reported existing Node `NO_COLOR`/`FORCE_COLOR` warnings.

## Safety Confirmation
No package deduction, payment, finance ledger, package reversal, package cancellation, package extension, clinical notes, WhatsApp, AI, production services, service-role browser client, cloud Supabase link/push, secrets, or production data were added.

## Stop Point
Phase 5G stops here before package deduction, package lifecycle mutations, payment/finance work, and any production integration.
