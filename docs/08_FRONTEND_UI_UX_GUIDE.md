# 08 - Frontend UI/UX Guide

## 1. Goal

Create a premium, calm, trustworthy dashboard for a clinical studio. The UI should feel modern but not playful. Finance, clinical cases, and payroll screens must feel serious and readable.

## 2. Recommended Stack

```text
Next.js
React 19
TypeScript
Tailwind CSS
shadcn/ui
Radix UI
Motion.dev
21st.dev Agent Elements or equivalent
Storybook
Playwright
Lighthouse CI
```

## 3. Motion.dev Usage

Use Motion.dev for subtle polish:

- Page transitions
- Card entrance
- Modal open/close
- Chat message arrival
- File upload progress
- Approval status movement
- Loading states

Do not over-animate finance and clinical screens.

Motion presets:

```text
critical screens: 120-180ms, fade only
normal dashboard cards: 180-250ms, fade + small y offset
chat/AI: 200-300ms, soft slide
empty states: can be slightly more expressive
```

Always support reduced motion.

## 4. UIPro Usage

UIPro is useful only after the Figma file is clean.

Before using UIPro:

- Use Auto Layout.
- Name layers clearly.
- Create variants for buttons/cards/tables.
- Use consistent spacing.
- Use design tokens.
- Define responsive behavior.

After UIPro generates code:

1. Do not commit blindly.
2. Refactor into reusable components.
3. Replace hardcoded values with tokens.
4. Add TypeScript props.
5. Add Storybook story.
6. Add loading/empty/error states.

## 5. 21st.dev Usage

Use 21st.dev for inspiration and AI UI components.

Good use cases:

- AI Business Agent chat
- Knowledge Studio test lab
- File attachment UI
- Tool cards
- Model picker
- Command palette
- Empty states
- Approval cards

Treat generated/community code as external code. Review dependencies and security before use.

## 6. Design System

### Colors

Use calm premium palette:

```text
background: warm off-white / beige
sidebar: dark brown / charcoal
primary: muted gold or warm tan
success: calm green
warning: amber
error: muted red
text: dark neutral
```

### Typography

- Headings: clear and calm.
- Tables: readable at small sizes.
- Finance numbers: tabular numeric style if possible.

### Spacing

Use consistent spacing scale:

```text
4, 8, 12, 16, 24, 32, 48
```

### Radius and Shadows

- Cards: medium-large radius.
- Shadows: soft, not heavy.
- Tables: minimal borders, clear row hover.

## 7. Main Pages

### 7.1 Dashboard Layout

Required:

- Sidebar
- Top bar
- Page title
- Breadcrumb optional
- Global search optional
- User menu
- Content grid

### 7.2 Strategic Overview

Cards:

- Monthly revenue
- Active clients
- Practitioner utilization
- AI lead conversion
- Performance bonus pool
- AI cost

Charts:

- Revenue trend
- Client count trend
- Practitioner performance
- Studio utilization

### 7.3 Appointments

Views:

- Calendar
- Table
- Practitioner filter
- Status filter
- New appointment modal
- Reschedule modal

States:

- Loading calendar
- Empty day
- API error
- Conflict error

### 7.4 Live Chat

Layout:

- Conversation list
- Message thread
- Client context side panel
- AI draft box
- Manual intervention toggle

### 7.5 Knowledge Studio

Sections:

- Upload files
- Sources table
- Extraction review
- Spreadsheet mapping
- Test lab
- Publish/rollback

### 7.6 Finance

Sections:

- Period picker
- Summary cards
- Ledger table
- Expenses
- Commission
- Reimbursements
- PDF export

Rule: finance summary must never show fake zero if loading failed.

### 7.7 Clinical Cases

Sections:

- Restricted access banner
- Case list
- Client summary
- Assigned practitioner
- Status
- Session count

### 7.8 Approvals

Kanban or table:

- Reimbursements
- Note unlock requests
- WhatsApp blast approvals
- Processed history

## 8. Component Library

Suggested components:

```text
KpiCard
RevenueChart
PractitionerMetricCard
AppointmentCalendar
AppointmentStatusBadge
ClientProfileCard
ClinicalRiskBadge
FinanceLedgerTable
ApprovalRequestCard
ChatConversationList
ChatMessageBubble
AIDraftPanel
KnowledgeSourceCard
FileUploadDropzone
ProcessingTimeline
TestLabResult
AuditLogTable
```

## 9. Accessibility Checklist

Every screen must support:

- Keyboard navigation.
- Visible focus state.
- Proper labels for forms.
- Sufficient color contrast.
- No meaning by color alone.
- Reduced motion.
- Readable error messages.

## 10. Frontend Quality Gate

Before merge:

- TypeScript passes.
- Lint passes.
- Storybook renders components.
- Playwright smoke test passes.
- Lighthouse performance not worse than threshold.
- No hardcoded fake data in final screens.
- Loading/empty/error states exist.

---

# Revision - Code-First UI Strategy

The project no longer requires Figma before frontend development. Follow `15_CODE_FIRST_UI_STRATEGY.md`, `16_USER_JOURNEY_MAPS.md`, `17_SCREEN_SPECIFICATIONS.md`, and `18_DESIGN_SYSTEM_WITHOUT_FIGMA.md`. Build the UI in code from reusable components, Storybook, mock states, and visual regression checks. UIPro/Figma is optional later, not a blocker for MVP.

