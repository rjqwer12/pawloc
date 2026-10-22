# Database scripts

These SQL files contain database setup and migrations. Keep them for deployment and recovery. Run them manually in Supabase SQL Editor; deleting a local SQL file does not change the database.

- setup-database.sql is the original combined base setup (profiles, shelter approvals, and user records). schema.sql, shelter-approvals.sql, and user-features.sql are the individual setup scripts. Do not rerun base scripts on an upgraded database without reviewing their policies.
- Shelter and admin scripts add features after the base setup. Follow each script's prerequisite comments.
- Recent feature migrations: admin-shelter-suspension.sql, then admin-user-suspension.sql; admin-report-review.sql enables complaint review.
- The authentication email OTP template is maintained directly in Supabase.

Keep required migrations even after applying them; they document the database functions used by the app.
