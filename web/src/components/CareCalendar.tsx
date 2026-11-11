import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { completionSlot, DAY, isFullKind, plannedDays, projectDueDays, type PlanInput } from '../lib/due'
import type { Animal, Enclosure } from '../lib/types'

interface CleanRow { id: string; enclosure_id: string; cleaned_at: string; kind: string }
interface FeedRow { id: string; animal_id: string; fed_at: string; outcome: 'ate' | 'refused' | 'regurgitated' }
type FeedPlan = PlanInput & { anchor: string }

const LOOKBACK_DAYS = 31
const dayKey = (d: Date | number) => {
  const x = new Date(d)
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`
}
const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
const monthLabel = (d: Date) => d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
const push = <T,>(m: Map<string, T[]>, k: string, v: T) => m.set(k, [...(m.get(k) ?? []), v])

/**
 * One month at a time: cleanings and feedings that happened, plus what is planned. History goes back as
 * far as there is data; planning looks ahead only to next month. Tap a day to see what is NOT done for it.
 */
export default function CareCalendar({
  enclosures, fullPlans, animals, feedPlans,
}: {
  enclosures: Enclosure[]; fullPlans: Record<string, PlanInput>
  animals: Pick<Animal, 'id' | 'name'>[]; feedPlans: Record<string, FeedPlan>
}) {
  const today = new Date()
  const todayKey = dayKey(today)
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const lastMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1) // furthest we look ahead
  const horizon = new Date(today.getFullYear(), today.getMonth() + 2, 1)   // projections stop here
  const [month, setMonth] = useState(thisMonth)
  const [selected, setSelected] = useState<string>(todayKey)

  const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 1)
  const from = new Date(month.getTime() - LOOKBACK_DAYS * DAY)
  const to = new Date(monthEnd.getTime() + LOOKBACK_DAYS * DAY)
  const { data } = useQuery({
    queryKey: ['calendar', monthKey(month)],
    queryFn: async () => {
      const [c, f] = await Promise.all([
        supabase!.from('cleanings').select('id, enclosure_id, cleaned_at, kind')
          .gte('cleaned_at', from.toISOString()).lt('cleaned_at', monthEnd.toISOString()).order('cleaned_at'),
        supabase!.from('feedings').select('id, animal_id, fed_at, outcome')
          .gte('fed_at', from.toISOString()).lt('fed_at', to.toISOString()).order('fed_at'),
      ])
      if (c.error) throw c.error
      if (f.error) throw f.error
      return { cleanings: c.data as CleanRow[], feedings: f.data as FeedRow[] }
    },
  })
  const cleanings = data?.cleanings ?? []
  const feedings = data?.feedings ?? []

  const cleanByDay = new Map<string, CleanRow[]>()
  for (const r of cleanings) push(cleanByDay, dayKey(new Date(r.cleaned_at)), r)
  const feedByDay = new Map<string, FeedRow[]>()
  for (const r of feedings) push(feedByDay, dayKey(new Date(r.fed_at)), r)

  // Planned full cleans (an overdue one shows on today).
  const fullDueByDay = new Map<string, string[]>()
  for (const e of enclosures) {
    const plan = fullPlans[e.id]
    if (!plan) continue
    for (const ms of projectDueDays(plan, Date.now(), horizon.getTime())) push(fullDueByDay, dayKey(ms), e.label)
  }

  // Planned feedings on the fixed schedule: upcoming ones from the plan; earlier ones that were never fed.
  const feedPlannedByDay = new Map<string, string[]>()
  const todayMs = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
  for (const a of animals) {
    const plan = feedPlans[a.id]
    if (!plan) continue
    for (const ms of projectDueDays(plan, Date.now(), horizon.getTime())) push(feedPlannedByDay, dayKey(ms), a.name)
    const ate = feedings.filter((f) => f.animal_id === a.id && f.outcome === 'ate')
    for (const { ms, slot } of plannedDays(plan, month.getTime(), Math.min(monthEnd.getTime(), todayMs))) {
      const satisfied = ate.some((f) => completionSlot(plan.anchor, plan.intervalDays, f.fed_at) === slot)
      if (!satisfied) push(feedPlannedByDay, dayKey(ms), a.name)
    }
  }

  const total = enclosures.length
  const selDate = new Date(`${selected}T12:00:00`)

  /** What is still outstanding on a day: unlogged spot cleans, planned full cleans and planned feedings. */
  function notDone(k: string): string[] {
    const items: string[] = []
    const date = new Date(`${k}T12:00:00`)
    for (const e of enclosures) {
      const rowsOn = (key: string) => (cleanByDay.get(key) ?? []).filter((r) => r.enclosure_id === e.id)
      if (k <= todayKey && e.spot_clean_interval_days <= LOOKBACK_DAYS && rowsOn(k).length === 0) {
        let covered = false
        for (let n = 1; n < e.spot_clean_interval_days && !covered; n++)
          covered = rowsOn(dayKey(date.getTime() - n * DAY)).length > 0
        if (!covered) items.push(`${e.label} · Spot clean`)
      }
      if ((fullDueByDay.get(k) ?? []).includes(e.label) && !rowsOn(k).some((r) => isFullKind(r.kind)))
        items.push(`${e.label} · Full clean`)
    }
    for (const a of animals) {
      if ((feedPlannedByDay.get(k) ?? []).includes(a.name)
          && !(feedByDay.get(k) ?? []).some((f) => f.animal_id === a.id && f.outcome === 'ate'))
        items.push(`${a.name} · Feeding`)
    }
    return items
  }
  const selItems = notDone(selected)

  const shift = (n: number) => {
    const next = new Date(month.getFullYear(), month.getMonth() + n, 1)
    if (next > lastMonth) return
    setMonth(next)
    setSelected(monthKey(next) === monthKey(thisMonth) ? todayKey : dayKey(next))
  }
  const atLimit = month >= lastMonth

  const first = month.getDay()
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
  const cells = [...Array(first).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1))]

  return (
    <section className="calendar">
      <h2>Calendar</h2>
      <div className="row between">
        <button className="secondary compact" aria-label="Previous month" onClick={() => shift(-1)}>‹</button>
        <h3 className="cal-month">{monthLabel(month)}</h3>
        <button className="secondary compact" aria-label="Next month" disabled={atLimit} onClick={() => shift(1)}>›</button>
      </div>
      {monthKey(month) !== monthKey(thisMonth) && (
        <div className="cal-tools"><button className="secondary" onClick={() => { setMonth(thisMonth); setSelected(todayKey) }}>Back to this month</button></div>
      )}
      <div className="legend">
        <span><i className="m-spot all" /> All cleaned</span>
        <span><i className="m-spot" /> Some cleaned</span>
        <span><i className="m-full" /> Full clean</span>
        <span><i className="m-due" /> Full clean planned</span>
        <span><i className="m-fed" /> Fed</span>
        <span><i className="m-offered" /> Offered, not eaten</span>
        <span><i className="m-fdue" /> Feeding planned</span>
      </div>
      <div className="cal" role="grid" aria-label={`Calendar, ${monthLabel(month)}`}>
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <div key={i} className="cal-head" aria-hidden>{d}</div>)}
        {cells.map((d, i) => {
          if (!d) return <div key={`b${i}`} />
          const k = dayKey(d)
          const items = cleanByDay.get(k) ?? []
          const cleaned = new Set(items.map((r) => r.enclosure_id)).size
          const fulls = items.filter((r) => isFullKind(r.kind)).length
          const fullDue = (fullDueByDay.get(k) ?? []).length > 0
          const feeds = feedByDay.get(k) ?? []
          const ate = feeds.filter((f) => f.outcome === 'ate').length
          const offered = feeds.length - ate
          const feedDue = (feedPlannedByDay.get(k) ?? []).length > 0
          const desc = [
            `${cleaned} of ${total} enclosures cleaned`, fulls ? `${fulls} full` : '',
            ate ? `${ate} fed` : '', offered ? `${offered} offered, not eaten` : '',
            fullDue ? 'full clean planned' : '', feedDue ? 'feeding planned' : '',
          ].filter(Boolean).join(', ')
          return (
            <button key={k} role="gridcell" className={`day${k === selected ? ' sel' : ''}${k === todayKey ? ' today' : ''}`}
                    onClick={() => setSelected(k)} aria-pressed={k === selected}
                    aria-label={`${d.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}: ${desc}`}>
              <span>{d.getDate()}</span>
              <span className="marks" aria-hidden>
                {cleaned > 0 && <i className={cleaned >= total && total > 0 ? 'm-spot all' : 'm-spot'} />}
                {fulls > 0 && <i className="m-full" />}
                {fullDue && fulls === 0 && <i className="m-due" />}
                {ate > 0 && <i className="m-fed" />}
                {ate === 0 && offered > 0 && <i className="m-offered" />}
                {feedDue && ate === 0 && <i className="m-fdue" />}
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
