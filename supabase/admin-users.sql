-- Run after setup-database.sql. Only trusted admins can read this directory.
create or replace function public.admin_users()
returns jsonb language plpgsql security definer set search_path=public as $$
begin
  if not exists(select 1 from auth.users where id=auth.uid() and raw_app_meta_data->>'role'='admin') then
    raise exception 'Administrator access required' using errcode='42501';
  end if;
  return coalesce((select jsonb_agg(jsonb_build_object(
    'id',p.id,'name',case when p.role='shelter' then coalesce(nullif(p.shelter_name,''),'Shelter') else coalesce(nullif(concat_ws(' ',p.first_name,p.middle_name,p.last_name),''),'Client') end,
    'email',u.email,'phone',to_jsonb(p)->>'phone','role',p.role,'representative',p.representative,'address',p.address,
    'status',case when p.role='shelter' then coalesce(a.status,'pending') when u.email_confirmed_at is not null then 'active' else 'unconfirmed' end,
    'createdAt',p.created_at,'licenseId',coalesce(to_jsonb(p)->>'license_id',''),
    'rejectionReason',coalesce(to_jsonb(a)->>'rejection_reason',''),
    'hasBir',p.bir_path is not null,'hasPermit',p.permit_path is not null
  ) order by p.created_at desc) from public.profiles p join auth.users u on u.id=p.id
  left join public.shelter_approvals a on a.user_id=p.id
  where coalesce(u.raw_app_meta_data->>'role','')<>'admin'),'[]'::jsonb);
end;
$$;
revoke all on function public.admin_users() from public,anon;
grant execute on function public.admin_users() to authenticated;
