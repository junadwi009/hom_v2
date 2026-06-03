create table public.packages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  package_type text not null check (
    package_type in ('intro', 'session_pack', 'membership')
  ),
  total_sessions integer not null check (total_sessions > 0),
  validity_days integer not null check (validity_days > 0),
  price_idr bigint not null check (price_idr >= 0),
  status text not null default 'active' check (
    status in ('active', 'inactive', 'archived')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.client_packages (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id),
  package_id uuid not null references public.packages(id),
  purchased_at timestamptz not null,
  expires_at timestamptz not null,
  total_sessions integer not null check (total_sessions > 0),
  remaining_sessions integer not null check (remaining_sessions >= 0),
  status text not null default 'active' check (
    status in ('active', 'expired', 'depleted', 'cancelled')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint client_package_remaining_sessions_valid check (
    remaining_sessions <= total_sessions
  ),
  constraint client_package_expiry_after_purchase check (
    expires_at > purchased_at
  )
);

create table public.package_usage_history (
  id uuid primary key default gen_random_uuid(),
  client_package_id uuid not null references public.client_packages(id) on delete cascade,
  appointment_id uuid references public.appointments(id) on delete set null,
  change_type text not null check (
    change_type in (
      'assigned',
      'deducted',
      'reversed',
      'adjusted',
      'cancelled',
      'expired'
    )
  ),
  quantity integer not null check (quantity > 0),
  before_remaining integer not null check (before_remaining >= 0),
  after_remaining integer not null check (after_remaining >= 0),
  reason text check (
    reason is null
    or (
      char_length(reason) <= 280
      and reason !~* '\m(payment|paid|card|bank|transfer|invoice|clinical|medical|diagnosis|diagnose|treatment|whatsapp|message|phone|email|contact|secret|token)\M'
      and reason !~* 'api[[:space:]_-]*key'
    )
  ),
  actor_app_user_id uuid references public.app_users(id) on delete set null,
  created_at timestamptz not null default now()
);

create trigger set_packages_updated_at
before update on public.packages
for each row
execute function private.set_updated_at();

create trigger set_client_packages_updated_at
before update on public.client_packages
for each row
execute function private.set_updated_at();

create index idx_packages_status on public.packages(status);
create index idx_packages_package_type on public.packages(package_type);

create index idx_client_packages_client_id
  on public.client_packages(client_id);
create index idx_client_packages_package_id
  on public.client_packages(package_id);
create index idx_client_packages_status
  on public.client_packages(status);

create index idx_package_usage_history_client_package_id
  on public.package_usage_history(client_package_id);
create index idx_package_usage_history_appointment_id
  on public.package_usage_history(appointment_id);
create index idx_package_usage_history_change_type
  on public.package_usage_history(change_type);

alter table public.packages enable row level security;
alter table public.client_packages enable row level security;
alter table public.package_usage_history enable row level security;

revoke all on public.packages from public;
revoke all on public.packages from anon;
revoke all on public.packages from authenticated;

revoke all on public.client_packages from public;
revoke all on public.client_packages from anon;
revoke all on public.client_packages from authenticated;

revoke all on public.package_usage_history from public;
revoke all on public.package_usage_history from anon;
revoke all on public.package_usage_history from authenticated;

grant select on public.packages to authenticated;
grant select on public.client_packages to authenticated;
grant select on public.package_usage_history to authenticated;

create policy "operational users can read packages"
on public.packages
for select
to authenticated
using (
  private.has_permission('can_view_clients')
  or private.has_permission('can_manage_clients')
  or private.has_permission('can_view_appointments')
  or private.has_permission('can_manage_appointments')
);

create policy "operational users can read client packages"
on public.client_packages
for select
to authenticated
using (
  private.has_permission('can_view_clients')
  or private.has_permission('can_manage_clients')
  or private.has_permission('can_view_appointments')
  or private.has_permission('can_manage_appointments')
);

create policy "operational users can read package usage history"
on public.package_usage_history
for select
to authenticated
using (
  private.has_permission('can_view_clients')
  or private.has_permission('can_manage_clients')
  or private.has_permission('can_view_appointments')
  or private.has_permission('can_manage_appointments')
);

comment on table public.packages is
  'Local package catalog foundation. Browser writes are intentionally blocked until server-only audited mutation flows are approved.';

comment on table public.client_packages is
  'Local client package ownership foundation. Browser writes are intentionally blocked until server-only audited assignment and usage flows are approved.';

comment on table public.package_usage_history is
  'Local package usage history foundation. Browser writes are intentionally blocked until server-only audited package usage flows are approved.';
