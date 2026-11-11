# Supabase setup

1. **Run the schema**: Supabase dashboard → SQL Editor → paste the contents of
   `migrations/0001_core.sql` → Run. (Later phases add `0002_…`, etc., run in order.)
2. **Create your user**: Authentication → Users → *Add user* → *Create new user*
   with your email and a password. Tick "Auto Confirm User".
3. **Disable sign-ups**: Authentication → Sign In / Providers (or Settings) →
   turn off **Allow new users to sign up**. The app has no sign-up screen, and this
   stops anyone else from creating accounts through the API.
4. Put the project URL and publishable key in the repo's Actions *variables*
   (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).

## Photos (migration 0005)
Run `migrations/0005_photos.sql`. It creates two Storage buckets (`animal-photos`, private, and
`animal-public`, public profile copies) and their policies. No dashboard clicks needed.

## Backups
Manual: in the app, **Settings → Back up your data** downloads everything as one JSON file
(or any table as CSV). Photo files are not included, only their records. There is no
automatic backup, so download one now and then and keep it somewhere safe.

Note: a free Supabase project pauses after about a week with no activity. Regular use keeps
it awake. If it pauses, resume it from the Supabase dashboard; no data is lost.

## Access test
From `web/`: `SUPABASE_URL=… SUPABASE_ANON_KEY=… [TEST_TOKEN=…] node scripts/anon-access.mjs`
