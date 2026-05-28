# 05 - API Contracts

## 1. Principles

- Every API input must be validated with Zod.
- Every API response should have predictable shape.
- Every sensitive API must check permission.
- Every mutation must write audit log if sensitive.
- Every mutation should be idempotent where possible.
- Do not return raw internal errors to frontend.

## 2. Standard Response Shape

Success:

```json
{
  "ok": true,
  "data": {},
  "meta": {}
}
```

Error:

```json
{
  "ok": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable message",
    "details": {}
  }
}
```

## 3. Auth and Users

### GET /api/me

Returns current user, roles, and permissions.

### GET /api/users

Permission: `can_manage_users`

### POST /api/users

Permission: `can_manage_users`

Payload:

```json
{
  "fullName": "Practitioner Name",
  "email": "person@example.com",
  "roles": ["practitioner"]
}
```

## 4. Clients

### GET /api/clients

Query:

```text
search?
status?
page?
pageSize?
```

### GET /api/clients/:id

Permission: `can_view_clients`

### POST /api/clients

Permission: `can_manage_clients`

Payload:

```json
{
  "fullName": "Client Name",
  "phone": "+628xxx",
  "email": "client@example.com",
  "primaryPractitionerId": "uuid"
}
```

## 5. Practitioners

### GET /api/practitioners

### POST /api/practitioners

Permission: `can_manage_practitioners`

### GET /api/practitioners/:id/attendance

Permission: `can_view_team_attendance`

## 6. Appointments

### GET /api/appointments

Query:

```text
from
until
practitionerId?
clientId?
status?
```

### POST /api/appointments

Permission: `can_manage_appointments`

Payload:

```json
{
  "clientId": "uuid",
  "practitionerId": "uuid",
  "serviceId": "uuid",
  "startsAt": "2026-06-01T10:00:00+07:00",
  "endsAt": "2026-06-01T11:00:00+07:00",
  "notes": "Optional"
}
```

Business rules:

- Check practitioner overlap.
- Check valid service.
- Write status history.
- Create audit log.
- Emit `AppointmentCreated` event.

### POST /api/appointments/:id/reschedule

Payload:

```json
{
  "startsAt": "2026-06-02T13:00:00+07:00",
  "endsAt": "2026-06-02T14:00:00+07:00",
  "reason": "Client requested via WhatsApp"
}
```

Business rules:

- Must check overlap.
- Must store previous time.
- Must emit `AppointmentRescheduled`.

### POST /api/appointments/:id/cancel

Payload:

```json
{
  "reason": "Client cancelled"
}
```

### POST /api/appointments/:id/complete

Marks appointment done and optionally creates session note draft.

## 7. Clinical Cases

### GET /api/clinical-cases

Permission: `can_view_clinical_cases`

### POST /api/clinical-cases

Permission: `can_manage_clinical_cases`

Payload:

```json
{
  "clientId": "uuid",
  "assignedPractitionerId": "uuid",
  "conditionLabel": "Chronic lower back pain",
  "priority": "normal",
  "summary": "Short non-diagnostic summary"
}
```

## 8. Session Notes

### GET /api/session-notes/:id

Permission: `can_view_session_notes`

### POST /api/session-notes

Permission: `can_edit_session_notes`

### POST /api/session-notes/:id/finalize

Locks the note.

### POST /api/session-notes/:id/unlock-request

Creates unlock request.

### POST /api/session-note-unlock-requests/:id/approve

Permission: `can_approve_note_unlock`

## 9. Finance

### GET /api/financials/monthly-summary

Query:

```text
periodMonth=2026-05-01
```

Permission: `can_view_financials`

### POST /api/financials/ledger

Permission: `can_edit_financials`

Payload:

```json
{
  "periodMonth": "2026-05-01",
  "entryDate": "2026-05-20",
  "category": "pilates_sessions_revenue",
  "description": "Private sessions",
  "amountCents": 10000000,
  "direction": "income"
}
```

### POST /api/financials/recalculate-summary

Permission: `can_edit_financials`

### GET /api/financials/report.pdf

Permission: `can_export_financial_report`

## 10. WhatsApp

### POST /api/webhooks/whatsapp

External webhook. Must:

- Verify signature if provider supports it.
- Save inbound message.
- Return quickly.
- Emit event for worker.

### GET /api/whatsapp/conversations

Permission: `can_view_whatsapp_inbox`

### POST /api/whatsapp/conversations/:id/manual-intervention

Payload:

```json
{
  "enabled": true
}
```

### POST /api/whatsapp/conversations/:id/send

Permission: `can_send_whatsapp_message`

### POST /api/whatsapp/conversations/:id/ai-draft

Creates AI draft. Does not send automatically unless policy allows.

## 11. Knowledge Studio

### POST /api/knowledge/sources

Uploads metadata after file is stored.

### POST /api/knowledge/sources/:id/process

Enqueues extraction job.

### POST /api/knowledge/sources/:id/review

Owner approves or edits extraction.

### POST /api/knowledge/sources/:id/publish

Publishes knowledge version.

### POST /api/knowledge/sources/:id/rollback

Rolls back to previous version.

### POST /api/knowledge/test

Payload:

```json
{
  "scope": "public_chatbot",
  "question": "Berapa harga private session?"
}
```

Response includes answer, sources, latency, cost estimate, and policy flags.

## 12. AI Gateway API Internals

Do not expose raw LLM endpoints to frontend. Create internal functions:

```ts
classifyIntent(input)
draftReply(input)
summarizeConversation(input)
extractBehaviorSignals(input)
analyzeFinance(input)
retrieveKnowledge(input)
```

## 13. Behavior Intelligence

### GET /api/behavior/insights

Query:

```text
from
until
segment?
```

### POST /api/behavior/extract/:conversationId

Enqueues extraction job.

### POST /api/behavior/suggestions/:id/approve

Creates a draft knowledge or business rule update.

## 14. Error Codes

```text
VALIDATION_ERROR
UNAUTHORIZED
FORBIDDEN
NOT_FOUND
CONFLICT
BUSINESS_RULE_FAILED
EXTERNAL_SERVICE_FAILED
AI_POLICY_BLOCKED
RATE_LIMITED
INTERNAL_ERROR
```
