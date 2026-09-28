-- schema.sql
-- Run this in the Supabase SQL Editor once.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'adopter' check (role in ('adopter', 'shelter')),
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


-- shelter-approvals.sql
-- Run in the Supabase SQL Editor. Only a trusted admin/service role may
-- update approval decisions; signed-in users may read their own status.
create table if not exists public.shelter_approvals (
  user_id uuid primary key references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  updated_at timestamptz not null default now()
);
alter table public.shelter_approvals enable row level security;
revoke all on public.shelter_approvals from anon, authenticated;
grant select on public.shelter_approvals to authenticated;
grant all on public.shelter_approvals to service_role;
drop policy if exists "Read own shelter approval" on public.shelter_approvals;
create policy "Read own shelter approval" on public.shelter_approvals
  for select to authenticated using (auth.uid() = user_id);
-- An absent decision is treated as pending by the application.
insert into public.shelter_approvals (user_id)
select id from public.profiles where role = 'shelter'
on conflict (user_id) do nothing;


-- user-features.sql
-- Run after schema.sql and shelter-approvals.sql. Safe to rerun.
create table if not exists public.user_records (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('post','shelter','pet','reservation','contact','report','like','comment')),
  owner_id uuid references auth.users(id) on delete cascade,
  recipient_id uuid references auth.users(id) on delete cascade,
  parent_id uuid references public.user_records(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists user_records_kind_owner on public.user_records(kind, owner_id);
create unique index if not exists user_records_one_like on public.user_records(owner_id,parent_id) where kind='like';
create unique index if not exists user_records_one_active_reservation on public.user_records(owner_id,parent_id) where kind='reservation' and data->>'status' in ('pending','approved');
alter table public.user_records enable row level security;
grant select,insert,update,delete on public.user_records to authenticated;
grant all on public.user_records to service_role;
grant select on public.user_records to anon;
drop policy if exists "Read community records" on public.user_records;
create policy "Read community records" on public.user_records for select using (
  kind in ('post','shelter','pet','like','comment') or owner_id=auth.uid() or recipient_id=auth.uid()
);
drop policy if exists "Create own records" on public.user_records;
create policy "Create own records" on public.user_records for insert to authenticated with check (
  owner_id=auth.uid() and (
    (kind='post' and data->>'category' in ('lost','found','reunited') and length(data->>'title')>0 and length(data->>'image')>0 and recipient_id is null)
    or (kind in ('like','comment','report') and recipient_id is null and exists (select 1 from public.user_records p where p.id=user_records.parent_id and p.kind='post'))
    or (kind='contact' and exists (select 1 from public.user_records p where p.id=user_records.parent_id and p.kind='post' and p.owner_id=user_records.recipient_id))
    or (kind='reservation' and data->>'status'='pending' and exists (select 1 from public.user_records p where p.id=user_records.parent_id and p.kind='pet' and p.owner_id is not distinct from user_records.recipient_id))
  )
);
drop policy if exists "Edit own posts" on public.user_records;
create policy "Edit own posts" on public.user_records for update to authenticated
  using (owner_id=auth.uid() and kind='post')
  with check (owner_id=auth.uid() and kind='post' and data->>'category' in ('lost','found','reunited') and length(data->>'image')>0);
drop policy if exists "Delete own posts and reactions" on public.user_records;
create policy "Delete own posts and reactions" on public.user_records for delete to authenticated using (owner_id=auth.uid() and kind in ('post','like','comment'));
-- Prevent clients changing identity or recipients through an update.
create or replace function public.keep_record_identity() returns trigger language plpgsql set search_path=public as $$
begin
  if new.id<>old.id or new.kind<>old.kind or new.owner_id is distinct from old.owner_id or new.recipient_id is distinct from old.recipient_id or new.parent_id is distinct from old.parent_id then
    raise exception 'Record identity cannot be changed';
  end if;
  return new;
end $$;
drop trigger if exists keep_record_identity on public.user_records;
create trigger keep_record_identity before update on public.user_records for each row execute function public.keep_record_identity();
create or replace function public.cancel_user_reservation(reservation_id uuid) returns void
language plpgsql security definer set search_path=public as $$
begin
  update public.user_records set data=jsonb_set(data,'{status}','"cancelled"')
  where id=reservation_id and owner_id=auth.uid() and kind='reservation' and data->>'status'='pending';
  if not found then raise exception 'Pending reservation not found'; end if;
end $$;
revoke all on function public.cancel_user_reservation(uuid) from public;
grant execute on function public.cancel_user_reservation(uuid) to authenticated;
create or replace function public.delete_own_account() returns void
language plpgsql security definer set search_path=public as $$
begin
  if auth.uid() is null then raise exception 'Sign in required'; end if;
  delete from auth.users where id=auth.uid();
end $$;
revoke all on function public.delete_own_account() from public;
grant execute on function public.delete_own_account() to authenticated;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('user-images','user-images',true,10485760,array['image/jpeg','image/png']) on conflict(id) do nothing;
drop policy if exists "Upload own user images" on storage.objects;
create policy "Upload own user images" on storage.objects for insert to authenticated with check(bucket_id='user-images' and (storage.foldername(name))[1]=auth.uid()::text);
drop policy if exists "Delete own user images" on storage.objects;
create policy "Delete own user images" on storage.objects for delete to authenticated using(bucket_id='user-images' and (storage.foldername(name))[1]=auth.uid()::text);
drop policy if exists "List own user images" on storage.objects;
create policy "List own user images" on storage.objects for select to authenticated using(bucket_id='user-images' and (storage.foldername(name))[1]=auth.uid()::text);
drop policy if exists "Delete own shelter docs" on storage.objects;
create policy "Delete own shelter docs" on storage.objects for delete to authenticated using(bucket_id='shelter-docs' and (storage.foldername(name))[1]=auth.uid()::text);
