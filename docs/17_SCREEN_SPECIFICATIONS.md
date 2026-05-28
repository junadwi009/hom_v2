# 17 - Code-First Screen Specifications

## Purpose

This document turns the current HOM screenshots into actionable screen specifications for Codex. Each screen should be built first with mock data, then connected to API.

## Global Layout

### App Shell

Required elements:

```text
- dark left sidebar
- HOM logo area
- current user card
- sidebar navigation
- top search bar
- help icon
- notification bell
- user menu
- main content area
```

### Visual behavior

```text
- Sidebar can collapse.
- Active nav item uses beige/gold accent.
- Main area uses warm off-white background.
- Cards use white or very light neutral surface.
- Use subtle borders and shadow; avoid heavy gradients.
```

## Screen 1 - Executive Command / Strategic Overview

Route:

```text
/dashboard/executive-command
```

Top sections:

```text
1. Page header
2. Critical attention strip
3. KPI cards
4. Revenue growth chart
5. Practitioner metrics
6. AI intelligence panel
7. Studio utilization
8. Token/cost monitor
```

KPI cards:

```text
Monthly Revenue
Active Clients
Performance Bonus Pool
AI Lead Conversion
Pending Approvals
Open Chat Interventions
```

Required states:

```text
loading: skeleton KPI cards and chart placeholder
empty: no dashboard data for selected period
error: dashboard data failed to load with retry
success: data with period/source labels
```

Important UX change:

The current dashboard shows many metrics. The new dashboard should start with `Attention Required` cards:

```text
- 3 pending WhatsApp blast approvals
- 2 failed reminders
- 1 finance reconciliation issue
- 4 appointments need reschedule confirmation
```

## Screen 2 - Appointments

Route:

```text
/appointments
```

Required modules:

```text
- appointment status filters
- calendar/list toggle
- date navigation
- new appointment button
- search client/session
- appointment cards/table
- conflict warning modal
- reschedule side panel
```

Statuses:

```text
scheduled
confirmed
reschedule_requested
done
cancelled
no_show
```

Important UX change:

Do not show endless `Loading schedule...`. If loading exceeds timeout, show:

```text
Schedule still loading
[Retry] [Open list view] [Report issue]
```

## Screen 3 - Live Chat

Route:

```text
/live-chat
```

Required modules:

```text
- conversation list
- search conversations
- practitioner/client tags
- message thread
- AI draft bubble
- manual intervention toggle
- suggested replies
- action panel for reschedule/booking/FAQ
- WhatsApp blast entry point
```

Safety requirements:

```text
- AI cannot directly reschedule without backend availability check.
- Human takeover stops auto-reply for that conversation.
- Sensitive clinical messages get escalation label.
```

## Screen 4 - Knowledge Studio

Route:

```text
/knowledge-studio
```

Required modules:

```text
- upload panel
- knowledge source list
- processing timeline
- extraction review
- scope selector
- spreadsheet mapping mode
- test lab
- publish/rollback controls
```

Knowledge source statuses:

```text
uploaded
processing
review_required
tested
published
failed
archived
```

## Screen 5 - Behavior Intelligence

Route:

```text
/behavior-intelligence
```

Required modules:

```text
- top intents this week
- unanswered questions
- lead objections
- reschedule reasons
- practitioner demand mentions
- customer segments
- suggested knowledge updates
```

Important UX rule:

Show aggregate trend first. Raw chat examples should only appear after clicking into an insight and only for authorized roles.

## Screen 6 - Financial Strategy

Route:

```text
/financials
```

Required modules:

```text
- year/month filter
- summary cards
- cash flow chart
- therapist commission panel
- studio ledger statement
- operational expense input
- reconciliation warnings
- PDF report export
```

Important UX change:

If summary and ledger disagree, show reconciliation warning. Never silently show Rp 0 if ledger contains data.

## Screen 7 - Approvals & Payroll

Route:

```text
/approvals
```

Required modules:

```text
- pending reimbursement claims
- clinical note unlock requests
- WhatsApp blast clearances
- processed request history
- payroll integration logs
```

Approval card actions:

```text
approve
reject
request more info
open evidence
view audit trail
```

## Screen 8 - Chronic Case Registry

Route:

```text
/clinical-cases
```

Required modules:

```text
- active case cards
- condition label
- assigned practitioner
- session count
- status
- restricted detail view
- audit log on open
```

Safety requirement:

Clinical case details must not be sent to AI unless masked/summarized and explicitly allowed by policy.
