-- Lost/found/reunited community posts, separate from complaints about posts.
-- Review decisions belong to admins, not editable post payloads.
create table if not exists public.pet_report_reviews (
  post_id uuid primary key references public.user_records(id) on delete cascade,
  status text not null default 'pending' check(status in ('pending','accepted','rejected')),
  reason text,
  reviewed_at timestamptz
);
alter table public.pet_report_reviews enable row level security;
revoke all on public.pet_report_reviews from anon,authenticated;
grant all on public.pet_report_reviews to service_role;
create or replace function public.admin_pet_reports()
returns jsonb language plpgsql security definer set search_path=public as $$
begin
  if not exists(select 1 from auth.users where id=auth.uid() and raw_app_meta_data->>'role'='admin') then
    raise exception 'Administrator access required' using errcode='42501';
  end if;
  return coalesce((select jsonb_agg(jsonb_build_object(
    'id',p.id,'title',coalesce(p.data->>'petName',p.data->>'title','Pet report'),
    'category',p.data->>'category','image',p.data->>'image','description',p.data->>'description',
    'location',p.data->>'location','landmark',p.data->>'landmark',
    'author',p.data->>'author','createdAt',p.created_at,
    'status',coalesce(r.status,'pending'),'reason',r.reason
  ) order by p.created_at desc) from public.user_records p
  left join public.pet_report_reviews r on r.post_id=p.id
  where p.kind='post' and p.data->>'category' in ('lost','found','reunited')),'[]'::jsonb);
end;
$$;
revoke all on function public.admin_pet_reports() from public,anon;
grant execute on function public.admin_pet_reports() to authenticated;
