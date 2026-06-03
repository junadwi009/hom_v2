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

select pg_temp.assert_true(
  exists (
    select 1
    from public.permissions
    where key = 'can_manage_client_packages'
  ),
  'can_manage_client_packages permission must exist'
);

select pg_temp.assert_true(
  exists (
    select 1
    from public.roles
    join public.role_permissions
      on role_permissions.role_id = roles.id
    join public.permissions
      on permissions.id = role_permissions.permission_id
    where roles.name = 'studio_director'
      and permissions.key = 'can_manage_client_packages'
  ),
  'studio_director must have can_manage_client_packages'
);

select pg_temp.assert_true(
  has_function_privilege(
    'authenticated',
    'public.assign_client_package(uuid,uuid,timestamptz)',
    'execute'
  ),
  'authenticated must be able to execute assign_client_package'
);

select pg_temp.assert_true(
  not has_function_privilege(
    'anon',
    'public.assign_client_package(uuid,uuid,timestamptz)',
    'execute'
  ),
  'anon must not execute assign_client_package'
);

set local role authenticated;
set local request.jwt.claim.sub = '93000000-0000-4000-8000-000000000001';

select pg_temp.assert_true(
  exists (
    select 1
    from public.get_current_app_user_context()
    where 'can_manage_client_packages' = any(permissions)
  ),
  'local Studio Director context must include client package management permission'
);

select *
from public.assign_client_package(
  '10000000-0000-4000-8000-000000000028',
  '50000000-0000-4000-8000-000000000007',
  '2036-06-03T09:00:00+07:00'
);

reset role;

select pg_temp.assert_true(
  exists (
    select 1
    from public.client_packages
    where client_id = '10000000-0000-4000-8000-000000000028'
      and package_id = '50000000-0000-4000-8000-000000000007'
      and purchased_at = '2036-06-03T09:00:00+07:00'
      and expires_at = '2036-06-03T09:00:00+07:00'::timestamptz
        + interval '90 days'
      and total_sessions = 6
      and remaining_sessions = 6
      and status = 'active'
  ),
  'active package assignment must create client package with copied sessions and calculated expiry'
);

select pg_temp.assert_true(
  exists (
    select 1
    from public.package_usage_history
    join public.client_packages
      on client_packages.id = package_usage_history.client_package_id
    where client_packages.client_id = '10000000-0000-4000-8000-000000000028'
      and client_packages.package_id = '50000000-0000-4000-8000-000000000007'
      and client_packages.purchased_at = '2036-06-03T09:00:00+07:00'
      and package_usage_history.change_type = 'assigned'
      and package_usage_history.quantity = 6
      and package_usage_history.before_remaining = 0
      and package_usage_history.after_remaining = 6
      and package_usage_history.actor_app_user_id =
        '94000000-0000-4000-8000-000000000001'
  ),
  'assignment must create assigned usage history'
);

select pg_temp.assert_true(
  exists (
    select 1
    from public.audit_logs
    join public.client_packages
      on client_packages.id = audit_logs.target_id
    where audit_logs.action = 'client_package.assigned'
      and audit_logs.target_type = 'client_package'
      and audit_logs.risk_level = 'high'
      and client_packages.client_id =
        '10000000-0000-4000-8000-000000000028'
      and client_packages.package_id =
        '50000000-0000-4000-8000-000000000007'
      and audit_logs.metadata ->> 'clientId' =
        '10000000-0000-4000-8000-000000000028'
      and audit_logs.metadata ->> 'packageId' =
        '50000000-0000-4000-8000-000000000007'
      and audit_logs.metadata ->> 'totalSessions' = '6'
      and audit_logs.metadata ->> 'remainingSessions' = '6'
      and audit_logs.metadata ? 'purchasedAt'
      and audit_logs.metadata ? 'expiresAt'
      and audit_logs.metadata ? 'payment' is false
      and audit_logs.metadata ? 'contact' is false
      and audit_logs.metadata ? 'clinical' is false
      and audit_logs.metadata ? 'whatsapp' is false
  ),
  'assignment must create safe audit row'
);

set local role authenticated;
set local request.jwt.claim.sub = '93000000-0000-4000-8000-000000000001';

do $$
begin
  begin
    perform *
    from public.assign_client_package(
      '10000000-0000-4000-8000-000000000028',
      '50000000-0000-4000-8000-000000000006',
      '2036-06-04T09:00:00+07:00'
    );
    raise exception 'ASSERTION_FAILED: inactive package assignment was accepted';
  exception
    when others then
      if sqlerrm <> 'PACKAGE_UNAVAILABLE' then raise; end if;
  end;
end;
$$;

do $$
begin
  begin
    perform *
    from public.assign_client_package(
      '10000000-0000-4000-8000-000000000028',
      '50000000-0000-4000-8000-000000000008',
      '2036-06-05T09:00:00+07:00'
    );
    raise exception 'ASSERTION_FAILED: archived package assignment was accepted';
  exception
    when others then
      if sqlerrm <> 'PACKAGE_UNAVAILABLE' then raise; end if;
  end;
end;
$$;

do $$
begin
  begin
    perform *
    from public.assign_client_package(
      '10000000-0000-4000-8000-000000000025',
      '50000000-0000-4000-8000-000000000007',
      '2036-06-06T09:00:00+07:00'
    );
    raise exception 'ASSERTION_FAILED: archived client assignment was accepted';
  exception
    when others then
      if sqlerrm <> 'CLIENT_UNAVAILABLE' then raise; end if;
  end;
end;
$$;

do $$
begin
  begin
    perform *
    from public.assign_client_package(
      '10000000-0000-4000-8000-000000000028',
      '50000000-0000-4000-8000-000000000007',
      null
    );
    raise exception 'ASSERTION_FAILED: null purchase time was accepted';
  exception
    when others then
      if sqlerrm <> 'PURCHASED_AT_REQUIRED' then raise; end if;
  end;
end;
$$;

do $$
begin
  begin
    insert into public.client_packages (
      client_id,
      package_id,
      purchased_at,
      expires_at,
      total_sessions,
      remaining_sessions,
      status
    )
    values (
      '10000000-0000-4000-8000-000000000028',
      '50000000-0000-4000-8000-000000000007',
      now(),
      now() + interval '90 days',
      6,
      6,
      'active'
    );
    raise exception 'ASSERTION_FAILED: direct client package insert was accepted';
  exception
    when insufficient_privilege then null;
  end;
end;
$$;

do $$
begin
  begin
    update public.client_packages
    set remaining_sessions = remaining_sessions
    where id = '51000000-0000-4000-8000-000000000001';
    raise exception 'ASSERTION_FAILED: direct client package update was accepted';
  exception
    when insufficient_privilege then null;
  end;
end;
$$;

do $$
begin
  begin
    delete from public.client_packages
    where id = '51000000-0000-4000-8000-000000000001';
    raise exception 'ASSERTION_FAILED: direct client package delete was accepted';
  exception
    when insufficient_privilege then null;
  end;
end;
$$;

do $$
begin
  begin
    insert into public.package_usage_history (
      client_package_id,
      change_type,
      quantity,
      before_remaining,
      after_remaining
    )
    values (
      '51000000-0000-4000-8000-000000000001',
      'assigned',
      2,
      0,
      2
    );
    raise exception 'ASSERTION_FAILED: direct usage history insert was accepted';
  exception
    when insufficient_privilege then null;
  end;
end;
$$;

do $$
begin
  begin
    update public.package_usage_history
    set reason = reason
    where id = '52000000-0000-4000-8000-000000000001';
    raise exception 'ASSERTION_FAILED: direct usage history update was accepted';
  exception
    when insufficient_privilege then null;
  end;
end;
$$;

do $$
begin
  begin
    delete from public.package_usage_history
    where id = '52000000-0000-4000-8000-000000000001';
    raise exception 'ASSERTION_FAILED: direct usage history delete was accepted';
  exception
    when insufficient_privilege then null;
  end;
end;
$$;

do $$
begin
  begin
    insert into public.audit_logs (action, target_type, risk_level)
    values ('client_package.assigned', 'client_package', 'high');
    raise exception 'ASSERTION_FAILED: direct audit insert was accepted';
  exception
    when insufficient_privilege then null;
  end;
end;
$$;

reset role;

insert into auth.users (id, email)
values ('96000000-0000-4000-8000-000000000006', 'phase5f.noaccess@example.invalid');

insert into public.app_users (
  id,
  auth_user_id,
  full_name,
  email,
  status
)
values (
  '97000000-0000-4000-8000-000000000006',
  '96000000-0000-4000-8000-000000000006',
  'Mock Phase 5F No Access',
  'phase5f.noaccess@example.invalid',
  'active'
);

set local role authenticated;
set local request.jwt.claim.sub = '96000000-0000-4000-8000-000000000006';

do $$
begin
  begin
    perform *
    from public.assign_client_package(
      '10000000-0000-4000-8000-000000000028',
      '50000000-0000-4000-8000-000000000007',
      '2036-06-07T09:00:00+07:00'
    );
    raise exception 'ASSERTION_FAILED: no-permission assignment was accepted';
  exception
    when others then
      if sqlerrm <> 'PERMISSION_DENIED' then raise; end if;
  end;
end;
$$;

reset role;

create function pg_temp.reject_phase_5f_audit()
returns trigger
language plpgsql
as $$
begin
  if new.action = 'client_package.assigned'
    and new.metadata ->> 'packageId' =
      '50000000-0000-4000-8000-000000000009' then
    raise exception 'MOCK_ASSIGN_AUDIT_FAILURE';
  end if;

  return new;
end;
$$;

create trigger reject_phase_5f_audit
before insert on public.audit_logs
for each row
execute function pg_temp.reject_phase_5f_audit();

set local role authenticated;
set local request.jwt.claim.sub = '93000000-0000-4000-8000-000000000001';

do $$
begin
  begin
    perform *
    from public.assign_client_package(
      '10000000-0000-4000-8000-000000000026',
      '50000000-0000-4000-8000-000000000009',
      '2036-06-08T09:00:00+07:00'
    );
    raise exception 'ASSERTION_FAILED: audit failure did not rollback assignment';
  exception
    when others then
      if sqlerrm <> 'MOCK_ASSIGN_AUDIT_FAILURE' then raise; end if;
  end;
end;
$$;

reset role;

select pg_temp.assert_true(
  not exists (
    select 1
    from public.client_packages
    where client_id = '10000000-0000-4000-8000-000000000026'
      and package_id = '50000000-0000-4000-8000-000000000009'
      and purchased_at = '2036-06-08T09:00:00+07:00'
  ),
  'audit failure must rollback client package insert'
);

select pg_temp.assert_true(
  not exists (
    select 1
    from public.package_usage_history
    join public.client_packages
      on client_packages.id = package_usage_history.client_package_id
    where client_packages.client_id =
      '10000000-0000-4000-8000-000000000026'
      and client_packages.package_id =
        '50000000-0000-4000-8000-000000000009'
      and client_packages.purchased_at = '2036-06-08T09:00:00+07:00'
  ),
  'audit failure must rollback usage history insert'
);

select 'phase_5f_assign_client_package_rpc_passed' as result;

rollback;
