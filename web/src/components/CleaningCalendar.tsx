import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { DAY, isFullKind, projectDueDays, type PlanInput } from '../lib/due'
import type { Enclosure } from '../lib/types'

interface Row { id: string; enclosure_id: string; cleaned_at: string; kind: string }

const LOOKBACK_DAYS = 31
const dayKey = (d: Date | number) => {
  const x = new Date(d)
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`
}
const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
const monthLabel = (d: Date) => d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })

/**
 * One month at a time. History goes back as far as there is data; planning looks ahead only to next
 * month. Tap a day to see what is NOT done for it.
 */
export default function CleaningCalendar({
  enclosures, fullPlans,
}: { enclosures: Enclosure[]; fullPlans: Record<string, PlanInput> }) {
  const today = new Date()
  const todayKey = dayKey(today)
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const lastMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1) // furthest we look ahead
  const horizon = new Date(today.getFullYear(), today.getMonth() + 2, 1)   // projections stop here
  const [month, setMonth] = useState(thisMonth)
  const [selected, setSelected] = useState<string>(todayKey)

  const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 1)
  const { data: rows = [] } = useQuery({
    queryKey: ['cal-cleanings', monthKey(month)],
    queryFn: async () => {
      const from = new Date(month.getTime() - LOOKBACK_DAYS * DAY)
      const { data, error } = await supabase!.from('cleanings').select('id, enclosure_id, cleaned_at, kind')
        .gte('cleaned_at', from.toISOString()).lt('cleaned_at', monthEnd.toISOString()).order('cleaned_at')
      if (error) throw error
      return data as Row[]
    },
  })

  const byDay = new Map<string, Row[]>()
  for (const r of rows) {
    const k = dayKey(new Date(r.cleaned_at))
    byDay.set(k, [...(byDay.get(k) ?? []), r])
  }

  // Planned full cleans on the fixed schedule (an overdue one shows on today).
  const dueByDay = new Map<string, string[]>()
  for (const e of enclosures) {
    const plan = fullPlans[e.id]
    if (!plan) continue
    for (const ms of projectDueDays(plan, Date.now(), horizon.getTime())) {
      const k = dayKey(ms)
      dueByDay.set(k, [...(dueByDay.get(k) ?? []), e.label])
    }
  }

  const total = enclosures.length
  const selDate = new Date(`${selected}T12:00:00`)

  /** What is still outstanding on a day: unlogged spot cleans (today and earlier) and planned full cleans. */
  function notDone(k: string): string[] {
    const items: string[] = []
    const date = new Date(`${k}T12:00:00`)
    for (const e of enclosures) {
      const rowsOn = (key: string) => (byDay.get(key) ?? []).filter((r) => r.enclosure_id === e.id)
      if (k <= todayKey && e.spot_clean_interval_days <= LOOKBACK_DAYS && rowsOn(k).length === 0) {
        let covered = false
        for (let n = 1; n < e.spot_clean_interval_days && !covered; n++)
          covered = rowsOn(dayKey(date.getTime() - n * DAY)).length > 0
        if (!covered) items.push(`${e.label} · Spot clean`)
      }
      if ((dueByDay.get(k) ?? []).includes(e.label) && !rowsOn(k).some((r) => isFullKind(r.kind)))
        items.push(`${e.label} · Full clean`)
    }
    return items
  }
  const selItems = notDone(selected)

  const shift = (n: number) => {
    const next = new Date(month.getFullYear(), month.getMonth() + n, 1)
    if (next > lastMonth) return
    setMonth(next)
    // keep the selection in view: land on today for the current month, else the 1st
    setSelected(monthKey(next) === monthKey(thisMonth) ? todayKey : dayKey(next))
  }
  const atLimit = month >= lastMonth

  const first = month.getDay()
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
  const cells = [...Array(first).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1))]

  return (
    <section className="calendar">
      <h2>Cleaning calendar</h2>
      <div className="row between">
        <button className="secondary compact" aria-label="Previous month" onClick={() => shift(-1)}>‹</button>
        <h3 className="cal-month">{monthLabel(month)}</h3>
        <button className="secondary compact" aria-label="Next month" disabled={atLimit} onClick={() => shift(1)}>›</button>
      </div>
      <div className="row between cal-tools">
        <label className="jump">
          <span className="muted">Jump to</span>
          <input type="month" max={monthKey(lastMonth)} value={monthKey(month)}
                 onChange={(e) => {
                   if (!e.target.value) return
                   const [y, m] = e.target.value.split('-').map(Number)
                   const next = new Date(y, m - 1, 1)
                   if (next <= lastMonth) { setMonth(next); setSelected(dayKey(next)) }
                 }} />
        </label>
        {monthKey(month) !== monthKey(thisMonth) && (
          <button className="secondary" onClick={() => { setMonth(thisMonth); setSelected(todayKey) }}>Today</button>
        )}
      </div>
      <div className="legend">
        <span><i className="m-spot all" /> All cleaned</span>
        <span><i className="m-spot" /> Some cleaned</span>
        <span><i className="m-full" /> Full clean</span>
        <span><i className="m-due" /> Full clean planned</span>
      </div>
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
                    aria-label={`${d.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}: ${cleaned} of ${total} enclosures cleaned${fulls ? `, ${fulls} full` : ''}${due ? ', full clean planned' : ''}`}>
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
      <div className="card stack day-detail">
        <strong>{selDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</strong>
        {selItems.length === 0
          ? <p className="muted">{selected > todayKey ? 'Nothing planned.' : 'Everything is done.'}</p>
          : <ul className="todo">{selItems.map((t) => <li key={t}>{t}</li>)}</ul>}
      </div>
    </section>
  )
}
