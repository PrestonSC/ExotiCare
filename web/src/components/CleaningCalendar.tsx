import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { DAY, isFullKind } from '../lib/due'
import type { Enclosure } from '../lib/types'

interface Row { id: string; enclosure_id: string; cleaned_at: string; kind: string }

const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

/** One month of cleaning history plus the projected next full clean. Tap a day to see, add or remove entries. */
export default function CleaningCalendar({
  enclosures, lastFull, onChange,
}: { enclosures: Enclosure[]; lastFull: Record<string, string | undefined>; onChange: () => void }) {
  const today = new Date()
  const [month, setMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [selected, setSelected] = useState<string>(dayKey(today))
  const [addEnc, setAddEnc] = useState('')
  const [addKind, setAddKind] = useState<'spot' | 'full'>('spot')
  const [error, setError] = useState<string | null>(null)

  const start = month
  const end = new Date(month.getFullYear(), month.getMonth() + 1, 1)
  const { data: rows = [] } = useQuery({
    queryKey: ['cal-cleanings', dayKey(start)],
    queryFn: async () => {
      const { data, error } = await supabase!.from('cleanings').select('id, enclosure_id, cleaned_at, kind')
        .gte('cleaned_at', start.toISOString()).lt('cleaned_at', end.toISOString()).order('cleaned_at')
      if (error) throw error
      return data as Row[]
    },
  })

  const label = (id: string) => enclosures.find((e) => e.id === id)?.label ?? 'Removed enclosure'
  const byDay = new Map<string, Row[]>()
  for (const r of rows) {
    const k = dayKey(new Date(r.cleaned_at))
    byDay.set(k, [...(byDay.get(k) ?? []), r])
  }

  // Projected full cleans: last full clean + interval; anything overdue shows on today.
  const dueByDay = new Map<string, string[]>()
  const todayKey = dayKey(today)
  for (const e of enclosures) {
    const last = lastFull[e.id]
    const next = last ? new Date(new Date(last).getTime() + e.full_clean_interval_days * DAY) : today
    const k = next < today ? todayKey : dayKey(next)
    dueByDay.set(k, [...(dueByDay.get(k) ?? []), e.label])
  }

  const total = enclosures.length
  const first = month.getDay()
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
  const cells = [...Array(first).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1))]

  const selDate = new Date(`${selected}T12:00:00`)
  const isFuture = selected > todayKey
  const selRows = byDay.get(selected) ?? []
  const selDue = dueByDay.get(selected) ?? []

  async function add() {
    const enclosure_id = addEnc || enclosures[0]?.id
    if (!enclosure_id) return
    setError(null)
    const cleaned_at = selected === todayKey ? new Date().toISOString() : selDate.toISOString()
    const { error } = await supabase!.from('cleanings').insert({ enclosure_id, kind: addKind, cleaned_at })
    if (error) return setError(error.message)
    onChange()
  }
  async function remove(id: string) {
    const { error } = await supabase!.from('cleanings').delete().eq('id', id)
    if (error) return setError(error.message)
    onChange()
  }

  const shift = (n: number) => setMonth(new Date(month.getFullYear(), month.getMonth() + n, 1))

  return (
    <section className="calendar">
      <div className="row between">
        <h2>{month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</h2>
        <div className="row">
          <button className="secondary compact" aria-label="Previous month" onClick={() => shift(-1)}>‹</button>
          <button className="secondary compact" aria-label="Next month" onClick={() => shift(1)}>›</button>
        </div>
      </div>
      <div className="cal" role="grid" aria-label="Cleaning calendar">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <div key={i} className="cal-head" aria-hidden>{d}</div>)}
        {cells.map((d, i) => {
          if (!d) return <div key={`b${i}`} />
          const k = dayKey(d)
          const items = byDay.get(k) ?? []
          const cleaned = new Set(items.map((r) => r.enclosure_id)).size
          const fulls = items.filter((r) => isFullKind(r.kind)).length
          const due = (dueByDay.get(k) ?? []).length > 0
          return (
            <button key={k} role="gridcell" className={`day${k === selected ? ' sel' : ''}${k === todayKey ? ' today' : ''}`}
                    onClick={() => setSelected(k)} aria-pressed={k === selected}
                    aria-label={`${d.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}: ${cleaned} of ${total} enclosures cleaned${fulls ? `, ${fulls} full` : ''}${due ? ', full clean due' : ''}`}>
              <span>{d.getDate()}</span>
              <span className="marks" aria-hidden>
                {cleaned > 0 && <i className={cleaned >= total && total > 0 ? 'm-spot all' : 'm-spot'} />}
                {fulls > 0 && <i className="m-full" />}
                {due && fulls === 0 && <i className="m-due" />}
              </span>
            </button>
          )
        })}
      </div>
      <div className="legend">
        <span><i className="m-spot all" /> All cleaned</span>
        <span><i className="m-spot" /> Some cleaned</span>
        <span><i className="m-full" /> Full clean</span>
        <span><i className="m-due" /> Full clean due</span>
      </div>

      <div className="card stack day-detail">
        <strong>{selDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</strong>
        {selDue.length > 0 && <p className="late-text">Full clean due: {selDue.join(', ')}</p>}
        {selRows.length === 0 && !isFuture && <p className="muted">Nothing logged.</p>}
        {selRows.map((r) => (
          <div key={r.id} className="row between">
            <span>{label(r.enclosure_id)} · {isFullKind(r.kind) ? 'Full' : 'Spot'}</span>
            <button className="link" onClick={() => remove(r.id)}>Remove</button>
          </div>
        ))}
        {!isFuture && total > 0 && (
          <div className="row add-clean">
            <select aria-label="Enclosure" value={addEnc || enclosures[0]?.id} onChange={(e) => setAddEnc(e.target.value)}>
              {enclosures.map((e) => <option key={e.id} value={e.id}>{e.label}</option>)}
            </select>
            <select aria-label="Kind" value={addKind} onChange={(e) => setAddKind(e.target.value as 'spot' | 'full')}>
              <option value="spot">Spot</option><option value="full">Full</option>
            </select>
            <button className="secondary" onClick={add}>Add</button>
          </div>
        )}
        {error && <p className="error">{error}</p>}
      </div>
    </section>
  )
}
