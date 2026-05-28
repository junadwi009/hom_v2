# Codex Prompt — Phase 1 Code-First UI Foundation

Implement only Phase 1.

Goal: build the visual and structural foundation of HOM Studio OS v2 using a code-first design system based on the existing HOM screenshots and final design strategy.

Read:
- `docs/08_FRONTEND_UI_UX_GUIDE.md`
- `docs/15_CODE_FIRST_UI_STRATEGY.md`
- `docs/17_SCREEN_SPECIFICATIONS.md`
- `docs/18_DESIGN_SYSTEM_WITHOUT_FIGMA.md`
- `docs/19_CODE_FIRST_UI_CODEX_PROMPTS.md`
- `reference_screenshots/`

Tasks:

1. Build app shell with dark sidebar and light workspace.
2. Add sidebar navigation items:
   - Overview
   - Financials
   - AI Business Agent
   - Live Chat
   - Appointments
   - Clients
   - Settings
3. Add Executive Command top navigation:
   - Strategic Overview
   - Chronic Case Registry
   - Team Attendance
   - Financial Strategy
   - Client LTV & Milestones
   - User Management
   - Approvals & Payroll
4. Create reusable UI components:
   - KPI card
   - metric card
   - dashboard card
   - data table
   - status badge
   - empty state
   - loading skeleton
   - error state
   - page header
   - filter bar
5. Use mock data only.
6. Add subtle Motion.dev animations only after layout is stable.
7. Do not connect API yet.
8. Do not implement AI yet.

Constraints:

- UI must feel premium, calm, and clinical/executive.
- Avoid over-animation.
- No hardcoded production secrets.
- No backend mutations.
- Every screen needs loading, empty, error, and success-ready patterns.

Return summary, changed files, checks run, and next step.
