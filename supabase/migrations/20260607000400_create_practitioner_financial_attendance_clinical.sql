-- Create pipelines for four modules:
--   1. Practitioners  -> create_practitioner (table already exists)
--   2. Financials     -> financial_entries  + create_financial_entry
--   3. Team Attendance-> attendance_records + create_attendance_record
--   4. Clinical Cases -> clinical_cases      + create_clinical_case
-- Tables follow the catalog read-RLS convention; RPCs follow create_client
-- (auth + app_user + permission gate, audit-logged, SECURITY DEFINER). No new
-- permission keys are introduced — existing manage/edit permissions are reused.

-- ===========================================================================
-- 1. PRACTITIONERS — create RPC only (public.practitioners already exists)
-- ===========================================================================

create or replace function public.create_practitioner(
  p_display_name text,
  p_email text,
  p_status text
)
returns table (
  id uuid,
  display_name text,
  email text,
  status text,
  app_user_id uuid,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_actor public.app_users%rowtype;
  v_new public.practitioners%rowtype;
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

  if not private.has_permission('can_manage_practitioners') then
    raise exception using errcode = 'P0001', message = 'PERMISSION_DENIED';
  end if;

  if p_display_name is null or char_length(trim(p_display_name)) = 0 then
    raise exception using errcode = 'P0001', message = 'NAME_REQUIRED';
  end if;

  if char_length(trim(p_display_name)) > 120 then
    raise exception using errcode = 'P0001', message = 'NAME_TOO_LONG';
  end if;

  if p_status not in ('active', 'inactive', 'archived') then
    raise exception using errcode = 'P0001', message = 'STATUS_INVALID';
  end if;

  insert into public.practitioners (display_name, email, status)
  values (
    trim(p_display_name),
    nullif(trim(coalesce(p_email, '')), ''),
    p_status
  )
  returning * into v_new;

  insert into public.audit_logs (actor_user_id, actor_auth_user_id, action, target_type, target_id, risk_level, metadata)
  values (v_actor.id, auth.uid(), 'practitioner.created', 'practitioner', v_new.id, 'low', jsonb_build_object('status', v_new.status));

  return query
  select v_new.id, v_new.display_name, v_new.email, v_new.status,
    v_new.app_user_id, v_new.created_at, v_new.updated_at;
end;
$$;

revoke all on function public.create_practitioner(text, text, text) from public;
revoke all on function public.create_practitioner(text, text, text) from anon;
grant execute on function public.create_practitioner(text, text, text) to authenticated;

comment on function public.create_practitioner(text, text, text) is
  'Authenticated, can_manage_practitioners-gated practitioner creation with audit logging.';

-- ===========================================================================
-- 2. FINANCIALS — financial_entries table + create_financial_entry RPC
-- ===========================================================================

create table public.financial_entries (
  id uuid primary key default gen_random_uuid(),
  entry_type text not null check (entry_type in ('income', 'expense')),
  category text not null,
  amount_idr bigint not null check (amount_idr >= 0),
  occurred_on date not null,
  note text,
  created_by_app_user_id uuid references public.app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_financial_entries_updated_at
before update on public.financial_entries
for each row
execute function private.set_updated_at();

create index idx_financial_entries_type on public.financial_entries(entry_type);
create index idx_financial_entries_occurred_on on public.financial_entries(occurred_on);

alter table public.financial_entries enable row level security;

revoke all on public.financial_entries from public;
revoke all on public.financial_entries from anon;
revoke all on public.financial_entries from authenticated;

grant select on public.financial_entries to authenticated;

create policy "permitted users can read financial entries"
on public.financial_entries
for select
to authenticated
using (
  private.has_permission('can_view_financials')
  or private.has_permission('can_edit_financials')
);

comment on table public.financial_entries is
  'Local table for manual income/expense ledger entries. Browser writes are intentionally blocked until server-only audited mutation flows are approved.';

create or replace function public.create_financial_entry(
  p_entry_type text,
  p_category text,
  p_amount_idr bigint,
  p_occurred_on date,
  p_note text
)
returns table (
  id uuid,
  entry_type text,
  category text,
  amount_idr bigint,
  occurred_on date,
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
  v_new public.financial_entries%rowtype;
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

  if not private.has_permission('can_edit_financials') then
    raise exception using errcode = 'P0001', message = 'PERMISSION_DENIED';
  end if;

  if p_entry_type not in ('income', 'expense') then
    raise exception using errcode = 'P0001', message = 'TYPE_INVALID';
  end if;

  if p_category is null or char_length(trim(p_category)) = 0 then
    raise exception using errcode = 'P0001', message = 'CATEGORY_REQUIRED';
  end if;

  if char_length(trim(p_category)) > 120 then
    raise exception using errcode = 'P0001', message = 'CATEGORY_TOO_LONG';
  end if;

  if p_amount_idr is null or p_amount_idr < 0 then
    raise exception using errcode = 'P0001', message = 'AMOUNT_INVALID';
  end if;

  if p_occurred_on is null then
    raise exception using errcode = 'P0001', message = 'DATE_REQUIRED';
  end if;

  insert into public.financial_entries (entry_type, category, amount_idr, occurred_on, note, created_by_app_user_id)
  values (
    p_entry_type,
    trim(p_category),
    p_amount_idr,
    p_occurred_on,
    nullif(trim(coalesce(p_note, '')), ''),
    v_actor.id
  )
  returning * into v_new;

  insert into public.audit_logs (actor_user_id, actor_auth_user_id, action, target_type, target_id, risk_level, metadata)
  values (v_actor.id, auth.uid(), 'financial_entry.created', 'financial_entry', v_new.id, 'medium',
    jsonb_build_object('entry_type', v_new.entry_type, 'amount_idr', v_new.amount_idr));

  return query
  select v_new.id, v_new.entry_type, v_new.category, v_new.amount_idr,
    v_new.occurred_on, v_new.note, v_new.created_at, v_new.updated_at;
end;
$$;

revoke all on function public.create_financial_entry(text, text, bigint, date, text) from public;
revoke all on function public.create_financial_entry(text, text, bigint, date, text) from anon;
grant execute on function public.create_financial_entry(text, text, bigint, date, text) to authenticated;

comment on function public.create_financial_entry(text, text, bigint, date, text) is
  'Authenticated, can_edit_financials-gated financial ledger entry creation with audit logging.';

-- ===========================================================================
-- 3. TEAM ATTENDANCE — attendance_records table + create_attendance_record RPC
--    Creation reuses can_manage_practitioners (roster/presence management);
--    reads are visible to can_view_team_attendance holders.
-- ===========================================================================

create table public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  practitioner_id uuid not null references public.practitioners(id) on delete cascade,
  work_date date not null,
  status text not null default 'present' check (
    status in ('present', 'absent', 'late', 'leave')
  ),
  check_in time,
  check_out time,
  note text,
  created_by_app_user_id uuid references public.app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (practitioner_id, work_date)
);

create trigger set_attendance_records_updated_at
before update on public.attendance_records
for each row
execute function private.set_updated_at();

create index idx_attendance_records_work_date on public.attendance_records(work_date);
create index idx_attendance_records_practitioner on public.attendance_records(practitioner_id);

alter table public.attendance_records enable row level security;

revoke all on public.attendance_records from public;
revoke all on public.attendance_records from anon;
revoke all on public.attendance_records from authenticated;

grant select on public.attendance_records to authenticated;

create policy "permitted users can read attendance records"
on public.attendance_records
for select
to authenticated
using (
  private.has_permission('can_view_team_attendance')
  or private.has_permission('can_manage_practitioners')
);

comment on table public.attendance_records is
  'Local table for practitioner daily attendance/presence records. Browser writes are intentionally blocked until server-only audited mutation flows are approved.';

create or replace function public.create_attendance_record(
  p_practitioner_id uuid,
  p_work_date date,
  p_status text,
  p_check_in time,
  p_check_out time,
  p_note text
)
returns table (
  id uuid,
  practitioner_id uuid,
  work_date date,
  status text,
  check_in time,
  check_out time,
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
  v_new public.attendance_records%rowtype;
  v_practitioner_exists boolean;
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

  if not private.has_permission('can_manage_practitioners') then
    raise exception using errcode = 'P0001', message = 'PERMISSION_DENIED';
  end if;

  if p_practitioner_id is null then
    raise exception using errcode = 'P0001', message = 'PRACTITIONER_REQUIRED';
  end if;

  select exists (
    select 1 from public.practitioners where practitioners.id = p_practitioner_id
  ) into v_practitioner_exists;

  if not v_practitioner_exists then
    raise exception using errcode = 'P0001', message = 'PRACTITIONER_NOT_FOUND';
  end if;

  if p_work_date is null then
    raise exception using errcode = 'P0001', message = 'DATE_REQUIRED';
  end if;

  if p_status not in ('present', 'absent', 'late', 'leave') then
    raise exception using errcode = 'P0001', message = 'STATUS_INVALID';
  end if;

  insert into public.attendance_records (practitioner_id, work_date, status, check_in, check_out, note, created_by_app_user_id)
  values (
    p_practitioner_id,
    p_work_date,
    p_status,
    p_check_in,
    p_check_out,
    nullif(trim(coalesce(p_note, '')), ''),
    v_actor.id
  )
  returning * into v_new;

  insert into public.audit_logs (actor_user_id, actor_auth_user_id, action, target_type, target_id, risk_level, metadata)
  values (v_actor.id, auth.uid(), 'attendance.created', 'attendance_record', v_new.id, 'low',
    jsonb_build_object('status', v_new.status, 'work_date', v_new.work_date));

  return query
  select v_new.id, v_new.practitioner_id, v_new.work_date, v_new.status,
    v_new.check_in, v_new.check_out, v_new.note, v_new.created_at, v_new.updated_at;
end;
$$;

revoke all on function public.create_attendance_record(uuid, date, text, time, time, text) from public;
revoke all on function public.create_attendance_record(uuid, date, text, time, time, text) from anon;
grant execute on function public.create_attendance_record(uuid, date, text, time, time, text) to authenticated;

comment on function public.create_attendance_record(uuid, date, text, time, time, text) is
  'Authenticated, can_manage_practitioners-gated attendance record creation with audit logging.';

-- ===========================================================================
-- 4. CLINICAL CASES — clinical_cases table + create_clinical_case RPC
-- ===========================================================================

create table public.clinical_cases (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  title text not null,
  case_status text not null default 'open' check (
    case_status in ('open', 'monitoring', 'resolved')
  ),
  severity text not null default 'low' check (
    severity in ('low', 'medium', 'high')
  ),
  summary text,
  opened_on date not null,
  created_by_app_user_id uuid references public.app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_clinical_cases_updated_at
before update on public.clinical_cases
for each row
execute function private.set_updated_at();

create index idx_clinical_cases_status on public.clinical_cases(case_status);
create index idx_clinical_cases_client on public.clinical_cases(client_id);

alter table public.clinical_cases enable row level security;

revoke all on public.clinical_cases from public;
revoke all on public.clinical_cases from anon;
revoke all on public.clinical_cases from authenticated;

grant select on public.clinical_cases to authenticated;

create policy "permitted users can read clinical cases"
on public.clinical_cases
for select
to authenticated
using (
  private.has_permission('can_view_clinical_cases')
  or private.has_permission('can_manage_clinical_cases')
);

comment on table public.clinical_cases is
  'Local table for chronic/clinical case registry records. Browser writes are intentionally blocked until server-only audited mutation flows are approved.';

create or replace function public.create_clinical_case(
  p_client_id uuid,
  p_title text,
  p_case_status text,
  p_severity text,
  p_summary text,
  p_opened_on date
)
returns table (
  id uuid,
  client_id uuid,
  title text,
  case_status text,
  severity text,
  summary text,
  opened_on date,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_actor public.app_users%rowtype;
  v_new public.clinical_cases%rowtype;
  v_client_exists boolean;
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

  if not private.has_permission('can_manage_clinical_cases') then
    raise exception using errcode = 'P0001', message = 'PERMISSION_DENIED';
  end if;

  if p_client_id is null then
    raise exception using errcode = 'P0001', message = 'CLIENT_REQUIRED';
  end if;

  select exists (
    select 1 from public.clients where clients.id = p_client_id
  ) into v_client_exists;

  if not v_client_exists then
    raise exception using errcode = 'P0001', message = 'CLIENT_NOT_FOUND';
  end if;

  if p_title is null or char_length(trim(p_title)) = 0 then
    raise exception using errcode = 'P0001', message = 'TITLE_REQUIRED';
  end if;

  if char_length(trim(p_title)) > 160 then
    raise exception using errcode = 'P0001', message = 'TITLE_TOO_LONG';
  end if;

  if p_case_status not in ('open', 'monitoring', 'resolved') then
    raise exception using errcode = 'P0001', message = 'STATUS_INVALID';
  end if;

  if p_severity not in ('low', 'medium', 'high') then
    raise exception using errcode = 'P0001', message = 'SEVERITY_INVALID';
  end if;

  if p_opened_on is null then
    raise exception using errcode = 'P0001', message = 'DATE_REQUIRED';
  end if;

  insert into public.clinical_cases (client_id, title, case_status, severity, summary, opened_on, created_by_app_user_id)
  values (
    p_client_id,
    trim(p_title),
    p_case_status,
    p_severity,
    nullif(trim(coalesce(p_summary, '')), ''),
    p_opened_on,
    v_actor.id
  )
  returning * into v_new;

  insert into public.audit_logs (actor_user_id, actor_auth_user_id, action, target_type, target_id, risk_level, metadata)
  values (v_actor.id, auth.uid(), 'clinical_case.created', 'clinical_case', v_new.id, 'high',
    jsonb_build_object('case_status', v_new.case_status, 'severity', v_new.severity));

  return query
  select v_new.id, v_new.client_id, v_new.title, v_new.case_status,
    v_new.severity, v_new.summary, v_new.opened_on, v_new.created_at, v_new.updated_at;
end;
$$;

revoke all on function public.create_clinical_case(uuid, text, text, text, text, date) from public;
revoke all on function public.create_clinical_case(uuid, text, text, text, text, date) from anon;
grant execute on function public.create_clinical_case(uuid, text, text, text, text, date) to authenticated;

comment on function public.create_clinical_case(uuid, text, text, text, text, date) is
  'Authenticated, can_manage_clinical_cases-gated clinical case creation with audit logging.';
