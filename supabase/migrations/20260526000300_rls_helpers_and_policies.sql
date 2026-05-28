create or replace function private.current_app_user_id()
returns uuid
language sql
security definer
set search_path = public, private
stable
as $$
  select app_users.id
  from public.app_users
  where app_users.auth_user_id = auth.uid()
  limit 1
$$;

create or replace function private.has_permission(permission_key text)
returns boolean
language sql
security definer
set search_path = public, private
stable
as $$
  select exists (
    select 1
    from public.app_users
    join public.user_roles
      on user_roles.user_id = app_users.id
    join public.role_permissions
      on role_permissions.role_id = user_roles.role_id
    join public.permissions
      on permissions.id = role_permissions.permission_id
    where app_users.auth_user_id = auth.uid()
      and permissions.key = permission_key
  )
$$;

revoke all on function private.current_app_user_id() from public;
revoke all on function private.has_permission(text) from public;
grant execute on function private.current_app_user_id() to authenticated;
grant execute on function private.has_permission(text) to authenticated;

alter table public.app_users enable row level security;
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.user_roles enable row level security;
alter table public.role_permissions enable row level security;
alter table public.audit_logs enable row level security;

revoke all on public.audit_logs from public;
revoke all on public.audit_logs from anon;
revoke all on public.audit_logs from authenticated;

grant select on public.app_users to authenticated;
grant select on public.roles to authenticated;
grant select on public.permissions to authenticated;
grant select on public.user_roles to authenticated;
grant select on public.role_permissions to authenticated;
grant select on public.audit_logs to authenticated;

create policy "app users can read their own profile"
on public.app_users
for select
to authenticated
using (auth.uid() = auth_user_id);

create policy "role reference data is readable by authenticated users"
on public.roles
for select
to authenticated
using (true);

create policy "permission reference data is readable by authenticated users"
on public.permissions
for select
to authenticated
using (true);

create policy "users can read their own role assignments"
on public.user_roles
for select
to authenticated
using (user_id = private.current_app_user_id());

create policy "role managers can read all role assignments"
on public.user_roles
for select
to authenticated
using (private.has_permission('can_manage_roles_permissions'));

create policy "role managers can read the permission matrix"
on public.role_permissions
for select
to authenticated
using (private.has_permission('can_manage_roles_permissions'));

create policy "audit viewers can read audit logs"
on public.audit_logs
for select
to authenticated
using (private.has_permission('can_view_audit_logs'));

comment on table public.audit_logs is
  'Append-only audit trail. Direct client inserts are intentionally blocked by RLS; a server-only audit writer will be introduced later when backend mutation flows exist.';
