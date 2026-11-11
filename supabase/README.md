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

## Weekly backup
`.github/workflows/backup.yml` runs every Monday and can be run manually (Actions tab).
Add three repository **secrets** (Settings → Secrets and variables → Actions → *Secrets*):

| Secret | Value |
|---|---|
| `BACKUP_EMAIL` | your login email |
| `BACKUP_PASSWORD` | your login password |
| `BACKUP_PASSPHRASE` | a new passphrase used only to encrypt backups. **Store it in your password manager.** |

The repo is public and artifacts of public repos are downloadable by any GitHub user, so the
workflow encrypts the dump with GPG before uploading. To restore/read one:
`gpg -d backup.json.gpg > backup.json`.

## Access test
From `web/`: `SUPABASE_URL=… SUPABASE_ANON_KEY=… [TEST_TOKEN=…] node scripts/anon-access.mjs`
