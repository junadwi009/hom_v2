create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id),
  practitioner_id uuid not null references public.practitioners(id),
  service_id uuid not null references public.services(id),
  status text not null check (
    status in ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show')
  ),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  duration_minutes integer not null check (
    duration_minutes > 0
    and duration_minutes <= 480
  ),
  source text not null check (
    source in ('admin', 'import', 'whatsapp_request', 'ai_draft')
  ),
  cancellation_reason text,
  reschedule_reason text,
  notes_summary text check (
    notes_summary is null
    or char_length(notes_summary) <= 280
  ),
  created_by_app_user_id uuid references public.app_users(id) on delete set null,
  updated_by_app_user_id uuid references public.app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint appointment_time_valid check (ends_at > starts_at)
);

create table public.appointment_status_history (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  from_status text check (
    from_status is null
    or from_status in ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show')
  ),
  to_status text not null check (
    to_status in ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show')
  ),
  reason text,
  actor_app_user_id uuid references public.app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create trigger set_appointments_updated_at
before update on public.appointments
for each row
execute function private.set_updated_at();

create index idx_appointments_client_id on public.appointments(client_id);
create index idx_appointments_practitioner_id on public.appointments(practitioner_id);
create index idx_appointments_service_id on public.appointments(service_id);
create index idx_appointments_status on public.appointments(status);
create index idx_appointments_starts_at on public.appointments(starts_at);
create index idx_appointments_practitioner_starts_at
  on public.appointments(practitioner_id, starts_at);
create index idx_appointment_status_history_appointment_created_at
  on public.appointment_status_history(appointment_id, created_at);

alter table public.appointments enable row level security;
alter table public.appointment_status_history enable row level security;

revoke all on public.appointments from public;
revoke all on public.appointments from anon;
revoke all on public.appointments from authenticated;

revoke all on public.appointment_status_history from public;
revoke all on public.appointment_status_history from anon;
revoke all on public.appointment_status_history from authenticated;

grant select on public.appointments to authenticated;
grant select on public.appointment_status_history to authenticated;

create policy "permitted users can read appointments"
on public.appointments
for select
to authenticated
using (
  private.has_permission('can_view_appointments')
  or private.has_permission('can_manage_appointments')
);

create policy "permitted users can read appointment status history"
on public.appointment_status_history
for select
to authenticated
using (
  private.has_permission('can_view_appointments')
  or private.has_permission('can_manage_appointments')
);

comment on table public.appointments is
  'Local appointment foundation. Browser writes are intentionally blocked until server-only audited mutation flows are approved.';

comment on table public.appointment_status_history is
  'Append-style local appointment status history. Browser writes are intentionally blocked until server-only audited mutation flows are approved.';
