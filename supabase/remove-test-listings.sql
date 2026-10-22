-- Remove only fixtures inserted by the retired demo seed script and their linked test activity.
-- Real shelter-owned listings are not selected.
begin;
create temporary table pawloc_test_ids on commit drop as
select id from public.user_records where owner_id is null and (
  (kind='shelter' and id='10000000-0000-4000-8000-000000000001') or
  (kind='pet' and id in (
    '20000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000002',
    '20000000-0000-4000-8000-000000000003','20000000-0000-4000-8000-000000000004',
    '20000000-0000-4000-8000-000000000005','20000000-0000-4000-8000-000000000006')));
delete from public.user_records where kind='reservation' and (parent_id in (select id from pawloc_test_ids)
  or data->>'petId' in (select id::text from pawloc_test_ids)
  or data->>'shelterId' in (select id::text from pawloc_test_ids));
delete from public.user_records where id in (select id from pawloc_test_ids);
commit;
