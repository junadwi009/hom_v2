# Phase 1 Implementation Plan

Date: 2026-05-25

## Purpose

Phase 1 is the first real implementation phase after this audit. Its goal is to create the code-first frontend foundation for HOM Studio OS v2.

This phase should build the visual and structural base only. It should not implement real backend features, production service connections, Supabase migrations, AI calls, WhatsApp integration, finance logic, clinical note logic, or worker jobs.

Implementation note: Phase 1 has been implemented. See `docs/PHASE_1_IMPLEMENTATION_LOG.md` for actual commands, versions, checks, and known limitations.

## Phase 1 Scope

Build:

- Monorepo scaffold.
- Next.js app in `apps/web`.
- TypeScript strict setup.
- Tailwind and design tokens.
- shadcn/ui and Radix UI base primitives.
- Motion.dev dependency and reduced-motion pattern.
- App shell.
- Sidebar and topbar.
- Base layout components.
- Auth/session placeholder UI.
- Storybook setup.
- Shared frontend component structure.
- Playwright smoke test setup once routes exist.

Do not build:

- Real Supabase auth.
- Real database tables or migrations.
- Real API mutations.
- Flask.
- FastAPI.
- n8n.
- VPS deployment.
- AI Gateway implementation.
- WhatsApp provider integration.
- Finance, appointment, payroll, approval, or clinical note business workflows.

## Working Assumptions

- Use pnpm workspaces unless the owner chooses another package manager.
- Use `apps/web` as the main Next.js app.
- Use mock data only.
- Use `docs/24_TECH_STACK_LOCKFILE.md` as the final stack authority.
- Use `docs/15_CODE_FIRST_UI_STRATEGY.md`, `docs/17_SCREEN_SPECIFICATIONS.md`, and `docs/18_DESIGN_SYSTEM_WITHOUT_FIGMA.md` as the UI authority.
- Use the reference screenshots for mood and structure, not as pixel-perfect requirements.

## Step-by-Step Plan

### Step 1 - Confirm and Scaffold

Ask for approval to run scaffold commands. After approval:

```powershell
corepack enable
corepack prepare pnpm@latest --activate
pnpm create next-app@latest apps/web --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-pnpm
```

Then create or update root workspace files in small edits:

- root `package.json`
- `pnpm-workspace.yaml`
- root `README` setup notes if needed
- `.gitignore`
- `.env.example`
- `apps/worker/README.md` placeholder
- `packages/ui/README.md`
- `packages/domain/README.md`
- `packages/db/README.md`
- `packages/config/README.md`

### Step 2 - Configure Strict Project Defaults

In `apps/web`:

- Confirm TypeScript strict mode.
- Confirm path aliases.
- Confirm lint command.
- Add or document format command.
- Keep environment variables as placeholders only.

Root scripts should eventually provide:

```text
typecheck
lint
test
build
storybook
playwright
```

During this phase, placeholder scripts are acceptable if a tool is not ready yet, but the limitation must be documented.

### Step 3 - Add UI Dependencies

After scaffold approval, add only Phase 1 UI dependencies:

```powershell
pnpm --dir apps/web dlx shadcn@latest init
pnpm --dir apps/web add @radix-ui/react-slot class-variance-authority clsx tailwind-merge lucide-react motion
```

Use shadcn/ui with CSS variables. Avoid adding optional AI UI libraries until there is a specific need.

### Step 4 - Create Design Tokens

Create semantic tokens for:

- App background.
- Sidebar background.
- Card surface.
- Primary foreground.
- Muted foreground.
- Gold accent.
- Muted green success.
- Amber warning.
- Soft red danger.
- Info state.
- Subtle borders.
- Shadows.
- Radius.
- Typography roles.
- Motion timing.
- Chart colors.

Rules:

- Feature components must use tokens, not random colors.
- The UI should feel calm, premium, clinical-safe, and operational.
- Avoid heavy gradients, decorative backgrounds, and over-animation.

### Step 5 - Create Frontend Folder Structure

Use a simple structure that can grow:

```text
apps/web/
  app/
    layout.tsx
    page.tsx
    dashboard/
    appointments/
    live-chat/
    clients/
    financials/
    knowledge-studio/
    behavior-intelligence/
    approvals/
    settings/
  components/
    ui/
    hom/
    layout/
    feedback/
  features/
    shell/
    auth-placeholder/
    executive-command/
  lib/
    mock-data/
    routes/
    utils/
  stories/
```

Keep business logic out of these UI components.

### Step 6 - Build the App Shell

Create:

- `AppShell`
- `SidebarNavigation`
- `Topbar`
- `PageContainer`
- `PageHeader`
- User card placeholder.
- Notification/help/user menu placeholders.
- Main content area.

Navigation should include the operational modules directly:

- Overview
- Appointments
- Clients
- Live Chat
- Knowledge Studio
- Behavior Intelligence
- Financials
- AI Business Agent
- Approvals
- Settings

Executive Command tabs can be represented as a top navigation pattern:

- Strategic Overview
- Chronic Case Registry
- Team Attendance
- Financial Strategy
- Client LTV & Milestones
- User Management
- Approvals & Payroll

### Step 7 - Add Auth Placeholder

Create a clear placeholder that shows the future auth shape without connecting Supabase:

- current user display
- role badge
- permission-denied state component
- sign-in placeholder screen if needed

Do not implement real login, sessions, cookies, Supabase clients, or RLS in Phase 1.

### Step 8 - Build Core Shared Components

Create reusable HOM components:

- `MetricCard`
- `DashboardCard`
- `StatusBadge`
- `DataTable`
- `EmptyState`
- `ErrorState`
- `LoadingSkeleton`
- `PermissionDeniedState`
- `FilterBar`
- `PageHeader`
- `AppShell`

Each component should support long text and predictable sizing.

### Step 9 - Add Mock Routes

Add simple mock routes to exercise the shell:

- `/`
- `/dashboard/executive-command`
- `/appointments`
- `/live-chat`
- `/clients`
- `/financials`
- `/knowledge-studio`
- `/behavior-intelligence`
- `/approvals`
- `/settings`

These routes should use mock data and clearly show layout patterns. They should not call real APIs.

### Step 10 - Add Storybook

Install and configure Storybook:

```powershell
pnpm --dir apps/web dlx storybook@latest init
```

Add stories for reusable components:

- default
- loading
- empty
- error
- long text
- narrow container
- permission denied where relevant

Storybook becomes the code-first design catalog because there is no Figma source of truth.

### Step 11 - Add Playwright Smoke Tests

Install Playwright after the app can run:

```powershell
pnpm --dir apps/web dlx playwright@latest install chromium
```

Add smoke tests for:

- homepage loads
- app shell renders
- sidebar navigation exists
- executive command route loads
- appointments route loads
- live chat route loads

No authenticated backend flow is required in Phase 1.

### Step 12 - Verification

Run the available checks:

```powershell
pnpm --dir apps/web typecheck
pnpm --dir apps/web lint
pnpm --dir apps/web build
pnpm --dir apps/web storybook
pnpm --dir apps/web test:e2e
```

Exact script names may differ after scaffold. Update this document and `CONTRIBUTING.md` with the actual commands.

## Acceptance Criteria

Phase 1 is complete when:

- The Next.js app runs locally.
- TypeScript strict mode is enabled.
- Tailwind tokens exist and are used by shell/components.
- App shell has dark sidebar, topbar, and main workspace.
- Auth placeholder exists but no real auth is connected.
- Reusable components exist for loading, empty, error, status, cards, and tables.
- Storybook displays core components.
- Playwright smoke tests cover the main shell routes.
- No real backend mutations exist.
- No production services are connected.
- No Flask, FastAPI, n8n, or VPS work was added.
- All changes are documented in beginner-friendly language.

## Review Checklist

Before moving to Phase 2:

- Does every shared component have a clear purpose?
- Are colors and spacing coming from tokens?
- Does the layout work at desktop and tablet widths?
- Are loading, empty, error, and success-ready states visible?
- Are mock data files separated from UI components?
- Are there any direct AI, Supabase, WhatsApp, finance, appointment, payroll, or clinical mutations? There should be none.
- Can a beginner run the app using documented commands?

## Phase 2 Boundary Reminder

Phase 2 should not begin until Phase 1 is reviewed. Phase 2 can then decide how to introduce Supabase, RBAC, domain modules, migrations, and the first operational data models.
