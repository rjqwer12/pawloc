-- Run this in the Supabase SQL Editor once.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'user' check (role in ('user', 'shelter', 'admin')),
  first_name text,
  middle_name text,
  last_name text,
  shelter_name text,
  representative text,
  address text,
  bir_path text,
  permit_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

update public.profiles
set role = 'user'
where role = 'adopter';

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check check (role in ('user', 'shelter', 'admin'));

alter table public.profiles enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

insert into storage.buckets (id, name, public)
values ('shelter-docs', 'shelter-docs', false)
on conflict (id) do nothing;

drop policy if exists "Users can upload own shelter docs" on storage.objects;
create policy "Users can upload own shelter docs"
  on storage.objects for insert
  with check (
    bucket_id = 'shelter-docs'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Users can update own shelter docs" on storage.objects;
create policy "Users can update own shelter docs"
  on storage.objects for update
  using (
    bucket_id = 'shelter-docs'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Users can read own shelter docs" on storage.objects;
create policy "Users can read own shelter docs"
  on storage.objects for select
  using (
    bucket_id = 'shelter-docs'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
