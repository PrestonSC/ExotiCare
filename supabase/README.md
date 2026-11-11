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
