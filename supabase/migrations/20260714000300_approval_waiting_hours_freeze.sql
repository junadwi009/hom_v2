-- Fix: "Menunggu" (waiting_hours) kept counting on already-decided approvals.
--
-- The redaction-aware view `private.approval_request_rows` computed
--   waiting_hours = now() - created_at
-- unconditionally, so an approved/rejected/cancelled request's waiting time
-- grew on every page load — a timer that never stops after the decision.
--
-- Freeze it at the resolution moment: elapsed = coalesce(resolved_at, now())
-- - created_at. Active requests (resolved_at IS NULL) keep counting; decided
-- requests show a stable time-to-decision.
--
-- `create or replace view` requires restating the full definition with an
-- identical column set/order; this is migration 20260608000400's view verbatim
-- except for the single waiting_hours expression on the flagged line.
create or replace view private.approval_request_rows as
  select
    ar.id,
    ar.request_number,
    case
      when (ar.sensitive or ar.domain = 'clinical')
        and not private.can_view_sensitive_approval_details()
      then 'Permintaan approval klinis'
      else ar.title
    end as title,
    ar.request_type,
    ar.domain,
    ar.status,
    ar.risk,
    ar.requested_by,
    req.full_name as requester_name,
    (
      select r.name from public.user_roles ur
      join public.roles r on r.id = ur.role_id
      where ur.user_id = ar.requested_by order by r.name limit 1
    ) as requester_role,
    ar.approver_id,
    apr.full_name as approver_name,
    (
      select r.name from public.user_roles ur
      join public.roles r on r.id = ur.role_id
      where ur.user_id = ar.approver_id order by r.name limit 1
    ) as approver_role,
    ar.branch_id,
    b.name as branch_name,
    ar.related_module,
    ar.related_record_id,
    case
      when (ar.sensitive or ar.domain = 'clinical')
        and not private.can_view_sensitive_approval_details()
      then 'Clinical record hidden'
      else ar.related_record_label
    end as related_record_label,
    ar.client_id,
    case
      when (ar.sensitive or ar.domain = 'clinical')
        and not private.can_view_sensitive_approval_details()
      then null
      else c.full_name
    end as client_name,
    ar.impact_label,
    ar.amount_idr,
    case
      when (ar.sensitive or ar.domain = 'clinical')
        and not private.can_view_sensitive_approval_details()
      then 'Detail klinis disembunyikan. Membutuhkan akses Clinical Lead/Owner.'
      else ar.reason
    end as reason,
    case
      when (ar.sensitive or ar.domain = 'clinical')
        and not private.can_view_sensitive_approval_details()
      then 'Risk check disembunyikan karena data klinis sensitif.'
      else ar.risk_check
    end as risk_check,
    ar.sensitive,
    ar.requires_second_approval,
    -- Freeze at resolution: decided requests stop counting; active ones keep going.
    round(extract(epoch from (coalesce(ar.resolved_at, now()) - ar.created_at)) / 3600.0, 1) as waiting_hours,
    ar.created_at,
    ar.updated_at,
    ar.resolved_at,
    case
      when (ar.sensitive or ar.domain = 'clinical')
        and not private.can_view_sensitive_approval_details()
      then '[]'::jsonb
      else coalesce((
        select jsonb_agg(
          jsonb_build_object(
            'id', e.id,
            'action', e.action,
            'actorName', actor.full_name,
            'timestamp', e.created_at,
            'note', case
              when (ar.sensitive or ar.domain = 'clinical')
                and not private.can_view_sensitive_approval_details()
              then null
              else e.note
            end
          ) order by e.created_at
        )
        from public.approval_events e
        left join public.app_users actor on actor.id = e.actor_id
        where e.approval_request_id = ar.id
      ), '[]'::jsonb)
    end as events,
    case
      when (ar.sensitive or ar.domain = 'clinical')
        and not private.can_view_sensitive_approval_details()
      then '[]'::jsonb
      else coalesce((
        select jsonb_agg(
          jsonb_build_object('id', ev.id, 'label', ev.label, 'type', ev.evidence_type)
        )
        from public.approval_evidence ev
        where ev.approval_request_id = ar.id
      ), '[]'::jsonb)
    end as evidence
  from public.approval_requests ar
  left join public.app_users req on req.id = ar.requested_by
  left join public.app_users apr on apr.id = ar.approver_id
  left join public.branches b on b.id = ar.branch_id
  left join public.clients c on c.id = ar.client_id;
