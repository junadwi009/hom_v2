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
  has_function_privilege('authenticated', 'public.mark_payment_paid(uuid,timestamptz)', 'execute')
    and has_function_privilege('authenticated', 'public.cancel_payment(uuid,text)', 'execute'),
  'authenticated must execute both transition RPCs'
);
select pg_temp.assert_true(
  not has_function_privilege('anon', 'public.mark_payment_paid(uuid,timestamptz)', 'execute')
    and not has_function_privilege('anon', 'public.cancel_payment(uuid,text)', 'execute'),
  'anon must not execute transition RPCs'
);

set local role authenticated;
set local request.jwt.claim.sub = '93000000-0000-4000-8000-000000000001';

-- Mark a pending payment paid (60...002).
select *
from public.mark_payment_paid(
  '60000000-0000-4000-8000-000000000002',
  '2026-06-03T09:00:00+07:00'
);

-- Cancel a pending payment (60...004) with a reason.
select *
from public.cancel_payment(
  '60000000-0000-4000-8000-000000000004',
  'Mock cancellation reason.'
);

reset role;

select pg_temp.assert_true(
  exists (
    select 1 from public.payments
    where id = '60000000-0000-4000-8000-000000000002'
      and status = 'paid' and paid_at is not null
  ),
  'mark paid must set status paid with paid_at'
);
select pg_temp.assert_true(
  exists (
    select 1 from public.payments
    where id = '60000000-0000-4000-8000-000000000004' and status = 'cancelled'
  ),
  'cancel must set status cancelled'
);

select pg_temp.assert_true(
  exists (
    select 1 from public.payment_status_history
    where payment_id = '60000000-0000-4000-8000-000000000002'
      and from_status = 'pending' and to_status = 'paid'
  ) and exists (
    select 1 from public.payment_status_history
    where payment_id = '60000000-0000-4000-8000-000000000004'
      and from_status = 'pending' and to_status = 'cancelled'
      and reason = 'Mock cancellation reason.'
  ),
  'transitions must insert status history (cancel keeps reason in history)'
);

select pg_temp.assert_true(
  exists (
    select 1 from public.audit_logs
    where action = 'payment.marked_paid'
      and target_id = '60000000-0000-4000-8000-000000000002'
      and risk_level = 'high'
      and metadata ->> 'fromStatus' = 'pending'
      and metadata ->> 'toStatus' = 'paid'
      and metadata ? 'amountIdr'
      and metadata ? 'paymentMethod'
      and (metadata ? 'reason') is false
      and (metadata ? 'notes') is false
      and (metadata ? 'referenceNumber') is false
  ),
  'mark paid audit must carry safe metadata without reason/notes/reference'
);
select pg_temp.assert_true(
  exists (
    select 1 from public.audit_logs
    where action = 'payment.cancelled'
      and target_id = '60000000-0000-4000-8000-000000000004'
      and metadata ->> 'fromStatus' = 'pending'
      and metadata ->> 'toStatus' = 'cancelled'
      and (metadata ? 'reason') is false
  ),
  'cancel audit must not carry reason text'
);

-- Negative scenarios.
set local role authenticated;
set local request.jwt.claim.sub = '93000000-0000-4000-8000-000000000001';

do $$
begin
  begin
    perform * from public.mark_payment_paid('60000000-0000-4000-8000-000000000001', now());
    raise exception 'ASSERTION_FAILED: marking a paid payment was accepted';
  exception when others then
    if sqlerrm <> 'PAYMENT_NOT_PENDING' then raise; end if;
  end;
end;
$$;

do $$
begin
  begin
    perform * from public.cancel_payment('60000000-0000-4000-8000-000000000001', 'Mock.');
    raise exception 'ASSERTION_FAILED: cancelling a paid payment was accepted';
  exception when others then
    if sqlerrm <> 'PAYMENT_NOT_PENDING' then raise; end if;
  end;
end;
$$;

do $$
begin
  begin
    perform * from public.mark_payment_paid('60000000-0000-4000-8000-000000000006', null);
    raise exception 'ASSERTION_FAILED: mark paid without paid_at was accepted';
  exception when others then
    if sqlerrm <> 'PAYMENT_PAID_AT_REQUIRED' then raise; end if;
  end;
end;
$$;

do $$
begin
  begin
    perform * from public.cancel_payment('60000000-0000-4000-8000-000000000006', '   ');
    raise exception 'ASSERTION_FAILED: cancel without reason was accepted';
  exception when others then
    if sqlerrm <> 'CANCEL_REASON_REQUIRED' then raise; end if;
  end;
end;
$$;

do $$
begin
  begin
    perform * from public.mark_payment_paid('60000000-0000-4000-8000-0000000000ff', now());
    raise exception 'ASSERTION_FAILED: missing payment mark paid was accepted';
  exception when others then
    if sqlerrm <> 'PAYMENT_NOT_FOUND' then raise; end if;
  end;
end;
$$;

-- Direct writes remain blocked.
do $$
begin
  begin
    update public.payments set status = 'paid'
    where id = '60000000-0000-4000-8000-000000000006';
    raise exception 'ASSERTION_FAILED: direct payment update was accepted';
  exception when insufficient_privilege then null;
  end;
end;
$$;

do $$
begin
  begin
    insert into public.payment_status_history (payment_id, to_status)
    values ('60000000-0000-4000-8000-000000000006', 'paid');
    raise exception 'ASSERTION_FAILED: direct status history insert was accepted';
  exception when insufficient_privilege then null;
  end;
end;
$$;

do $$
begin
  begin
    insert into public.audit_logs (action, target_type, risk_level)
    values ('payment.marked_paid', 'payment', 'high');
    raise exception 'ASSERTION_FAILED: direct audit insert was accepted';
  exception when insufficient_privilege then null;
  end;
end;
$$;

reset role;

-- No-permission user denied.
insert into auth.users (id, email)
values ('96000000-0000-4000-8000-000000000030', 'phase6g.noaccess@example.invalid');
insert into public.app_users (id, auth_user_id, full_name, email, status)
values (
  '97000000-0000-4000-8000-000000000030',
  '96000000-0000-4000-8000-000000000030',
  'Mock Phase 6G No Access',
  'phase6g.noaccess@example.invalid',
  'active'
);

set local role authenticated;
set local request.jwt.claim.sub = '96000000-0000-4000-8000-000000000030';

do $$
begin
  begin
    perform * from public.mark_payment_paid('60000000-0000-4000-8000-000000000006', now());
    raise exception 'ASSERTION_FAILED: no-permission mark paid was accepted';
  exception when others then
    if sqlerrm <> 'PERMISSION_DENIED' then raise; end if;
  end;
end;
$$;

do $$
begin
  begin
    perform * from public.cancel_payment('60000000-0000-4000-8000-000000000006', 'Mock.');
    raise exception 'ASSERTION_FAILED: no-permission cancel was accepted';
  exception when others then
    if sqlerrm <> 'PERMISSION_DENIED' then raise; end if;
  end;
end;
$$;

reset role;

-- Rollback when the audit insert fails (payment 60...008 stays pending).
create function pg_temp.reject_phase_6g_audit()
returns trigger
language plpgsql
as $$
begin
  if new.action = 'payment.marked_paid'
    and new.metadata ->> 'paymentId' = '60000000-0000-4000-8000-000000000008' then
    raise exception 'MOCK_TRANSITION_AUDIT_FAILURE';
  end if;
  return new;
end;
$$;

create trigger reject_phase_6g_audit
before insert on public.audit_logs
for each row
execute function pg_temp.reject_phase_6g_audit();

set local role authenticated;
set local request.jwt.claim.sub = '93000000-0000-4000-8000-000000000001';

do $$
begin
  begin
    perform * from public.mark_payment_paid('60000000-0000-4000-8000-000000000008', now());
    raise exception 'ASSERTION_FAILED: audit failure did not roll back transition';
  exception when others then
    if sqlerrm <> 'MOCK_TRANSITION_AUDIT_FAILURE' then raise; end if;
  end;
end;
$$;

reset role;

select pg_temp.assert_true(
  exists (
    select 1 from public.payments
    where id = '60000000-0000-4000-8000-000000000008' and status = 'pending'
  ),
  'audit failure must roll back the status change'
);
select pg_temp.assert_true(
  not exists (
    select 1 from public.payment_status_history
    where payment_id = '60000000-0000-4000-8000-000000000008' and to_status = 'paid'
  ),
  'audit failure must roll back the status history insert'
);

select 'phase_6g_payment_status_transitions_rpc_passed' as result;

rollback;
