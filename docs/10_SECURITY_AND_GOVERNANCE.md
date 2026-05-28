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
