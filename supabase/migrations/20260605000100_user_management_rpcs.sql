-- User / Admin Management RPCs.
-- Authenticated, permission-gated (`can_manage_users`) management of app_users:
-- list, provision (after auth user creation), status change, role replacement.
-- All writes are SECURITY DEFINER, audit-logged, and block self-lockout.

-- Defense-in-depth read policy. The list RPC below is SECURITY DEFINER so it does
-- not strictly need this, but allow user managers to read all profiles directly too.
create policy "user managers can read all app users"
on public.app_users
for select
to authenticated
using (private.has_permission('can_manage_users'));

-- Shared shape returned by every management RPC.
-- list_app_users: read-only aggregated list of all app users with their roles.
create or replace function public.list_app_users()
returns table (
  id uuid,
  auth_user_id uuid,
  full_name text,
  email text,
  status text,
  roles text[],
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public, private
stable
as $$
begin
  if auth.uid() is null then
    raise exception using errcode = 'P0001', message = 'AUTH_REQUIRED';
  end if;

  if not private.has_permission('can_manage_users') then
    raise exception using errcode = 'P0001', message = 'PERMISSION_DENIED';
  end if;

  return query
  select
    app_users.id,
    app_users.auth_user_id,
    app_users.full_name,
    app_users.email,
    app_users.status,
    coalesce(
      array_agg(distinct roles.name order by roles.name)
        filter (where roles.name is not null),
      '{}'::text[]
    ) as roles,
    app_users.created_at,
    app_users.updated_at
  from public.app_users
  left join public.user_roles
    on user_roles.user_id = app_users.id
  left join public.roles
    on roles.id = user_roles.role_id
  group by app_users.id
  order by app_users.full_name;
end;
$$;

-- provision_app_user: link an already-created auth.users identity to a new app_users
-- profile + role assignments. Auth user creation itself happens server-side via the
-- Supabase Admin API; this RPC owns the application-side records atomically.
create or replace function public.provision_app_user(
  p_auth_user_id uuid,
  p_full_name text,
  p_email text,
  p_role_names text[]
)
returns table (
  id uuid,
  auth_user_id uuid,
  full_name text,
  email text,
  status text,
  roles text[],
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_actor public.app_users%rowtype;
  v_new public.app_users%rowtype;
  v_role_name text;
  v_role_id uuid;
begin
  if auth.uid() is null then
    raise exception using errcode = 'P0001', message = 'AUTH_REQUIRED';
  end if;

  select app_users.*
  into v_actor
  from public.app_users
  where app_users.auth_user_id = auth.uid()
    and app_users.status = 'active'
  limit 1;

  if v_actor.id is null then
    raise exception using errcode = 'P0001', message = 'APP_USER_REQUIRED';
  end if;

  if not private.has_permission('can_manage_users') then
    raise exception using errcode = 'P0001', message = 'PERMISSION_DENIED';
  end if;

  if p_auth_user_id is null then
    raise exception using errcode = 'P0001', message = 'AUTH_USER_ID_REQUIRED';
  end if;

  if p_full_name is null or char_length(trim(p_full_name)) = 0 then
    raise exception using errcode = 'P0001', message = 'FULL_NAME_REQUIRED';
  end if;

  if p_email is null or char_length(trim(p_email)) = 0 then
    raise exception using errcode = 'P0001', message = 'EMAIL_REQUIRED';
  end if;

  if p_role_names is null or array_length(p_role_names, 1) is null then
    raise exception using errcode = 'P0001', message = 'ROLES_REQUIRED';
  end if;

  -- Validate every requested role exists before writing anything.
  foreach v_role_name in array p_role_names loop
    if not exists (select 1 from public.roles where roles.name = v_role_name) then
      raise exception using errcode = 'P0001', message = 'ROLE_UNKNOWN';
    end if;
  end loop;

  begin
    insert into public.app_users (auth_user_id, full_name, email, status)
    values (p_auth_user_id, trim(p_full_name), lower(trim(p_email)), 'active')
    returning * into v_new;
  exception
    when unique_violation then
      raise exception using errcode = 'P0001', message = 'EMAIL_ALREADY_EXISTS';
  end;

  foreach v_role_name in array p_role_names loop
    select roles.id into v_role_id from public.roles where roles.name = v_role_name;
    insert into public.user_roles (user_id, role_id)
    values (v_new.id, v_role_id)
    on conflict do nothing;
  end loop;

  insert into public.audit_logs (
    actor_user_id,
    actor_auth_user_id,
    action,
    target_type,
    target_id,
    risk_level,
    metadata
  )
  values (
    v_actor.id,
    auth.uid(),
    'user.created',
    'app_user',
    v_new.id,
    'high',
    jsonb_build_object('roles', p_role_names, 'email', v_new.email)
  );

  return query
  select
    v_new.id,
    v_new.auth_user_id,
    v_new.full_name,
    v_new.email,
    v_new.status,
    coalesce(
      array_agg(distinct roles.name order by roles.name)
        filter (where roles.name is not null),
      '{}'::text[]
    ) as roles,
    v_new.created_at,
    v_new.updated_at
  from public.app_users
  left join public.user_roles
    on user_roles.user_id = app_users.id
  left join public.roles
    on roles.id = user_roles.role_id
  where app_users.id = v_new.id
  group by app_users.id, v_new.id, v_new.auth_user_id, v_new.full_name,
    v_new.email, v_new.status, v_new.created_at, v_new.updated_at;
end;
$$;

-- set_app_user_status: change a user's lifecycle status. Cannot target self.
create or replace function public.set_app_user_status(
  p_target_user_id uuid,
  p_status text
)
returns table (
  id uuid,
  auth_user_id uuid,
  full_name text,
  email text,
  status text,
  roles text[],
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_actor public.app_users%rowtype;
  v_target public.app_users%rowtype;
  v_previous_status text;
begin
  if auth.uid() is null then
    raise exception using errcode = 'P0001', message = 'AUTH_REQUIRED';
  end if;

  select app_users.*
  into v_actor
  from public.app_users
  where app_users.auth_user_id = auth.uid()
    and app_users.status = 'active'
  limit 1;

  if v_actor.id is null then
    raise exception using errcode = 'P0001', message = 'APP_USER_REQUIRED';
  end if;

  if not private.has_permission('can_manage_users') then
    raise exception using errcode = 'P0001', message = 'PERMISSION_DENIED';
  end if;

  if p_status not in ('active', 'inactive', 'invited', 'suspended') then
    raise exception using errcode = 'P0001', message = 'STATUS_INVALID';
  end if;

  select app_users.* into v_target
  from public.app_users
  where app_users.id = p_target_user_id
  for update;

  if v_target.id is null then
    raise exception using errcode = 'P0001', message = 'APP_USER_NOT_FOUND';
  end if;

  if v_target.id = v_actor.id then
    raise exception using errcode = 'P0001', message = 'CANNOT_MODIFY_SELF';
  end if;

  v_previous_status := v_target.status;

  update public.app_users
  set status = p_status
  where app_users.id = p_target_user_id
  returning * into v_target;

  insert into public.audit_logs (
    actor_user_id,
    actor_auth_user_id,
    action,
    target_type,
    target_id,
    risk_level,
    metadata
  )
  values (
    v_actor.id,
    auth.uid(),
    'user.status_changed',
    'app_user',
    v_target.id,
    'high',
    jsonb_build_object('previousStatus', v_previous_status, 'newStatus', p_status)
  );

  return query
  select
    v_target.id,
    v_target.auth_user_id,
    v_target.full_name,
    v_target.email,
    v_target.status,
    coalesce(
      array_agg(distinct roles.name order by roles.name)
        filter (where roles.name is not null),
      '{}'::text[]
    ) as roles,
    v_target.created_at,
    v_target.updated_at
  from public.app_users
  left join public.user_roles
    on user_roles.user_id = app_users.id
  left join public.roles
    on roles.id = user_roles.role_id
  where app_users.id = v_target.id
  group by app_users.id, v_target.id, v_target.auth_user_id, v_target.full_name,
    v_target.email, v_target.status, v_target.created_at, v_target.updated_at;
end;
$$;

-- set_app_user_roles: replace a user's role assignments. Cannot target self.
create or replace function public.set_app_user_roles(
  p_target_user_id uuid,
  p_role_names text[]
)
returns table (
  id uuid,
  auth_user_id uuid,
  full_name text,
  email text,
  status text,
  roles text[],
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_actor public.app_users%rowtype;
  v_target public.app_users%rowtype;
  v_role_name text;
  v_role_id uuid;
  v_previous_roles text[];
begin
  if auth.uid() is null then
    raise exception using errcode = 'P0001', message = 'AUTH_REQUIRED';
  end if;

  select app_users.*
  into v_actor
  from public.app_users
  where app_users.auth_user_id = auth.uid()
    and app_users.status = 'active'
  limit 1;

  if v_actor.id is null then
    raise exception using errcode = 'P0001', message = 'APP_USER_REQUIRED';
  end if;

  if not private.has_permission('can_manage_users') then
    raise exception using errcode = 'P0001', message = 'PERMISSION_DENIED';
  end if;

  if p_role_names is null or array_length(p_role_names, 1) is null then
    raise exception using errcode = 'P0001', message = 'ROLES_REQUIRED';
  end if;

  foreach v_role_name in array p_role_names loop
    if not exists (select 1 from public.roles where roles.name = v_role_name) then
      raise exception using errcode = 'P0001', message = 'ROLE_UNKNOWN';
    end if;
  end loop;

  select app_users.* into v_target
  from public.app_users
  where app_users.id = p_target_user_id
  for update;

  if v_target.id is null then
    raise exception using errcode = 'P0001', message = 'APP_USER_NOT_FOUND';
  end if;

  if v_target.id = v_actor.id then
    raise exception using errcode = 'P0001', message = 'CANNOT_MODIFY_SELF';
  end if;

  select coalesce(array_agg(roles.name order by roles.name), '{}'::text[])
  into v_previous_roles
  from public.user_roles
  join public.roles on roles.id = user_roles.role_id
  where user_roles.user_id = v_target.id;

  delete from public.user_roles where user_roles.user_id = v_target.id;

  foreach v_role_name in array p_role_names loop
    select roles.id into v_role_id from public.roles where roles.name = v_role_name;
    insert into public.user_roles (user_id, role_id)
    values (v_target.id, v_role_id)
    on conflict do nothing;
  end loop;

  insert into public.audit_logs (
    actor_user_id,
    actor_auth_user_id,
    action,
    target_type,
    target_id,
    risk_level,
    metadata
  )
  values (
    v_actor.id,
    auth.uid(),
    'user.roles_changed',
    'app_user',
    v_target.id,
    'high',
    jsonb_build_object('previousRoles', v_previous_roles, 'newRoles', p_role_names)
  );

  return query
  select
    v_target.id,
    v_target.auth_user_id,
    v_target.full_name,
    v_target.email,
    v_target.status,
    coalesce(
      array_agg(distinct roles.name order by roles.name)
        filter (where roles.name is not null),
      '{}'::text[]
    ) as roles,
    v_target.created_at,
    v_target.updated_at
  from public.app_users
  left join public.user_roles
    on user_roles.user_id = app_users.id
  left join public.roles
    on roles.id = user_roles.role_id
  where app_users.id = v_target.id
  group by app_users.id, v_target.id, v_target.auth_user_id, v_target.full_name,
    v_target.email, v_target.status, v_target.created_at, v_target.updated_at;
end;
$$;

revoke all on function public.list_app_users() from public;
revoke all on function public.list_app_users() from anon;
grant execute on function public.list_app_users() to authenticated;

revoke all on function public.provision_app_user(uuid, text, text, text[]) from public;
revoke all on function public.provision_app_user(uuid, text, text, text[]) from anon;
grant execute on function public.provision_app_user(uuid, text, text, text[]) to authenticated;

revoke all on function public.set_app_user_status(uuid, text) from public;
revoke all on function public.set_app_user_status(uuid, text) from anon;
grant execute on function public.set_app_user_status(uuid, text) to authenticated;

revoke all on function public.set_app_user_roles(uuid, text[]) from public;
revoke all on function public.set_app_user_roles(uuid, text[]) from anon;
grant execute on function public.set_app_user_roles(uuid, text[]) to authenticated;

comment on function public.list_app_users() is
  'Authenticated, can_manage_users-gated list of all app users with aggregated role names.';
comment on function public.provision_app_user(uuid, text, text, text[]) is
  'Links a Supabase auth identity to a new app_users profile + roles. Permission-gated and audit-logged. Auth user creation is performed server-side via the Admin API.';
comment on function public.set_app_user_status(uuid, text) is
  'Permission-gated app_user status change with audit logging. Blocks modifying the caller''s own account.';
comment on function public.set_app_user_roles(uuid, text[]) is
  'Permission-gated replacement of an app_user''s role assignments with audit logging. Blocks modifying the caller''s own account.';
