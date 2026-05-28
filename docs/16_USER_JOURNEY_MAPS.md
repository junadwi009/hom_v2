# 16 - User Journey Maps and Information Architecture

## Purpose

This document defines the user journeys before Codex builds the screens. A code-first build is acceptable only if the user journey is explicit.

## Primary Users

```text
Studio Director / Business Owner
Front Desk / Admin
Practitioner
Finance Admin
Marketing / AI Operator
AI Service Account
```

## Journey 1 - Studio Director Daily Command

### User goal

The Studio Director wants to know what requires attention today: revenue, appointments, practitioner status, unresolved chat, pending approvals, and AI insights.

### Entry point

`/dashboard/executive-command`

### Flow

```text
Open dashboard
  -> See today's risk and opportunity summary
  -> Review revenue/client/utilization KPIs
  -> Review pending approvals
  -> Review AI insights
  -> Drill down into financial, LTV, appointment, or chat modules
  -> Approve, reject, or delegate action
```

### UI implications

```text
- Dashboard should not show every metric at once.
- Top section should answer: What needs attention now?
- Use alert/risk cards before vanity metrics.
- Every KPI should have period label and source status.
- AI insight must show whether it is based on live data or cached summary.
```

### Success criteria

```text
Director can understand studio health within 60 seconds.
Director can reach any critical pending approval within 2 clicks.
Director is not forced to ask AI just to see basic KPIs.
```

## Journey 2 - Front Desk Appointment Operation

### User goal

Admin wants to create, reschedule, cancel, and check appointment status quickly while avoiding double booking and wrong practitioner assignment.

### Entry point

`/appointments`

### Flow

```text
Search client
  -> Open client context
  -> Create or reschedule appointment
  -> Select service, practitioner, date, time
  -> Backend checks availability and conflicts
  -> Admin confirms
  -> System sends WhatsApp confirmation or queues message
  -> Appointment history is updated
```

### UI implications

```text
- Appointment screen should be operational, not decorative.
- Calendar and list view must both exist.
- Reschedule flow must show previous and new schedule.
- System must clearly show whether WhatsApp confirmation was sent, queued, or failed.
- If schedule is loading too long, show retry and fallback list view.
```

### Success criteria

```text
Admin can create appointment in under 90 seconds.
Admin can reschedule without losing history.
Admin sees conflict explanation, not just generic error.
```

## Journey 3 - Practitioner Clinical Session

### User goal

Practitioner wants to see today's sessions, understand client context, write session notes, and lock notes after completion.

### Entry point

`/practitioner/today` or `/sessions/:id`

### Flow

```text
Open daily schedule
  -> Select next client
  -> Review condition summary and recent notes
  -> Conduct session
  -> Write session note
  -> Mark appointment done
  -> Lock note
  -> Suggest next session or follow-up
```

### UI implications

```text
- Clinical condition data must be concise and permission-controlled.
- Do not overload practitioner with finance details.
- Session note editor needs autosave and locked state.
- Unlock request should require reason.
```

### Success criteria

```text
Practitioner can understand client context within 30 seconds.
Finalized notes cannot be silently edited.
Sensitive case views are audit logged.
```

## Journey 4 - Finance Monthly Close

### User goal

Finance/Admin wants to reconcile revenue, expenses, commission, reimbursement, and export a report.

### Entry point

`/financials`

### Flow

```text
Choose month/year
  -> Review monthly summary cards
  -> Review ledger rows
  -> Add/edit operational expenses
  -> Review practitioner commissions
  -> Reconcile inconsistencies
  -> Generate PDF report
  -> Export and archive report
```

### UI implications

```text
- Summary cards and ledger must use same period filter.
- If data is missing, show missing-data status, not Rp 0 as fake truth.
- Every financial row must show category and source.
- Report generation should be async when slow.
```

### Success criteria

```text
Finance view never shows inconsistent period data.
Director can identify why a number changed.
PDF report is reproducible from stored data snapshot.
```

## Journey 5 - Owner Updates AI Knowledge

### User goal

Business owner wants to upload new pricing/SOP/FAQ/PDF/XLSX and adjust how the AI answers without editing code.

### Entry point

`/knowledge-studio`

### Flow

```text
Upload file
  -> System extracts text/table/image information
  -> Owner reviews extracted knowledge
  -> Owner assigns scope
  -> Owner runs test questions
  -> System reports pass/fail, source usage, risk
  -> Owner publishes or rejects
  -> Previous version remains rollbackable
```

### UI implications

```text
- Never auto-publish uploaded knowledge.
- Make extraction review easy for non-technical users.
- For spreadsheets, show sheet/column mapping.
- Show affected agents before publishing.
```

### Success criteria

```text
Owner can update FAQ/pricing without developer help.
AI answer sources are visible.
Knowledge update can be rolled back.
```

## Journey 6 - Behavior Learning From Chat

### User goal

Owner wants to understand customer behavior from WhatsApp conversations without manually reading every chat.

### Entry point

`/behavior-intelligence`

### Flow

```text
System processes conversations
  -> Extracts intent, topic, objection, sentiment, schedule preference
  -> Aggregates weekly insights
  -> Detects unanswered questions
  -> Suggests knowledge updates or campaign segments
  -> Owner approves changes
  -> Knowledge Studio publishes update if needed
```

### UI implications

```text
- Do not show raw private chats as the first view.
- Show aggregate insight first.
- Provide sample conversations only when user has permission.
- Every AI-generated insight should have evidence count.
```

### Success criteria

```text
Owner can see top customer questions each week.
Owner can detect FAQ gaps.
Owner approves improvements before AI behavior changes.
```

## Information Architecture

Primary navigation:

```text
Overview
Appointments
Clients
Live Chat
Knowledge Studio
Behavior Intelligence
Financials
AI Business Agent
Approvals
Settings
```

Executive Command tabs:

```text
Strategic Overview
Chronic Case Registry
Team Attendance
Financial Strategy
Client LTV & Milestones
User Management
Approvals & Payroll
```

Recommended change:

Keep the Executive Command tabs, but do not hide operational modules only inside it. Appointment, Chat, Clients, and Knowledge Studio should be direct sidebar items.
