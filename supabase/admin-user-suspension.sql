-- Run after admin-shelter-suspension.sql. No account is suspended by running this migration.
begin;
create or replace function public.admin_client_details(client_user_id uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
begin
 if not exists(select 1 from auth.users where id=auth.uid() and raw_app_meta_data->>'role'='admin' and (banned_until is null or banned_until<=now())) then raise exception 'Administrator access required' using errcode='42501'; end if;
 if not exists(select 1 from profiles where id=client_user_id and role='adopter') then raise exception 'User account not found'; end if;
 return jsonb_build_object('lastLogin',(select last_sign_in_at from auth.users where id=client_user_id),'lost',(select count(*) from user_records where owner_id=client_user_id and kind='post' and data->>'category'='lost'),'found',(select count(*) from user_records where owner_id=client_user_id and kind='post' and data->>'category'='found'),'reunited',(select count(*) from user_records where owner_id=client_user_id and kind='post' and data->>'category'='reunited'));
end; $$;
revoke all on function public.admin_client_details(uuid) from public,anon;
grant execute on function public.admin_client_details(uuid) to authenticated;
create or replace function public.admin_suspend_user(client_user_id uuid)
returns void language plpgsql security definer set search_path=public as $$
begin
 if not exists(select 1 from auth.users where id=auth.uid() and raw_app_meta_data->>'role'='admin' and (banned_until is null or banned_until<=now())) then raise exception 'Administrator access required' using errcode='42501'; end if;
 perform 1 from profiles p join auth.users u on u.id=p.id where p.id=client_user_id and p.role='adopter' and coalesce(u.raw_app_meta_data->>'role','')<>'admin' for update of p,u;
 if not found then raise exception 'Only regular user accounts can be suspended here'; end if;
 update auth.users set banned_until='infinity'::timestamptz where id=client_user_id;
 delete from auth.sessions where user_id=client_user_id;
end; $$;
revoke all on function public.admin_suspend_user(uuid) from public,anon;
grant execute on function public.admin_suspend_user(uuid) to authenticated;
-- Also block still-unexpired access tokens, including writes through definer RPCs.
create or replace function public.account_is_not_suspended()
returns boolean language sql stable security definer set search_path=public as $$
 select not exists(select 1 from auth.users where id=auth.uid() and banned_until > now()) and not exists(select 1 from shelter_approvals where user_id=auth.uid() and status='suspended');
$$;
revoke all on function public.account_is_not_suspended() from public;
grant execute on function public.account_is_not_suspended() to anon,authenticated;
create or replace function public.guard_suspended_account()
returns trigger language plpgsql security definer set search_path=public as $$
begin
 if not public.account_is_not_suspended() then raise exception 'This account is suspended' using errcode='42501'; end if;
 if TG_OP='DELETE' then return OLD; end if; return NEW;
end; $$;
revoke all on function public.guard_suspended_account() from public;
drop trigger if exists guard_suspended_account on public.user_records;
create trigger guard_suspended_account before insert or update or delete on public.user_records for each row execute function public.guard_suspended_account();
drop trigger if exists guard_suspended_account on public.profiles;
create trigger guard_suspended_account before insert or update or delete on public.profiles for each row execute function public.guard_suspended_account();
drop policy if exists "Block suspended accounts" on public.user_records;
create policy "Block suspended accounts" on public.user_records as restrictive for all to authenticated using(public.account_is_not_suspended()) with check(public.account_is_not_suspended());
drop policy if exists "Block suspended storage access" on storage.objects;
create policy "Block suspended storage access" on storage.objects as restrictive for all to authenticated using(public.account_is_not_suspended()) with check(public.account_is_not_suspended());
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
    'status',case when u.banned_until > now() then 'suspended' when p.role='shelter' then coalesce(a.status,'pending') when u.email_confirmed_at is not null then 'active' else 'unconfirmed' end,
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

commit;
