-- Leads, Segments, and Tags directory tables for the Clients module, plus their
-- authenticated create RPCs. Tables follow the catalog read-RLS convention;
-- RPCs follow create_client (permission-gated by can_manage_clients, audit-logged,
-- SECURITY DEFINER so inserts run server-side while direct browser writes stay
-- blocked by RLS).

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text,
  email text,
  source text not null check (
    source in ('instagram', 'whatsapp', 'google', 'referral', 'walk_in', 'facebook_ads')
  ),
  stage text not null default 'new_lead' check (
    stage in ('new_lead', 'trial_booked', 'trial_attended', 'member_converted')
  ),
  status text not null default 'warm' check (
    status in ('hot', 'warm', 'cold')
  ),
  score integer not null default 0 check (score between 0 and 100),
  interest text,
  branch text,
  note text,
  created_by_app_user_id uuid references public.app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.client_segments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  segment_type text not null default 'custom' check (
    segment_type in ('system', 'custom')
  ),
  criteria jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  created_by_app_user_id uuid references public.app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.client_tags (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  color text not null default '#3f7cae' check (color ~ '^#[0-9a-fA-F]{6}$'),
  description text,
  tag_type text not null default 'custom' check (
    tag_type in ('system', 'custom')
  ),
  is_active boolean not null default true,
  created_by_app_user_id uuid references public.app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_leads_updated_at
before update on public.leads
for each row
execute function private.set_updated_at();

create trigger set_client_segments_updated_at
before update on public.client_segments
for each row
execute function private.set_updated_at();

create trigger set_client_tags_updated_at
before update on public.client_tags
for each row
execute function private.set_updated_at();

create index idx_leads_stage on public.leads(stage);
create index idx_leads_status on public.leads(status);
create index idx_leads_lower_full_name on public.leads (lower(full_name));

create index idx_client_segments_type on public.client_segments(segment_type);
create index idx_client_segments_lower_name on public.client_segments (lower(name));

create index idx_client_tags_type on public.client_tags(tag_type);
create unique index idx_client_tags_lower_name on public.client_tags (lower(name));

alter table public.leads enable row level security;
alter table public.client_segments enable row level security;
alter table public.client_tags enable row level security;

revoke all on public.leads from public;
revoke all on public.leads from anon;
revoke all on public.leads from authenticated;

revoke all on public.client_segments from public;
revoke all on public.client_segments from anon;
revoke all on public.client_segments from authenticated;

revoke all on public.client_tags from public;
revoke all on public.client_tags from anon;
revoke all on public.client_tags from authenticated;

grant select on public.leads to authenticated;
grant select on public.client_segments to authenticated;
grant select on public.client_tags to authenticated;

create policy "permitted users can read leads"
on public.leads
for select
to authenticated
using (
  private.has_permission('can_view_clients')
  or private.has_permission('can_manage_clients')
);

create policy "permitted users can read client segments"
on public.client_segments
for select
to authenticated
using (
  private.has_permission('can_view_clients')
  or private.has_permission('can_manage_clients')
);

create policy "permitted users can read client tags"
on public.client_tags
for select
to authenticated
using (
  private.has_permission('can_view_clients')
  or private.has_permission('can_manage_clients')
);

comment on table public.leads is
  'Local table for client lead pipeline records. Browser writes are intentionally blocked until server-only audited mutation flows are approved.';

comment on table public.client_segments is
  'Local table for client segmentation definitions. Browser writes are intentionally blocked until server-only audited mutation flows are approved.';

comment on table public.client_tags is
  'Local table for client label/tag definitions. Browser writes are intentionally blocked until server-only audited mutation flows are approved.';

-- ---------------------------------------------------------------------------
-- create_lead RPC
-- ---------------------------------------------------------------------------

create or replace function public.create_lead(
  p_full_name text,
  p_phone text,
  p_email text,
  p_source text,
  p_stage text,
  p_status text,
  p_score integer,
  p_interest text,
  p_branch text,
  p_note text
)
returns table (
  id uuid,
  full_name text,
  phone text,
  email text,
  source text,
  stage text,
  status text,
  score integer,
  interest text,
  branch text,
  note text,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_actor public.app_users%rowtype;
  v_new public.leads%rowtype;
begin
  if auth.uid() is null then
    raise exception using errcode = 'P0001', message = 'AUTH_REQUIRED';
  end if;

  select app_users.* into v_actor
  from public.app_users
  where app_users.auth_user_id = auth.uid() and app_users.status = 'active'
  limit 1;

  if v_actor.id is null then
    raise exception using errcode = 'P0001', message = 'APP_USER_REQUIRED';
  end if;

  if not private.has_permission('can_manage_clients') then
    raise exception using errcode = 'P0001', message = 'PERMISSION_DENIED';
  end if;

  if p_full_name is null or char_length(trim(p_full_name)) = 0 then
    raise exception using errcode = 'P0001', message = 'FULL_NAME_REQUIRED';
  end if;

  if char_length(trim(p_full_name)) > 120 then
    raise exception using errcode = 'P0001', message = 'FULL_NAME_TOO_LONG';
  end if;

  if p_source not in ('instagram', 'whatsapp', 'google', 'referral', 'walk_in', 'facebook_ads') then
    raise exception using errcode = 'P0001', message = 'SOURCE_INVALID';
  end if;

  if p_stage not in ('new_lead', 'trial_booked', 'trial_attended', 'member_converted') then
    raise exception using errcode = 'P0001', message = 'STAGE_INVALID';
  end if;

  if p_status not in ('hot', 'warm', 'cold') then
    raise exception using errcode = 'P0001', message = 'STATUS_INVALID';
  end if;

  if p_score is null or p_score < 0 or p_score > 100 then
    raise exception using errcode = 'P0001', message = 'SCORE_INVALID';
  end if;

  insert into public.leads (
    full_name, phone, email, source, stage, status, score,
    interest, branch, note, created_by_app_user_id
  )
  values (
    trim(p_full_name),
    nullif(trim(coalesce(p_phone, '')), ''),
    nullif(trim(coalesce(p_email, '')), ''),
    p_source, p_stage, p_status, p_score,
    nullif(trim(coalesce(p_interest, '')), ''),
    nullif(trim(coalesce(p_branch, '')), ''),
    nullif(trim(coalesce(p_note, '')), ''),
    v_actor.id
  )
  returning * into v_new;

  insert into public.audit_logs (
    actor_user_id, actor_auth_user_id, action, target_type, target_id, risk_level, metadata
  )
  values (
    v_actor.id, auth.uid(), 'lead.created', 'lead', v_new.id, 'low',
    jsonb_build_object('source', v_new.source, 'stage', v_new.stage, 'status', v_new.status)
  );

  return query
  select v_new.id, v_new.full_name, v_new.phone, v_new.email, v_new.source,
    v_new.stage, v_new.status, v_new.score, v_new.interest, v_new.branch,
    v_new.note, v_new.created_at, v_new.updated_at;
end;
$$;

-- ---------------------------------------------------------------------------
-- create_segment RPC
-- ---------------------------------------------------------------------------

create or replace function public.create_segment(
  p_name text,
  p_description text,
  p_segment_type text,
  p_criteria jsonb,
  p_is_active boolean
)
returns table (
  id uuid,
  name text,
  description text,
  segment_type text,
  criteria jsonb,
  is_active boolean,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_actor public.app_users%rowtype;
  v_new public.client_segments%rowtype;
begin
  if auth.uid() is null then
    raise exception using errcode = 'P0001', message = 'AUTH_REQUIRED';
  end if;

  select app_users.* into v_actor
  from public.app_users
  where app_users.auth_user_id = auth.uid() and app_users.status = 'active'
  limit 1;

  if v_actor.id is null then
    raise exception using errcode = 'P0001', message = 'APP_USER_REQUIRED';
  end if;

  if not private.has_permission('can_manage_clients') then
    raise exception using errcode = 'P0001', message = 'PERMISSION_DENIED';
  end if;

  if p_name is null or char_length(trim(p_name)) = 0 then
    raise exception using errcode = 'P0001', message = 'NAME_REQUIRED';
  end if;

  if char_length(trim(p_name)) > 120 then
    raise exception using errcode = 'P0001', message = 'NAME_TOO_LONG';
  end if;

  if p_segment_type not in ('system', 'custom') then
    raise exception using errcode = 'P0001', message = 'TYPE_INVALID';
  end if;

  insert into public.client_segments (
    name, description, segment_type, criteria, is_active, created_by_app_user_id
  )
  values (
    trim(p_name),
    nullif(trim(coalesce(p_description, '')), ''),
    p_segment_type,
    coalesce(p_criteria, '[]'::jsonb),
    coalesce(p_is_active, true),
    v_actor.id
  )
  returning * into v_new;

  insert into public.audit_logs (
    actor_user_id, actor_auth_user_id, action, target_type, target_id, risk_level, metadata
  )
  values (
    v_actor.id, auth.uid(), 'segment.created', 'segment', v_new.id, 'low',
    jsonb_build_object('segment_type', v_new.segment_type, 'is_active', v_new.is_active)
  );

  return query
  select v_new.id, v_new.name, v_new.description, v_new.segment_type,
    v_new.criteria, v_new.is_active, v_new.created_at, v_new.updated_at;
end;
$$;

-- ---------------------------------------------------------------------------
-- create_tag RPC
-- ---------------------------------------------------------------------------

create or replace function public.create_tag(
  p_name text,
  p_color text,
  p_description text,
  p_tag_type text,
  p_is_active boolean
)
returns table (
  id uuid,
  name text,
  color text,
  description text,
  tag_type text,
  is_active boolean,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_actor public.app_users%rowtype;
  v_new public.client_tags%rowtype;
begin
  if auth.uid() is null then
    raise exception using errcode = 'P0001', message = 'AUTH_REQUIRED';
  end if;

  select app_users.* into v_actor
  from public.app_users
  where app_users.auth_user_id = auth.uid() and app_users.status = 'active'
  limit 1;

  if v_actor.id is null then
    raise exception using errcode = 'P0001', message = 'APP_USER_REQUIRED';
  end if;

  if not private.has_permission('can_manage_clients') then
    raise exception using errcode = 'P0001', message = 'PERMISSION_DENIED';
  end if;

  if p_name is null or char_length(trim(p_name)) = 0 then
    raise exception using errcode = 'P0001', message = 'NAME_REQUIRED';
  end if;

  if char_length(trim(p_name)) > 120 then
    raise exception using errcode = 'P0001', message = 'NAME_TOO_LONG';
  end if;

  if p_color is null or p_color !~ '^#[0-9a-fA-F]{6}$' then
    raise exception using errcode = 'P0001', message = 'COLOR_INVALID';
  end if;

  if p_tag_type not in ('system', 'custom') then
    raise exception using errcode = 'P0001', message = 'TYPE_INVALID';
  end if;

  insert into public.client_tags (
    name, color, description, tag_type, is_active, created_by_app_user_id
  )
  values (
    trim(p_name),
    lower(p_color),
    nullif(trim(coalesce(p_description, '')), ''),
    p_tag_type,
    coalesce(p_is_active, true),
    v_actor.id
  )
  returning * into v_new;

  insert into public.audit_logs (
    actor_user_id, actor_auth_user_id, action, target_type, target_id, risk_level, metadata
  )
  values (
    v_actor.id, auth.uid(), 'tag.created', 'tag', v_new.id, 'low',
    jsonb_build_object('tag_type', v_new.tag_type, 'is_active', v_new.is_active)
  );

  return query
  select v_new.id, v_new.name, v_new.color, v_new.description, v_new.tag_type,
    v_new.is_active, v_new.created_at, v_new.updated_at;
end;
$$;

-- ---------------------------------------------------------------------------
-- Grants & comments
-- ---------------------------------------------------------------------------

revoke all on function public.create_lead(text, text, text, text, text, text, integer, text, text, text) from public;
revoke all on function public.create_lead(text, text, text, text, text, text, integer, text, text, text) from anon;
grant execute on function public.create_lead(text, text, text, text, text, text, integer, text, text, text) to authenticated;

revoke all on function public.create_segment(text, text, text, jsonb, boolean) from public;
revoke all on function public.create_segment(text, text, text, jsonb, boolean) from anon;
grant execute on function public.create_segment(text, text, text, jsonb, boolean) to authenticated;

revoke all on function public.create_tag(text, text, text, text, boolean) from public;
revoke all on function public.create_tag(text, text, text, text, boolean) from anon;
grant execute on function public.create_tag(text, text, text, text, boolean) to authenticated;

comment on function public.create_lead(text, text, text, text, text, text, integer, text, text, text) is
  'Authenticated, can_manage_clients-gated lead creation with audit logging.';
comment on function public.create_segment(text, text, text, jsonb, boolean) is
  'Authenticated, can_manage_clients-gated client segment creation with audit logging.';
comment on function public.create_tag(text, text, text, text, boolean) is
  'Authenticated, can_manage_clients-gated client tag creation with audit logging.';
