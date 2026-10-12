-- First create pawloc@admin.com in Authentication > Users > Add user.
-- Enter the requested password there, with Auto Confirm User enabled.
-- Run only in the Supabase SQL Editor as the project owner.
do $$
begin
  update auth.users set raw_app_meta_data=coalesce(raw_app_meta_data,'{}'::jsonb)||'{"role":"admin"}'::jsonb
  where lower(email)='pawloc@admin.com';
  if not found then raise exception 'Create pawloc@admin.com in Authentication > Users first'; end if;
end;
$$;
