# 15 - Code-First UI Strategy Without Figma

## Purpose

This document updates the project strategy. The project no longer assumes that Figma must exist before frontend development starts.

Instead, the frontend will be designed and built directly in code, using the current HOM dashboard screenshots as the visual baseline, then improving the user journey, information architecture, visual hierarchy, and interaction quality.

## Verdict

This strategy is acceptable and practical for a solo developer using Codex, but only if the frontend is built with a strict component system, Storybook, visual regression tests, and clear screen specifications.

Without Figma, the source of truth becomes:

```text
1. /docs UI specifications
2. design tokens in code
3. reusable components
4. Storybook stories
5. screenshot regression tests
6. implemented pages
```

Do not treat AI-generated frontend code as the source of truth by itself.

## Why This Is Reasonable

A Figma-first workflow is useful for teams, stakeholders, and design handoff. But this project is being executed by a solo developer and the current product already has visible UI references from screenshots. A code-first approach can be faster, cheaper, and easier to iterate if the design system is enforced in the repository.

The risk is that the app becomes visually inconsistent. To avoid that, build the design system before building all pages.

## Current HOM Visual Baseline

The current interface has these recognizable visual traits:

```text
- Dark left sidebar
- Minimal off-white dashboard background
- Warm beige/gold accent colors
- Premium clinical studio branding
- Large executive dashboard title treatment
- Card-based analytics sections
- Wide tables for finance and LTV
- Tab navigation across executive modules
- WhatsApp/live-chat operational view
- Human intervention toggle for AI chat
- Approval cards for reimbursements, notes, and blasts
```

The new version should preserve the brand mood, but improve clarity, hierarchy, consistency, responsiveness, accessibility, and error handling.

## New Design Direction

The new UI should feel like:

```text
Premium clinical operations dashboard
not generic SaaS template
not over-animated startup landing page
not consumer fitness app
not medical EMR clutter
```

Target keywords:

```text
calm
precise
premium
clinical-safe
executive
operational
trustworthy
human-controlled AI
```

## Code-First Frontend Rules

### Rule 1 - Build components first

Before building pages, create these components:

```text
AppShell
SidebarNavigation
TopSearchBar
PageHeader
TabNavigation
MetricCard
InsightCard
StatusBadge
DataTable
EmptyState
ErrorState
LoadingSkeleton
ApprovalCard
ChatBubble
HumanInterventionToggle
FileUploadPanel
KnowledgeSourceCard
ProcessingTimeline
ModelPicker
ToolCallCard
```

### Rule 2 - Every page must have four states

Each screen must include:

```text
loading state
empty state
error state
success/data state
```

The previous screenshots often show indefinite `Loading...`. The rebuilt system must avoid that.

### Rule 3 - Use mock data first, API later

Codex should build pages in this order:

```text
1. Static mock layout
2. Storybook story
3. Responsive refinement
4. Accessibility check
5. API contract integration
6. Real data integration
7. Playwright visual snapshot
```

Do not connect API before the UI state model is stable.

### Rule 4 - UI is not allowed to contain business logic

Frontend components may render state, but business rules must live in backend/domain modules.

Bad:

```text
Frontend calculates whether a practitioner can be double-booked.
```

Good:

```text
Frontend calls appointment availability endpoint and displays returned allowed actions.
```

### Rule 5 - Motion must be restrained

Use Motion.dev for:

```text
modal transitions
sidebar collapse
chat message arrival
card entrance
file ingestion timeline
approval card movement
loading transitions
```

Do not use heavy animated backgrounds, exaggerated bounce, or scroll effects on financial/clinical screens.

### Rule 6 - AI UI must expose sources and actions

Every AI-generated business answer should display:

```text
source data period
knowledge version
tool calls used
confidence/risk label
whether the result is read-only or action-required
```

This is especially important for finance, clinical, appointment, and WhatsApp decisions.

## Recommended Frontend Stack

```text
Next.js
React 19
TypeScript strict
Tailwind CSS
shadcn/ui
Radix UI
Motion.dev
Storybook
Playwright
21st Agent Elements for AI/chat interfaces where useful
```

## Figma Later, Not Now

Figma can be added later if:

```text
- the owner wants a brand redesign
- another designer joins
- UIPro/Figma-to-code becomes useful
- marketing website needs more visual experimentation
```

For now, do not block development because Figma is missing.

## Definition of Done for Code-First UI

A screen is not done until:

```text
- it has loading, empty, error, and data states
- it is responsive at desktop/tablet widths
- it uses design tokens, not random colors
- it is represented in Storybook when reusable
- it passes TypeScript checks
- it passes basic Playwright navigation test
- it has no hardcoded production data
- it has no secret keys
- it matches HOM visual direction
```
