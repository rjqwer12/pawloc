-- Run after setup-user-testing.sql. Counts real records; excludes seeded test inventory.
create or replace function public.admin_system_overview()
returns jsonb language plpgsql security definer set search_path=public as $$
begin
  if not exists(select 1 from auth.users where id=auth.uid() and raw_app_meta_data->>'role'='admin') then
    raise exception 'Administrator access required' using errcode='42501';
  end if;
  return jsonb_build_object(
    'reunited',(select count(*) from public.user_records where kind='post' and data->>'category'='reunited'),
    'lost',(select count(*) from public.user_records where kind='post' and data->>'category'='lost'),
    'found',(select count(*) from public.user_records where kind='post' and data->>'category'='found'),
    'adoptable',(select count(*) from public.user_records where kind='pet' and data->>'status' in ('Available','Senior Gentle')
      and not(owner_id is null and id in (
        '20000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000002',
        '20000000-0000-4000-8000-000000000003','20000000-0000-4000-8000-000000000004',
        '20000000-0000-4000-8000-000000000005','20000000-0000-4000-8000-000000000006'))),
    'users',(select count(*) from public.profiles p join auth.users u on u.id=p.id where coalesce(u.raw_app_meta_data->>'role','')<>'admin'),
    'shelters',(select count(*) from public.profiles p join auth.users u on u.id=p.id where p.role='shelter' and coalesce(u.raw_app_meta_data->>'role','')<>'admin'),
    'pending',(select count(*) from public.profiles p join auth.users u on u.id=p.id left join public.shelter_approvals a on a.user_id=p.id
      where p.role='shelter' and coalesce(a.status,'pending')='pending' and coalesce(u.raw_app_meta_data->>'role','')<>'admin')
  );
end;
$$;
revoke all on function public.admin_system_overview() from public,anon;
grant execute on function public.admin_system_overview() to authenticated;
