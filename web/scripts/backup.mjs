// Weekly backup: signs in as the owner, reads every table through normal RLS, writes JSON to a file.
// It never prints data. The workflow encrypts the file before uploading it.
// Usage: SUPABASE_URL=… SUPABASE_ANON_KEY=… BACKUP_EMAIL=… BACKUP_PASSWORD=… node scripts/backup.mjs <out.json>
import { createClient } from '@supabase/supabase-js'
import { writeFileSync } from 'node:fs'

const { SUPABASE_URL, SUPABASE_ANON_KEY, BACKUP_EMAIL, BACKUP_PASSWORD } = process.env
const out = process.argv[2]
if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !BACKUP_EMAIL || !BACKUP_PASSWORD || !out) {
  console.error('Missing env vars or output path'); process.exit(2)
}
const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
const { error: authError } = await sb.auth.signInWithPassword({ email: BACKUP_EMAIL, password: BACKUP_PASSWORD })
if (authError) { console.error('Sign-in failed:', authError.message); process.exit(1) }

const tables = ['animals', 'enclosures', 'placements', 'weights', 'feedings', 'sheds', 'cleanings', 'health_events', 'photos']
const dump = { exported_at: new Date().toISOString() }
for (const t of tables) {
  dump[t] = []
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb.from(t).select('*').order('id').range(from, from + 999)
    if (error) { console.error(`Reading ${t} failed:`, error.message); process.exit(1) }
    dump[t].push(...data)
    if (data.length < 1000) break
  }
}
writeFileSync(out, JSON.stringify(dump))
console.log('Backup written:', Object.fromEntries(tables.map((t) => [t, dump[t].length])))
