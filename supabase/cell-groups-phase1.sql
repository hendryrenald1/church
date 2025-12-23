-- Cell Groups Phase 1 schema

create table if not exists public.cell_group (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.church(id) on delete cascade,
  branch_id uuid references public.branch(id) on delete set null,
  name text not null,
  description text,
  schedule_weekday integer check (schedule_weekday between 0 and 6),
  default_meeting_time time,
  status text not null check (status in ('ACTIVE','INACTIVE')) default 'ACTIVE',
  host_address text,
  allow_children boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.app_user(id),
  updated_by uuid references public.app_user(id)
);

create index if not exists cell_group_church_idx on public.cell_group(church_id);
create index if not exists cell_group_branch_idx on public.cell_group(branch_id);

create table if not exists public.cell_group_member (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.church(id) on delete cascade,
  group_id uuid not null references public.cell_group(id) on delete cascade,
  member_id uuid not null references public.member(id) on delete cascade,
  role text not null check (role in ('LEADER','ASSISTANT','MEMBER')) default 'MEMBER',
  joined_at timestamptz not null default now(),
  archived_at timestamptz
);

create unique index if not exists cell_group_member_unique_active on public.cell_group_member(group_id, member_id) where archived_at is null;
create index if not exists cell_group_member_member_idx on public.cell_group_member(member_id);

create table if not exists public.cell_meeting (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.church(id) on delete cascade,
  group_id uuid not null references public.cell_group(id) on delete cascade,
  meeting_date date not null,
  status text not null check (status in ('SCHEDULED','HELD','CANCELLED')) default 'SCHEDULED',
  leader_member_id uuid references public.member(id),
  notes text,
  visitor_count integer default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.app_user(id),
  updated_by uuid references public.app_user(id),
  finalized_at timestamptz,
  finalized_by uuid references public.app_user(id),
  combined_with_meeting_id uuid references public.cell_meeting(id)
);

create unique index if not exists cell_meeting_unique_week on public.cell_meeting(group_id, meeting_date);
create index if not exists cell_meeting_church_date_idx on public.cell_meeting(church_id, meeting_date desc);

create table if not exists public.meeting_attendance (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.church(id) on delete cascade,
  meeting_id uuid not null references public.cell_meeting(id) on delete cascade,
  member_id uuid not null references public.member(id) on delete cascade,
  status text not null check (status in ('UNKNOWN','PRESENT','ABSENT')) default 'UNKNOWN',
  is_child boolean not null default false,
  recorded_by uuid references public.app_user(id),
  recorded_at timestamptz default now()
);

create unique index if not exists meeting_attendance_unique_member on public.meeting_attendance(meeting_id, member_id);
create index if not exists meeting_attendance_member_idx on public.meeting_attendance(member_id, meeting_id);
