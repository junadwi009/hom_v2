# 04 - Database Schema Blueprint

## 1. Principles

- Database is the source of truth.
- Every sensitive table needs access policy.
- Every sensitive action needs audit log.
- Use migrations, not manual dashboard changes.
- Prefer simple schemas first, then expand.
- Do not store raw secrets in database.

## 2. Suggested Schemas

Use logical schemas if the project grows:

```text
public      - app-facing tables
private     - internal-only tables
analytics   - aggregated insights
```

For MVP, `public` is acceptable if RLS and backend permissions are strict.

## 3. Tables

### users

Stores internal system users.

```sql
create table users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique,
  full_name text not null,
  email text unique not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### roles

```sql
create table roles (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  description text,
  created_at timestamptz not null default now()
);
```

### permissions

```sql
create table permissions (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  description text
);
```

### user_roles

```sql
create table user_roles (
  user_id uuid references users(id),
  role_id uuid references roles(id),
  primary key (user_id, role_id)
);
```

### role_permissions

```sql
create table role_permissions (
  role_id uuid references roles(id),
  permission_id uuid references permissions(id),
  primary key (role_id, permission_id)
);
```

## 4. Client Tables

### clients

```sql
create table clients (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text,
  email text,
  status text not null default 'active',
  primary_practitioner_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### client_profiles

```sql
create table client_profiles (
  client_id uuid primary key references clients(id),
  birth_date date,
  gender text,
  notes text,
  source text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### client_conditions

Use this for controlled condition labels, not full medical notes.

```sql
create table client_conditions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id),
  label text not null,
  risk_level text not null default 'normal',
  status text not null default 'active',
  created_by uuid references users(id),
  created_at timestamptz not null default now()
);
```

## 5. Practitioner Tables

### practitioners

```sql
create table practitioners (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  display_name text not null,
  email text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### practitioner_attendance

```sql
create table practitioner_attendance (
  id uuid primary key default gen_random_uuid(),
  practitioner_id uuid not null references practitioners(id),
  work_date date not null,
  clock_in timestamptz,
  clock_out timestamptz,
  status text not null default 'present',
  notes text,
  created_at timestamptz not null default now()
);
```

## 6. Appointment Tables

### services

```sql
create table services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  default_duration_minutes int not null,
  default_price_cents bigint,
  status text not null default 'active',
  created_at timestamptz not null default now()
);
```

### appointments

```sql
create table appointments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id),
  practitioner_id uuid not null references practitioners(id),
  service_id uuid not null references services(id),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'scheduled',
  source text not null default 'admin',
  notes text,
  created_by uuid references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint appointment_time_valid check (ends_at > starts_at)
);
```

### appointment_status_history

```sql
create table appointment_status_history (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references appointments(id),
  old_status text,
  new_status text not null,
  reason text,
  actor_user_id uuid references users(id),
  created_at timestamptz not null default now()
);
```

## 7. Clinical Tables

### chronic_cases

```sql
create table chronic_cases (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id),
  assigned_practitioner_id uuid references practitioners(id),
  condition_label text not null,
  status text not null default 'active',
  priority text not null default 'normal',
  summary text,
  started_at date,
  created_by uuid references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### session_notes

```sql
create table session_notes (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid references appointments(id),
  client_id uuid not null references clients(id),
  practitioner_id uuid not null references practitioners(id),
  note_text text,
  status text not null default 'draft',
  locked_at timestamptz,
  locked_by uuid references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### clinical_note_unlock_requests

```sql
create table clinical_note_unlock_requests (
  id uuid primary key default gen_random_uuid(),
  session_note_id uuid not null references session_notes(id),
  requested_by uuid not null references users(id),
  reason text not null,
  status text not null default 'pending',
  reviewed_by uuid references users(id),
  reviewed_at timestamptz,
  review_notes text,
  created_at timestamptz not null default now()
);
```

## 8. Finance Tables

### financial_ledger

```sql
create table financial_ledger (
  id uuid primary key default gen_random_uuid(),
  period_month date not null,
  entry_date date not null,
  category text not null,
  subcategory text,
  description text,
  amount_cents bigint not null,
  direction text not null check (direction in ('income','expense')),
  source_type text,
  source_id uuid,
  created_by uuid references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### monthly_summary

```sql
create table monthly_summary (
  id uuid primary key default gen_random_uuid(),
  period_month date unique not null,
  revenue_cents bigint not null default 0,
  cogs_cents bigint not null default 0,
  gross_profit_cents bigint not null default 0,
  operating_expenses_cents bigint not null default 0,
  net_profit_cents bigint not null default 0,
  calculated_at timestamptz not null default now()
);
```

### therapist_commissions

```sql
create table therapist_commissions (
  id uuid primary key default gen_random_uuid(),
  practitioner_id uuid not null references practitioners(id),
  period_month date not null,
  sessions_count int not null default 0,
  commission_cents bigint not null default 0,
  status text not null default 'draft',
  created_at timestamptz not null default now()
);
```

### reimbursements

```sql
create table reimbursements (
  id uuid primary key default gen_random_uuid(),
  requester_user_id uuid not null references users(id),
  amount_cents bigint not null,
  description text not null,
  status text not null default 'pending',
  reviewed_by uuid references users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
```

## 9. WhatsApp Tables

### whatsapp_conversations

```sql
create table whatsapp_conversations (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id),
  external_contact_id text,
  status text not null default 'open',
  manual_intervention boolean not null default false,
  assigned_user_id uuid references users(id),
  last_message_at timestamptz,
  created_at timestamptz not null default now()
);
```

### whatsapp_messages

```sql
create table whatsapp_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references whatsapp_conversations(id),
  direction text not null check (direction in ('inbound','outbound')),
  sender_type text not null,
  message_text text,
  provider_message_id text,
  status text,
  created_at timestamptz not null default now()
);
```

### whatsapp_blasts

```sql
create table whatsapp_blasts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  message_template text not null,
  segment_criteria jsonb not null default '{}'::jsonb,
  status text not null default 'draft',
  created_by uuid references users(id),
  created_at timestamptz not null default now()
);
```

## 10. Knowledge Studio Tables

### knowledge_sources

```sql
create table knowledge_sources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  source_type text not null,
  storage_path text,
  mime_type text,
  scope text not null,
  status text not null default 'uploaded',
  version int not null default 1,
  uploaded_by uuid references users(id),
  created_at timestamptz not null default now()
);
```

### knowledge_extractions

```sql
create table knowledge_extractions (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references knowledge_sources(id),
  extracted_text text,
  extracted_tables jsonb,
  image_descriptions jsonb,
  parser_used text,
  confidence numeric,
  errors jsonb,
  created_at timestamptz not null default now()
);
```

### knowledge_chunks

```sql
create table knowledge_chunks (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references knowledge_sources(id),
  chunk_text text not null,
  chunk_type text not null default 'text',
  metadata jsonb not null default '{}'::jsonb,
  embedding vector,
  status text not null default 'draft',
  created_at timestamptz not null default now()
);
```

### ai_test_cases

```sql
create table ai_test_cases (
  id uuid primary key default gen_random_uuid(),
  scope text not null,
  input text not null,
  expected_behavior text,
  risk_level text not null default 'normal',
  created_at timestamptz not null default now()
);
```

### ai_test_runs

```sql
create table ai_test_runs (
  id uuid primary key default gen_random_uuid(),
  test_case_id uuid references ai_test_cases(id),
  model_alias text not null,
  answer text,
  retrieved_sources jsonb,
  pass_fail text,
  latency_ms int,
  cost_estimate_cents bigint,
  created_at timestamptz not null default now()
);
```

## 11. AI and Behavior Tables

### ai_agent_logs

```sql
create table ai_agent_logs (
  id uuid primary key default gen_random_uuid(),
  feature text not null,
  model_alias text not null,
  prompt_version text,
  input_summary text,
  output_summary text,
  tokens_input int,
  tokens_output int,
  latency_ms int,
  cost_estimate_cents bigint,
  status text not null,
  created_at timestamptz not null default now()
);
```

### conversation_events

```sql
create table conversation_events (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references whatsapp_conversations(id),
  client_id uuid references clients(id),
  event_type text not null,
  intent text,
  topic text,
  extracted_json jsonb not null default '{}'::jsonb,
  confidence numeric,
  created_at timestamptz not null default now()
);
```

### customer_behavior_profiles

```sql
create table customer_behavior_profiles (
  client_id uuid primary key references clients(id),
  preferred_practitioner_id uuid references practitioners(id),
  preferred_days jsonb,
  preferred_time_range text,
  service_interest jsonb,
  price_sensitivity text,
  reschedule_frequency int not null default 0,
  no_show_risk text,
  last_summary text,
  updated_at timestamptz not null default now()
);
```

## 12. Worker and Audit Tables

### event_outbox

```sql
create table event_outbox (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  aggregate_type text not null,
  aggregate_id uuid,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending',
  attempts int not null default 0,
  next_attempt_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  processed_at timestamptz
);
```

### audit_logs

```sql
create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references users(id),
  action text not null,
  target_type text not null,
  target_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);
```

## 13. Important Indexes

Create indexes for common queries:

```sql
create index idx_appointments_practitioner_time on appointments(practitioner_id, starts_at, ends_at);
create index idx_appointments_client_time on appointments(client_id, starts_at desc);
create index idx_financial_ledger_period on financial_ledger(period_month);
create index idx_whatsapp_conversations_last_message on whatsapp_conversations(last_message_at desc);
create index idx_event_outbox_status_next on event_outbox(status, next_attempt_at);
create index idx_audit_logs_target on audit_logs(target_type, target_id);
```

## 14. RLS Guidance

RLS should be enabled for sensitive tables:

- clients
- client_profiles
- client_conditions
- chronic_cases
- session_notes
- finance tables
- whatsapp messages
- knowledge sources
- ai logs
- audit logs

Beginner note: RLS is not a replacement for backend permission checks. Use both.

## 15. Migration Strategy

If old data exists:

1. Export old data read-only.
2. Map old tables to new schema.
3. Import into staging.
4. Run validation queries.
5. Compare totals: clients, appointments, revenue, sessions, commissions.
6. Only then import production.

Never migrate finance data without reconciliation.
