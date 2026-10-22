-- Run after admin-shelter-review.sql. Does not suspend any account by itself.
begin;
alter table public.shelter_approvals drop constraint if exists shelter_approvals_status_check;
alter table public.shelter_approvals add constraint shelter_approvals_status_check check(status in ('pending','approved','rejected','suspended'));
create or replace function public.admin_verified_shelter_details(shelter_user_id uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare result jsonb;
begin
 if not exists(select 1 from auth.users where id=auth.uid() and raw_app_meta_data->>'role'='admin') then raise exception 'Administrator access required' using errcode='42501'; end if;
 if not exists(select 1 from profiles where id=shelter_user_id and role='shelter') then raise exception 'Shelter not found'; end if;
 select jsonb_build_object('available',(select count(*) from user_records where owner_id=shelter_user_id and kind='pet' and lower(data->>'status') in ('available','senior gentle')),'adopted',(select count(*) from user_records where owner_id=shelter_user_id and kind='pet' and lower(data->>'status')='adopted'),'hours',(select data->>'hours' from user_records where owner_id=shelter_user_id and kind='shelter' order by created_at limit 1),'approvedAt',case when a.status='approved' then a.updated_at else null end) into result from shelter_approvals a where a.user_id=shelter_user_id;
 return result;
end; $$;
revoke all on function public.admin_verified_shelter_details(uuid) from public,anon;
grant execute on function public.admin_verified_shelter_details(uuid) to authenticated;
create or replace function public.admin_suspend_shelter(shelter_user_id uuid)
returns void language plpgsql security definer set search_path=public as $$
begin
 if not exists(select 1 from auth.users where id=auth.uid() and raw_app_meta_data->>'role'='admin') then raise exception 'Administrator access required' using errcode='42501'; end if;
 perform 1 from profiles where id=shelter_user_id and role='shelter' for update;
 if not found then raise exception 'Shelter not found'; end if;
 update shelter_approvals set status='suspended',updated_at=now() where user_id=shelter_user_id and status='approved';
 if not found then raise exception 'Only an approved shelter can be suspended'; end if;
 update auth.users set banned_until='infinity'::timestamptz where id=shelter_user_id;
 delete from auth.sessions where user_id=shelter_user_id;
end; $$;
revoke all on function public.admin_suspend_shelter(uuid) from public,anon;
grant execute on function public.admin_suspend_shelter(uuid) to authenticated;
-- Also block still-unexpired access tokens, including writes through definer RPCs.
create or replace function public.account_is_not_suspended()
returns boolean language sql stable security definer set search_path=public as $$
 select not exists(select 1 from shelter_approvals where user_id=auth.uid() and status='suspended');
$$;
revoke all on function public.account_is_not_suspended() from public;
grant execute on function public.account_is_not_suspended() to anon,authenticated;
create or replace function public.guard_suspended_account()
returns trigger language plpgsql security definer set search_path=public as $$
begin
 if not public.account_is_not_suspended() then raise exception 'This shelter account is suspended' using errcode='42501'; end if;
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
commit;
