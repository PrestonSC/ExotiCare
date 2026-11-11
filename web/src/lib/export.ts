import { supabase } from './supabase'

export const EXPORT_TABLES = [
  'animals', 'enclosures', 'placements', 'weights', 'feedings', 'sheds', 'cleanings', 'health_events', 'photos',
] as const

export async function fetchAll(table: string): Promise<Record<string, unknown>[]> {
  const rows: Record<string, unknown>[] = []
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase!.from(table).select('*').order('id').range(from, from + 999)
    if (error) throw error
    rows.push(...(data as Record<string, unknown>[]))
    if (data.length < 1000) return rows
  }
}

/** Cleaning history with enclosure names and a plain Spot/Full kind: what the calendar shows, in a spreadsheet-friendly form. */
export async function cleaningLog(): Promise<Record<string, unknown>[]> {
  const [cleanings, enclosures] = await Promise.all([fetchAll('cleanings'), fetchAll('enclosures')])
  const names = new Map(enclosures.map((e) => [e.id as string, e.label as string]))
  return cleanings
    .map((c) => {
      const at = new Date(c.cleaned_at as string)
      const kind = String(c.kind)
      return {
        date: `${at.getFullYear()}-${String(at.getMonth() + 1).padStart(2, '0')}-${String(at.getDate()).padStart(2, '0')}`,
        time: at.toTimeString().slice(0, 5),
        enclosure: names.get(c.enclosure_id as string) ?? 'Removed enclosure',
        clean_type: kind === 'spot' ? 'Spot' : 'Full',
        logged_as: kind,
        notes: c.notes ?? '',
      }
    })
    .sort((a, b) => (a.date + a.time < b.date + b.time ? 1 : -1))
}

export function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return ''
  const cols = [...new Set(rows.flatMap((r) => Object.keys(r)))]
  const cell = (v: unknown) => {
    if (v === null || v === undefined) return ''
    const s = typeof v === 'object' ? JSON.stringify(v) : String(v)
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  return [cols.join(','), ...rows.map((r) => cols.map((c) => cell(r[c])).join(','))].join('\n')
}

export function download(filename: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const a = Object.assign(document.createElement('a'), { href: url, download: filename })
  document.body.appendChild(a); a.click(); a.remove()
  URL.revokeObjectURL(url)
}
