-- Phase 6C: local manual payment tables, read-only RLS, and payment permissions.
-- Local-only, read-only from the browser. No payment writes, gateway, settlement,
-- finance ledger, card details, or bank account secrets.

-- Extend the canonical permission catalog with the two payment permissions.
alter table public.permissions
drop constraint if exists permissions_key_check;

alter table public.permissions
add constraint permissions_key_check check (
  key in (
    'can_manage_users',
    'can_manage_roles_permissions',
    'can_view_audit_logs',
    'can_view_clients',
    'can_manage_clients',
    'can_view_practitioners',
    'can_manage_practitioners',
    'can_manage_services',
    'can_view_team_attendance',
    'can_view_appointments',
    'can_manage_appointments',
    'can_reschedule_appointments',
    'can_manage_client_packages',
    'can_view_payments',
    'can_manage_payments',
    'can_view_clinical_cases',
    'can_manage_clinical_cases',
    'can_view_session_notes',
    'can_edit_session_notes',
    'can_request_note_unlock',
    'can_approve_note_unlock',
    'can_view_financials',
    'can_edit_financials',
    'can_export_financial_report',
    'can_approve_reimbursements',
    'can_view_whatsapp_inbox',
    'can_send_whatsapp_message',
    'can_approve_whatsapp_blast',
    'can_use_ai_business_agent',
    'can_view_ai_logs',
    'can_manage_knowledge',
    'can_publish_knowledge'
  )
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id),
  client_package_id uuid references public.client_packages(id),
  amount_idr bigint not null check (amount_idr > 0),
  payment_method text not null check (
    payment_method in ('cash', 'bank_transfer', 'card', 'e_wallet', 'other')
  ),
  status text not null default 'pending' check (
    status in ('pending', 'paid', 'failed', 'refunded', 'cancelled')
  ),
  paid_at timestamptz,
  reference_number text check (
    reference_number is null or char_length(reference_number) <= 64
  ),
  notes text check (notes is null or char_length(notes) <= 280),
  created_by_app_user_id uuid references public.app_users(id),
  updated_by_app_user_id uuid references public.app_users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- A settled timestamp implies a settled status (paid, or later refunded).
  constraint payment_paid_at_requires_settled_status check (
    paid_at is null or status in ('paid', 'refunded')
  )
);

create table public.payment_status_history (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.payments(id) on delete cascade,
  from_status text check (
    from_status is null
    or from_status in ('pending', 'paid', 'failed', 'refunded', 'cancelled')
  ),
  to_status text not null check (
    to_status in ('pending', 'paid', 'failed', 'refunded', 'cancelled')
  ),
  reason text check (reason is null or char_length(reason) <= 280),
  actor_app_user_id uuid references public.app_users(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create trigger set_payments_updated_at
before update on public.payments
for each row
execute function private.set_updated_at();

create index idx_payments_client_id on public.payments(client_id);
create index idx_payments_client_package_id
  on public.payments(client_package_id);
create index idx_payments_status on public.payments(status);
create index idx_payments_payment_method on public.payments(payment_method);
create index idx_payments_paid_at on public.payments(paid_at);

create index idx_payment_status_history_payment_id_created_at
  on public.payment_status_history(payment_id, created_at);
create index idx_payment_status_history_to_status
  on public.payment_status_history(to_status);

alter table public.payments enable row level security;
alter table public.payment_status_history enable row level security;

revoke all on public.payments from public;
revoke all on public.payments from anon;
revoke all on public.payments from authenticated;

revoke all on public.payment_status_history from public;
revoke all on public.payment_status_history from anon;
revoke all on public.payment_status_history from authenticated;

grant select on public.payments to authenticated;
grant select on public.payment_status_history to authenticated;

create policy "payment viewers can read payments"
on public.payments
for select
to authenticated
using (
  private.has_permission('can_view_payments')
  or private.has_permission('can_manage_payments')
);

create policy "payment viewers can read payment status history"
on public.payment_status_history
for select
to authenticated
using (
  private.has_permission('can_view_payments')
  or private.has_permission('can_manage_payments')
);

comment on table public.payments is
  'Manual payment records (local-first, read-only from the browser). No gateway metadata, card details, or bank account secrets are stored. Writes are server-only and audited in a later phase.';
comment on table public.payment_status_history is
  'Append-only payment status transition history (local-first, read-only from the browser).';
