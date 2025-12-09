-- Groups schema for multi-tenant church management

create table if not exists public."group" (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.church(id) on delete cascade,
  branch_id uuid references public.branch(id) on delete set null,
  name text not null,
  type text,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.group_member (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.church(id) on delete cascade,
  group_id uuid not null references public."group"(id) on delete cascade,
  member_id uuid not null references public.member(id) on delete cascade,
  joined_at timestamptz not null default now()
);

create table if not exists public.group_announcement (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.church(id) on delete cascade,
  group_id uuid not null references public."group"(id) on delete cascade,
  title text not null,
  body text not null,
  created_at timestamptz not null default now(),
  created_by uuid references public.app_user(id)
);
