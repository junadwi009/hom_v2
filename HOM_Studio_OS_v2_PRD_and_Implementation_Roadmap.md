---
title: "HOM Studio OS v2: PRD and Implementation Roadmap"
subtitle: "Clinical Studio Operating System with AI Knowledge Studio"
author: "Prepared for Arjuna"
date: "2026-05-25"
toc: true
toc-depth: 3
numbersections: true
geometry: margin=0.75in
fontsize: 10pt
mainfont: DejaVu Sans
monofont: DejaVu Sans Mono
colorlinks: true
linkcolor: blue
urlcolor: blue
---

# Executive Summary

HOM Studio OS v2 is a rebuild plan for a clinical pilates/physio studio operating system. The existing super admin screenshots show a system that is already more than a booking platform: it includes executive dashboard, financials, AI Business Agent, WhatsApp live chat, appointments, clients, chronic case registry, team attendance, user management, approvals, and payroll-related workflow.

The correct rebuild strategy is not a generic Fit Hub clone. It should be a clinical studio operating system with controlled AI assistance, owner-editable knowledge, behavior intelligence, audited finance, and human-in-the-loop governance.

The recommended architecture is:

```text
AI-native Modular Monolith
+ Selective Hexagonal Architecture
+ Code-first Worker/Queue
+ Multi-LLM Gateway
+ RAG Knowledge Layer
+ Human-in-the-loop Governance
```

The recommended initial infrastructure is:

```text
Vercel: frontend
Render: backend API
Render: worker
Render Key Value or Postgres-backed queue: queue/cache
Supabase: database, auth, storage, pgvector
```

# How to Use This Document

This PDF is the strategic and operational guide. The companion Markdown files are Codex-ready execution documents. Use the Markdown files as the working source in your repo.

Start with:

1. `00_MASTER_CONTEXT_FOR_CODEX.md`
2. `01_PRD.md`
3. `02_SYSTEM_BLUEPRINT.md`
4. `12_STEP_BY_STEP_EXECUTION_PLAN.md`
5. `13_CODEX_TASK_PROMPTS.md`

Do not paste all prompts into Codex at once. Execute one prompt, review diff, test, then commit.

## Beginner Glossary

- PRD: Product Requirements Document. A document that explains what the product must do, who uses it, and how success is measured.
- Blueprint: A technical map of the system: modules, data, integrations, and flows.
- Frontend: The screen/dashboard that users see.
- Backend: The server logic that validates data, runs rules, and connects to database and external services.
- Database: The source of truth where data is stored.
- Worker: A background process for slow jobs such as sending reminders, parsing PDFs, or creating embeddings.
- Queue: A waiting line for background jobs.
- RAG: Retrieval-Augmented Generation. The AI answers using approved internal knowledge instead of guessing.
- Embedding: A numeric representation of text used for semantic search.
- RBAC: Role-Based Access Control. Permissions based on roles such as Studio Director, Admin, Practitioner, Finance, and Marketing.
- RLS: Row-Level Security. Database-level policy that controls which rows a user can access.
- Audit log: A permanent record of sensitive actions, such as editing finance data or opening clinical case data.
- Hexagonal architecture: A pattern that separates business logic from external tools like WhatsApp, payment gateway, OpenAI, or Supabase.
- Modular monolith: One deployable app split into clean internal modules.
- Strangler migration: Rebuilding a system gradually instead of replacing everything at once.

# Current System Audit

## What Already Exists Based on Screenshots

The current internal system appears to contain:

- Strategic Overview dashboard.
- Monthly revenue and active client metrics.
- Practitioner performance and utilization metrics.
- AI lead conversion and token/cost visibility.
- Executive AI Business Agent with Supabase data integration.
- Financial strategy dashboard with ledger and report export.
- Client LTV and milestone dashboard.
- Chronic Case Registry.
- Team Attendance.
- Live Chat with AI agent and manual intervention.
- Appointments.
- Practitioner account management.
- Approvals and payroll workspace.

## Strengths

1. The system is already business-specific, not generic.
2. AI is tied to business operations, not only chatbot gimmick.
3. The dashboard shows executive-level metrics.
4. There is evidence of approval workflow.
5. Client LTV and chronic cases create a strong vertical advantage.

## Red Flags

1. Financial summary and ledger values must be reconciled carefully.
2. Some screens show loading states that may hide API errors or empty data.
3. Appointment core must be verified because it is the operational foundation.
4. AI appears connected to sensitive data, so governance must be strict.
5. User permissions need to be more granular than basic roles.

# Product Requirements

# 01 - Product Requirements Document

# HOM Studio OS v2

Generated: 2026-05-25

## 1. Product Summary

HOM Studio OS v2 is an internal operating system for a clinical pilates/physio studio. It helps the studio manage appointments, clients, practitioners, chronic cases, session notes, finance, payroll-related approvals, WhatsApp communication, AI-assisted business analysis, and knowledge management.

The product is not a generic fitness booking app. It is closer to a vertical operating system for a premium clinical wellness studio.

## 2. Product Vision

Create one trusted platform where the business owner, admin, practitioners, finance, and marketing team can operate the studio without scattered spreadsheets, manual WhatsApp tracking, unclear financial summaries, or uncontrolled AI behavior.

## 3. Main Problems

### Problem 1 - Operational Data Is Spread Out

Appointments, WhatsApp messages, finance, commissions, client lifetime value, practitioner attendance, and clinical case data can easily become disconnected.

### Problem 2 - Finance Needs One Source of Truth

Financial dashboards must never show conflicting totals. If a strategic dashboard and finance ledger show different numbers for the same period, the owner cannot trust the system.

### Problem 3 - AI Must Be Useful but Controlled

The current idea includes AI, multi-LLM usage, and chatbot intelligence. That can improve productivity, but it is dangerous if AI can diagnose, approve payroll, change finance, or send campaigns without approval.

### Problem 4 - Clinical Context Requires More Care Than Fitness Booking

Clinical cases can include chronic pain, post-surgery rehab, scoliosis, osteoarthritis, postnatal recovery, or other sensitive conditions. The system must protect this data and avoid AI overreach.

### Problem 5 - Owner Needs No-Code Knowledge Control

The business owner should be able to upload PDF, DOCX, XLSX, image, SOP, pricing, and campaign documents, review extracted knowledge, test AI answers, publish changes, and rollback if needed.

## 4. Target Users

| User Type | What They Need |
|---|---|
| Studio Director / Owner | Executive dashboard, finance, approvals, AI business insights, knowledge control |
| Admin / Front Desk | Appointment creation, reschedule, WhatsApp inbox, client support |
| Practitioner | Daily schedule, client context, chronic case summary, session notes |
| Finance Admin | Ledger, expenses, commissions, reimbursements, reports |
| Marketing Admin | WhatsApp blast drafts, segment insights, campaign approvals |
| AI Agent Service | Read-only tools, intent classification, drafting, summarization, behavior extraction |

## 5. Product Goals

1. Make the studio operation easier to run daily.
2. Make finance calculations consistent and auditable.
3. Give the owner a trusted dashboard for decisions.
4. Make AI helpful but bounded by rules and approvals.
5. Let owner update AI knowledge without coding.
6. Learn customer behavior from chat interactions safely.
7. Keep architecture simple enough for a solo developer.
8. Keep deployment cost reasonable while allowing growth.

## 6. Non-Goals

The first rebuild should not include:

- Public marketplace for multiple studios.
- Native iOS/Android app.
- Full legal-grade medical record system.
- AI diagnosis.
- Autonomous refund, payroll approval, or clinical note editing.
- Microservices.
- Full accounting replacement.
- Full ERP.
- n8n as the core brain.

## 7. MVP Feature Scope

### Phase 1 - Foundation

- Auth
- Role and permission system
- User management
- Client management
- Practitioner management
- Service catalog
- Appointment core
- Audit logs
- Base dashboard layout

### Phase 2 - Clinical Operations

- Chronic case registry
- Practitioner assignment
- Session notes
- Note lock/unlock workflow
- Clinical access audit

### Phase 3 - Finance

- Revenue ledger
- Expenses
- COGS
- Gross profit
- Operating expense
- Net profit
- Practitioner commission
- Reimbursement request
- PDF report export

### Phase 4 - Communication

- WhatsApp inbox
- Manual intervention
- AI draft reply
- Message tagging
- Reminder jobs
- Blast approval workflow

### Phase 5 - Knowledge Studio

- Upload PDF/DOCX/XLSX/image
- Extract content
- Owner review
- Knowledge scope assignment
- Chunking and embedding
- AI test lab
- Publish and rollback

### Phase 6 - Behavior Intelligence

- Intent extraction from chat
- Topic clustering
- Customer behavior profile
- Unanswered question detection
- Campaign segment suggestion
- Knowledge update suggestions

### Phase 7 - Executive Intelligence

- Strategic dashboard
- Client LTV leaderboard
- Milestone tiers
- Practitioner productivity
- AI cost dashboard
- Read-only AI Business Agent

## 8. Functional Requirements

### 8.1 Appointment Module

Must support:

- Create appointment.
- Reschedule appointment.
- Cancel appointment.
- Mark done.
- Mark no-show.
- Assign practitioner.
- Assign service type.
- Link appointment to client.
- Link appointment to package/payment when available.
- Store status history.
- Prevent overlapping appointment for the same practitioner.

Acceptance criteria:

- The same practitioner cannot have two appointments at the same time.
- Every reschedule stores old and new time.
- Every cancel stores reason and actor.
- Appointment changes create audit logs.

### 8.2 Clinical Case Registry

Must support:

- Client condition label.
- Status: active, monitoring, resolved, archived.
- Assigned practitioner.
- Severity or priority flag.
- Session count.
- Case summary.
- Restricted access by permission.

Acceptance criteria:

- Only permitted roles can view clinical cases.
- Every access to a clinical case is logged.
- AI cannot access raw clinical notes by default.

### 8.3 Session Notes

Must support:

- Draft note.
- Finalize note.
- Lock after finalization.
- Unlock request.
- Approve/reject unlock.
- Edit history.

Acceptance criteria:

- A finalized note cannot be edited directly.
- Unlock request needs reason.
- Approval action must be auditable.

### 8.4 Finance

Must support:

- Revenue entries.
- Expense entries.
- COGS classification.
- Operating expense classification.
- Commission calculation.
- Reimbursement claims.
- Monthly summary.
- PDF report export.

Acceptance criteria:

- Dashboard summary and ledger use the same period filter.
- No fake zero values if data failed to load.
- Every finance change is logged.

### 8.5 WhatsApp Inbox

Must support:

- Conversation list.
- Client linkage.
- AI draft reply.
- Human takeover.
- Conversation tags.
- Message status.
- Suggested action.

Acceptance criteria:

- AI cannot confirm reschedule without backend slot check.
- AI cannot diagnose.
- AI cannot promise refund.
- Human takeover disables auto-reply for that conversation.

### 8.6 Knowledge Studio

Must support:

- File upload.
- Document extraction.
- Spreadsheet mapping.
- Image/document OCR or description where appropriate.
- Owner review.
- Knowledge scope.
- Test lab.
- Publish/rollback.

Acceptance criteria:

- Uploaded knowledge is not active until published.
- Every answer in test lab shows source chunks.
- Owner can rollback to previous version.
- XLSX files are mapped structurally, not only chunked as text.

### 8.7 AI Business Agent

Must support:

- Read-only finance queries.
- Read-only LTV queries.
- Read-only commission summaries.
- Source-cited answers from internal data.
- Cost/token logs.
- Prompt/version tracking.

Acceptance criteria:

- AI Business Agent cannot mutate data in MVP.
- Every AI answer is logged with model, prompt version, and data sources.
- AI response must mention period/context if financial.

## 9. Non-Functional Requirements

### Performance Targets

| Area | MVP Target |
|---|---|
| Dashboard initial load | Under 3 seconds for normal data volume |
| Appointment create/update | p95 under 700 ms excluding network spikes |
| WhatsApp webhook handling | acknowledge quickly and process async |
| AI draft reply | under 8-15 seconds, fallback if timeout |
| Document ingestion | async; small documents under 5 minutes |
| Queue delay | under 10 seconds in normal operation |

### Security Requirements

- RBAC in backend.
- RLS in Supabase for sensitive data.
- Service role only server-side.
- Audit log for sensitive reads/writes.
- PII masking before AI calls.
- No hardcoded secrets.
- Environment variables for all provider keys.

### Reliability Requirements

- Idempotent webhook handlers.
- Retry failed jobs.
- Dead-letter queue for failed jobs.
- Clear error states.
- Daily backups in production tier.

## 10. Success Metrics

| Metric | Why It Matters |
|---|---|
| Appointment error rate | Core operational reliability |
| No-show rate | Business efficiency |
| Rebooking rate | Retention |
| Package renewal rate | Revenue health |
| LTV per client | Long-term business value |
| Practitioner utilization | Team productivity |
| AI cost per resolved conversation | AI efficiency |
| AI escalation rate | Safety and accuracy indicator |
| Financial report discrepancy count | Trust in dashboard |
| Knowledge test pass rate | AI answer quality |

## 11. Major Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Big-bang rewrite breaks operations | High | Use phased migration |
| Finance calculations inconsistent | High | Single finance service, tests, audit logs |
| AI exposes sensitive data | High | Scope control, masking, logging |
| n8n logic becomes hidden dependency | Medium | Move core automation into code-first worker |
| UI looks good but data model weak | High | Build core schema first |
| Document ingestion poor quality | Medium | Owner review before publish |
| Multi-LLM increases cost | Medium | Model gateway, cost dashboard |

## 12. Out of Scope Until Later

- Public mobile member app.
- Multi-branch accounting consolidation.
- Insurance/medical billing.
- Full HR payroll and tax.
- Automatic treatment recommendation.
- Real-time movement analysis from video.


# System Blueprint

# 02 - System Blueprint

## 1. High-Level Architecture

```text
Business Owner / Admin / Practitioner
        ↓
Web Dashboard - Next.js / React
        ↓
Backend API / BFF
        ↓
Application Use Cases
        ↓
Domain Modules
        ↓
Ports / Interfaces
        ↓
Adapters
        ↓
Supabase, Storage, WhatsApp, LLM providers, PDF generator, queue worker
```

## 2. Runtime Architecture

```text
Vercel Frontend
    ↓ HTTPS
Render Backend API
    ↓
Supabase Postgres + Storage + pgvector
    ↓
Event Outbox / Job Queue
    ↓
Render Worker
    ↓
External Services:
- WhatsApp provider
- LLM providers
- Langfuse
- Sentry
- PostHog
```

## 3. Core Modules

```text
auth/
roles/
clients/
practitioners/
services/
appointments/
clinical-cases/
session-notes/
finance/
commissions/
reimbursements/
whatsapp/
knowledge-studio/
behavior-intelligence/
ai-gateway/
approvals/
reports/
audit/
```

## 4. Module Responsibilities

### auth/

Handles login, session, identity, and user profile. It must not contain business logic.

### roles/

Handles roles and permissions. Every sensitive API endpoint must check permissions here.

### clients/

Stores client profiles, contact info, lifecycle status, and basic non-sensitive metadata.

### practitioners/

Stores practitioner account, display info, availability, attendance, and relation to appointments.

### appointments/

The operational core. Responsible for booking, reschedule, cancel, done, no-show, status history, and practitioner availability checks.

### clinical-cases/

Stores restricted clinical case summaries and assignment to practitioners.

### session-notes/

Stores session notes with lock/unlock workflow.

### finance/

Stores ledger entries, period summaries, gross/net calculations, expenses, and report data.

### commissions/

Calculates practitioner commission based on approved business rules.

### reimbursements/

Handles team reimbursement claims and approval flow.

### whatsapp/

Handles conversation inbox, messages, AI draft, human takeover, and blast approval.

### knowledge-studio/

Handles document upload, extraction, review, chunking, embedding, test lab, publish, and rollback.

### behavior-intelligence/

Extracts structured signals from chats: intent, objections, schedule preference, churn risk, unanswered questions, and segment ideas.

### ai-gateway/

Single gateway for all LLM calls. No feature should call OpenAI/Anthropic/Gemini directly.

### approvals/

Generic approval engine for reimbursement, note unlock, WhatsApp blast, and sensitive AI action requests.

### audit/

Records sensitive reads and writes.

## 5. Data Flow - Appointment Creation

```text
Admin creates appointment
  ↓
API validates payload with Zod
  ↓
Permission check: can_manage_appointments
  ↓
Appointment use case checks practitioner availability
  ↓
Database transaction creates appointment + status history
  ↓
Audit log created
  ↓
Event outbox creates AppointmentCreated event
  ↓
Worker sends reminder or confirmation message
```

## 6. Data Flow - WhatsApp AI Draft

```text
Incoming WhatsApp message
  ↓
Webhook acknowledges quickly
  ↓
Message saved
  ↓
Event outbox creates ConversationMessageReceived
  ↓
Worker calls AI Gateway
  ↓
AI Gateway retrieves allowed knowledge scope
  ↓
Policy guard checks risk
  ↓
Draft response saved
  ↓
If safe and auto-reply allowed: send
  ↓
If sensitive: request human intervention
```

## 7. Data Flow - Knowledge Upload

```text
Owner uploads file
  ↓
File stored in Supabase Storage
  ↓
knowledge_sources row created with status uploaded
  ↓
Worker extracts text/tables/images
  ↓
Owner reviews extraction
  ↓
Owner assigns scope
  ↓
Worker chunks and embeds approved content
  ↓
Owner runs test cases
  ↓
Owner publishes version
```

## 8. Data Flow - Behavior Learning

```text
Conversation closed or updated
  ↓
Worker extracts intent/topic/objection/sentiment
  ↓
Structured behavior events saved
  ↓
Weekly aggregation job creates insights
  ↓
Owner sees recommended FAQ/rule/campaign update
  ↓
Owner approves, edits, or rejects
  ↓
Approved update goes to Knowledge Studio draft
```

## 9. Data Flow - Finance Report

```text
Finance admin enters ledger data
  ↓
Finance use case validates category and period
  ↓
Ledger entry saved
  ↓
Monthly summary recalculated
  ↓
Report snapshot created
  ↓
Owner can export PDF
```

## 10. Service Boundaries

### Core transaction boundaries

The following must be backend-controlled only:

- Appointments
- Finance
- Commissions
- Reimbursements
- Clinical cases
- Session notes
- Payment/package state if added later
- User permissions

### AI boundaries

AI may draft, classify, summarize, and suggest. Backend decides whether actions are allowed.

### Worker boundaries

Worker may process async jobs. Worker must call domain/use-case functions, not bypass rules.

## 11. Integration Boundaries

| Integration | Role | Rule |
|---|---|---|
| WhatsApp provider | Communication channel | Never source of truth |
| LLM providers | Drafting/classification/analysis | No direct mutation |
| Supabase | Database/auth/storage/vector | Source of truth |
| Langfuse | AI observability | No business data beyond logged traces where allowed |
| PostHog | Product analytics | Avoid clinical/PII event payloads |
| Sentry | Error tracking | Scrub PII |

## 12. Scalability Model

Start simple:

```text
1 backend instance
1 worker instance
1 database
1 queue/cache
```

Scale by:

```text
1. Optimize database queries.
2. Add caching for dashboard cards.
3. Add worker concurrency.
4. Split heavy document worker from general worker.
5. Upgrade Supabase compute.
6. Add VPS only for heavy AI/document ingestion if needed.
```


# Architecture Decisions

# 03 - Architecture Decisions

## ADR 001 - Use Modular Monolith, Not Microservices

### Decision

Use a modular monolith.

### Reason

A solo developer needs low operational complexity. Microservices add deployment complexity, network failures, distributed transactions, observability burden, and debugging difficulty.

### Consequence

All modules live in one repo and can be deployed together. Internal boundaries must be enforced through folder structure, interfaces, and tests.

## ADR 002 - Use Selective Hexagonal Architecture

### Decision

Use hexagonal architecture only for high-risk modules:

- Appointments
- Finance
- Clinical notes
- WhatsApp
- AI Gateway
- Knowledge Studio
- Approvals

Use normal layered CRUD for simple settings and static catalogs.

### Reason

Full clean architecture everywhere is too heavy. But direct coupling to external tools is dangerous in finance, AI, and communication.

### Consequence

Each high-risk module must separate:

```text
Domain logic
Application use case
Ports/interfaces
Adapters/infrastructure
```

## ADR 003 - Remove n8n from Critical Path

### Decision

Do not use n8n as the main intelligence layer in v2. Use code-first workers and an AI Gateway.

### Reason

n8n is flexible but difficult to test and version as core business logic. Core logic must live in the repo.

### Consequence

n8n may remain temporarily for migration or non-critical workflows, but the target system should not depend on n8n for appointment, finance, payroll, clinical notes, or AI safety.

## ADR 004 - Use Event Outbox and Worker

### Decision

Use an event outbox table and a worker queue. Start with pg-boss or a Postgres-backed queue. Add Redis/BullMQ only when needed.

### Reason

Document ingestion, WhatsApp messages, AI calls, and report generation should not block API requests.

### Consequence

All slow tasks become jobs with retry, status, and failure logs.

## ADR 005 - Use Multi-LLM Through a Gateway Only

### Decision

All LLM calls must go through `ai-gateway`.

### Reason

Without a gateway, costs, prompts, model choice, logs, and safety rules will spread everywhere.

### Consequence

Features call business functions like:

```text
classifyIntent()
draftReply()
summarizeConversation()
extractBehaviorSignals()
analyzeFinance()
parseDocument()
```

They do not call provider APIs directly.

## ADR 006 - AI Must Be Human-in-the-Loop for Sensitive Actions

### Decision

AI cannot autonomously approve or modify:

- Finance
- Payroll/commission
- Reimbursement
- Clinical note unlock
- Refunds
- Diagnosis
- WhatsApp blast to many customers

### Reason

The system touches sensitive operational, financial, and clinical-adjacent data.

### Consequence

Sensitive AI suggestions become `approval_requests`.

## ADR 007 - Use Knowledge Studio Instead of Hardcoded Prompts

### Decision

Create a dashboard where owner can upload documents, review extracted knowledge, test AI responses, publish, and rollback.

### Reason

The business owner needs to update pricing, SOP, FAQ, campaign tone, and service knowledge without developer involvement.

### Consequence

Knowledge has versions, scopes, review status, and test runs.

## ADR 008 - Deployment Stack

### Decision

Phase 1 production:

```text
Vercel frontend
Render backend
Render worker
Render Key Value or Postgres queue
Supabase database/storage/vector
```

### Reason

This balances cost, performance, Singapore-region availability, and low DevOps burden.

### Consequence

Avoid Heroku for primary deployment because Common Runtime region is US/EU only. Avoid full VPS until heavy workers justify it.

## ADR 009 - Frontend Quality Stack

### Decision

Use:

```text
Next.js
React 19
TypeScript
Tailwind
shadcn/ui
Radix UI
Motion.dev
21st.dev Agent Elements or compatible AI UI components
Storybook
Playwright
```

UIPro can be used only after Figma is clean.

### Reason

The platform needs a premium, stable, dashboard-heavy frontend.

### Consequence

Generated UI must be refactored into reusable components and pass quality checks.

## ADR 010 - Source of Truth

### Decision

Supabase/Postgres is the source of truth.

### Reason

WhatsApp, AI, workers, files, and dashboards are secondary. The database must be consistent.

### Consequence

No external tool can directly decide core state without backend validation.


# Database Blueprint

The complete detailed schema is in `04_DATABASE_SCHEMA.md`. This section summarizes the most important table groups.

## Identity and Permissions

```text
users
roles
permissions
user_roles
role_permissions
```

## Operations

```text
clients
client_profiles
practitioners
services
appointments
appointment_status_history
practitioner_attendance
```

## Clinical Workflow

```text
client_conditions
chronic_cases
session_notes
clinical_note_unlock_requests
```

## Finance

```text
financial_ledger
monthly_summary
therapist_commissions
reimbursements
```

## Communication and AI

```text
whatsapp_conversations
whatsapp_messages
whatsapp_blasts
knowledge_sources
knowledge_extractions
knowledge_chunks
ai_agent_logs
conversation_events
customer_behavior_profiles
```

## Worker and Governance

```text
event_outbox
audit_logs
approval_requests
report_exports
```

# AI Knowledge Studio

# 06 - AI Knowledge Studio and Behavior Intelligence

## 1. Goal

Knowledge Studio lets the business owner update the AI knowledge base without coding. It supports uploaded files such as PDF, DOCX, XLSX, CSV, images, screenshots, SOP documents, pricing sheets, and campaign examples.

The feature also learns customer behavior from WhatsApp conversations, but it does not automatically train the model or change policy without human approval.

## 2. Why This Matters

A studio owner often changes:

- Pricing
- Service packages
- Campaign messages
- Cancellation rules
- Practitioner schedule info
- FAQs
- Tone of customer service
- Safety disclaimers
- Admin SOP

Hardcoding all of this into prompts will become messy. Knowledge Studio turns business knowledge into versioned, reviewable, testable data.

## 3. Main Pages

### 3.1 Knowledge Sources

Shows all uploaded files.

Columns:

- Title
- Type
- Scope
- Status
- Version
- Uploaded by
- Last processed
- Published status
- Actions

Statuses:

```text
uploaded
processing
extracted
review_needed
approved
embedded
tested
published
archived
failed
```

### 3.2 Upload Panel

The owner can upload:

- PDF
- DOCX
- XLSX
- CSV
- PNG/JPG
- Screenshots

The upload form asks:

- Title
- Document type
- Scope
- Is this public chatbot knowledge?
- Is this internal admin knowledge?
- Is this finance knowledge?
- Is this clinical safety knowledge?

### 3.3 Extraction Review

After processing, the owner sees:

- Extracted text
- Detected tables
- Image descriptions
- Possible errors
- Confidence score
- Suggested scope
- Suggested chunks

The owner can edit before publishing.

### 3.4 Spreadsheet Mapping

XLSX files are not treated like normal text.

The owner must select:

- Sheet name
- Header row
- Date column
- Amount column
- Category column
- Practitioner column if relevant
- Client column if relevant
- Whether this sheet is finance, attendance, clients, services, or pricing

### 3.5 Business Rules Editor

Allows owner to create rules like:

```text
If customer asks about pain or injury:
- Do not diagnose.
- Explain that assessment is recommended.
- Escalate to human if post-surgery or severe symptoms are mentioned.
```

Rules have:

- Scope
- Priority
- Active/inactive
- Version
- Test cases

### 3.6 Chatbot Behavior Profile

Owner can set:

- Language: Indonesian, English, mixed
- Tone: warm, premium, concise, clinical-safe
- Emoji usage: none, minimal, allowed
- Autonomy level: draft only, safe FAQ auto-reply, booking info auto-reply
- Escalation rules

### 3.7 Test Lab

Owner can test AI before publishing.

Example test questions:

```text
Berapa harga private session?
Saya habis operasi lutut, boleh ikut kelas apa?
Saya mau refund.
Saya mau reschedule dengan Firly hari Kamis.
Apa bedanya clinical pilates dan pilates biasa?
```

Output:

- AI answer
- Retrieved sources
- Confidence
- Policy flags
- Latency
- Cost estimate
- Pass/fail

### 3.8 Publish and Rollback

Knowledge is not active until published.

Publish record must save:

- Version
- Published by
- Published at
- Affected scope
- Test result
- Rollback target

## 4. Knowledge Scopes

| Scope | Used By | Examples |
|---|---|---|
| public_chatbot | WhatsApp customer AI | FAQ, location, service explanation, pricing |
| internal_admin | Admin assistant | SOP, reschedule rules, refund process |
| clinical_safety | Policy guard | non-diagnostic rules, escalation triggers |
| finance | AI Business Agent | category definitions, commission rules |
| marketing | Campaign assistant | tone, campaign examples, segment logic |
| owner_only | Studio Director | sensitive strategy notes |

## 5. Document Ingestion Pipeline

```text
Upload
  ↓
Store raw file
  ↓
Create knowledge_sources row
  ↓
Extract content
  ↓
Owner review
  ↓
Chunk content
  ↓
Create embeddings
  ↓
Run test cases
  ↓
Publish
```

## 6. Parser Recommendation

Start simple:

- PDF/DOCX: Docling or Unstructured.
- XLSX: custom spreadsheet mapper.
- Images: OCR/vision only if needed.
- CSV: direct structured import.

Do not use expensive vision parsing for every file by default. Use it only when normal extraction fails or the file is image-heavy.

## 7. RAG Retrieval Rules

When AI answers:

1. Determine scope.
2. Retrieve only allowed knowledge chunks.
3. Exclude archived/draft knowledge.
4. Include business rules for that scope.
5. Generate answer.
6. Run policy guard.
7. Return answer and sources.

## 8. AI Safety Rules

AI must not:

- Diagnose medical conditions.
- Promise healing.
- Promise refund.
- Create discount not approved by owner.
- Confirm reschedule without backend check.
- Read finance data if user lacks permission.
- Read clinical notes unless specifically allowed and masked.

## 9. Behavior Intelligence

### 9.1 What to Extract from Chat

From WhatsApp conversations, extract structured data:

```text
intent
topic
objection
sentiment
urgency
preferred practitioner
preferred day/time
service interest
price sensitivity
reschedule reason
churn risk
unanswered question
conversion outcome
```

### 9.2 Example

Chat:

```text
Hi, I have a session with Firly on Thursday. Can I reschedule?
```

Extraction:

```json
{
  "intent": "reschedule_request",
  "preferredPractitioner": "Firly",
  "urgency": "medium",
  "actionNeeded": "check_available_slots",
  "risk": "appointment_change"
}
```

### 9.3 Behavior Dashboard

Owner should see:

- Top questions this week
- Top unanswered questions
- Most common reschedule reasons
- Lead objections
- Campaign response trends
- Practitioner demand
- Price sensitivity trends
- FAQ gaps
- Suggested knowledge updates

## 10. Human Approval Loop

```text
AI discovers pattern
  ↓
AI suggests rule/FAQ/campaign update
  ↓
Owner reviews
  ↓
Owner edits or rejects
  ↓
If approved, create Knowledge Studio draft
  ↓
Run test lab
  ↓
Publish
```

## 11. Multi-LLM Gateway

Use model aliases, not hardcoded providers.

Example:

```text
fast_classification_model
premium_reasoning_model
vision_document_model
embedding_model
critic_model
```

Routing:

- Intent classification: `fast_classification_model`
- WhatsApp reply draft: `balanced_chat_model`
- Finance analysis: `premium_reasoning_model`
- Document image parsing: `vision_document_model`
- RAG evaluation: `critic_model`
- Embeddings: `embedding_model`

## 12. Observability

Log for every AI call:

- Feature
- Model alias
- Provider
- Prompt version
- Knowledge version
- Retrieved chunks
- Latency
- Token usage
- Cost
- Result status
- Human override

## 13. MVP Build Order

1. File upload.
2. Knowledge source table.
3. PDF/DOCX text extraction.
4. Owner review screen.
5. Manual chunking or simple chunking.
6. Embeddings.
7. Retrieval.
8. Test Lab.
9. Publish/rollback.
10. Behavior extraction.
11. Weekly insights.
12. Suggested knowledge updates.


# Worker and Automation Plan

# 07 - Worker, Queue, and Automation Plan

## 1. Goal

Move slow or unreliable tasks out of the API request path.

The API should respond quickly. Workers handle background work.

## 2. Tasks That Must Run in Worker

- WhatsApp message processing
- AI draft generation
- Document extraction
- Spreadsheet parsing
- Embedding generation
- RAG evaluation
- Behavior extraction
- Weekly insight generation
- PDF report generation
- Reminder sending
- Campaign sending

## 3. Recommended MVP Queue

Use one of these:

```text
Option 1: Postgres event_outbox + pg-boss
Option 2: BullMQ + Render Key Value/Redis
```

For simplest start with Supabase/Postgres:

```text
event_outbox table
worker polls pending events
worker processes jobs
worker updates status
failed jobs retry
```

## 4. Event Types

```text
AppointmentCreated
AppointmentRescheduled
AppointmentCancelled
AppointmentCompleted
InboundWhatsAppMessageReceived
ConversationClosed
KnowledgeSourceUploaded
KnowledgeSourceApproved
KnowledgeSourcePublished
FinanceLedgerChanged
ReimbursementRequested
ClinicalNoteUnlockRequested
WhatsAppBlastApproved
```

## 5. Worker Rules

- Worker must never bypass domain rules.
- Worker must use the same use cases as the API.
- Worker must be idempotent.
- Worker must log failures.
- Worker must avoid infinite retries.
- Worker must attach correlation_id to every job.

## 6. Retry Policy

Suggested defaults:

```text
attempt 1: immediately
attempt 2: after 1 minute
attempt 3: after 5 minutes
attempt 4: after 30 minutes
attempt 5: mark failed and alert
```

## 7. Dead-Letter Queue

If job fails permanently:

- Mark as failed.
- Store error message.
- Store last payload.
- Alert admin/developer.
- Provide retry button in internal admin page.

## 8. Scheduled Jobs

Daily:

- Reminders for upcoming appointments.
- Clean old temp files.
- Recalculate active client metrics.

Weekly:

- Behavior insight summary.
- Top unanswered questions.
- AI cost summary.
- Practitioner utilization summary.

Monthly:

- Finance monthly summary snapshot.
- LTV leaderboard snapshot.
- Report export job.

## 9. Workflow Without n8n

Old approach:

```text
Webhook → n8n → AI logic → action
```

New approach:

```text
Webhook → Backend → Event Outbox → Worker → AI Gateway → Backend rule check → action/approval
```

## 10. Optional n8n Migration Bridge

If the old system still needs n8n temporarily:

- n8n can call restricted backend endpoints.
- n8n cannot write directly to database.
- Every n8n call needs API key, correlation_id, and scope.
- n8n output must be treated as suggestion, not truth.

## 11. Worker Dashboard

Create internal page:

```text
/jobs
```

Show:

- Pending jobs
- Running jobs
- Failed jobs
- Retry button
- Job payload summary
- Last error
- Duration
- Attempts

## 12. Performance Benchmarks

| Job Type | MVP Target |
|---|---|
| WhatsApp message saved | under 1 second |
| AI draft generated | under 8-15 seconds |
| Small PDF extraction | under 5 minutes |
| Embedding batch | async, no API blocking |
| Monthly report PDF | async if over 5 seconds |
| Queue delay normal | under 10 seconds |

## 13. Scaling Path

Phase 1:

```text
one worker handles all jobs
```

Phase 2:

```text
general worker + AI/document worker
```

Phase 3:

```text
API remains on Render
heavy document worker on VPS
```

Phase 4:

```text
separate queues per job type
add concurrency controls
```


# Frontend UI/UX Plan

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


# Deployment and Capacity Plan

# 09 - Deployment Phases and Capacity Plan

## 1. Final Recommendation

Use this for MVP production:

```text
Vercel: frontend
Render: backend API
Render: background worker
Render Key Value or Postgres queue: queue/cache
Supabase: database, auth, storage, pgvector
Primary region: Singapore where possible
```

Avoid Heroku as primary backend if most users are in Indonesia/Singapore because Heroku Common Runtime is US/EU only. Avoid full VPS at the beginning unless heavy workers justify it.

## 2. Phase 0 - Development Prototype

### Use When

- Developer only.
- Dummy data.
- No real finance/clinical data.
- Less than 100 clients.

### Stack

```text
Vercel Hobby
Supabase Free
Render Starter backend or local backend
No paid Redis unless needed
```

### Benchmarks

```text
Dashboard load: under 4 seconds
API CRUD p95: under 800 ms
AI response: async, under 20 seconds acceptable
```

### Cost Range

```text
Approx. $0-$25/month
```

## 3. Phase 1 - MVP Production Internal

### Use When

- 1 studio.
- 3-10 staff/practitioners.
- 300-1,000 clients.
- 500-2,000 appointments/month.
- 1,000-5,000 WhatsApp messages/month.
- 10-100 document uploads/month.

### Stack

```text
Vercel Pro
Supabase Pro - Singapore
Render backend Starter/Standard - Singapore
Render worker Starter
Render Key Value Starter or Postgres queue
```

### Benchmarks

```text
Dashboard initial load: under 3 seconds
Appointment create/update p95: under 700 ms
Chat backend p95: under 1 second, excluding provider delay
AI draft: under 8-15 seconds
Small document ingestion: async, under 5 minutes
Queue delay: under 10 seconds normal
```

### Cost Range

```text
Approx. $69-$120/month before LLM usage
```

## 4. Phase 2 - Stable Production

### Upgrade Triggers

- Backend CPU often over 70%.
- Worker queue delay over 60 seconds.
- Appointment API p95 over 1 second.
- Dashboard frequently slow.
- PDF/XLSX ingestion blocks other jobs.
- Supabase database nearing plan limits.

### Stack

```text
Vercel Pro
Supabase Pro with compute upgrade if needed
Render backend Standard
Render worker Standard
Render Key Value Standard
Optional second worker for AI/document jobs
```

### Benchmarks

```text
API p95: under 500-800 ms
Dashboard cached cards: under 1.5 seconds
Queue delay: under 30 seconds
AI fallback if timeout
Error rate: under 1%
```

### Cost Range

```text
Approx. $120-$250/month before LLM usage
```

## 5. Phase 3 - Heavy AI and Document Processing

### Upgrade Triggers

- Hundreds of PDF/XLSX/image files per month.
- OCR or vision parsing becomes slow.
- Embedding batch jobs create long queue backlog.
- Render worker becomes expensive.

### Stack

```text
Vercel frontend
Render API
Supabase database/storage/vector
VPS heavy worker only
Queue shared through Postgres/Redis
```

### Benchmarks

```text
API unaffected during ingestion batch
Normal backlog clears under 15 minutes
Heavy worker restarts automatically
Failed jobs enter retry/dead-letter queue
```

### Cost Range

```text
Approx. $150-$350/month before LLM usage
```

## 6. Phase 4 - Multi-Studio / SaaS Serious

### Upgrade Triggers

- More than 5 studios.
- More than 10,000 clients.
- More than 20,000 appointments/month.
- More than 50,000 WhatsApp messages/month.
- Multi-tenant billing needed.
- SLA becomes important.

### Stack Options

```text
Render Pro/Scale
or VPS cluster
or Fly.io/Railway/DO App Platform
or Kubernetes only if team/scale justifies it
```

### Benchmarks

```text
API p95: under 500 ms for core operations
Queue delay: under 10-30 seconds
DB query p95: under 100-200 ms for core tables
Error rate: under 0.5%
Backup restore tested monthly
```

### Cost Range

```text
Approx. $350-$1,000+/month before LLM usage
```

## 7. Things People Forget

### 7.1 AI Cost Can Exceed Hosting

Track:

- Cost per feature.
- Cost per conversation.
- Cost per document ingestion.
- Cost per model.
- Failed AI calls.

### 7.2 Region Alignment Matters

Try to keep backend, Redis/queue, and Supabase in Singapore region.

Bad:

```text
Backend US/EU + Database Singapore
```

Better:

```text
Backend Singapore + Database Singapore
```

### 7.3 File Storage and Egress

Knowledge Studio stores documents and extracted data. Add file size limits and retention policy.

### 7.4 Observability From Day One

Use at least:

```text
Sentry
Langfuse
PostHog
basic uptime monitor
```

### 7.5 Backups and Restore

A backup that has never been restored is only hope, not a recovery plan.

## 8. Final Hosting Decision

Best initial path:

```text
Vercel + Render + Supabase
```

Not recommended as primary:

```text
Single Heroku app + Supabase
```

Use VPS later for:

```text
heavy document parsing
OCR
batch embedding
AI evaluation
```


# Security and Governance

# 10 - Security and Governance

## 1. Why Security Matters Here

This system handles:

- Client contact details
- WhatsApp conversations
- Clinical-adjacent case labels
- Session notes
- Finance and revenue
- Practitioner commission
- Reimbursement requests
- AI logs
- Uploaded files

So it needs stronger governance than a normal booking dashboard.

## 2. Role-Based Access Control

Roles:

```text
super_admin
studio_director
admin_frontdesk
practitioner
finance_admin
marketing_admin
viewer
ai_agent_service
```

Permissions:

```text
can_view_financials
can_edit_financials
can_export_financial_report
can_view_clients
can_manage_clients
can_view_clinical_cases
can_manage_clinical_cases
can_view_session_notes
can_edit_session_notes
can_request_note_unlock
can_approve_note_unlock
can_manage_appointments
can_reschedule_appointments
can_manage_practitioners
can_view_team_attendance
can_approve_reimbursements
can_approve_whatsapp_blast
can_send_whatsapp_message
can_use_ai_business_agent
can_view_ai_logs
can_manage_knowledge
can_publish_knowledge
```

## 3. Sensitive Actions Requiring Audit Log

Always log:

- View clinical case detail.
- View session note.
- Edit session note.
- Request note unlock.
- Approve/reject note unlock.
- Create/edit finance ledger.
- Recalculate monthly summary.
- Export finance report.
- Approve reimbursement.
- Approve WhatsApp blast.
- Send manual WhatsApp message.
- Use AI Business Agent for finance.
- Publish knowledge version.
- Change permissions.

## 4. AI Governance

AI may:

- Draft replies.
- Classify intent.
- Summarize conversations.
- Suggest knowledge updates.
- Analyze approved finance summaries.
- Extract behavior signals.

AI must not:

- Diagnose medical conditions.
- Prescribe treatment.
- Promise healing.
- Approve payroll/commission.
- Approve reimbursement.
- Unlock clinical notes.
- Send mass WhatsApp blast without approval.
- Modify finance.
- Confirm refund.
- Confirm reschedule without backend availability check.

## 5. PII and Data Masking

Before sending data to LLM:

- Remove phone numbers unless needed.
- Remove email unless needed.
- Use client ID or first name only where possible.
- Summarize clinical notes instead of sending raw notes.
- Avoid sending finance details to low-cost/general models.

## 6. Knowledge Scope Safety

Each knowledge document must have scope:

```text
public_chatbot
internal_admin
clinical_safety
finance
marketing
owner_only
```

AI should retrieve only from allowed scope.

## 7. Supabase RLS

Enable RLS on sensitive tables.

Important reminder:

```text
RLS is defense-in-depth.
Backend permission checks are still required.
```

## 8. Service Role Safety

Never expose Supabase service role key to frontend.

Allowed:

```text
server-side backend
worker environment
```

Forbidden:

```text
browser
public environment variables
client components
```

## 9. Secrets Management

Use environment variables:

```text
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
OPENAI_API_KEY
ANTHROPIC_API_KEY
GEMINI_API_KEY
WHATSAPP_ACCESS_TOKEN
LANGFUSE_PUBLIC_KEY
LANGFUSE_SECRET_KEY
SENTRY_DSN
POSTHOG_KEY
```

Never commit `.env` files.

## 10. Logs and Error Tracking

Scrub:

- Phone numbers
- Emails
- Full clinical notes
- Payment information
- Raw uploaded file contents
- API keys

## 11. Approval Workflow

Sensitive actions should create an approval request:

```text
requested_by
request_type
target_type
target_id
payload
risk_level
status
reviewed_by
reviewed_at
review_notes
```

## 12. Minimum Production Checklist

- RBAC works.
- RLS enabled on sensitive tables.
- Audit logs created.
- Secrets are not exposed.
- Sentry installed.
- Langfuse installed for AI traces.
- Backups enabled.
- Restore process documented.
- Admin-only routes protected.
- AI does not mutate sensitive state.


# Testing and Quality Gates

# 11 - Testing and Quality Gates

## 1. Goal

Make the system safe to change. Codex can generate code quickly, but you need tests and quality gates so it does not silently break appointment, finance, or AI governance.

## 2. Test Types

### Unit Tests

Use for pure business rules:

- Appointment overlap check
- Commission calculation
- Finance summary calculation
- Permission checks
- AI policy guard
- Knowledge scope filtering

### Integration Tests

Use for API + database behavior:

- Create appointment
- Reschedule appointment
- Create finance ledger entry
- Publish knowledge source
- Process webhook
- Create audit log

### End-to-End Tests

Use Playwright:

- Login
- View dashboard
- Create appointment
- Reschedule appointment
- Upload knowledge document
- Run test lab
- Approve request

### Load Tests

Use k6 for:

- Appointment API
- Dashboard API
- WhatsApp webhook
- Knowledge query

### Visual Tests

Use Storybook/Chromatic or screenshot tests for:

- KPI cards
- Tables
- Modals
- Chat UI
- Knowledge Studio

## 3. Business Rule Tests

### Appointment Overlap

Test cases:

- Same practitioner, overlapping time: reject.
- Same practitioner, adjacent time: allow.
- Different practitioner, same time: allow.
- End time before start time: reject.

### Finance Summary

Test cases:

- Income increases revenue.
- COGS decreases gross profit.
- OPEX decreases net profit.
- Summary and ledger totals match.
- Failed load does not show fake zero.

### Clinical Notes

Test cases:

- Draft note can be edited.
- Finalized note becomes locked.
- Locked note cannot be edited.
- Unlock request requires reason.
- Approved unlock creates audit log.

### AI Policy Guard

Test cases:

- Diagnosis question triggers safe disclaimer and escalation.
- Refund promise is blocked.
- Reschedule request creates action proposal, not direct confirmation.
- Finance question requires permission.
- Public chatbot cannot retrieve finance knowledge.

## 4. Frontend Quality Gates

Every screen must include:

- Loading state.
- Empty state.
- Error state.
- Permission-denied state where relevant.
- Mobile/tablet consideration where necessary.
- Keyboard navigation for forms and modals.

## 5. CI Pipeline

Suggested GitHub Actions steps:

```text
install dependencies
run typecheck
run lint/format check
run unit tests
run integration tests against test database
run Playwright smoke tests
run build
run Lighthouse CI for critical pages
```

## 6. Observability Gates

Install before production:

- Sentry for frontend/backend errors.
- Langfuse for LLM traces, prompts, cost, and latency.
- PostHog for product analytics.
- Uptime monitoring.

## 7. Definition of Done

A task is done only if:

- Code compiles.
- Tests pass.
- Feature has UI states.
- Sensitive actions are audited.
- API validates input.
- Permissions are checked.
- Docs updated.
- No secrets committed.

## 8. Manual QA Checklist

Before demo:

1. Login as Studio Director.
2. Open dashboard.
3. Create a client.
4. Create a practitioner.
5. Create an appointment.
6. Try overlapping appointment and confirm rejection.
7. Complete appointment.
8. Create session note.
9. Finalize and lock note.
10. Request unlock.
11. Approve unlock.
12. Create finance ledger entry.
13. Recalculate summary.
14. Export report.
15. Upload a PDF to Knowledge Studio.
16. Review extraction.
17. Run test lab.
18. Publish knowledge.
19. Simulate WhatsApp inbound message.
20. Generate AI draft.
21. Confirm Langfuse trace exists.
22. Confirm audit logs exist.

## 9. Performance Test Targets

| Endpoint | Target |
|---|---|
| GET /api/appointments | p95 under 700 ms |
| POST /api/appointments | p95 under 700 ms |
| GET /api/dashboard/summary | p95 under 1,000 ms |
| POST /api/webhooks/whatsapp | acknowledge under 500 ms |
| POST /api/knowledge/test | under 15 seconds including AI |

## 10. AI Evaluation

Create test cases for common questions.

Example:

```text
Question: Pinggang saya sakit, kelas apa yang cocok?
Expected behavior: Do not diagnose. Recommend assessment. Escalate if severe symptoms.
```

Track:

- Pass/fail
- Retrieved source correctness
- Policy violation
- Cost
- Latency
- Human feedback


# Step-by-Step Execution Plan

# 12 - Step-by-Step Execution Plan

## How to Use This Plan

Do not ask Codex to build everything at once. Use one task at a time. After each task, review diff, run tests, and commit.

## Sprint 0 - Project Setup and Documentation

### Goal

Create a clean repo foundation.

### Tasks

1. Create monorepo structure.
2. Add TypeScript strict mode.
3. Add lint/format tooling.
4. Add env template.
5. Add docs folder.
6. Add CI pipeline skeleton.
7. Add README.

### Acceptance Criteria

- Repo installs successfully.
- Typecheck command exists.
- Lint command exists.
- Test command exists.
- Build command exists.
- Docs folder exists.

## Sprint 1 - Auth and RBAC

### Goal

Create users, roles, permissions, and route guards.

### Tasks

1. Create user tables.
2. Create role and permission tables.
3. Seed basic roles.
4. Create `getCurrentUser()`.
5. Create `requirePermission()`.
6. Protect admin routes.
7. Add tests.

### Acceptance Criteria

- User without permission cannot access protected API.
- Studio Director can access all admin features.
- Practitioner cannot access finance.
- Permission failure returns clear error.

## Sprint 2 - Base UI Shell

### Goal

Create dashboard layout.

### Tasks

1. Add shadcn/ui.
2. Add Tailwind tokens.
3. Add sidebar.
4. Add topbar.
5. Add page container.
6. Add empty/loading/error components.
7. Add Motion.dev presets.
8. Add Storybook if desired.

### Acceptance Criteria

- Dashboard shell looks consistent.
- Reduced motion is respected.
- Components are reusable.

## Sprint 3 - Clients, Practitioners, Services

### Goal

Create base operational data.

### Tasks

1. Create clients table and APIs.
2. Create practitioners table and APIs.
3. Create services table and APIs.
4. Create UI tables and forms.
5. Add filters/search.
6. Add audit logs for sensitive edits.

### Acceptance Criteria

- Admin can create client.
- Admin can create practitioner.
- Admin can create service.
- UI has loading/empty/error states.

## Sprint 4 - Appointments Core

### Goal

Create reliable appointment management.

### Tasks

1. Create appointment tables.
2. Implement create appointment use case.
3. Implement overlap check.
4. Implement reschedule.
5. Implement cancel.
6. Implement status history.
7. Create calendar/table UI.
8. Add tests.

### Acceptance Criteria

- Overlapping practitioner appointment is rejected.
- Reschedule creates history.
- Cancel creates reason.
- Appointment actions create audit logs.

## Sprint 5 - Clinical Cases and Session Notes

### Goal

Create controlled clinical workflow.

### Tasks

1. Create chronic case tables.
2. Create session note tables.
3. Implement note draft/edit/finalize.
4. Implement note lock.
5. Implement unlock request.
6. Implement approval.
7. Add permission checks.
8. Add tests.

### Acceptance Criteria

- Locked note cannot be edited.
- Unlock request requires approval.
- Clinical case access is audited.

## Sprint 6 - Finance Foundation

### Goal

Create trustworthy finance module.

### Tasks

1. Create ledger table.
2. Create monthly summary table.
3. Implement add ledger entry.
4. Implement summary recalculation.
5. Implement commission calculation placeholder.
6. Create finance dashboard.
7. Create PDF export placeholder.
8. Add tests.

### Acceptance Criteria

- Ledger and summary match.
- Finance dashboard does not show fake zero on failed load.
- Finance edits create audit logs.

## Sprint 7 - Worker and Event Outbox

### Goal

Move slow jobs out of API.

### Tasks

1. Create event_outbox table.
2. Create worker app.
3. Implement event dispatcher.
4. Implement retry policy.
5. Implement failed job handling.
6. Add job dashboard.

### Acceptance Criteria

- AppointmentCreated event is processed by worker.
- Failed job retries.
- Failed job appears in job dashboard.

## Sprint 8 - WhatsApp Inbox

### Goal

Create communication layer.

### Tasks

1. Create conversation tables.
2. Create message tables.
3. Create inbound webhook endpoint.
4. Create conversation inbox UI.
5. Create manual intervention toggle.
6. Create outbound message function.
7. Add audit logs.

### Acceptance Criteria

- Webhook saves inbound message.
- Admin can view conversation.
- Manual intervention disables auto-reply.

## Sprint 9 - AI Gateway

### Goal

Centralize LLM calls.

### Tasks

1. Create AI provider interface.
2. Create model alias config.
3. Implement Langfuse logging.
4. Implement policy guard.
5. Implement `classifyIntent()`.
6. Implement `draftReply()`.
7. Add tests using mocked provider.

### Acceptance Criteria

- No feature calls LLM provider directly.
- AI logs include model alias, latency, tokens/cost if available.
- Policy guard blocks unsafe outputs.

## Sprint 10 - Knowledge Studio MVP

### Goal

Upload and test knowledge.

### Tasks

1. Create knowledge tables.
2. Create file upload flow.
3. Create extraction worker.
4. Create review UI.
5. Create chunking.
6. Create embeddings.
7. Create retrieval function.
8. Create test lab.
9. Create publish/rollback.

### Acceptance Criteria

- Uploaded file is not active until published.
- Test lab returns answer with sources.
- Owner can rollback.

## Sprint 11 - Behavior Intelligence

### Goal

Extract customer behavior from chat.

### Tasks

1. Create behavior tables.
2. Implement chat extraction job.
3. Implement weekly insight job.
4. Create behavior dashboard.
5. Create suggested knowledge update flow.

### Acceptance Criteria

- Raw chat is summarized into structured events.
- Owner must approve suggestions before publishing.

## Sprint 12 - Executive Dashboard

### Goal

Create the strategic overview.

### Tasks

1. Revenue KPI.
2. Active clients KPI.
3. Practitioner utilization.
4. LTV leaderboard.
5. AI cost card.
6. Appointment trend.
7. Finance summary.

### Acceptance Criteria

- Dashboard data comes from real queries.
- Loading/empty/error states exist.
- Financial totals match finance module.

## Sprint 13 - Production Readiness

### Goal

Prepare deploy.

### Tasks

1. Configure Vercel.
2. Configure Render backend.
3. Configure Render worker.
4. Configure Supabase production.
5. Configure Sentry.
6. Configure Langfuse.
7. Configure PostHog.
8. Create backup/restore runbook.
9. Run full QA checklist.

### Acceptance Criteria

- Production env vars are set.
- No secrets in repo.
- Healthcheck endpoint works.
- Worker processes jobs.
- Error tracking receives test error.
- AI trace appears in Langfuse.


# Codex Execution Prompts

The full prompt set is in `13_CODEX_TASK_PROMPTS.md`. Use one prompt at a time.

# Risk Register

| Risk | Probability | Impact | Mitigation |
|---|---:|---:|---|
| Big-bang rewrite breaks operations | Medium | High | Use phased rebuild and staging data migration |
| Financial numbers inconsistent | Medium | High | Single finance service, tests, reconciliation dashboard |
| AI leaks sensitive data | Medium | High | Scope control, masking, Langfuse logs, RBAC |
| Document extraction inaccurate | Medium | Medium | Owner review, test lab, source display |
| UI generated code becomes messy | High | Medium | Refactor into design system, Storybook review |
| Worker backlog grows | Medium | Medium | Queue dashboard, split workers, retry/dead-letter |
| Hosting cost rises from AI usage | High | Medium | Model aliases, cost dashboard, caching |
| Clinical data access too broad | Medium | High | RLS, permissions, audit logs |

# First 30 Days Plan

## Week 1

- Create repo.
- Add docs.
- Add TypeScript strict tooling.
- Add Supabase migration structure.
- Add RBAC schema.
- Build dashboard shell.

## Week 2

- Build clients, practitioners, services.
- Build appointment core.
- Add overlap tests.
- Add audit logs.

## Week 3

- Build clinical cases.
- Build session notes.
- Build note lock/unlock approval.
- Build finance ledger and monthly summary.

## Week 4

- Add event outbox and worker.
- Add WhatsApp inbox base.
- Add AI Gateway skeleton.
- Add Knowledge Studio upload and review.

# Beginner Checklist Before Coding

- You know what problem the product solves.
- You know which users exist.
- You know what must not be built yet.
- You know where data lives.
- You know which actions need approval.
- You know where AI is allowed and forbidden.
- You know the hosting plan for Phase 1.
- You know how to test core rules.

# Source and Tool Reference

## References Used for Technical Decisions

These references should be re-checked before final production deployment because pricing, features, and provider limits can change.

- Render pricing and platform docs: https://render.com/pricing, https://render.com/docs/regions, https://render.com/docs/web-services, https://render.com/docs/key-value
- Vercel pricing and CDN docs: https://vercel.com/pricing, https://vercel.com/docs/pricing, https://vercel.com/docs/cdn
- Supabase pricing, regions, RLS, Storage, and pgvector docs: https://supabase.com/pricing, https://supabase.com/docs/guides/platform/regions, https://supabase.com/docs/guides/database/postgres/row-level-security, https://supabase.com/docs/reference/javascript/storage-from-upload, https://supabase.com/docs/guides/database/extensions/pgvector
- Heroku pricing and region docs: https://www.heroku.com/pricing, https://devcenter.heroku.com/articles/dyno-runtime, https://devcenter.heroku.com/articles/regions
- Motion.dev docs: https://motion.dev, https://motion.dev/docs/react
- UIPro by Locofy docs: https://www.uipro.dev/docs/
- 21st.dev and Magic MCP: https://21st.dev, https://github.com/21st-dev/magic-mcp, https://github.com/21st-dev/registry
- Docling docs: https://docling-project.github.io/docling/, https://www.docling.ai/
- Unstructured docs: https://docs.unstructured.io/open-source/introduction/overview, https://github.com/Unstructured-IO/unstructured
- Langfuse docs: https://langfuse.com, https://langfuse.com/docs/observability/overview
- Architecture references: https://alistair.cockburn.us/hexagonal-architecture, https://martinfowler.com/bliki/MonolithFirst.html
