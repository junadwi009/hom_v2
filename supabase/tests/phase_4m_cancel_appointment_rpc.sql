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

select pg_temp.assert_true(
  has_function_privilege(
    'authenticated',
    'public.cancel_appointment(uuid,text)',
    'execute'
  ),
  'authenticated must be able to execute cancel_appointment'
);

select pg_temp.assert_true(
  not has_function_privilege(
    'anon',
    'public.cancel_appointment(uuid,text)',
    'execute'
  ),
  'anon must not be able to execute cancel_appointment'
);

set local role authenticated;
set local request.jwt.claim.sub = '93000000-0000-4000-8000-000000000001';

select *
from public.cancel_appointment(
  '40000000-0000-4000-8000-000000000001',
  'Mock Phase 4M cancellation reason.'
);

reset role;

select pg_temp.assert_true(
  exists (
    select 1
    from public.appointments
    where id = '40000000-0000-4000-8000-000000000001'
      and status = 'cancelled'
      and cancellation_reason = 'Mock Phase 4M cancellation reason.'
  ),
  'RPC must cancel scheduled appointment and store reason'
);

select pg_temp.assert_true(
  exists (
    select 1
    from public.appointment_status_history
    where appointment_id = '40000000-0000-4000-8000-000000000001'
      and from_status = 'scheduled'
      and to_status = 'cancelled'
      and reason = 'Mock Phase 4M cancellation reason.'
  ),
  'RPC must insert cancelled status history'
);

select pg_temp.assert_true(
  exists (
    select 1
    from public.audit_logs
    where target_id = '40000000-0000-4000-8000-000000000001'
      and action = 'appointment.cancelled'
      and metadata ->> 'previousStatus' = 'scheduled'
      and metadata ? 'reason' is false
  ),
  'RPC must insert safe atomic appointment.cancelled audit row'
);

set local role authenticated;
set local request.jwt.claim.sub = '93000000-0000-4000-8000-000000000001';

do $$
begin
  begin
    perform *
    from public.cancel_appointment(
      '40000000-0000-4000-8000-000000000003',
      'Mock terminal cancellation attempt.'
    );
    raise exception 'ASSERTION_FAILED: completed appointment was cancelled';
  exception
    when others then
      if sqlerrm <> 'APPOINTMENT_NOT_CANCELLABLE' then
        raise;
      end if;
  end;
end;
$$;

do $$
begin
  begin
    perform *
    from public.cancel_appointment(
      '40000000-0000-4000-8000-000000000004',
      'Mock repeated cancellation attempt.'
    );
    raise exception 'ASSERTION_FAILED: cancelled appointment was cancelled again';
  exception
    when others then
      if sqlerrm <> 'APPOINTMENT_NOT_CANCELLABLE' then
        raise;
      end if;
  end;
end;
$$;

do $$
begin
  begin
    perform *
    from public.cancel_appointment(
      '40000000-0000-4000-8000-000000000006',
      ''
    );
    raise exception 'ASSERTION_FAILED: blank cancellation reason was accepted';
  exception
    when others then
      if sqlerrm <> 'CANCELLATION_REASON_INVALID' then
        raise;
      end if;
  end;
end;
$$;

do $$
begin
  begin
    perform *
    from public.cancel_appointment(
      '40000000-0000-4000-8000-000000000006',
      repeat('x', 281)
    );
    raise exception 'ASSERTION_FAILED: overlong cancellation reason was accepted';
  exception
    when others then
      if sqlerrm <> 'CANCELLATION_REASON_INVALID' then
        raise;
      end if;
  end;
end;
$$;

do $$
begin
  begin
    update public.appointments
    set status = 'cancelled'
    where id = '40000000-0000-4000-8000-000000000006';
    raise exception 'ASSERTION_FAILED: direct appointment update was accepted';
  exception
    when insufficient_privilege then null;
  end;
end;
$$;

do $$
begin
  begin
    insert into public.appointment_status_history (
      appointment_id,
      to_status
    )
    values (
      '40000000-0000-4000-8000-000000000006',
      'cancelled'
    );
    raise exception 'ASSERTION_FAILED: direct history insert was accepted';
  exception
    when insufficient_privilege then null;
  end;
end;
$$;

do $$
begin
  begin
    insert into public.audit_logs (
      action,
      target_type,
      risk_level
    )
    values (
      'appointment.cancelled',
      'appointment',
      'high'
    );
    raise exception 'ASSERTION_FAILED: direct audit insert was accepted';
  exception
    when insufficient_privilege then null;
  end;
end;
$$;

reset role;

insert into auth.users (id, email)
values ('98000000-0000-4000-8000-000000000001', 'phase4m.viewer@example.invalid');

insert into public.app_users (
  id,
  auth_user_id,
  full_name,
  email,
  status
)
values (
  '99000000-0000-4000-8000-000000000001',
  '98000000-0000-4000-8000-000000000001',
  'Mock Phase 4M Viewer',
  'phase4m.viewer@example.invalid',
  'active'
);

insert into public.user_roles (user_id, role_id)
select '99000000-0000-4000-8000-000000000001', roles.id
from public.roles
where roles.name = 'viewer';

set local role authenticated;
set local request.jwt.claim.sub = '98000000-0000-4000-8000-000000000001';

do $$
begin
  begin
    perform *
    from public.cancel_appointment(
      '40000000-0000-4000-8000-000000000006',
      'Mock viewer cancellation attempt.'
    );
    raise exception 'ASSERTION_FAILED: viewer cancel was accepted';
  exception
    when others then
      if sqlerrm <> 'PERMISSION_DENIED' then
        raise;
      end if;
  end;
end;
$$;

reset role;

create function pg_temp.reject_phase_4m_audit()
returns trigger
language plpgsql
as $$
begin
  if new.action = 'appointment.cancelled'
    and new.target_id = '40000000-0000-4000-8000-000000000002' then
    raise exception 'MOCK_AUDIT_FAILURE';
  end if;

  return new;
end;
$$;

create trigger reject_phase_4m_audit
before insert on public.audit_logs
for each row
execute function pg_temp.reject_phase_4m_audit();

set local role authenticated;
set local request.jwt.claim.sub = '93000000-0000-4000-8000-000000000001';

do $$
begin
  begin
    perform *
    from public.cancel_appointment(
      '40000000-0000-4000-8000-000000000002',
      'Mock audit rollback reason.'
    );
    raise exception 'ASSERTION_FAILED: audit failure did not rollback';
  exception
    when others then
      if sqlerrm <> 'MOCK_AUDIT_FAILURE' then
        raise;
      end if;
  end;
end;
$$;

reset role;

select pg_temp.assert_true(
  exists (
    select 1
    from public.appointments
    where id = '40000000-0000-4000-8000-000000000002'
      and status = 'confirmed'
      and cancellation_reason is null
  ),
  'audit failure must rollback appointment cancellation'
);

select pg_temp.assert_true(
  not exists (
    select 1
    from public.appointment_status_history
    where appointment_id = '40000000-0000-4000-8000-000000000002'
      and to_status = 'cancelled'
  ),
  'audit failure must rollback cancelled status history'
);

select 'phase_4m_cancel_appointment_rpc_passed' as result;

rollback;
