-- Run after admin-accept-shelter.sql and admin-users.sql.
alter table public.shelter_approvals add column if not exists rejection_reason text;
create or replace function public.admin_can_read_shelter_document(object_name text)
returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from auth.users where id=auth.uid() and raw_app_meta_data->>'role'='admin')
  and exists(select 1 from public.profiles where role='shelter' and (bir_path=object_name or permit_path=object_name));
$$;
revoke all on function public.admin_can_read_shelter_document(text) from public,anon;
grant execute on function public.admin_can_read_shelter_document(text) to authenticated;
drop policy if exists "Admins view submitted shelter documents" on storage.objects;
create policy "Admins view submitted shelter documents" on storage.objects for select to authenticated
using(bucket_id='shelter-docs' and public.admin_can_read_shelter_document(name));

create or replace function public.admin_shelter_documents(shelter_user_id uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare applicant public.profiles;
begin
  if not exists(select 1 from auth.users where id=auth.uid() and raw_app_meta_data->>'role'='admin') then
    raise exception 'Administrator access required' using errcode='42501';
  end if;
  select * into applicant from public.profiles where id=shelter_user_id and role='shelter';
  if not found then raise exception 'Shelter application not found'; end if;
  return jsonb_build_array(
    jsonb_build_object('label','Mayor''s Business Permit','path',applicant.permit_path),
    jsonb_build_object('label','Shelter Image','path',applicant.bir_path));
end;
$$;
revoke all on function public.admin_shelter_documents(uuid) from public,anon;
grant execute on function public.admin_shelter_documents(uuid) to authenticated;

create or replace function public.admin_reject_shelter(shelter_user_id uuid,rejection_reason text)
returns void language plpgsql security definer set search_path=public as $$
declare decision text;
begin
  if not exists(select 1 from auth.users where id=auth.uid() and raw_app_meta_data->>'role'='admin') then
    raise exception 'Administrator access required' using errcode='42501';
  end if;
  if rejection_reason is null or length(trim(rejection_reason)) not between 1 and 1000 then
    raise exception 'Enter a rejection reason (up to 1000 characters)';
  end if;
  perform 1 from public.profiles where id=shelter_user_id and role='shelter' for update;
  if not found then raise exception 'Shelter application not found'; end if;
  select status into decision from public.shelter_approvals where user_id=shelter_user_id for update;
  if coalesce(decision,'pending')<>'pending' then raise exception 'This application has already been reviewed. Refresh the users list.'; end if;
  insert into public.shelter_approvals(user_id,status,rejection_reason,updated_at)
  values(shelter_user_id,'rejected',trim(rejection_reason),now())
  on conflict(user_id) do update set status='rejected',rejection_reason=excluded.rejection_reason,updated_at=now();
end;
$$;
revoke all on function public.admin_reject_shelter(uuid,text) from public,anon;
grant execute on function public.admin_reject_shelter(uuid,text) to authenticated;
