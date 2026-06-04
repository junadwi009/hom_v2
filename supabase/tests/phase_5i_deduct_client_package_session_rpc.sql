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

-- Function privileges.
select pg_temp.assert_true(
  has_function_privilege(
    'authenticated',
    'public.deduct_client_package_session(uuid,uuid)',
    'execute'
  ),
  'authenticated must be able to execute deduct_client_package_session'
);

select pg_temp.assert_true(
  not has_function_privilege(
    'anon',
    'public.deduct_client_package_session(uuid,uuid)',
    'execute'
  ),
  'anon must not execute deduct_client_package_session'
);

-- Idempotency backstop index exists.
select pg_temp.assert_true(
  exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and indexname = 'uq_package_usage_history_deducted_appointment'
  ),
  'partial unique deducted-appointment index must exist'
);

-- Superuser fixture setup for negative scenarios.
update public.client_packages
set remaining_sessions = 1
where id = '51000000-0000-4000-8000-000000000014';

update public.client_packages
set status = 'expired'
where id = '51000000-0000-4000-8000-000000000002';

update public.client_packages
set status = 'depleted', remaining_sessions = 0
where id = '51000000-0000-4000-8000-000000000001';

-- Active status but past expiry, for the expiry-date denial.
insert into public.client_packages (
  id, client_id, package_id, purchased_at, expires_at,
  total_sessions, remaining_sessions, status
)
values (
  '5a000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  '50000000-0000-4000-8000-000000000007',
  '2026-01-01T09:00:00+07:00',
  '2026-02-01T09:00:00+07:00',
  6, 6, 'active'
);

-- Active future package reserved for the audit-rollback probe.
insert into public.client_packages (
  id, client_id, package_id, purchased_at, expires_at,
  total_sessions, remaining_sessions, status
)
values (
  '5a000000-0000-4000-8000-000000000002',
  '10000000-0000-4000-8000-000000000001',
  '50000000-0000-4000-8000-000000000001',
  '2026-06-01T09:00:00+07:00',
  '2026-12-01T09:00:00+07:00',
  2, 2, 'active'
);

-- No-permission user fixture.
insert into auth.users (id, email)
values (
  '96000000-0000-4000-8000-000000000007',
  'phase5i.noaccess@example.invalid'
);

insert into public.app_users (id, auth_user_id, full_name, email, status)
values (
  '97000000-0000-4000-8000-000000000007',
  '96000000-0000-4000-8000-000000000007',
  'Mock Phase 5I No Access',
  'phase5i.noaccess@example.invalid',
  'active'
);

-- Active package allowed: decrement by exactly one.
set local role authenticated;
set local request.jwt.claim.sub = '93000000-0000-4000-8000-000000000001';

select *
from public.deduct_client_package_session(
  '40000000-0000-4000-8000-000000000003',
  '51000000-0000-4000-8000-000000000005'
);

reset role;

select pg_temp.assert_true(
  exists (
    select 1
    from public.client_packages
    where id = '51000000-0000-4000-8000-000000000005'
      and remaining_sessions = 11
      and status = 'active'
  ),
  'active deduction must decrement remaining_sessions by one'
);

select pg_temp.assert_true(
  exists (
    select 1
    from public.package_usage_history
    where appointment_id = '40000000-0000-4000-8000-000000000003'
      and client_package_id = '51000000-0000-4000-8000-000000000005'
      and change_type = 'deducted'
      and quantity = 1
      and before_remaining = 12
      and after_remaining = 11
      and actor_app_user_id = '94000000-0000-4000-8000-000000000001'
  ),
  'active deduction must insert a deducted usage row'
);

select pg_temp.assert_true(
  exists (
    select 1
    from public.audit_logs
    where action = 'package_usage.recorded'
      and target_type = 'client_package'
      and target_id = '51000000-0000-4000-8000-000000000005'
      and risk_level = 'high'
      and metadata ->> 'clientPackageId' =
        '51000000-0000-4000-8000-000000000005'
      and metadata ->> 'appointmentId' =
        '40000000-0000-4000-8000-000000000003'
      and metadata ->> 'beforeRemaining' = '12'
      and metadata ->> 'afterRemaining' = '11'
      and metadata ->> 'quantity' = '1'
      and (metadata ? 'payment') is false
      and (metadata ? 'contact') is false
      and (metadata ? 'clinical') is false
      and (metadata ? 'whatsapp') is false
  ),
  'active deduction must insert a safe package_usage.recorded audit row'
);

-- Decrement to zero flips the client package to depleted.
set local role authenticated;
set local request.jwt.claim.sub = '93000000-0000-4000-8000-000000000001';

select *
from public.deduct_client_package_session(
  '40000000-0000-4000-8000-000000000008',
  '51000000-0000-4000-8000-000000000014'
);

reset role;

select pg_temp.assert_true(
  exists (
    select 1
    from public.client_packages
    where id = '51000000-0000-4000-8000-000000000014'
      and remaining_sessions = 0
      and status = 'depleted'
  ),
  'deduction reaching zero must set status depleted'
);

select pg_temp.assert_true(
  exists (
    select 1
    from public.package_usage_history
    where appointment_id = '40000000-0000-4000-8000-000000000008'
      and change_type = 'deducted'
      and before_remaining = 1
      and after_remaining = 0
  ),
  'depleting deduction must insert a deducted usage row'
);

-- Negative scenarios.
set local role authenticated;
set local request.jwt.claim.sub = '93000000-0000-4000-8000-000000000001';

-- Duplicate deduction for the same appointment is rejected.
do $$
begin
  begin
    perform *
    from public.deduct_client_package_session(
      '40000000-0000-4000-8000-000000000003',
      '51000000-0000-4000-8000-000000000005'
    );
    raise exception 'ASSERTION_FAILED: duplicate deduction was accepted';
  exception
    when others then
      if sqlerrm <> 'ALREADY_DEDUCTED' then raise; end if;
  end;
end;
$$;

-- Package belonging to a different client is rejected.
do $$
begin
  begin
    perform *
    from public.deduct_client_package_session(
      '40000000-0000-4000-8000-000000000023',
      '51000000-0000-4000-8000-000000000005'
    );
    raise exception 'ASSERTION_FAILED: wrong-client package deduction was accepted';
  exception
    when others then
      if sqlerrm <> 'CLIENT_PACKAGE_UNAVAILABLE' then raise; end if;
  end;
end;
$$;

-- Expired-status package is rejected.
do $$
begin
  begin
    perform *
    from public.deduct_client_package_session(
      '40000000-0000-4000-8000-000000000023',
      '51000000-0000-4000-8000-000000000002'
    );
    raise exception 'ASSERTION_FAILED: expired package deduction was accepted';
  exception
    when others then
      if sqlerrm <> 'CLIENT_PACKAGE_UNAVAILABLE' then raise; end if;
  end;
end;
$$;

-- Depleted-status package is rejected.
do $$
begin
  begin
    perform *
    from public.deduct_client_package_session(
      '40000000-0000-4000-8000-000000000023',
      '51000000-0000-4000-8000-000000000001'
    );
    raise exception 'ASSERTION_FAILED: depleted package deduction was accepted';
  exception
    when others then
      if sqlerrm <> 'CLIENT_PACKAGE_UNAVAILABLE' then raise; end if;
  end;
end;
$$;

-- Active package past its expiry date is rejected.
do $$
begin
  begin
    perform *
    from public.deduct_client_package_session(
      '40000000-0000-4000-8000-000000000023',
      '5a000000-0000-4000-8000-000000000001'
    );
    raise exception 'ASSERTION_FAILED: past-expiry package deduction was accepted';
  exception
    when others then
      if sqlerrm <> 'CLIENT_PACKAGE_UNAVAILABLE' then raise; end if;
  end;
end;
$$;

-- Scheduled appointment is rejected.
do $$
begin
  begin
    perform *
    from public.deduct_client_package_session(
      '40000000-0000-4000-8000-000000000006',
      '51000000-0000-4000-8000-000000000010'
    );
    raise exception 'ASSERTION_FAILED: scheduled appointment deduction was accepted';
  exception
    when others then
      if sqlerrm <> 'APPOINTMENT_NOT_COMPLETED' then raise; end if;
  end;
end;
$$;

-- Confirmed appointment is rejected.
do $$
begin
  begin
    perform *
    from public.deduct_client_package_session(
      '40000000-0000-4000-8000-000000000007',
      '51000000-0000-4000-8000-000000000012'
    );
    raise exception 'ASSERTION_FAILED: confirmed appointment deduction was accepted';
  exception
    when others then
      if sqlerrm <> 'APPOINTMENT_NOT_COMPLETED' then raise; end if;
  end;
end;
$$;

-- Cancelled appointment is rejected.
do $$
begin
  begin
    perform *
    from public.deduct_client_package_session(
      '40000000-0000-4000-8000-000000000004',
      '51000000-0000-4000-8000-000000000007'
    );
    raise exception 'ASSERTION_FAILED: cancelled appointment deduction was accepted';
  exception
    when others then
      if sqlerrm <> 'APPOINTMENT_NOT_COMPLETED' then raise; end if;
  end;
end;
$$;

-- No-show appointment is rejected.
do $$
begin
  begin
    perform *
    from public.deduct_client_package_session(
      '40000000-0000-4000-8000-000000000005',
      '51000000-0000-4000-8000-000000000009'
    );
    raise exception 'ASSERTION_FAILED: no-show appointment deduction was accepted';
  exception
    when others then
      if sqlerrm <> 'APPOINTMENT_NOT_COMPLETED' then raise; end if;
  end;
end;
$$;

-- Direct authenticated table writes remain blocked.
do $$
begin
  begin
    insert into public.client_packages (
      client_id, package_id, purchased_at, expires_at,
      total_sessions, remaining_sessions, status
    )
    values (
      '10000000-0000-4000-8000-000000000001',
      '50000000-0000-4000-8000-000000000001',
      now(), now() + interval '14 days', 2, 1, 'active'
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
    where id = '51000000-0000-4000-8000-000000000005';
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
    where id = '51000000-0000-4000-8000-000000000005';
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
      client_package_id, appointment_id, change_type,
      quantity, before_remaining, after_remaining
    )
    values (
      '51000000-0000-4000-8000-000000000005',
      '40000000-0000-4000-8000-000000000018',
      'deducted', 1, 7, 6
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
    where appointment_id = '40000000-0000-4000-8000-000000000003';
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
    where appointment_id = '40000000-0000-4000-8000-000000000003';
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
    values ('package_usage.recorded', 'client_package', 'high');
    raise exception 'ASSERTION_FAILED: direct audit insert was accepted';
  exception
    when insufficient_privilege then null;
  end;
end;
$$;

reset role;

-- User without can_manage_client_packages is denied.
set local role authenticated;
set local request.jwt.claim.sub = '96000000-0000-4000-8000-000000000007';

do $$
begin
  begin
    perform *
    from public.deduct_client_package_session(
      '40000000-0000-4000-8000-000000000023',
      '5a000000-0000-4000-8000-000000000002'
    );
    raise exception 'ASSERTION_FAILED: no-permission deduction was accepted';
  exception
    when others then
      if sqlerrm <> 'PERMISSION_DENIED' then raise; end if;
  end;
end;
$$;

reset role;

-- Rollback when the audit insert fails: no decrement, no usage row.
create function pg_temp.reject_phase_5i_audit()
returns trigger
language plpgsql
as $$
begin
  if new.action = 'package_usage.recorded'
    and new.metadata ->> 'clientPackageId' =
      '5a000000-0000-4000-8000-000000000002' then
    raise exception 'MOCK_DEDUCT_AUDIT_FAILURE';
  end if;

  return new;
end;
$$;

create trigger reject_phase_5i_audit
before insert on public.audit_logs
for each row
execute function pg_temp.reject_phase_5i_audit();

set local role authenticated;
set local request.jwt.claim.sub = '93000000-0000-4000-8000-000000000001';

do $$
begin
  begin
    perform *
    from public.deduct_client_package_session(
      '40000000-0000-4000-8000-000000000023',
      '5a000000-0000-4000-8000-000000000002'
    );
    raise exception 'ASSERTION_FAILED: audit failure did not roll back deduction';
  exception
    when others then
      if sqlerrm <> 'MOCK_DEDUCT_AUDIT_FAILURE' then raise; end if;
  end;
end;
$$;

reset role;

select pg_temp.assert_true(
  exists (
    select 1
    from public.client_packages
    where id = '5a000000-0000-4000-8000-000000000002'
      and remaining_sessions = 2
      and status = 'active'
  ),
  'audit failure must roll back the remaining_sessions decrement'
);

select pg_temp.assert_true(
  not exists (
    select 1
    from public.package_usage_history
    where appointment_id = '40000000-0000-4000-8000-000000000023'
      and change_type = 'deducted'
  ),
  'audit failure must roll back the deducted usage row'
);

select 'phase_5i_deduct_client_package_session_rpc_passed' as result;

rollback;
