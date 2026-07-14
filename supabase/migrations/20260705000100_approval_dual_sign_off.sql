-- Phase Approval Backend — True Dual Sign-Off (M1, owner decision 2026-07-05).
-- Previously `requires_second_approval` only prevented self-approval: a single
-- approval by any non-requester finalised the request. Owner decided the flag
-- must mean a TRUE second signature:
--   approve #1 (non-requester)                → status 'awaiting_second_approval'
--   approve #2 (different non-requester,
--               different from approver #1)   → status 'approved' (final)
--   reject at any active stage                → final (one rejection suffices)
--   need_more_info / escalate                 → allowed while awaiting; a later
--                                               approve restarts the chain.
-- No real side effects (refund/payment) are performed — status-only, as before.

-- ---------------------------------------------------------------------------
-- 1) Allow the new intermediate status.
-- ---------------------------------------------------------------------------
alter table public.approval_requests
  drop constraint approval_requests_status_check;

alter table public.approval_requests
  add constraint approval_requests_status_check check (
    status in (
      'draft',
      'pending',
      'need_more_info',
      'awaiting_second_approval',
      'approved',
      'rejected',
      'cancelled',
      'expired',
      'auto_approved',
      'escalated'
    )
  );

-- ---------------------------------------------------------------------------
-- 2) Dual sign-off in the shared transition helper.
--    approver_id records the LAST decisive actor (first approver while
--    awaiting, final approver once approved); approval #1 remains visible in
--    approval_events history.
-- ---------------------------------------------------------------------------
create or replace function private.transition_approval_request(
  p_request_id uuid,
  p_action text,
  p_new_status text,
  p_note text,
  p_new_approver_id uuid,
  p_set_resolved boolean
)
returns uuid
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_actor public.app_users%rowtype;
  v_request public.approval_requests%rowtype;
  v_note text := nullif(btrim(p_note), '');
  v_new_status text := p_new_status;
  v_set_resolved boolean := p_set_resolved;
  v_stage text := null;
begin
  if auth.uid() is null then
    raise exception using errcode = 'P0001', message = 'AUTH_REQUIRED';
  end if;

  select * into v_actor from public.app_users
  where auth_user_id = auth.uid() and status = 'active' limit 1;
  if v_actor.id is null then
    raise exception using errcode = 'P0001', message = 'APP_USER_REQUIRED';
  end if;

  select * into v_request from public.approval_requests where id = p_request_id for update;
  if v_request.id is null then
    raise exception using errcode = 'P0001', message = 'REQUEST_NOT_FOUND';
  end if;

  if v_request.status not in (
    'pending', 'need_more_info', 'escalated', 'awaiting_second_approval'
  ) then
    raise exception using errcode = 'P0001', message = 'REQUEST_NOT_ACTIVE';
  end if;

  if not private.can_approve_request(v_request.request_type, v_request.domain) then
    raise exception using errcode = 'P0001', message = 'PERMISSION_DENIED';
  end if;

  -- Segregation of duties for second-approval requests.
  if v_request.requires_second_approval then
    if p_action = 'approved' and v_actor.id = v_request.requested_by then
      raise exception using errcode = 'P0001', message = 'SECOND_APPROVAL_REQUIRED_APPROVE';
    end if;
    if p_action = 'rejected' and v_actor.id = v_request.requested_by then
      raise exception using errcode = 'P0001', message = 'SECOND_APPROVAL_REQUIRED_REJECT';
    end if;
    if p_action = 'escalated'
       and p_new_approver_id is not null
       and p_new_approver_id = v_request.requested_by then
      raise exception using errcode = 'P0001', message = 'SECOND_APPROVAL_INVALID_APPROVER';
    end if;

    -- True dual sign-off for approve.
    if p_action = 'approved' then
      if v_request.status = 'awaiting_second_approval' then
        -- Second signature: must come from a different person than approval #1.
        if v_request.approver_id is not null and v_actor.id = v_request.approver_id then
          raise exception using errcode = 'P0001', message = 'SECOND_APPROVAL_SAME_APPROVER';
        end if;
        v_stage := 'final';
        -- v_new_status stays 'approved'; v_set_resolved stays true.
      else
        -- First signature: park the request for the second approver.
        v_new_status := 'awaiting_second_approval';
        v_set_resolved := false;
        v_stage := 'first';
      end if;
    end if;
  end if;

  -- Note requirements mirror the UI: reject/more-info always; approve for
  -- high/critical; escalate for critical.
  if p_action in ('rejected', 'need_more_info') and v_note is null then
    raise exception using errcode = 'P0001', message = 'NOTE_REQUIRED';
  end if;
  if p_action = 'approved' and v_request.risk in ('high', 'critical') and v_note is null then
    raise exception using errcode = 'P0001', message = 'NOTE_REQUIRED';
  end if;
  if p_action = 'escalated' and v_request.risk = 'critical' and v_note is null then
    raise exception using errcode = 'P0001', message = 'NOTE_REQUIRED';
  end if;

  update public.approval_requests
  set status = v_new_status,
      approver_id = case
        when p_action = 'approved' then v_actor.id
        else coalesce(p_new_approver_id, approver_id)
      end,
      resolved_at = case when v_set_resolved then now() else resolved_at end
  where id = v_request.id;

  insert into public.approval_events (
    approval_request_id, action, actor_id, note, from_status, to_status
  ) values (
    v_request.id, p_action, v_actor.id, v_note, v_request.status, v_new_status
  );

  insert into public.audit_logs (
    actor_user_id, actor_auth_user_id, action, target_type, target_id, risk_level, metadata
  ) values (
    v_actor.id, auth.uid(), 'approval_request.' || p_action, 'approval_request', v_request.id,
    v_request.risk,
    jsonb_build_object(
      'requestNumber', v_request.request_number,
      'fromStatus', v_request.status,
      'toStatus', v_new_status,
      'hasNote', v_note is not null,
      'secondApproval', v_request.requires_second_approval,
      'signOffStage', v_stage
    )
  );

  return v_request.id;
end;
$$;

revoke all on function private.transition_approval_request(uuid, text, text, text, uuid, boolean) from public, anon;
grant execute on function private.transition_approval_request(uuid, text, text, text, uuid, boolean) to authenticated;

comment on function private.transition_approval_request(uuid, text, text, text, uuid, boolean) is
  'Shared approval transition with SoD + true dual sign-off: requests flagged requires_second_approval need two distinct non-requester approvals (pending -> awaiting_second_approval -> approved); one rejection is final.';
