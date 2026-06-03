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
  to_regclass('public.packages') is not null,
  'packages table must exist'
);

select pg_temp.assert_true(
  to_regclass('public.client_packages') is not null,
  'client_packages table must exist'
);

select pg_temp.assert_true(
  to_regclass('public.package_usage_history') is not null,
  'package_usage_history table must exist'
);

select pg_temp.assert_true(
  (select count(*) from public.packages) between 8 and 12,
  'package seed count must be between 8 and 12'
);

select pg_temp.assert_true(
  (select count(*) from public.client_packages) between 20 and 30,
  'client package seed count must be between 20 and 30'
);

select pg_temp.assert_true(
  (select count(*) from public.package_usage_history where change_type = 'assigned')
    = (select count(*) from public.client_packages),
  'each seeded client package must have one assigned usage history row'
);

select pg_temp.assert_true(
  not exists (
    select 1
    from pg_class
    where oid in (
      'public.packages'::regclass,
      'public.client_packages'::regclass,
      'public.package_usage_history'::regclass
    )
      and relrowsecurity is false
  ),
  'package tables must have RLS enabled'
);

select pg_temp.assert_true(
  not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename in ('packages', 'client_packages', 'package_usage_history')
      and cmd in ('INSERT', 'UPDATE', 'DELETE', 'ALL')
  ),
  'package tables must not have direct browser write policies'
);

select pg_temp.assert_true(
  to_regclass('public.payments') is null
    and to_regclass('public.finance_ledger') is null
    and to_regclass('public.clinical_notes') is null
    and to_regclass('public.whatsapp_messages') is null
    and to_regclass('public.ai_gateway_events') is null
    and to_regclass('public.worker_jobs') is null
    and to_regclass('public.payroll_entries') is null,
  'Phase 5C must not add prohibited product tables'
);

set local role authenticated;
set local request.jwt.claim.sub = '93000000-0000-4000-8000-000000000001';

select pg_temp.assert_true(
  (select count(*) from public.packages) = 10,
  'local Studio Director must read package catalog'
);

select pg_temp.assert_true(
  (select count(*) from public.client_packages) = 24,
  'local Studio Director must read client packages'
);

select pg_temp.assert_true(
  (select count(*) from public.package_usage_history) = 24,
  'local Studio Director must read package usage history'
);

do $$
begin
  begin
    insert into public.packages (
      name,
      package_type,
      total_sessions,
      validity_days,
      price_idr,
      status
    )
    values (
      'Mock Direct Write Probe',
      'intro',
      1,
      7,
      0,
      'active'
    );
    raise exception 'ASSERTION_FAILED: direct package insert was accepted';
  exception
    when insufficient_privilege then null;
  end;
end;
$$;

do $$
begin
  begin
    update public.packages
    set name = name
    where id = '50000000-0000-4000-8000-000000000001';
    raise exception 'ASSERTION_FAILED: direct package update was accepted';
  exception
    when insufficient_privilege then null;
  end;
end;
$$;

do $$
begin
  begin
    delete from public.packages
    where id = '50000000-0000-4000-8000-000000000001';
    raise exception 'ASSERTION_FAILED: direct package delete was accepted';
  exception
    when insufficient_privilege then null;
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
      '10000000-0000-4000-8000-000000000001',
      '50000000-0000-4000-8000-000000000001',
      now(),
      now() + interval '14 days',
      1,
      1,
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
      after_remaining,
      reason
    )
    values (
      '51000000-0000-4000-8000-000000000001',
      'assigned',
      1,
      0,
      1,
      'Mock direct write probe.'
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
    values ('package.created', 'package', 'high');
    raise exception 'ASSERTION_FAILED: direct authenticated audit insert was accepted';
  exception
    when insufficient_privilege then null;
  end;
end;
$$;

reset role;

insert into auth.users (id, email)
values ('96000000-0000-4000-8000-000000000005', 'phase5c.noaccess@example.invalid');

insert into public.app_users (
  id,
  auth_user_id,
  full_name,
  email,
  status
)
values (
  '97000000-0000-4000-8000-000000000005',
  '96000000-0000-4000-8000-000000000005',
  'Mock Phase 5C No Access',
  'phase5c.noaccess@example.invalid',
  'active'
);

set local role authenticated;
set local request.jwt.claim.sub = '96000000-0000-4000-8000-000000000005';

select pg_temp.assert_true(
  (select count(*) from public.packages) = 0,
  'user without operational permissions must not read packages'
);

select pg_temp.assert_true(
  (select count(*) from public.client_packages) = 0,
  'user without operational permissions must not read client packages'
);

select pg_temp.assert_true(
  (select count(*) from public.package_usage_history) = 0,
  'user without operational permissions must not read package usage history'
);

reset role;

select 'phase_5c_package_local_db_passed' as result;

rollback;
