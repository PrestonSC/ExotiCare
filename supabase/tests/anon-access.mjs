// Checks what an anonymous (logged-out) visitor can and cannot do.
// Usage: SUPABASE_URL=… SUPABASE_ANON_KEY=… [TEST_TOKEN=<an animal public_token>] node supabase/tests/anon-access.mjs
// Run it from web/ so @supabase/supabase-js resolves:  cd web && node ../supabase/tests/anon-access.mjs
import { createClient } from '@supabase/supabase-js'

const { SUPABASE_URL, SUPABASE_ANON_KEY, TEST_TOKEN } = process.env
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) throw new Error('Set SUPABASE_URL and SUPABASE_ANON_KEY')
const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

let failed = 0
const check = (name, ok, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` (${detail})` : ''}`)
  if (!ok) failed++
}

for (const table of ['animals', 'enclosures', 'placements', 'weights', 'feedings', 'sheds', 'cleanings', 'health_events']) {
  const { data, error } = await sb.from(table).select('*').limit(1)
  check(`anon cannot read ${table}`, Boolean(error) || (data ?? []).length === 0, error?.message)
}

const bad = await sb.rpc('get_animal_public', { p_token: 'not-a-real-token' })
check('bad token returns nothing', !bad.error && bad.data === null)

const rot = await sb.rpc('rotate_animal_token', { p_animal: '00000000-0000-0000-0000-000000000000' })
check('anon cannot rotate tokens', Boolean(rot.error))

if (TEST_TOKEN) {
  const ok = await sb.rpc('get_animal_public', { p_token: TEST_TOKEN })
  const allowed = new Set(['name', 'species', 'morph', 'sex', 'hatch_date', 'status', 'enclosure', 'weights', 'last_fed', 'last_shed', 'last_cleaned', 'health_open', 'last_ate_at', 'feed_interval_days', 'clean_interval_days'])
  const extra = Object.keys(ok.data ?? {}).filter((k) => !allowed.has(k))
  check('valid token returns the animal', Boolean(ok.data?.name))
  check('only whitelisted fields are returned', extra.length === 0, extra.join(','))
}

process.exit(failed ? 1 : 0)
