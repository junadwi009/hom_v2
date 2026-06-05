\set ON_ERROR_STOP on

begin;

create function pg_temp.assert_true(condition boolean, message text)
returns void
language plpgsql
as $$
begin
  if not condition then
    raise exception 'ASSERTION_FAILED: %', message;
  end if;
end;
$$;

-- Grants: authenticated can execute, anon cannot.
select pg_temp.assert_true(
  has_function_privilege('authenticated', 'public.list_app_users()', 'execute'),
  'authenticated must be able to execute list_app_users'
);
select pg_temp.assert_true(
  not has_function_privilege('anon', 'public.list_app_users()', 'execute'),
  'anon must not be able to execute list_app_users'
);
select pg_temp.assert_true(
  has_function_privilege('authenticated', 'public.provision_app_user(uuid,text,text,text[])', 'execute'),
  'authenticated must be able to execute provision_app_user'
);
select pg_temp.assert_true(
  not has_function_privilege('anon', 'public.set_app_user_status(uuid,text)', 'execute'),
  'anon must not be able to execute set_app_user_status'
);

-- Seeded studio_director (has can_manage_users).
set local role authenticated;
set local request.jwt.claim.sub = '93000000-0000-4000-8000-000000000001';

-- list returns at least the seeded director.
select pg_temp.assert_true(
  (select count(*) from public.list_app_users()) >= 1,
  'list_app_users must return seeded users'
);

-- Provision needs a pre-created auth identity (Admin API does this in the app).
reset role;
insert into auth.users (id, email)
values ('98000000-0000-4000-8000-0000000000aa', 'usermgmt.new@example.invalid');

set local role authenticated;
set local request.jwt.claim.sub = '93000000-0000-4000-8000-000000000001';

select *
from public.provision_app_user(
  '98000000-0000-4000-8000-0000000000aa',
  'User Mgmt New',
  'usermgmt.new@example.invalid',
  array['admin_frontdesk']
);

reset role;

select pg_temp.assert_true(
  exists (
    select 1 from public.app_users
    where email = 'usermgmt.new@example.invalid' and status = 'active'
  ),
  'provision must create active app_user'
);
select pg_temp.assert_true(
  exists (
    select 1 from public.user_roles ur
    join public.app_users au on au.id = ur.user_id
    join public.roles r on r.id = ur.role_id
    where au.email = 'usermgmt.new@example.invalid' and r.name = 'admin_frontdesk'
  ),
  'provision must assign requested role'
);
select pg_temp.assert_true(
  exists (
    select 1 from public.audit_logs
    where action = 'user.created'
      and target_id = (select id from public.app_users where email = 'usermgmt.new@example.invalid')
  ),
  'provision must write user.created audit row'
);

-- Replace roles, then change status, on the new (non-self) user.
set local role authenticated;
set local request.jwt.claim.sub = '93000000-0000-4000-8000-000000000001';

select *
from public.set_app_user_roles(
  (select id from public.app_users where email = 'usermgmt.new@example.invalid'),
  array['finance_admin', 'viewer']
);

select *
from public.set_app_user_status(
  (select id from public.app_users where email = 'usermgmt.new@example.invalid'),
  'inactive'
);

reset role;

select pg_temp.assert_true(
  exists (
    select 1 from public.user_roles ur
    join public.app_users au on au.id = ur.user_id
    join public.roles r on r.id = ur.role_id
    where au.email = 'usermgmt.new@example.invalid' and r.name = 'finance_admin'
  )
  and not exists (
    select 1 from public.user_roles ur
    join public.app_users au on au.id = ur.user_id
    join public.roles r on r.id = ur.role_id
    where au.email = 'usermgmt.new@example.invalid' and r.name = 'admin_frontdesk'
  ),
  'set_app_user_roles must replace the prior assignment'
);
select pg_temp.assert_true(
  exists (
    select 1 from public.app_users
    where email = 'usermgmt.new@example.invalid' and status = 'inactive'
  ),
  'set_app_user_status must update status'
);

-- Self-guard: director cannot modify own status.
set local role authenticated;
set local request.jwt.claim.sub = '93000000-0000-4000-8000-000000000001';

do $$
declare
  v_self uuid;
begin
  select id into v_self from public.app_users
  where auth_user_id = '93000000-0000-4000-8000-000000000001';
  begin
    perform * from public.set_app_user_status(v_self, 'suspended');
    raise exception 'ASSERTION_FAILED: self status change was accepted';
  exception
    when others then
      if sqlerrm <> 'CANNOT_MODIFY_SELF' then raise; end if;
  end;
end;
$$;

-- Unknown role rejected.
do $$
begin
  begin
    perform * from public.set_app_user_roles(
      (select id from public.app_users where email = 'usermgmt.new@example.invalid'),
      array['not_a_real_role']
    );
    raise exception 'ASSERTION_FAILED: unknown role was accepted';
  exception
    when others then
      if sqlerrm <> 'ROLE_UNKNOWN' then raise; end if;
  end;
end;
$$;

reset role;

-- Permission denied for a viewer (no can_manage_users).
insert into auth.users (id, email)
values ('98000000-0000-4000-8000-0000000000bb', 'usermgmt.viewer@example.invalid');
insert into public.app_users (id, auth_user_id, full_name, email, status)
values (
  '99000000-0000-4000-8000-0000000000bb',
  '98000000-0000-4000-8000-0000000000bb',
  'User Mgmt Viewer',
  'usermgmt.viewer@example.invalid',
  'active'
);
insert into public.user_roles (user_id, role_id)
select '99000000-0000-4000-8000-0000000000bb', roles.id
from public.roles where roles.name = 'viewer';

set local role authenticated;
set local request.jwt.claim.sub = '98000000-0000-4000-8000-0000000000bb';

do $$
begin
  begin
    perform * from public.list_app_users();
    raise exception 'ASSERTION_FAILED: viewer listed users';
  exception
    when others then
      if sqlerrm <> 'PERMISSION_DENIED' then raise; end if;
  end;
end;
$$;

reset role;

select 'phase_user_management_rpcs_passed' as result;

rollback;
