-- Run after user-features.sql. Reports here are complaints submitted through Report Post.
begin;
create table if not exists public.post_complaint_reviews (
 report_id uuid primary key references public.user_records(id) on delete cascade,
 status text not null check(status in ('accepted','rejected')),
 reviewed_by uuid references auth.users(id) on delete set null,
 reviewed_at timestamptz not null default now()
);
alter table public.post_complaint_reviews enable row level security;
revoke all on public.post_complaint_reviews from anon,authenticated;
grant all on public.post_complaint_reviews to service_role;
create or replace function public.admin_moderation_reports()
returns jsonb language plpgsql security definer set search_path=public as $$
begin
 if not exists(select 1 from auth.users where id=auth.uid() and raw_app_meta_data->>'role'='admin' and (banned_until is null or banned_until<=now())) then raise exception 'Administrator access required' using errcode='42501'; end if;
 return coalesce((select jsonb_agg(jsonb_build_object(
 'id',r.id,'postId',p.id,'title',coalesce(p.data->>'petName',p.data->>'title','Unavailable post'),
 'category',p.data->>'category','image',p.data->>'image','description',p.data->>'description',
 'location',p.data->>'location','landmark',p.data->>'landmark','author',p.data->>'author',
 'createdAt',r.created_at,'postCreatedAt',p.created_at,'postAvailable',p.id is not null,
 'status',coalesce(v.status,'pending'),'reason',r.data->>'reason','reportDetails',r.data->>'description',
 'reporter',coalesce(nullif(concat_ws(' ',pr.first_name,pr.middle_name,pr.last_name),''),'Community member'),
 'reporterEmail',u.email,'reporterVerified',u.email_confirmed_at is not null
 ) order by r.created_at desc) from public.user_records r
 left join public.user_records p on p.id=r.parent_id and p.kind='post'
 left join public.profiles pr on pr.id=r.owner_id left join auth.users u on u.id=r.owner_id
 left join public.post_complaint_reviews v on v.report_id=r.id where r.kind='report'),'[]'::jsonb);
end; $$;
revoke all on function public.admin_moderation_reports() from public,anon;
grant execute on function public.admin_moderation_reports() to authenticated;
create or replace function public.admin_review_complaint(complaint_id uuid,decision text)
returns void language plpgsql security definer set search_path=public as $$
begin
 if not exists(select 1 from auth.users where id=auth.uid() and raw_app_meta_data->>'role'='admin' and (banned_until is null or banned_until<=now())) then raise exception 'Administrator access required' using errcode='42501'; end if;
 if decision is null or decision not in ('accepted','rejected') then raise exception 'Invalid review decision'; end if;
 perform 1 from public.user_records where id=complaint_id and kind='report' for update;
 if not found then raise exception 'Report not found'; end if;
 if exists(select 1 from post_complaint_reviews where report_id=complaint_id) then raise exception 'This report has already been reviewed. Reopen the report to refresh its status.'; end if;
 insert into post_complaint_reviews(report_id,status,reviewed_by) values(complaint_id,decision,auth.uid());
end; $$;
revoke all on function public.admin_review_complaint(uuid,text) from public,anon;
grant execute on function public.admin_review_complaint(uuid,text) to authenticated;
commit;
