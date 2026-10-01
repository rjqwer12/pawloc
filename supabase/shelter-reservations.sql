-- Run once in the SQL Editor after setup-user-testing.sql.
create or replace function public.review_shelter_reservation(
  reservation_id uuid, decision text, visit_at timestamptz default null,
  rejection_reason text default null
) returns public.user_records
language plpgsql security definer set search_path = public as $$
declare result public.user_records;
begin
  if auth.uid() is null or not exists (
    select 1 from public.shelter_approvals where user_id=auth.uid() and status='approved'
  ) then raise exception 'An approved shelter account is required'; end if;
  if decision is null or decision not in ('approved','rejected') then raise exception 'Invalid decision'; end if;
  -- Serialize decisions for a shelter to prevent overlapping appointments.
  perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text, 0));
  select * into result from public.user_records where id=reservation_id
    and kind='reservation' and recipient_id=auth.uid() for update;
  if not found then raise exception 'Reservation not found'; end if;
  if result.data->>'status' is distinct from 'pending' then raise exception 'This request is no longer pending. Refresh the dashboard.'; end if;
  if decision='approved' then
    if visit_at is null or visit_at <= now() then raise exception 'Select a future visit date and time'; end if;
    if exists (select 1 from public.user_records where kind='reservation' and recipient_id=auth.uid()
      and data->>'status'='approved' and data->>'visitAt' is not null
      and (data->>'visitAt')::timestamptz < visit_at + interval '30 minutes'
      and (data->>'visitAt')::timestamptz + interval '30 minutes' > visit_at
    ) then raise exception 'That appointment overlaps another visit. Choose another time.'; end if;
    result.data := result.data || jsonb_build_object('status',decision,'visitAt',visit_at,
      'visitSchedule',to_char(visit_at at time zone 'Asia/Manila','FMDay, FMMonth DD, YYYY "at" HH12:MI AM') || ' (Philippine time)');
  else
    if rejection_reason is null or length(trim(rejection_reason))=0 or length(rejection_reason)>1000 then
      raise exception 'A rejection reason is required'; end if;
    result.data := result.data || jsonb_build_object('status',decision,'rejectionReason',trim(rejection_reason));
  end if;
  update public.user_records set data=result.data || jsonb_build_object('reviewedAt',now())
    where id=reservation_id returning * into result;
  return result;
end $$;
revoke all on function public.review_shelter_reservation(uuid,text,timestamptz,text) from public;
grant execute on function public.review_shelter_reservation(uuid,text,timestamptz,text) to authenticated;
