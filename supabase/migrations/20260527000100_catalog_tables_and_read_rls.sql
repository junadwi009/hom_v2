create table public.practitioners (
  id uuid primary key default gen_random_uuid(),
  app_user_id uuid unique references public.app_users(id) on delete set null,
  display_name text not null,
  email text,
  status text not null default 'active' check (
    status in ('active', 'inactive', 'archived')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text,
  email text,
  status text not null default 'active' check (
    status in ('active', 'inactive', 'prospect', 'archived')
  ),
  primary_practitioner_id uuid references public.practitioners(id) on delete set null,
  created_by_app_user_id uuid references public.app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  default_duration_minutes integer not null check (
    default_duration_minutes > 0
    and default_duration_minutes <= 480
  ),
  default_price_idr bigint,
  status text not null default 'active' check (
    status in ('active', 'inactive', 'archived')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_practitioners_updated_at
before update on public.practitioners
for each row
execute function private.set_updated_at();

create trigger set_clients_updated_at
before update on public.clients
for each row
execute function private.set_updated_at();

create trigger set_services_updated_at
before update on public.services
for each row
execute function private.set_updated_at();

create index idx_practitioners_status on public.practitioners(status);
create index idx_practitioners_lower_display_name
  on public.practitioners (lower(display_name));

create index idx_clients_status on public.clients(status);
create index idx_clients_primary_practitioner_id
  on public.clients(primary_practitioner_id);
create index idx_clients_lower_full_name
  on public.clients (lower(full_name));

create index idx_services_status on public.services(status);
create index idx_services_category on public.services(category);
create index idx_services_lower_name on public.services (lower(name));

alter table public.practitioners enable row level security;
alter table public.clients enable row level security;
alter table public.services enable row level security;

revoke all on public.practitioners from public;
revoke all on public.practitioners from anon;
revoke all on public.practitioners from authenticated;

revoke all on public.clients from public;
revoke all on public.clients from anon;
revoke all on public.clients from authenticated;

revoke all on public.services from public;
revoke all on public.services from anon;
revoke all on public.services from authenticated;

grant select on public.practitioners to authenticated;
grant select on public.clients to authenticated;
grant select on public.services to authenticated;

create policy "permitted users can read practitioners"
on public.practitioners
for select
to authenticated
using (
  private.has_permission('can_view_practitioners')
  or private.has_permission('can_manage_practitioners')
  or private.has_permission('can_view_appointments')
  or private.has_permission('can_manage_appointments')
);

create policy "permitted users can read clients"
on public.clients
for select
to authenticated
using (
  private.has_permission('can_view_clients')
  or private.has_permission('can_manage_clients')
);

create policy "permitted users can read services"
on public.services
for select
to authenticated
using (
  private.has_permission('can_manage_services')
  or private.has_permission('can_view_appointments')
  or private.has_permission('can_manage_appointments')
);

comment on table public.practitioners is
  'Local catalog table for practitioner directory records. Browser writes are intentionally blocked until server-only audited mutation flows are approved.';

comment on table public.clients is
  'Local catalog table for basic client directory records. Browser writes are intentionally blocked until server-only audited mutation flows are approved.';

comment on table public.services is
  'Local catalog table for service directory records using IDR price naming. Browser writes are intentionally blocked until server-only audited mutation flows are approved.';
