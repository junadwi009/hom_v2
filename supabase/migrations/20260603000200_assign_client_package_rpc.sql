alter table public.permissions
drop constraint if exists permissions_key_check;

alter table public.permissions
add constraint permissions_key_check check (
  key in (
    'can_manage_users',
    'can_manage_roles_permissions',
    'can_view_audit_logs',
    'can_view_clients',
    'can_manage_clients',
    'can_view_practitioners',
    'can_manage_practitioners',
    'can_manage_services',
    'can_view_team_attendance',
    'can_view_appointments',
    'can_manage_appointments',
    'can_reschedule_appointments',
    'can_manage_client_packages',
    'can_view_clinical_cases',
    'can_manage_clinical_cases',
    'can_view_session_notes',
    'can_edit_session_notes',
    'can_request_note_unlock',
    'can_approve_note_unlock',
    'can_view_financials',
    'can_edit_financials',
    'can_export_financial_report',
    'can_approve_reimbursements',
    'can_view_whatsapp_inbox',
    'can_send_whatsapp_message',
    'can_approve_whatsapp_blast',
    'can_use_ai_business_agent',
    'can_view_ai_logs',
    'can_manage_knowledge',
    'can_publish_knowledge'
  )
);

create or replace function public.assign_client_package(
  p_client_id uuid,
  p_package_id uuid,
  p_purchased_at timestamptz
)
returns table (
  id uuid,
  client_id uuid,
  client_name text,
  package_id uuid,
  package_name text,
  purchased_at timestamptz,
  expires_at timestamptz,
  total_sessions integer,
  remaining_sessions integer,
  status text,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_actor public.app_users%rowtype;
  v_client public.clients%rowtype;
  v_package public.packages%rowtype;
  v_client_package public.client_packages%rowtype;
  v_expires_at timestamptz;
begin
  if auth.uid() is null then
    raise exception using errcode = 'P0001', message = 'AUTH_REQUIRED';
  end if;

  select app_users.*
  into v_actor
  from public.app_users
  where app_users.auth_user_id = auth.uid()
    and app_users.status = 'active'
  limit 1;

  if v_actor.id is null then
    raise exception using errcode = 'P0001', message = 'APP_USER_REQUIRED';
  end if;

  if not private.has_permission('can_manage_client_packages') then
    raise exception using errcode = 'P0001', message = 'PERMISSION_DENIED';
  end if;

  if p_purchased_at is null then
    raise exception using errcode = 'P0001', message = 'PURCHASED_AT_REQUIRED';
  end if;

  select clients.*
  into v_client
  from public.clients
  where clients.id = p_client_id
    and clients.status <> 'archived'
  limit 1;

  if v_client.id is null then
    raise exception using errcode = 'P0001', message = 'CLIENT_UNAVAILABLE';
  end if;

  select packages.*
  into v_package
  from public.packages
  where packages.id = p_package_id
    and packages.status = 'active'
  limit 1;

  if v_package.id is null then
    raise exception using errcode = 'P0001', message = 'PACKAGE_UNAVAILABLE';
  end if;

  v_expires_at := p_purchased_at + make_interval(days => v_package.validity_days);

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
    v_client.id,
    v_package.id,
    p_purchased_at,
    v_expires_at,
    v_package.total_sessions,
    v_package.total_sessions,
    'active'
  )
  returning *
  into v_client_package;

  insert into public.package_usage_history (
    client_package_id,
    appointment_id,
    change_type,
    quantity,
    before_remaining,
    after_remaining,
    reason,
    actor_app_user_id
  )
  values (
    v_client_package.id,
    null,
    'assigned',
    v_package.total_sessions,
    0,
    v_package.total_sessions,
    null,
    v_actor.id
  );

  insert into public.audit_logs (
    actor_user_id,
    actor_auth_user_id,
    action,
    target_type,
    target_id,
    risk_level,
    metadata
  )
  values (
    v_actor.id,
    auth.uid(),
    'client_package.assigned',
    'client_package',
    v_client_package.id,
    'high',
    jsonb_build_object(
      'clientId', v_client.id,
      'packageId', v_package.id,
      'clientPackageId', v_client_package.id,
      'totalSessions', v_package.total_sessions,
      'remainingSessions', v_package.total_sessions,
      'purchasedAt', p_purchased_at,
      'expiresAt', v_expires_at
    )
  );

  return query
  select
    v_client_package.id,
    v_client_package.client_id,
    v_client.full_name,
    v_client_package.package_id,
    v_package.name,
    v_client_package.purchased_at,
    v_client_package.expires_at,
    v_client_package.total_sessions,
    v_client_package.remaining_sessions,
    v_client_package.status,
    v_client_package.created_at,
    v_client_package.updated_at;
end;
$$;

revoke all on function public.assign_client_package(uuid, uuid, timestamptz)
from public;

revoke all on function public.assign_client_package(uuid, uuid, timestamptz)
from anon;

grant execute on function public.assign_client_package(uuid, uuid, timestamptz)
to authenticated;

comment on function public.assign_client_package(uuid, uuid, timestamptz) is
  'Authenticated assign-only client package RPC. Copies active package sessions, calculates expiry, inserts ownership, usage history, and audit atomically. Direct browser table writes remain blocked.';
