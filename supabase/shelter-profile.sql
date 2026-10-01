-- Run after setup-user-testing.sql to enable public shelter profile updates.
-- Admins set coordinates through a trusted service-role backend or SQL Editor.
-- Reject coordinate changes from browser clients, including direct API calls.
create or replace function public.protect_shelter_pin()
returns trigger language plpgsql set search_path=public as $$
begin
  if new.kind = 'shelter' and current_user in ('authenticated', 'anon') then
    if TG_OP = 'INSERT' then
      if nullif(new.data->>'latitude', '') is not null or nullif(new.data->>'longitude', '') is not null then
        raise exception 'Only an admin can set the shelter location';
      end if;
    elsif nullif(new.data->>'latitude', '') is distinct from nullif(old.data->>'latitude', '')
       or nullif(new.data->>'longitude', '') is distinct from nullif(old.data->>'longitude', '') then
      raise exception 'Only an admin can change the shelter location';
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists protect_shelter_pin on public.user_records;
create trigger protect_shelter_pin before insert or update on public.user_records
for each row execute function public.protect_shelter_pin();

drop policy if exists "Shelters create own directory entry" on public.user_records;
create policy "Shelters create own directory entry" on public.user_records for insert to authenticated with check (
  kind='shelter' and owner_id=auth.uid() and recipient_id is null and parent_id is null
  and exists(select 1 from public.shelter_approvals where user_id=auth.uid() and status='approved')
  and length(trim(data->>'name'))>0 and length(trim(data->>'landmark'))>0 and length(data->>'image')>0
);
drop policy if exists "Shelters update own directory entry" on public.user_records;
create policy "Shelters update own directory entry" on public.user_records for update to authenticated using (
  kind='shelter' and owner_id=auth.uid()
  and exists(select 1 from public.shelter_approvals where user_id=auth.uid() and status='approved')
) with check (kind='shelter' and owner_id=auth.uid() and length(trim(data->>'name'))>0
  and length(trim(data->>'landmark'))>0 and length(data->>'image')>0);
