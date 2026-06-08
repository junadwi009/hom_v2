-- Settings module backends:
--   1. set_role_permissions  -> editable RBAC permission matrix (role_permissions)
--   2. branches + create_branch -> lean branch registry
--   3. list_audit_logs        -> read-only audit log viewer
-- RPCs follow the admin convention in 20260605000100_user_management_rpcs.sql
-- (auth + app_user + permission gate, SECURITY DEFINER, audit-logged). No new
-- permission keys are introduced.

-- ===========================================================================
-- 1. set_role_permissions — replace a role's permission set (RBAC matrix edit)
-- ===========================================================================

create or replace function public.set_role_permissions(
  p_role_name text,
  p_permission_keys text[]
)
returns table (
  role_name text,
  permission_keys text[]
)
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_actor public.app_users%rowtype;
  v_role public.roles%rowtype;
  v_key text;
  v_permission_id uuid;
  v_previous_keys text[];
begin
  if auth.uid() is null then
    raise exception using errcode = 'P0001', message = 'AUTH_REQUIRED';
  end if;

  select app_users.* into v_actor
  from public.app_users
  where app_users.auth_user_id = auth.uid() and app_users.status = 'active'
  limit 1;

  if v_actor.id is null then
    raise exception using errcode = 'P0001', message = 'APP_USER_REQUIRED';
  end if;

  if not private.has_permission('can_manage_roles_permissions') then
    raise exception using errcode = 'P0001', message = 'PERMISSION_DENIED';
  end if;

  -- Keep the break-glass full-access role intact (prevents total lockout).
  if p_role_name = 'super_admin' then
    raise exception using errcode = 'P0001', message = 'ROLE_PROTECTED';
  end if;

  select roles.* into v_role from public.roles where roles.name = p_role_name;
  if v_role.id is null then
    raise exception using errcode = 'P0001', message = 'ROLE_UNKNOWN';
  end if;

  if p_permission_keys is null then
    raise exception using errcode = 'P0001', message = 'PERMISSIONS_REQUIRED';
  end if;

  -- Validate every requested permission key exists before writing anything.
  foreach v_key in array p_permission_keys loop
    if not exists (select 1 from public.permissions where permissions.key = v_key) then
      raise exception using errcode = 'P0001', message = 'PERMISSION_UNKNOWN';
    end if;
  end loop;

  select coalesce(array_agg(permissions.key order by permissions.key), '{}'::text[])
  into v_previous_keys
  from public.role_permissions
  join public.permissions on permissions.id = role_permissions.permission_id
  where role_permissions.role_id = v_role.id;

  delete from public.role_permissions where role_permissions.role_id = v_role.id;

  foreach v_key in array p_permission_keys loop
    select permissions.id into v_permission_id
    from public.permissions where permissions.key = v_key;
    insert into public.role_permissions (role_id, permission_id)
    values (v_role.id, v_permission_id)
    on conflict do nothing;
  end loop;

  insert into public.audit_logs (
    actor_user_id, actor_auth_user_id, action, target_type, target_id, risk_level, metadata
  )
  values (
    v_actor.id, auth.uid(), 'role.permissions_changed', 'role', v_role.id, 'high',
    jsonb_build_object('role', p_role_name, 'previousKeys', v_previous_keys, 'newKeys', p_permission_keys)
  );

  return query
  select
    v_role.name,
    coalesce(
      array_agg(permissions.key order by permissions.key)
        filter (where permissions.key is not null),
      '{}'::text[]
    )
  from public.role_permissions
  left join public.permissions on permissions.id = role_permissions.permission_id
  where role_permissions.role_id = v_role.id;
end;
$$;

revoke all on function public.set_role_permissions(text, text[]) from public;
revoke all on function public.set_role_permissions(text, text[]) from anon;
grant execute on function public.set_role_permissions(text, text[]) to authenticated;

comment on function public.set_role_permissions(text, text[]) is
  'Authenticated, can_manage_roles_permissions-gated replacement of a role''s permission set with audit logging. super_admin is protected.';

-- ===========================================================================
-- 2. branches table + create_branch RPC
-- ===========================================================================

create table public.branches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text,
  address text,
  manager_name text,
  phone text,
  email text,
  branch_type text not null default 'satellite' check (
    branch_type in ('main', 'satellite')
  ),
  status text not null default 'active' check (
    status in ('active', 'inactive', 'archived')
  ),
  created_by_app_user_id uuid references public.app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_branches_updated_at
before update on public.branches
for each row
execute function private.set_updated_at();

create index idx_branches_status on public.branches(status);
create index idx_branches_lower_name on public.branches (lower(name));

alter table public.branches enable row level security;

revoke all on public.branches from public;
revoke all on public.branches from anon;
revoke all on public.branches from authenticated;

grant select on public.branches to authenticated;

create policy "settings admins can read branches"
on public.branches
for select
to authenticated
using (private.has_permission('can_manage_users'));

comment on table public.branches is
  'Local registry of studio branches/locations. Browser writes are intentionally blocked until server-only audited mutation flows are approved.';

create or replace function public.create_branch(
  p_name text,
  p_city text,
  p_address text,
  p_manager_name text,
  p_phone text,
  p_email text,
  p_branch_type text,
  p_status text
)
returns table (
  id uuid,
  name text,
  city text,
  address text,
  manager_name text,
  phone text,
  email text,
  branch_type text,
  status text,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_actor public.app_users%rowtype;
  v_new public.branches%rowtype;
begin
  if auth.uid() is null then
    raise exception using errcode = 'P0001', message = 'AUTH_REQUIRED';
  end if;

  select app_users.* into v_actor
  from public.app_users
  where app_users.auth_user_id = auth.uid() and app_users.status = 'active'
  limit 1;

  if v_actor.id is null then
    raise exception using errcode = 'P0001', message = 'APP_USER_REQUIRED';
  end if;

  if not private.has_permission('can_manage_users') then
    raise exception using errcode = 'P0001', message = 'PERMISSION_DENIED';
  end if;

  if p_name is null or char_length(trim(p_name)) = 0 then
    raise exception using errcode = 'P0001', message = 'NAME_REQUIRED';
  end if;

  if char_length(trim(p_name)) > 120 then
    raise exception using errcode = 'P0001', message = 'NAME_TOO_LONG';
  end if;

  if p_branch_type not in ('main', 'satellite') then
    raise exception using errcode = 'P0001', message = 'BRANCH_TYPE_INVALID';
  end if;

  if p_status not in ('active', 'inactive', 'archived') then
    raise exception using errcode = 'P0001', message = 'STATUS_INVALID';
  end if;

  insert into public.branches (
    name, city, address, manager_name, phone, email, branch_type, status, created_by_app_user_id
  )
  values (
    trim(p_name),
    nullif(trim(coalesce(p_city, '')), ''),
    nullif(trim(coalesce(p_address, '')), ''),
    nullif(trim(coalesce(p_manager_name, '')), ''),
    nullif(trim(coalesce(p_phone, '')), ''),
    nullif(trim(coalesce(p_email, '')), ''),
    p_branch_type,
    p_status,
    v_actor.id
  )
  returning * into v_new;

  insert into public.audit_logs (
    actor_user_id, actor_auth_user_id, action, target_type, target_id, risk_level, metadata
  )
  values (
    v_actor.id, auth.uid(), 'branch.created', 'branch', v_new.id, 'low',
    jsonb_build_object('branch_type', v_new.branch_type, 'status', v_new.status)
  );

  return query
  select v_new.id, v_new.name, v_new.city, v_new.address, v_new.manager_name,
    v_new.phone, v_new.email, v_new.branch_type, v_new.status,
    v_new.created_at, v_new.updated_at;
end;
$$;

revoke all on function public.create_branch(text, text, text, text, text, text, text, text) from public;
revoke all on function public.create_branch(text, text, text, text, text, text, text, text) from anon;
grant execute on function public.create_branch(text, text, text, text, text, text, text, text) to authenticated;

comment on function public.create_branch(text, text, text, text, text, text, text, text) is
  'Authenticated, can_manage_users-gated branch registry creation with audit logging.';

-- ===========================================================================
-- 3. list_audit_logs — read-only audit log viewer feed
-- ===========================================================================

create or replace function public.list_audit_logs(
  p_limit integer,
  p_action_prefix text
)
returns table (
  id uuid,
  created_at timestamptz,
  actor_name text,
  action text,
  target_type text,
  risk_level text,
  metadata jsonb,
  ip_address text
)
language plpgsql
security definer
set search_path = public, private
stable
as $$
declare
  v_limit integer;
begin
  if auth.uid() is null then
    raise exception using errcode = 'P0001', message = 'AUTH_REQUIRED';
  end if;

  if not private.has_permission('can_view_audit_logs') then
    raise exception using errcode = 'P0001', message = 'PERMISSION_DENIED';
  end if;

  v_limit := least(coalesce(p_limit, 50), 200);
  if v_limit < 1 then
    v_limit := 50;
  end if;

  return query
  select
    audit_logs.id,
    audit_logs.created_at,
    coalesce(actor.full_name, 'Unknown User') as actor_name,
    audit_logs.action,
    audit_logs.target_type,
    audit_logs.risk_level,
    audit_logs.metadata,
    audit_logs.ip_address
  from public.audit_logs
  left join public.app_users actor on actor.id = audit_logs.actor_user_id
  where p_action_prefix is null
    or p_action_prefix = ''
    or audit_logs.action like p_action_prefix || '%'
  order by audit_logs.created_at desc
  limit v_limit;
end;
$$;

revoke all on function public.list_audit_logs(integer, text) from public;
revoke all on function public.list_audit_logs(integer, text) from anon;
grant execute on function public.list_audit_logs(integer, text) to authenticated;

comment on function public.list_audit_logs(integer, text) is
  'Authenticated, can_view_audit_logs-gated recent audit log feed with actor names and optional action-prefix filter.';
