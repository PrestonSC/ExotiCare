import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { DAY, isFullKind } from '../lib/due'
import type { Enclosure } from '../lib/types'

interface Row { id: string; enclosure_id: string; cleaned_at: string; kind: string }

const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const LOOKBACK_DAYS = 31
const monthLabel = (d: Date) => d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })

/**
 * Two months at a time (this month and next, so planning never stops at month end) of cleaning
 * history plus projected full cleans. Tap a day to see only what is NOT done for it.
 */
export default function CleaningCalendar({
  enclosures, lastFull,
}: { enclosures: Enclosure[]; lastFull: Record<string, string | undefined> }) {
  const today = new Date()
  const todayKey = dayKey(today)
  const [base, setBase] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [selected, setSelected] = useState<string>(todayKey)

  const second = new Date(base.getFullYear(), base.getMonth() + 1, 1)
  const rangeEnd = new Date(base.getFullYear(), base.getMonth() + 2, 1)

  const { data: rows = [] } = useQuery({
    queryKey: ['cal-cleanings', dayKey(base)],
    queryFn: async () => {
      const from = new Date(base.getTime() - LOOKBACK_DAYS * DAY)
      const { data, error } = await supabase!.from('cleanings').select('id, enclosure_id, cleaned_at, kind')
        .gte('cleaned_at', from.toISOString()).lt('cleaned_at', rangeEnd.toISOString()).order('cleaned_at')
      if (error) throw error
      return data as Row[]
    },
  })

  const byDay = new Map<string, Row[]>()
  for (const r of rows) {
    const k = dayKey(new Date(r.cleaned_at))
    byDay.set(k, [...(byDay.get(k) ?? []), r])
  }

  // Projected full cleans: last full clean + interval (overdue ones land on today). Assuming each is
  // done on schedule, the next ones follow every interval, so next month shows them too.
  const dueByDay = new Map<string, string[]>()
  for (const e of enclosures) {
    const last = lastFull[e.id]
    let next = last ? new Date(new Date(last).getTime() + e.full_clean_interval_days * DAY) : today
    if (next < today) next = today
    for (let n = 0; n < 60 && next < rangeEnd; n++) {
      const k = dayKey(next)
      dueByDay.set(k, [...(dueByDay.get(k) ?? []), e.label])
      next = new Date(next.getTime() + e.full_clean_interval_days * DAY)
    }
  }

  const total = enclosures.length
  const selDate = new Date(`${selected}T12:00:00`)
  const selMonth = `${selDate.getFullYear()}-${selDate.getMonth()}`

  /** What is still outstanding on a day: unlogged spot cleans (today and past) and projected full cleans due. */
  function notDone(k: string): string[] {
    const items: string[] = []
    const date = new Date(`${k}T12:00:00`)
    for (const e of enclosures) {
      const rowsOn = (key: string) => (byDay.get(key) ?? []).filter((r) => r.enclosure_id === e.id)
      if (k <= todayKey && e.spot_clean_interval_days <= LOOKBACK_DAYS && rowsOn(k).length === 0) {
        let covered = false
        for (let n = 1; n < e.spot_clean_interval_days && !covered; n++)
          covered = rowsOn(dayKey(new Date(date.getTime() - n * DAY))).length > 0
        if (!covered) items.push(`${e.label} · Spot clean`)
      }
      if ((dueByDay.get(k) ?? []).includes(e.label) && !rowsOn(k).some((r) => isFullKind(r.kind)))
        items.push(`${e.label} · Full clean`)
    }
    return items
  }
  const selItems = notDone(selected)

  const shift = (n: number) => setBase(new Date(base.getFullYear(), base.getMonth() + n, 1))
  const isCurrent = base.getFullYear() === today.getFullYear() && base.getMonth() === today.getMonth()

  // Called as a plain function (not a component) so inputs inside keep focus across re-renders.
  function renderMonth(month: Date) {
    const first = month.getDay()
    const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
    const cells = [...Array(first).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1))]
    return (
      <div key={dayKey(month)}>
        <h3 className="cal-month">{monthLabel(month)}</h3>
        <div className="cal" role="grid" aria-label={`Cleaning calendar, ${monthLabel(month)}`}>
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
        {selMonth === `${month.getFullYear()}-${month.getMonth()}` && (
          <div className="card stack day-detail">
            <strong>{selDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</strong>
            {selItems.length === 0
              ? <p className="muted">{selected > todayKey ? 'Nothing due.' : 'Everything is done.'}</p>
              : <ul className="todo">{selItems.map((t) => <li key={t}>{t}</li>)}</ul>}
          </div>
        )}
      </div>
    )
  }

  return (
    <section className="calendar">
      <div className="row between">
        <h2>Cleaning calendar</h2>
        <div className="row">
          <button className="secondary compact" aria-label="Earlier" onClick={() => shift(-1)}>‹</button>
          {!isCurrent && <button className="secondary compact" onClick={() => { setBase(new Date(today.getFullYear(), today.getMonth(), 1)); setSelected(todayKey) }}>Today</button>}
          <button className="secondary compact" aria-label="Later" onClick={() => shift(1)}>›</button>
        </div>
      </div>
      <div className="legend">
        <span><i className="m-spot all" /> All cleaned</span>
        <span><i className="m-spot" /> Some cleaned</span>
        <span><i className="m-full" /> Full clean</span>
        <span><i className="m-due" /> Full clean due</span>
      </div>
      {renderMonth(base)}
      {renderMonth(second)}
    </section>
  )
}
