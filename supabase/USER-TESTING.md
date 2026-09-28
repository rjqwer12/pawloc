# Connect and test User features

1. Sign in at https://supabase.com/dashboard and select your PAWLOC project. If you cannot see it, ask its owner to invite you. If it is paused, restore it first.
2. Open **SQL Editor → New query**. Paste the entire `setup-user-testing.sql` file and click **Run**. It creates tables, image storage, and ownership policies. Existing tables and data are not deleted.
3. Optionally run `test-listings.sql` to add six clearly marked demo pets and one demo shelter for adoption testing. They are test inventory, not actual shelter listings.
4. In the project's **Connect** panel, copy the project URL and public anon key into `.env` as `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Do not put service-role keys or database passwords in Vite environment variables. Restart `npm run dev -- --host 0.0.0.0 --port 5174` after changing `.env`.
5. Create a real **User** account through the website and verify its email. The `test` / `test` account is a local preview and cannot persist database records. Configure the Supabase email OTP template to include the code and an 8-digit OTP length, matching the existing UI.

## Test with two real accounts

- User A creates Lost, Found, and Reunited posts with photos. Reload and confirm they remain in the feed and A's Library.
- User B can see A's feed posts but not A's Library. B sends contact details; A opens the bell button to read the message. Other accounts cannot read it.
- B adds/removes a heart, writes a comment, and reports a post. Reports are stored for administrator review, not emailed.
- A edits a post and reloads to check persistence. A deletes a disposable post and checks that it disappears from the feed. Database deletion is permanent; the preview Undo action does not apply.
- Reserve a demo pet, reload Library, and check Pending Reservation. Cancel it and reload to confirm Reservation Cancelled remains.
- Save profile name/photo and reload. Change a password, log out, and log in with the new one.
- Account deletion is permanent. Test it only with a disposable account; it removes owned files before removing the account and its records.
- Open Shelters → Directions and confirm the selected listing opens the in-app map. The map uses external map/route services rather than Supabase. Exact locations require actual shelter coordinates or manual map selection.

## Administrator test actions

There is no admin review interface yet. Use the SQL Editor to inspect `user_records` for reports and reservations. Decisions must be made by the project owner/admin, not by a normal browser user.

To test reservation approval, replace the ID and schedule below with the reservation's actual ID and intended schedule:

```sql
update public.user_records
set data = data || jsonb_build_object('status','approved','visitSchedule','YOUR SCHEDULE')
where id = 'RESERVATION_UUID' and kind = 'reservation';
```

For rejection, set `status` to `rejected` and add `rejectionReason`. Refresh Library to load the decision. Demo pets have no assigned real shelter owner; their requests are available to the project administrator. Production pet records need an `owner_id` belonging to their actual shelter.

Shelter login approval uses `shelter_approvals`. An absent row means pending. Add or update a decision through the SQL Editor with the real user's UUID. Never expose a privileged key to the browser.

## Current limitations

- No email, SMS, push delivery, or live subscription is implemented. The bell loads saved messages/reservations when opened; pages refresh data when reopened.
- Database setup and row-level policies must be verified in the live project. Local mocked UI checks do not validate server permissions.
- User images are publicly readable for post display; private contact data stays in access-controlled records.
- The configured project hostname could not be resolved during the connection check. Confirm the correct active project URL before testing.
