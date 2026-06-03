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
    'public.reschedule_appointment(uuid,timestamp with time zone,text)',
    'execute'
  ),
  'authenticated must be able to execute reschedule_appointment'
);

select pg_temp.assert_true(
  not has_function_privilege(
    'anon',
    'public.reschedule_appointment(uuid,timestamp with time zone,text)',
    'execute'
  ),
  'anon must not be able to execute reschedule_appointment'
);

set local role authenticated;
set local request.jwt.claim.sub = '93000000-0000-4000-8000-000000000001';

select *
from public.reschedule_appointment(
  '40000000-0000-4000-8000-000000000001',
  '2036-06-20 09:00:00+07',
  'Mock Phase 4N reschedule reason.'
);

reset role;

select pg_temp.assert_true(
  exists (
    select 1
    from public.appointments
    where id = '40000000-0000-4000-8000-000000000001'
      and status = 'scheduled'
      and starts_at = '2036-06-20 09:00:00+07'
      and ends_at = '2036-06-20 10:00:00+07'
      and duration_minutes = 60
      and reschedule_reason = 'Mock Phase 4N reschedule reason.'
  ),
  'RPC must preserve status and duration while updating schedule and reason'
);

select pg_temp.assert_true(
  exists (
    select 1
    from public.appointment_status_history
    where appointment_id = '40000000-0000-4000-8000-000000000001'
      and from_status = 'scheduled'
      and to_status = 'scheduled'
      and reason = 'Mock Phase 4N reschedule reason.'
      and metadata ? 'previousStartsAt'
      and metadata ? 'newStartsAt'
      and metadata ->> 'durationMinutes' = '60'
  ),
  'RPC must insert safe same-status reschedule history'
);

select pg_temp.assert_true(
  exists (
    select 1
    from public.audit_logs
    where target_id = '40000000-0000-4000-8000-000000000001'
      and action = 'appointment.rescheduled'
      and metadata ->> 'previousStatus' = 'scheduled'
      and metadata ->> 'durationMinutes' = '60'
      and metadata ? 'previousStartsAt'
      and metadata ? 'newStartsAt'
      and metadata ? 'reason' is false
  ),
  'RPC must insert safe atomic appointment.rescheduled audit row'
);

set local role authenticated;
set local request.jwt.claim.sub = '93000000-0000-4000-8000-000000000001';

select *
from public.reschedule_appointment(
  '40000000-0000-4000-8000-000000000002',
  '2036-06-20 10:00:00+07',
  'Mock adjacent reschedule reason.'
);

do $$
begin
  begin
    perform *
    from public.reschedule_appointment(
      '40000000-0000-4000-8000-000000000007',
      '2036-06-20 09:30:00+07',
      'Mock overlap reschedule attempt.'
    );
    raise exception 'ASSERTION_FAILED: overlapping reschedule was accepted';
  exception
    when others then
      if sqlerrm <> 'APPOINTMENT_OVERLAP' then
        raise;
      end if;
  end;
end;
$$;

do $$
begin
  begin
    perform *
    from public.reschedule_appointment(
      '40000000-0000-4000-8000-000000000003',
      '2036-06-21 09:00:00+07',
      'Mock terminal reschedule attempt.'
    );
    raise exception 'ASSERTION_FAILED: completed appointment was rescheduled';
  exception
    when others then
      if sqlerrm <> 'APPOINTMENT_NOT_RESCHEDULABLE' then
        raise;
      end if;
  end;
end;
$$;

do $$
begin
  begin
    perform *
    from public.reschedule_appointment(
      '40000000-0000-4000-8000-000000000006',
      '2036-06-21 09:00:00+07',
      ''
    );
    raise exception 'ASSERTION_FAILED: blank reschedule reason was accepted';
  exception
    when others then
      if sqlerrm <> 'RESCHEDULE_REASON_INVALID' then
        raise;
      end if;
  end;
end;
$$;

do $$
begin
  begin
    perform *
    from public.reschedule_appointment(
      '40000000-0000-4000-8000-000000000006',
      '2026-01-01 09:00:00+07',
      'Mock past reschedule attempt.'
    );
    raise exception 'ASSERTION_FAILED: past reschedule was accepted';
  exception
    when others then
      if sqlerrm <> 'START_TIME_INVALID' then
        raise;
      end if;
  end;
end;
$$;

do $$
begin
  begin
    update public.appointments
    set starts_at = starts_at + interval '1 day'
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
      'scheduled'
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
      'appointment.rescheduled',
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
values ('98000000-0000-4000-8000-000000000002', 'phase4n.viewer@example.invalid');

insert into public.app_users (
  id,
  auth_user_id,
  full_name,
  email,
  status
)
values (
  '99000000-0000-4000-8000-000000000002',
  '98000000-0000-4000-8000-000000000002',
  'Mock Phase 4N Viewer',
  'phase4n.viewer@example.invalid',
  'active'
);

insert into public.user_roles (user_id, role_id)
select '99000000-0000-4000-8000-000000000002', roles.id
from public.roles
where roles.name = 'viewer';

set local role authenticated;
set local request.jwt.claim.sub = '98000000-0000-4000-8000-000000000002';

do $$
begin
  begin
    perform *
    from public.reschedule_appointment(
      '40000000-0000-4000-8000-000000000006',
      '2036-06-21 09:00:00+07',
      'Mock viewer reschedule attempt.'
    );
    raise exception 'ASSERTION_FAILED: viewer reschedule was accepted';
  exception
    when others then
      if sqlerrm <> 'PERMISSION_DENIED' then
        raise;
      end if;
  end;
end;
$$;

reset role;

create function pg_temp.reject_phase_4n_audit()
returns trigger
language plpgsql
as $$
begin
  if new.action = 'appointment.rescheduled'
    and new.target_id = '40000000-0000-4000-8000-000000000007' then
    raise exception 'MOCK_AUDIT_FAILURE';
  end if;

  return new;
end;
$$;

create trigger reject_phase_4n_audit
before insert on public.audit_logs
for each row
execute function pg_temp.reject_phase_4n_audit();

set local role authenticated;
set local request.jwt.claim.sub = '93000000-0000-4000-8000-000000000001';

do $$
begin
  begin
    perform *
    from public.reschedule_appointment(
      '40000000-0000-4000-8000-000000000007',
      '2036-06-22 09:00:00+07',
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
    where id = '40000000-0000-4000-8000-000000000007'
      and starts_at = '2026-06-02 10:30:00+07'
      and reschedule_reason is null
  ),
  'audit failure must rollback appointment reschedule'
);

select pg_temp.assert_true(
  not exists (
    select 1
    from public.appointment_status_history
    where appointment_id = '40000000-0000-4000-8000-000000000007'
      and reason = 'Mock audit rollback reason.'
  ),
  'audit failure must rollback reschedule status history'
);

select 'phase_4n_reschedule_appointment_rpc_passed' as result;

rollback;
