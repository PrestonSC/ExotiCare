import { supabase } from './supabase'
import { FULL_KINDS } from './due'
import type { Cleaning } from './types'

export type CleaningRow = Pick<Cleaning, 'id' | 'enclosure_id' | 'cleaned_at' | 'kind'>

/**
 * Recent cleanings of any kind, plus the latest full-level cleans separately. Daily spot cleaning
 * produces many rows, so a plain "newest N" could push the last full clean out of range and make
 * the enclosure look like it was never fully cleaned.
 */
export async function loadCleanings(): Promise<CleaningRow[]> {
  const sb = supabase!
  const [recent, full] = await Promise.all([
    sb.from('cleanings').select('id, enclosure_id, cleaned_at, kind').order('cleaned_at', { ascending: false }).limit(1500),
    sb.from('cleanings').select('id, enclosure_id, cleaned_at, kind').in('kind', FULL_KINDS).order('cleaned_at', { ascending: false }).limit(500),
  ])
  if (recent.error) throw recent.error
  if (full.error) throw full.error
  const byId = new Map<string, CleaningRow>()
  for (const r of [...(recent.data as CleaningRow[]), ...(full.data as CleaningRow[])]) byId.set(r.id, r)
  return [...byId.values()]
}
