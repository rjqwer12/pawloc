-- Run after setup-user-testing.sql and shelter-profile.sql.
create or replace function public.admin_accept_shelter(shelter_user_id uuid, pin_latitude double precision, pin_longitude double precision)
returns void language plpgsql security definer set search_path=public as $$
declare applicant public.profiles; directory_id uuid; decision text;
begin
  if not exists(select 1 from auth.users where id=auth.uid() and raw_app_meta_data->>'role'='admin') then
    raise exception 'Administrator access required' using errcode='42501';
  end if;
  if pin_latitude is null or pin_longitude is null or not(pin_latitude between -90 and 90) or not(pin_longitude between -180 and 180) then
    raise exception 'Select a valid shelter location';
  end if;
  select * into applicant from public.profiles where id=shelter_user_id and role='shelter' for update;
  if not found then raise exception 'Shelter application not found'; end if;
  select status into decision from public.shelter_approvals where user_id=shelter_user_id for update;
  if coalesce(decision,'pending')<>'pending' then raise exception 'This application has already been reviewed. Refresh the users list.'; end if;
  select id into directory_id from public.user_records where kind='shelter' and owner_id=shelter_user_id order by created_at limit 1 for update;
  if directory_id is null then
    insert into public.user_records(kind,owner_id,data) values('shelter',shelter_user_id,jsonb_build_object(
      'name',applicant.shelter_name,'landmark',applicant.address,'phone',to_jsonb(applicant)->>'phone','latitude',pin_latitude,'longitude',pin_longitude,'status','See visiting hours'));
  else
    update public.user_records set data=data||jsonb_build_object('phone',coalesce(nullif(data->>'phone',''),to_jsonb(applicant)->>'phone'),'latitude',pin_latitude,'longitude',pin_longitude) where id=directory_id;
  end if;
  insert into public.shelter_approvals(user_id,status,updated_at) values(shelter_user_id,'approved',now())
    on conflict(user_id) do update set status='approved',updated_at=now();
end;
$$;
revoke all on function public.admin_accept_shelter(uuid,double precision,double precision) from public,anon;
grant execute on function public.admin_accept_shelter(uuid,double precision,double precision) to authenticated;
