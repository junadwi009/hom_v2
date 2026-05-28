# 19 - Code-First UI Codex Prompts

## Purpose

Use these prompts after the foundation docs are in the repo. Do not run them all at once. Paste one prompt at a time into Codex.

## Prompt UI-01 - Create Design Tokens and App Shell

```text
You are working on HOM Studio OS v2.

Task:
Create the code-first design foundation and app shell.

Read:
- docs/15_CODE_FIRST_UI_STRATEGY.md
- docs/17_SCREEN_SPECIFICATIONS.md
- docs/18_DESIGN_SYSTEM_WITHOUT_FIGMA.md

Implement:
1. Tailwind/CSS variables for HOM visual tokens.
2. AppShell with dark sidebar, top search, notification area, user menu placeholder, and main content area.
3. SidebarNavigation with active state.
4. PageHeader component.
5. LoadingSkeleton, EmptyState, ErrorState components.
6. Storybook stories if Storybook already exists; otherwise create component examples in a local demo route.

Rules:
- Do not connect real APIs yet.
- Use mock data only.
- Do not add paid services.
- Keep commits small.
- Ensure TypeScript passes.
```

## Prompt UI-02 - Build Executive Command Mock Page

```text
Task:
Build the Executive Command strategic overview page using mock data.

Read:
- docs/16_USER_JOURNEY_MAPS.md
- docs/17_SCREEN_SPECIFICATIONS.md
- docs/18_DESIGN_SYSTEM_WITHOUT_FIGMA.md

Implement:
1. Route /dashboard/executive-command.
2. Attention Required section.
3. KPI cards.
4. Revenue growth panel.
5. Practitioner metrics panel.
6. Studio utilization card.
7. AI cost/token monitor card.
8. Loading, empty, error, and success states.

Rules:
- Keep the visual style close to current HOM: premium, calm, off-white, dark sidebar, gold accent.
- Do not over-animate.
- Do not connect database yet.
```

## Prompt UI-03 - Build Appointments Mock Page

```text
Task:
Build the Appointments page using mock data and strong UX states.

Implement:
1. Route /appointments.
2. Status filters: All, Scheduled, Done, Reschedule, Cancelled, No-show.
3. Calendar/List toggle.
4. Date navigation.
5. New Appointment button.
6. Appointment cards/table.
7. Reschedule side panel mock.
8. Conflict warning mock.
9. Loading timeout fallback UI.

Rules:
- No backend integration yet.
- Focus on workflow clarity.
- Show clear empty and error states.
```

## Prompt UI-04 - Build Live Chat and AI Handoff Mock Page

```text
Task:
Build the Live Chat operations page.

Implement:
1. Route /live-chat.
2. Conversation list with tags.
3. Message thread.
4. AI draft response bubble.
5. Manual intervention toggle.
6. Suggested replies panel.
7. Action panel for reschedule request.
8. Safety labels for sensitive clinical/refund messages.

Rules:
- AI must appear as draft/human-controlled in mock.
- Do not send real WhatsApp messages.
- Use 21st Agent Elements only if it fits the stack and does not add unstable dependencies.
```

## Prompt UI-05 - Build Knowledge Studio Mock Page

```text
Task:
Build the Knowledge Studio UI for owner-adjustable AI knowledge.

Implement:
1. Route /knowledge-studio.
2. File upload panel for PDF, DOCX, XLSX, CSV, image.
3. Knowledge source list.
4. Processing timeline.
5. Extraction review panel.
6. Scope selector.
7. Spreadsheet mapping mock.
8. Test Lab mock.
9. Publish/Rollback controls.

Rules:
- No actual file parsing yet.
- UI must make it obvious that uploaded knowledge is not active until published.
```

## Prompt UI-06 - Build Behavior Intelligence Mock Page

```text
Task:
Build the Behavior Intelligence dashboard.

Implement:
1. Route /behavior-intelligence.
2. Top intents chart/list.
3. Unanswered questions list.
4. Lead objections.
5. Reschedule reason summary.
6. Practitioner demand mentions.
7. Suggested knowledge updates.
8. Permission-safe sample conversation drawer.

Rules:
- Use aggregate insights first.
- Do not expose raw chat by default.
```

## Prompt UI-07 - Add Motion Pass

```text
Task:
Add restrained Motion.dev animations to completed mock screens.

Implement:
1. Card entrance animation.
2. Sidebar collapse transition.
3. Chat message arrival animation.
4. Modal/side-panel transition.
5. File processing timeline animation.
6. Reduced-motion support.

Rules:
- Keep finance/clinical screens calm.
- No parallax or distracting effects.
- Do not animate critical numbers in a way that reduces readability.
```

## Prompt UI-08 - Add Visual Quality Gates

```text
Task:
Add frontend quality checks.

Implement:
1. Playwright smoke test for main routes.
2. Basic screenshot tests for key pages if project setup supports it.
3. Accessibility checks for navigation, buttons, and forms.
4. Lighthouse CI placeholder or script if appropriate.
5. README instructions for running UI checks.

Rules:
- Keep setup simple.
- Do not block development with overly complex CI.
```
