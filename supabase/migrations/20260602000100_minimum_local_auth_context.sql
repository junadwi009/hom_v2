create or replace function public.get_current_app_user_context()
returns table (
  id uuid,
  auth_user_id uuid,
  full_name text,
  email text,
  status text,
  roles text[],
  permissions text[]
)
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_app_user public.app_users%rowtype;
begin
  if auth.uid() is null then
    raise exception using errcode = 'P0001', message = 'AUTH_REQUIRED';
  end if;

  select app_users.*
  into v_app_user
  from public.app_users
  where app_users.auth_user_id = auth.uid()
  limit 1;

  if v_app_user.id is null then
    raise exception using errcode = 'P0001', message = 'APP_USER_REQUIRED';
  end if;

  if v_app_user.status <> 'active' then
    raise exception using errcode = 'P0001', message = 'APP_USER_INACTIVE';
  end if;

  return query
  select
    v_app_user.id,
    v_app_user.auth_user_id,
    v_app_user.full_name,
    v_app_user.email,
    v_app_user.status,
    coalesce(
      array_agg(distinct roles.name order by roles.name)
        filter (where roles.name is not null),
      '{}'::text[]
    ),
    coalesce(
      array_agg(distinct permissions.key order by permissions.key)
        filter (where permissions.key is not null),
      '{}'::text[]
    )
  from public.app_users
  left join public.user_roles
    on user_roles.user_id = app_users.id
  left join public.roles
    on roles.id = user_roles.role_id
  left join public.role_permissions
    on role_permissions.role_id = roles.id
  left join public.permissions
    on permissions.id = role_permissions.permission_id
  where app_users.id = v_app_user.id
  group by app_users.id;
end;
$$;

revoke all on function public.get_current_app_user_context() from public;
revoke all on function public.get_current_app_user_context() from anon;
grant execute on function public.get_current_app_user_context()
to authenticated;

comment on function public.get_current_app_user_context() is
  'Authenticated self-context RPC for local-first SSR auth. Returns only the active caller profile, roles, and permissions without broadening direct permission-matrix reads.';
