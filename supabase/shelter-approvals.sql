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
