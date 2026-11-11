import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { daysAgo, label } from '../lib/format'
import { cleanStatus, describeDue, feedingStatus, refusalStreak, weightDrop, type CleanStatus, type Due } from '../lib/due'
import { loadCleanings, type CleaningRow } from '../lib/cleanings'
import CleanRow from '../components/CleanRow'
import CleaningCalendar from '../components/CleaningCalendar'
import type { Animal, Enclosure, Feeding, HealthEvent, Placement, Weight } from '../lib/types'

async function load() {
  const sb = supabase!
  const [animals, enclosures, placements, feedings, weights, cleanings, health] = await Promise.all([
    sb.from('animals').select('*').in('status', ['active', 'breeder']).order('name'),
    sb.from('enclosures').select('*'),
    sb.from('placements').select('*').is('end_at', null),
    sb.from('feedings').select('animal_id, fed_at, outcome').order('fed_at', { ascending: false }).limit(1000),
    sb.from('weights').select('animal_id, measured_at, grams').order('measured_at', { ascending: false }).limit(1000),
    loadCleanings().then((data) => ({ data, error: null })),
    sb.from('health_events').select('*').is('resolved_at', null).order('occurred_at'),
  ])
  for (const r of [animals, enclosures, placements, feedings, weights, cleanings, health]) if (r.error) throw r.error
  return {
    animals: animals.data as Animal[],
    enclosures: enclosures.data as Enclosure[],
    placements: placements.data as Placement[],
    feedings: feedings.data as Pick<Feeding, 'animal_id' | 'fed_at' | 'outcome'>[],
    weights: weights.data as Pick<Weight, 'animal_id' | 'measured_at' | 'grams'>[],
    cleanings: cleanings.data as CleaningRow[],
    health: health.data as HealthEvent[],
  }
}

interface Item { key: string; to: string; text: string; sub?: string; urgency: number }
const urgent = (d: Due) => (d.state === 'due' ? 100 + d.days : d.state === 'never' ? 50 : 0)

export default function Dashboard() {
  const qc = useQueryClient()
  const refresh = () => qc.invalidateQueries()
  const { data, isLoading, error } = useQuery({ queryKey: ['dashboard'], queryFn: load })
  if (isLoading) return <p>Loading…</p>
  if (error || !data) return <p className="error">{(error as Error)?.message ?? 'Could not load'}</p>

  const now = Date.now()
  const feed: Item[] = [], alerts: Item[] = []
  const clean: { enc: Enclosure; occupant?: string; st: CleanStatus; urgency: number }[] = []
  const rows: { animal: Animal; enc?: Enclosure; feed: Due; lastFeed?: string; weight?: number }[] = []

  for (const a of data.animals) {
    const feeds = data.feedings.filter((f) => f.animal_id === a.id)
    const lastAte = feeds.find((f) => f.outcome === 'ate')
    const fd = feedingStatus({
      intervalDays: a.feed_interval_days, lastAteAt: lastAte?.fed_at,
      lastFeed: feeds[0] ? { at: feeds[0].fed_at, outcome: feeds[0].outcome } : null,
    }, now)
    const encId = data.placements.find((p) => p.animal_id === a.id)?.enclosure_id
    const enc = data.enclosures.find((e) => e.id === encId)
    const ws = data.weights.filter((w) => w.animal_id === a.id)
    rows.push({ animal: a, enc, feed: fd, lastFeed: feeds[0]?.fed_at, weight: ws[0] ? Number(ws[0].grams) : undefined })

    const care = `/animals/${a.id}/care`
    if (fd.state === 'due' || fd.state === 'never')
      feed.push({ key: a.id, to: care, text: a.name, sub: describeDue(fd, 'Feeding'), urgency: urgent(fd) })

    const streak = refusalStreak(feeds.map((f) => f.outcome))
    if (streak >= 3)
      alerts.push({ key: `r${a.id}`, to: care, text: a.name, sub: `Refused ${streak} feedings in a row`, urgency: 90 + streak })
    if (feeds[0]?.outcome === 'regurgitated' && fd.state === 'wait')
      alerts.push({ key: `g${a.id}`, to: care, text: a.name, sub: `Regurgitated recently, ${describeDue(fd, 'feeding').replace('feeding: ', '')}`, urgency: 60 })
    const drop = weightDrop(ws.map((w) => ({ at: w.measured_at, grams: Number(w.grams) })))
    if (drop)
      alerts.push({ key: `w${a.id}`, to: care, text: a.name, sub: `Weight down ${drop.pct}% (${drop.from} g → ${drop.to} g)`, urgency: 80 + drop.pct })
  }

  const occupied = new Set(data.placements.filter((p) => data.animals.some((a) => a.id === p.animal_id)).map((p) => p.enclosure_id))
  for (const e of data.enclosures.filter((e) => occupied.has(e.id))) {
    const st = cleanStatus(data.cleanings.filter((c) => c.enclosure_id === e.id), e.spot_clean_interval_days, e.full_clean_interval_days, now)
    const late = (d: Due) => d.state === 'due' || d.state === 'never'
    if (late(st.spot) || late(st.full)) {
      const animalId = data.placements.find((p) => p.enclosure_id === e.id)?.animal_id
      clean.push({ enc: e, occupant: data.animals.find((a) => a.id === animalId)?.name, st, urgency: Math.max(urgent(st.spot), urgent(st.full)) })
    }
  }

  for (const h of data.health) {
    const a = data.animals.find((x) => x.id === h.animal_id)
    if (a) alerts.push({ key: h.id, to: `/animals/${a.id}/care`, text: a.name, sub: `${label(h.kind)}: ${h.description} (${daysAgo(h.occurred_at)})`, urgency: 70 })
  }

  const section = (title: string, items: Item[]) =>
    items.length > 0 && (
      <section>
        <h2>{title} <span className="badge">{items.length}</span></h2>
        <ul className="cards">
          {items.sort((x, y) => y.urgency - x.urgency).map((i) => (
            <li key={i.key}><Link to={i.to}><strong>{i.text}</strong><span className="muted">{i.sub}</span></Link></li>
          ))}
        </ul>
      </section>
    )

  const nothing = feed.length + clean.length + alerts.length === 0

  return (
    <>
      <h1>Today</h1>
      {nothing && <p>Nothing needs attention right now. 🐍</p>}
      {section('Health & alerts', alerts)}
      {section('Feed', feed)}
      {clean.length > 0 && (
        <section>
          <h2>Clean <span className="badge">{clean.length}</span></h2>
          <ul className="cards">
            {clean.sort((x, y) => y.urgency - x.urgency).map(({ enc, occupant, st }) => (
              <li key={enc.id}>
                <div className="enc-head">
                  <div>
                    <h3>{enc.label}</h3>
                    <div className="muted enc-sub">{occupant ?? 'Empty'}</div>
                  </div>
                </div>
                {(st.spot.state === 'due' || st.spot.state === 'never') && (
                  <CleanRow enclosureId={enc.id} kind="spot" status={st.spot} lastAt={st.lastSpotAt} onChange={refresh} />
                )}
                {(st.full.state === 'due' || st.full.state === 'never') && (
                  <CleanRow enclosureId={enc.id} kind="full" status={st.full} lastAt={st.lastFullAt} onChange={refresh} />
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <CleaningCalendar
        enclosures={data.enclosures.filter((e) => occupied.has(e.id))}
        lastFull={Object.fromEntries(data.enclosures.map((e) => [e.id, cleanStatus(data.cleanings.filter((c) => c.enclosure_id === e.id), 1, 1).lastFullAt]))}
        onChange={refresh}
      />

      <h2>All animals</h2>
      <ul className="cards">
        {rows.map((r) => (
          <li key={r.animal.id}>
            <Link to={`/animals/${r.animal.id}/care`}>
              <strong>{r.animal.name}</strong>
              <span className="muted">
                {r.enc?.label ?? 'No enclosure'} · {r.lastFeed ? `fed ${daysAgo(r.lastFeed)}` : 'never fed'}
                {r.weight ? ` · ${r.weight} g` : ''}
              </span>
              <span className="muted">{describeDue(r.feed, 'Next feeding')}</span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  )
}
