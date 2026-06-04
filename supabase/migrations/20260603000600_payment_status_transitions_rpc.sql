-- Phase 6G: manual payment status transitions, server-only and audited.
-- pending -> paid (mark_payment_paid) and pending -> cancelled (cancel_payment).
-- No refund, no failed transition, no gateway, no card/bank secrets.

create or replace function public.mark_payment_paid(
  p_payment_id uuid,
  p_paid_at timestamptz
)
returns table (
  id uuid,
  client_id uuid,
  client_name text,
  client_package_id uuid,
  package_name text,
  amount_idr bigint,
  payment_method text,
  status text,
  paid_at timestamptz,
  reference_number text,
  notes text,
  created_by_app_user_id uuid,
  updated_by_app_user_id uuid,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_actor public.app_users%rowtype;
  v_payment public.payments%rowtype;
  v_client public.clients%rowtype;
  v_package_name text;
  v_previous_status text;
begin
  if auth.uid() is null then
    raise exception using errcode = 'P0001', message = 'AUTH_REQUIRED';
  end if;

  select app_users.* into v_actor
  from public.app_users
  where app_users.auth_user_id = auth.uid()
    and app_users.status = 'active'
  limit 1;

  if v_actor.id is null then
    raise exception using errcode = 'P0001', message = 'APP_USER_REQUIRED';
  end if;

  if not private.has_permission('can_manage_payments') then
    raise exception using errcode = 'P0001', message = 'PERMISSION_DENIED';
  end if;

  if p_paid_at is null then
    raise exception using errcode = 'P0001', message = 'PAYMENT_PAID_AT_REQUIRED';
  end if;

  select payments.* into v_payment
  from public.payments
  where payments.id = p_payment_id
  for update;

  if v_payment.id is null then
    raise exception using errcode = 'P0001', message = 'PAYMENT_NOT_FOUND';
  end if;

  if v_payment.status <> 'pending' then
    raise exception using errcode = 'P0001', message = 'PAYMENT_NOT_PENDING';
  end if;

  v_previous_status := v_payment.status;

  update public.payments
  set status = 'paid',
      paid_at = p_paid_at,
      updated_by_app_user_id = v_actor.id
  where payments.id = p_payment_id
  returning * into v_payment;

  insert into public.payment_status_history (
    payment_id, from_status, to_status, reason, actor_app_user_id, metadata
  )
  values (
    v_payment.id, v_previous_status, 'paid', null, v_actor.id,
    jsonb_build_object('paymentId', v_payment.id)
  );

  insert into public.audit_logs (
    actor_user_id, actor_auth_user_id, action, target_type, target_id,
    risk_level, metadata
  )
  values (
    v_actor.id, auth.uid(), 'payment.marked_paid', 'payment', v_payment.id,
    'high',
    jsonb_build_object(
      'paymentId', v_payment.id,
      'clientId', v_payment.client_id,
      'amountIdr', v_payment.amount_idr,
      'paymentMethod', v_payment.payment_method,
      'fromStatus', v_previous_status,
      'toStatus', v_payment.status
    )
  );

  select clients.* into v_client from public.clients where clients.id = v_payment.client_id;

  if v_payment.client_package_id is not null then
    select packages.name into v_package_name
    from public.client_packages
    join public.packages on packages.id = client_packages.package_id
    where client_packages.id = v_payment.client_package_id;
  end if;

  return query
  select
    v_payment.id, v_payment.client_id, v_client.full_name,
    v_payment.client_package_id, v_package_name, v_payment.amount_idr,
    v_payment.payment_method, v_payment.status, v_payment.paid_at,
    v_payment.reference_number, v_payment.notes,
    v_payment.created_by_app_user_id, v_payment.updated_by_app_user_id,
    v_payment.created_at, v_payment.updated_at;
end;
$$;

create or replace function public.cancel_payment(
  p_payment_id uuid,
  p_reason text
)
returns table (
  id uuid,
  client_id uuid,
  client_name text,
  client_package_id uuid,
  package_name text,
  amount_idr bigint,
  payment_method text,
  status text,
  paid_at timestamptz,
  reference_number text,
  notes text,
  created_by_app_user_id uuid,
  updated_by_app_user_id uuid,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_actor public.app_users%rowtype;
  v_payment public.payments%rowtype;
  v_client public.clients%rowtype;
  v_package_name text;
  v_previous_status text;
  v_reason text;
begin
  if auth.uid() is null then
    raise exception using errcode = 'P0001', message = 'AUTH_REQUIRED';
  end if;

  select app_users.* into v_actor
  from public.app_users
  where app_users.auth_user_id = auth.uid()
    and app_users.status = 'active'
  limit 1;

  if v_actor.id is null then
    raise exception using errcode = 'P0001', message = 'APP_USER_REQUIRED';
  end if;

  if not private.has_permission('can_manage_payments') then
    raise exception using errcode = 'P0001', message = 'PERMISSION_DENIED';
  end if;

  v_reason := nullif(btrim(p_reason), '');

  if v_reason is null then
    raise exception using errcode = 'P0001', message = 'CANCEL_REASON_REQUIRED';
  end if;

  if char_length(v_reason) > 280 then
    raise exception using errcode = 'P0001', message = 'CANCEL_REASON_INVALID';
  end if;

  select payments.* into v_payment
  from public.payments
  where payments.id = p_payment_id
  for update;

  if v_payment.id is null then
    raise exception using errcode = 'P0001', message = 'PAYMENT_NOT_FOUND';
  end if;

  if v_payment.status <> 'pending' then
    raise exception using errcode = 'P0001', message = 'PAYMENT_NOT_PENDING';
  end if;

  v_previous_status := v_payment.status;

  update public.payments
  set status = 'cancelled',
      updated_by_app_user_id = v_actor.id
  where payments.id = p_payment_id
  returning * into v_payment;

  insert into public.payment_status_history (
    payment_id, from_status, to_status, reason, actor_app_user_id, metadata
  )
  values (
    v_payment.id, v_previous_status, 'cancelled', v_reason, v_actor.id,
    jsonb_build_object('paymentId', v_payment.id)
  );

  insert into public.audit_logs (
    actor_user_id, actor_auth_user_id, action, target_type, target_id,
    risk_level, metadata
  )
  values (
    v_actor.id, auth.uid(), 'payment.cancelled', 'payment', v_payment.id,
    'high',
    jsonb_build_object(
      'paymentId', v_payment.id,
      'clientId', v_payment.client_id,
      'amountIdr', v_payment.amount_idr,
      'paymentMethod', v_payment.payment_method,
      'fromStatus', v_previous_status,
      'toStatus', v_payment.status
    )
  );

  select clients.* into v_client from public.clients where clients.id = v_payment.client_id;

  if v_payment.client_package_id is not null then
    select packages.name into v_package_name
    from public.client_packages
    join public.packages on packages.id = client_packages.package_id
    where client_packages.id = v_payment.client_package_id;
  end if;

  return query
  select
    v_payment.id, v_payment.client_id, v_client.full_name,
    v_payment.client_package_id, v_package_name, v_payment.amount_idr,
    v_payment.payment_method, v_payment.status, v_payment.paid_at,
    v_payment.reference_number, v_payment.notes,
    v_payment.created_by_app_user_id, v_payment.updated_by_app_user_id,
    v_payment.created_at, v_payment.updated_at;
end;
$$;

revoke all on function public.mark_payment_paid(uuid, timestamptz) from public;
revoke all on function public.mark_payment_paid(uuid, timestamptz) from anon;
grant execute on function public.mark_payment_paid(uuid, timestamptz) to authenticated;

revoke all on function public.cancel_payment(uuid, text) from public;
revoke all on function public.cancel_payment(uuid, text) from anon;
grant execute on function public.cancel_payment(uuid, text) to authenticated;

comment on function public.mark_payment_paid(uuid, timestamptz) is
  'Authenticated mark-paid-only payment RPC. Moves a pending payment to paid with paid_at, status history, and an atomic payment.marked_paid audit row. Direct browser table writes remain blocked.';
comment on function public.cancel_payment(uuid, text) is
  'Authenticated cancel-only payment RPC. Moves a pending payment to cancelled with a required safe reason, status history, and an atomic payment.cancelled audit row. Reason text is never written to audit metadata. Direct browser table writes remain blocked.';
