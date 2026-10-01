-- Run after setup-user-testing.sql. Allows approved shelters to manage their own pet posts.
drop policy if exists "Shelters create pets" on public.user_records;
create policy "Shelters create pets" on public.user_records for insert to authenticated with check (
  kind='pet' and owner_id=auth.uid() and recipient_id is null and parent_id is null
  and exists(select 1 from public.shelter_approvals where user_id=auth.uid() and status='approved')
  and length(trim(data->>'name'))>0 and length(trim(data->>'species'))>0
  and length(trim(data->>'breed'))>0 and length(data->>'image')>0 and data->>'status'='Available'
);
drop policy if exists "Shelters edit pets" on public.user_records;
create policy "Shelters edit pets" on public.user_records for update to authenticated using (
  kind='pet' and owner_id=auth.uid()
  and exists(select 1 from public.shelter_approvals where user_id=auth.uid() and status='approved')
) with check (
  kind='pet' and owner_id=auth.uid() and length(trim(data->>'name'))>0
  and length(trim(coalesce(data->>'species',data->>'type')))>0
  and length(trim(data->>'breed'))>0 and length(data->>'image')>0
  and data->>'status' in ('Available','Adopted')
);
-- Keep new reservations off adopted listings even if the browser has stale data.
drop policy if exists "Only reserve available pets" on public.user_records;
create policy "Only reserve available pets" on public.user_records as restrictive for insert to authenticated with check (
  kind<>'reservation' or exists(select 1 from public.user_records p where p.id=user_records.parent_id
    and p.kind='pet' and p.data->>'status' in ('Available','Senior Gentle'))
);
