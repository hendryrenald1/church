-- Schema for multi-tenant church platform
create type app_role as enum ('SUPER_ADMIN', 'ADMIN', 'PASTOR');

create table church (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  primary_contact_name text not null,
  primary_contact_email text not null,
  status text not null check (status in ('PENDING','ACTIVE','SUSPENDED')),
  plan text not null check (plan in ('FREE','STANDARD','PREMIUM')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table app_user (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role app_role not null,
  church_id uuid references church(id),
  member_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint admin_or_pastor_requires_church check (
    (role = 'SUPER_ADMIN' and church_id is null) or
    (role in ('ADMIN','PASTOR') and church_id is not null)
  )
);

create table branch (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references church(id) on delete cascade,
  name text not null,
  city text not null,
  address text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table member (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references church(id) on delete cascade,
  branch_id uuid references branch(id),
  first_name text not null,
  last_name text not null,
  gender text,
  email text,
  phone text,
  status text not null check (status in ('ACTIVE','INACTIVE')),
  joined_date date not null,
  date_of_birth date,
  baptism_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table pastor_profile (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references member(id) on delete cascade,
  church_id uuid not null references church(id) on delete cascade,
  title text not null,
  ordination_date date,
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (member_id)
);

create table pastor_branch (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references church(id) on delete cascade,
  pastor_profile_id uuid not null references pastor_profile(id) on delete cascade,
  branch_id uuid not null references branch(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (pastor_profile_id, branch_id)
);

create table family (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references church(id) on delete cascade,
  family_name text,
  wedding_anniversary date,
  address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table family_member (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references church(id) on delete cascade,
  family_id uuid not null references family(id) on delete cascade,
  member_id uuid not null references member(id) on delete cascade,
  relationship text not null check (relationship in ('HEAD','SPOUSE','CHILD','OTHER')),
  is_primary_contact boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (family_id, member_id)
);

-- Enable RLS
alter table church enable row level security;
alter table app_user enable row level security;
alter table branch enable row level security;
alter table member enable row level security;
alter table pastor_profile enable row level security;
alter table pastor_branch enable row level security;
alter table family enable row level security;
alter table family_member enable row level security;

-- Policies
create policy "sa all churches" on church for all using (auth.jwt() ->> 'role' = 'SUPER_ADMIN');
create policy "church select self" on church for select using (id = (auth.jwt() ->> 'church_id')::uuid);

do $$ declare t text; begin
  for t in select unnest(array['branch','member','pastor_profile','pastor_branch','family','family_member'])
  loop
    execute format($p$
      create policy "sa all %1$s" on %1$s
        for all using (auth.jwt() ->> 'role' = 'SUPER_ADMIN');
      create policy "tenant %1$s" on %1$s
        for all using (church_id = (auth.jwt() ->> 'church_id')::uuid);
    $p$, t);
  end loop;
end $$;

create policy "app_user super" on app_user
  for all using (auth.jwt() ->> 'role' = 'SUPER_ADMIN');
create policy "app_user same church" on app_user
  for select using (
    (auth.jwt() ->> 'role') in ('ADMIN','PASTOR')
    and church_id = (auth.jwt() ->> 'church_id')::uuid
  );

