create table public.app_users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  full_name text not null,
  email text unique not null,
  status text not null default 'active' check (
    status in ('active', 'inactive', 'invited', 'suspended')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  name text unique not null check (
    name in (
      'super_admin',
      'studio_director',
      'admin_frontdesk',
      'practitioner',
      'finance_admin',
      'marketing_admin',
      'viewer',
      'ai_agent_service'
    )
  ),
  description text,
  created_at timestamptz not null default now()
);

create table public.permissions (
  id uuid primary key default gen_random_uuid(),
  key text unique not null check (
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
  ),
  description text,
  created_at timestamptz not null default now()
);

create table public.user_roles (
  user_id uuid not null references public.app_users(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, role_id)
);

create table public.role_permissions (
  role_id uuid not null references public.roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (role_id, permission_id)
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references public.app_users(id) on delete set null,
  actor_auth_user_id uuid,
  action text not null check (
    action ~ '^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$'
  ),
  target_type text not null,
  target_id uuid,
  risk_level text not null default 'low' check (
    risk_level in ('low', 'medium', 'high', 'critical')
  ),
  metadata jsonb not null default '{}'::jsonb,
  request_id text,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

create or replace function private.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_app_users_updated_at
before update on public.app_users
for each row
execute function private.set_updated_at();

create index idx_app_users_auth_user_id on public.app_users(auth_user_id);
create index idx_roles_name on public.roles(name);
create index idx_permissions_key on public.permissions(key);
create index idx_user_roles_user_id on public.user_roles(user_id);
create index idx_role_permissions_permission_id on public.role_permissions(permission_id);
create index idx_audit_logs_target on public.audit_logs(target_type, target_id);
create index idx_audit_logs_actor_created_at on public.audit_logs(actor_user_id, created_at desc);

comment on table public.app_users is
  'Application user profiles mapped to Supabase auth.users identities.';
comment on table public.audit_logs is
  'Append-only audit trail for sensitive reads and writes.';
