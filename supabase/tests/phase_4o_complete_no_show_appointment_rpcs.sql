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
  has_function_privilege('authenticated', 'public.complete_appointment(uuid)', 'execute'),
  'authenticated must be able to execute complete_appointment'
);

select pg_temp.assert_true(
  has_function_privilege(
    'authenticated',
    'public.mark_appointment_no_show(uuid,text)',
    'execute'
  ),
  'authenticated must be able to execute mark_appointment_no_show'
);

select pg_temp.assert_true(
  not has_function_privilege('anon', 'public.complete_appointment(uuid)', 'execute'),
  'anon must not execute complete_appointment'
);

select pg_temp.assert_true(
  not has_function_privilege('anon', 'public.mark_appointment_no_show(uuid,text)', 'execute'),
  'anon must not execute mark_appointment_no_show'
);

set local role authenticated;
set local request.jwt.claim.sub = '93000000-0000-4000-8000-000000000001';

select * from public.complete_appointment('40000000-0000-4000-8000-000000000001');

select *
from public.mark_appointment_no_show(
  '40000000-0000-4000-8000-000000000002',
  'Mock Phase 4O operational no-show note.'
);

reset role;

select pg_temp.assert_true(
  exists (
    select 1
    from public.appointments
    where id = '40000000-0000-4000-8000-000000000001'
      and status = 'completed'
  ),
  'scheduled appointment must become completed'
);

select pg_temp.assert_true(
  exists (
    select 1
    from public.appointment_status_history
    where appointment_id = '40000000-0000-4000-8000-000000000001'
      and from_status = 'scheduled'
      and to_status = 'completed'
      and reason is null
  ),
  'completion must add reason-free status history'
);

select pg_temp.assert_true(
  exists (
    select 1
    from public.audit_logs
    where target_id = '40000000-0000-4000-8000-000000000001'
      and action = 'appointment.completed'
      and metadata ->> 'previousStatus' = 'scheduled'
      and metadata ? 'reason' is false
  ),
  'completion must add minimal safe atomic audit row'
);

select pg_temp.assert_true(
  exists (
    select 1
    from public.appointments
    where id = '40000000-0000-4000-8000-000000000002'
      and status = 'no_show'
  ),
  'confirmed appointment must become no-show'
);

select pg_temp.assert_true(
  exists (
    select 1
    from public.appointment_status_history
    where appointment_id = '40000000-0000-4000-8000-000000000002'
      and from_status = 'confirmed'
      and to_status = 'no_show'
      and reason = 'Mock Phase 4O operational no-show note.'
  ),
  'no-show must add status history with optional operational note'
);

select pg_temp.assert_true(
  exists (
    select 1
    from public.audit_logs
    where target_id = '40000000-0000-4000-8000-000000000002'
      and action = 'appointment.no_show_marked'
      and metadata ->> 'previousStatus' = 'confirmed'
      and metadata ? 'reason' is false
  ),
  'no-show must add minimal safe atomic audit row without reason text'
);

set local role authenticated;
set local request.jwt.claim.sub = '93000000-0000-4000-8000-000000000001';

do $$
begin
  begin
    perform * from public.complete_appointment('40000000-0000-4000-8000-000000000003');
    raise exception 'ASSERTION_FAILED: completed appointment was completed again';
  exception
    when others then
      if sqlerrm <> 'APPOINTMENT_NOT_COMPLETABLE' then raise; end if;
  end;
end;
$$;

do $$
begin
  begin
    perform *
    from public.mark_appointment_no_show(
      '40000000-0000-4000-8000-000000000004',
      null
    );
    raise exception 'ASSERTION_FAILED: cancelled appointment became no-show';
  exception
    when others then
      if sqlerrm <> 'APPOINTMENT_NOT_MARKABLE_NO_SHOW' then raise; end if;
  end;
end;
$$;

do $$
begin
  begin
    perform *
    from public.mark_appointment_no_show(
      '40000000-0000-4000-8000-000000000006',
      repeat('x', 281)
    );
    raise exception 'ASSERTION_FAILED: overlong no-show note was accepted';
  exception
    when others then
      if sqlerrm <> 'NO_SHOW_REASON_INVALID' then raise; end if;
  end;
end;
$$;

do $$
begin
  begin
    update public.appointments
    set status = 'completed'
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
    insert into public.appointment_status_history (appointment_id, to_status)
    values ('40000000-0000-4000-8000-000000000006', 'completed');
    raise exception 'ASSERTION_FAILED: direct history insert was accepted';
  exception
    when insufficient_privilege then null;
  end;
end;
$$;

do $$
begin
  begin
    insert into public.audit_logs (action, target_type, risk_level)
    values ('appointment.completed', 'appointment', 'high');
    raise exception 'ASSERTION_FAILED: direct audit insert was accepted';
  exception
    when insufficient_privilege then null;
  end;
end;
$$;

reset role;

insert into auth.users (id, email)
values ('98000000-0000-4000-8000-000000000003', 'phase4o.viewer@example.invalid');

insert into public.app_users (id, auth_user_id, full_name, email, status)
values (
  '99000000-0000-4000-8000-000000000003',
  '98000000-0000-4000-8000-000000000003',
  'Mock Phase 4O Viewer',
  'phase4o.viewer@example.invalid',
  'active'
);

insert into public.user_roles (user_id, role_id)
select '99000000-0000-4000-8000-000000000003', roles.id
from public.roles
where roles.name = 'viewer';

set local role authenticated;
set local request.jwt.claim.sub = '98000000-0000-4000-8000-000000000003';

do $$
begin
  begin
    perform * from public.complete_appointment('40000000-0000-4000-8000-000000000006');
    raise exception 'ASSERTION_FAILED: viewer completion was accepted';
  exception
    when others then
      if sqlerrm <> 'PERMISSION_DENIED' then raise; end if;
  end;
end;
$$;

do $$
begin
  begin
    perform *
    from public.mark_appointment_no_show(
      '40000000-0000-4000-8000-000000000006',
      null
    );
    raise exception 'ASSERTION_FAILED: viewer no-show was accepted';
  exception
    when others then
      if sqlerrm <> 'PERMISSION_DENIED' then raise; end if;
  end;
end;
$$;

reset role;

create function pg_temp.reject_phase_4o_audit()
returns trigger
language plpgsql
as $$
begin
  if new.action = 'appointment.completed'
    and new.target_id = '40000000-0000-4000-8000-000000000006' then
    raise exception 'MOCK_COMPLETE_AUDIT_FAILURE';
  end if;

  if new.action = 'appointment.no_show_marked'
    and new.target_id = '40000000-0000-4000-8000-000000000007' then
    raise exception 'MOCK_NO_SHOW_AUDIT_FAILURE';
  end if;

  return new;
end;
$$;

create trigger reject_phase_4o_audit
before insert on public.audit_logs
for each row
execute function pg_temp.reject_phase_4o_audit();

set local role authenticated;
set local request.jwt.claim.sub = '93000000-0000-4000-8000-000000000001';

do $$
begin
  begin
    perform * from public.complete_appointment('40000000-0000-4000-8000-000000000006');
    raise exception 'ASSERTION_FAILED: completion audit failure did not rollback';
  exception
    when others then
      if sqlerrm <> 'MOCK_COMPLETE_AUDIT_FAILURE' then raise; end if;
  end;
end;
$$;

do $$
begin
  begin
    perform *
    from public.mark_appointment_no_show(
      '40000000-0000-4000-8000-000000000007',
      'Mock rollback note.'
    );
    raise exception 'ASSERTION_FAILED: no-show audit failure did not rollback';
  exception
    when others then
      if sqlerrm <> 'MOCK_NO_SHOW_AUDIT_FAILURE' then raise; end if;
  end;
end;
$$;

reset role;

select pg_temp.assert_true(
  exists (
    select 1 from public.appointments
    where id = '40000000-0000-4000-8000-000000000006'
      and status = 'scheduled'
  ),
  'audit failure must rollback completion'
);

select pg_temp.assert_true(
  exists (
    select 1 from public.appointments
    where id = '40000000-0000-4000-8000-000000000007'
      and status = 'confirmed'
  ),
  'audit failure must rollback no-show'
);

select pg_temp.assert_true(
  not exists (
    select 1 from public.appointment_status_history
    where appointment_id in (
      '40000000-0000-4000-8000-000000000006',
      '40000000-0000-4000-8000-000000000007'
    )
      and to_status in ('completed', 'no_show')
  ),
  'audit failure must rollback terminal status history'
);

select 'phase_4o_complete_no_show_appointment_rpcs_passed' as result;

rollback;
