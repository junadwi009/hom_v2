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
