-- Run after setup-user-testing.sql. Does not grant admin access to any user.
create or replace function public.admin_dashboard()
returns jsonb language plpgsql security definer set search_path=public as $$
declare result jsonb;
begin
  if not exists(select 1 from auth.users where id=auth.uid() and raw_app_meta_data->>'role'='admin') then
    raise exception 'Administrator access required' using errcode='42501';
  end if;
  select jsonb_build_object(
    'users',(select count(*) from public.profiles),
    'clients',(select count(*) from public.profiles where role='adopter'),
    'pending',(select count(*) from public.profiles p left join public.shelter_approvals a on a.user_id=p.id where p.role='shelter' and coalesce(a.status,'pending')='pending'),
    'verified',(select count(*) from public.shelter_approvals where status='approved'),
    'posts',(select count(*) from public.user_records where kind='post'),
    'reports',(select count(*) from public.user_records where kind='report' and coalesce(data->>'status','pending') not in ('resolved','dismissed')),
    'reportTotal',(select count(*) from public.user_records where kind='report'),
    'resolved',(select count(*) from public.user_records where kind='report' and data->>'status'='resolved'),
    'outcomes',(select count(*) from public.user_records where (kind='post' and data->>'category'='reunited') or (kind='pet' and data->>'status'='Adopted')),
    'queue',coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'name',p.shelter_name,'createdAt',p.created_at) order by p.created_at desc) from public.profiles p left join public.shelter_approvals a on a.user_id=p.id where p.role='shelter' and coalesce(a.status,'pending')='pending'),'[]'::jsonb),
    'activity',coalesce((select jsonb_agg(e order by e.at desc) from (
      select * from (
        select id,created_at as at,case when role='shelter' then 'New Shelter Application' else 'User Registered' end as title,coalesce(shelter_name,first_name,'New account') as description,case when role='shelter' then 'Shelter' else 'Client' end as label from public.profiles
        union all
        select id,created_at,case when kind='report' then 'Post Report Submitted' when kind='pet' then 'Pet Listed for Adoption' when data->>'category'='reunited' then 'Reunited Story' when data->>'category'='found' then 'Found Pet Report Filed' else 'Lost Pet Report Filed' end,coalesce(data->>'title',data->>'name','Community report'),case when kind='report' then 'Report' when kind='pet' then 'Adoption' else coalesce(data->>'category','Post') end from public.user_records where kind in ('post','pet','report')
      ) events order by at desc limit 8
    ) e),'[]'::jsonb)
  ) into result;
  return result;
end;
$$;
revoke all on function public.admin_dashboard() from public,anon;
grant execute on function public.admin_dashboard() to authenticated;
