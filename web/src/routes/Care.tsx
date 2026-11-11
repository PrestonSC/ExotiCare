import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { daysAgo, fmtDate, label, localToIso, nowLocal } from '../lib/format'
import TimeChart, { type Marker } from '../components/TimeChart'
import PhotosTab from '../components/PhotosTab'
import type { Animal, Feeding, HealthEvent, Shed, Weight } from '../lib/types'

type Table = 'weights' | 'feedings' | 'sheds' | 'health_events'
const orderCol: Record<Table, string> = {
  weights: 'measured_at', feedings: 'fed_at', sheds: 'shed_at', health_events: 'occurred_at',
}

function useLog<T>(table: Table, animalId: string) {
  const qc = useQueryClient()
  const key = [table, animalId]
  const q = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase!.from(table).select('*')
        .eq('animal_id', animalId).order(orderCol[table], { ascending: false })
      if (error) throw error
      return data as T[]
    },
  })
  const refresh = () => qc.invalidateQueries({ queryKey: key })
  return {
    rows: q.data ?? [],
    isLoading: q.isLoading,
    async add(row: object): Promise<string | null> {
      const { error } = await supabase!.from(table).insert({ animal_id: animalId, ...row })
      if (error) return error.message
      refresh(); return null
    },
    async update(id: string, row: object) {
      const { error } = await supabase!.from(table).update(row).eq('id', id)
      if (error) alert(error.message); else refresh()
    },
    async remove(id: string) {
      if (!confirm('Delete this entry?')) return
      const { error } = await supabase!.from(table).delete().eq('id', id)
      if (error) alert(error.message); else refresh()
    },
  }
}

function LogForm({ onSubmit, children }: { onSubmit: () => Promise<string | null>; children: ReactNode }) {
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true); setError(await onSubmit()); setBusy(false)
  }
  return (
    <form onSubmit={submit} className="stack card">
      {children}
      {error && <p className="error">{error}</p>}
      <button disabled={busy}>{busy ? 'Saving…' : 'Add'}</button>
    </form>
  )
}

const When = ({ v, set }: { v: string; set: (v: string) => void }) => (
  <label>When<input type="datetime-local" value={v} onChange={(e) => set(e.target.value)} required /></label>
)
const Notes = ({ v, set }: { v: string; set: (v: string) => void }) => (
  <label>Notes<input value={v} onChange={(e) => set(e.target.value)} /></label>
)
const Del = ({ onClick }: { onClick: () => void }) => (
  <button type="button" className="link" onClick={onClick}>Delete</button>
)

function WeightTab({ id }: { id: string }) {
  const log = useLog<Weight>('weights', id)
  const [grams, setGrams] = useState(''); const [when, setWhen] = useState(nowLocal()); const [notes, setNotes] = useState('')
  const asc = [...log.rows].reverse()
  return (
    <>
      <LogForm onSubmit={async () => {
        const err = await log.add({ grams: Number(grams), measured_at: localToIso(when), notes: notes.trim() || null })
        if (!err) { setGrams(''); setNotes(''); setWhen(nowLocal()) }
        return err
      }}>
        <label>Weight (grams)<input type="number" step="0.1" min="0.1" value={grams} onChange={(e) => setGrams(e.target.value)} required inputMode="decimal" /></label>
        <When v={when} set={setWhen} /><Notes v={notes} set={setNotes} />
      </LogForm>
      {log.rows.length > 1 && (
        <TimeChart title="Weight over time" unit=" g"
          series={[{ id: 'w', name: 'Weight', color: 'var(--accent)', points: asc.map((w) => ({ t: +new Date(w.measured_at), v: Number(w.grams) })) }]} />
      )}
      <ul className="cards">
        {log.rows.map((w, i) => {
          const prev = log.rows[i + 1]
          const delta = prev ? Number(w.grams) - Number(prev.grams) : null
          return (
            <li key={w.id} className="row between">
              <div>
                <strong>{Number(w.grams)} g</strong>
                {delta !== null && <span className="muted"> ({delta >= 0 ? '+' : ''}{delta.toFixed(1)})</span>}
                <div className="muted">{fmtDate(w.measured_at)}{w.notes ? ` · ${w.notes}` : ''}</div>
              </div>
              <Del onClick={() => log.remove(w.id)} />
            </li>
          )
        })}
      </ul>
    </>
  )
}

function FeedingTab({ id }: { id: string }) {
  const log = useLog<Feeding>('feedings', id)
  const [f, setF] = useState({ prey_type: 'mouse', prey_stage: '', prey_weight_g: '', prep: 'frozen_thawed', outcome: 'ate', notes: '', when: nowLocal() })
  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }))
  return (
    <>
      <LogForm onSubmit={async () => {
        const err = await log.add({
          fed_at: localToIso(f.when), prey_type: f.prey_type, prey_stage: f.prey_stage.trim() || null,
          prey_weight_g: f.prey_weight_g ? Number(f.prey_weight_g) : null, prep: f.prep, outcome: f.outcome,
          notes: f.notes.trim() || null,
        })
        if (!err) setF((p) => ({ ...p, prey_stage: '', prey_weight_g: '', notes: '', outcome: 'ate', when: nowLocal() }))
        return err
      }}>
        <label>Outcome
          <select value={f.outcome} onChange={(e) => set('outcome', e.target.value)}>
            <option value="ate">Ate</option><option value="refused">Refused</option><option value="regurgitated">Regurgitated</option>
          </select>
        </label>
        <label>Prey
          <select value={f.prey_type} onChange={(e) => set('prey_type', e.target.value)}>
            <option value="mouse">Mouse</option><option value="rat">Rat</option><option value="asf">ASF</option>
            <option value="chick">Chick</option><option value="other">Other</option>
          </select>
        </label>
        <label>Size / stage<input value={f.prey_stage} onChange={(e) => set('prey_stage', e.target.value)} placeholder="hopper, small, medium…" /></label>
        <label>Prey weight (g)<input type="number" step="0.1" min="0.1" value={f.prey_weight_g} onChange={(e) => set('prey_weight_g', e.target.value)} inputMode="decimal" /></label>
        <label>Prep
          <select value={f.prep} onChange={(e) => set('prep', e.target.value)}>
            <option value="frozen_thawed">Frozen/thawed</option><option value="pre_killed">Pre-killed</option><option value="live">Live</option>
          </select>
        </label>
        <When v={f.when} set={(v) => set('when', v)} /><Notes v={f.notes} set={(v) => set('notes', v)} />
      </LogForm>
      <ul className="cards">
        {log.rows.map((x) => (
          <li key={x.id} className="row between">
            <div>
              <strong>{label(x.outcome)}</strong>
              <span className="muted"> · {[x.prey_stage, x.prey_type === 'asf' ? 'ASF' : x.prey_type, x.prey_weight_g ? `${Number(x.prey_weight_g)} g` : null].filter(Boolean).join(' ')}</span>
              <div className="muted">{fmtDate(x.fed_at)} · {label(x.prep)}{x.notes ? ` · ${x.notes}` : ''}</div>
            </div>
            <Del onClick={() => log.remove(x.id)} />
          </li>
        ))}
      </ul>
    </>
  )
}

function ShedTab({ id }: { id: string }) {
  const log = useLog<Shed>('sheds', id)
  const [when, setWhen] = useState(nowLocal()); const [complete, setComplete] = useState(true); const [notes, setNotes] = useState('')
  return (
    <>
      <LogForm onSubmit={async () => {
        const err = await log.add({ shed_at: localToIso(when), complete, notes: notes.trim() || null })
        if (!err) { setNotes(''); setComplete(true); setWhen(nowLocal()) }
        return err
      }}>
        <label className="check"><input type="checkbox" checked={complete} onChange={(e) => setComplete(e.target.checked)} /> Complete shed</label>
        <When v={when} set={setWhen} /><Notes v={notes} set={setNotes} />
      </LogForm>
      <ul className="cards">
        {log.rows.map((s) => (
          <li key={s.id} className="row between">
            <div>
              <strong>{s.complete ? 'Complete' : 'Incomplete'}</strong>
              <div className="muted">{fmtDate(s.shed_at)}{s.notes ? ` · ${s.notes}` : ''}</div>
            </div>
            <Del onClick={() => log.remove(s.id)} />
          </li>
        ))}
      </ul>
    </>
  )
}

const healthKinds = ['vet_visit', 'mites', 'respiratory', 'retained_shed', 'injury', 'medication', 'other']

function HealthTab({ id }: { id: string }) {
  const log = useLog<HealthEvent>('health_events', id)
  const [f, setF] = useState({ kind: 'other', description: '', treatment: '', vet: '', cost: '', when: nowLocal() })
  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }))
  return (
    <>
      <LogForm onSubmit={async () => {
        const err = await log.add({
          occurred_at: localToIso(f.when), kind: f.kind, description: f.description.trim(),
          treatment: f.treatment.trim() || null, vet: f.vet.trim() || null, cost: f.cost ? Number(f.cost) : null,
        })
        if (!err) setF({ kind: 'other', description: '', treatment: '', vet: '', cost: '', when: nowLocal() })
        return err
      }}>
        <label>Type
          <select value={f.kind} onChange={(e) => set('kind', e.target.value)}>
            {healthKinds.map((k) => <option key={k} value={k}>{label(k)}</option>)}
          </select>
        </label>
        <label>What happened<input value={f.description} onChange={(e) => set('description', e.target.value)} required /></label>
        <label>Treatment<input value={f.treatment} onChange={(e) => set('treatment', e.target.value)} /></label>
        <label>Vet<input value={f.vet} onChange={(e) => set('vet', e.target.value)} /></label>
        <label>Cost<input type="number" step="0.01" min="0" value={f.cost} onChange={(e) => set('cost', e.target.value)} inputMode="decimal" /></label>
        <When v={f.when} set={(v) => set('when', v)} />
      </LogForm>
      <p className="muted">Open items show on the public QR page until you mark them resolved.</p>
      <ul className="cards">
        {log.rows.map((h) => (
          <li key={h.id} className={h.resolved_at ? '' : 'flag'}>
            <div className="row between">
              <strong>{label(h.kind)}{h.resolved_at ? '' : ' · open'}</strong>
              <Del onClick={() => log.remove(h.id)} />
            </div>
            <div>{h.description}</div>
            <div className="muted">
              {fmtDate(h.occurred_at)}
              {h.treatment ? ` · Treatment: ${h.treatment}` : ''}{h.vet ? ` · ${h.vet}` : ''}{h.cost != null ? ` · $${Number(h.cost).toFixed(2)}` : ''}
              {h.resolved_at ? ` · Resolved ${fmtDate(h.resolved_at)}` : ''}
            </div>
            {!h.resolved_at && (
              <button type="button" className="secondary" onClick={() => log.update(h.id, { resolved_at: new Date().toISOString() })}>
                Mark resolved
              </button>
            )}
          </li>
        ))}
      </ul>
    </>
  )
}

const DAY_MS = 86_400_000

function ChartsTab({ id }: { id: string }) {
  const weights = useLog<Weight>('weights', id)
  const feedings = useLog<Feeding>('feedings', id)
  const w = [...weights.rows].reverse()
  const f = [...feedings.rows].reverse()
  const markers: Marker[] = f.map((x) => ({
    t: +new Date(x.fed_at), kind: x.outcome,
    label: [x.prey_stage, x.prey_type === 'asf' ? 'ASF' : x.prey_type].filter(Boolean).join(' '),
  }))
  const meals = f.filter((x) => x.outcome === 'ate' && x.prey_weight_g)
  const recent = feedings.rows.filter((x) => +new Date(x.fed_at) > Date.now() - 90 * DAY_MS)
  const count = (o: Feeding['outcome']) => recent.filter((x) => x.outcome === o).length
  return (
    <>
      <h2>Weight and feedings</h2>
      {w.length === 0 ? <p className="muted">Log a weight to see this chart.</p> : (
        <TimeChart title="Weight over time with feedings" unit=" g" markers={markers}
          series={[{ id: 'w', name: 'Weight', color: 'var(--accent)', points: w.map((x) => ({ t: +new Date(x.measured_at), v: Number(x.grams) })) }]} />
      )}
      <h2>Meal size</h2>
      {meals.length === 0 ? <p className="muted">Record the prey weight when you log a feeding to see how meal size changes.</p> : (
        <TimeChart title="Prey weight over time" unit=" g"
          series={[{ id: 'p', name: 'Prey weight', color: 'var(--accent)', points: meals.map((x) => ({ t: +new Date(x.fed_at), v: Number(x.prey_weight_g) })) }]} />
      )}
      <h2>Last 90 days</h2>
      <p>{count('ate')} ate · {count('refused')} refused · {count('regurgitated')} regurgitated</p>
    </>
  )
}

const tabs = ['weight', 'feeding', 'charts', 'sheds', 'health', 'photos'] as const
type Tab = (typeof tabs)[number]

export default function Care() {
  const { id = '' } = useParams()
  const [tab, setTab] = useState<Tab>('weight')
  const animal = useQuery({
    queryKey: ['animal', id],
    queryFn: async () => {
      const { data, error } = await supabase!.from('animals').select('*').eq('id', id).single()
      if (error) throw error
      return data as Animal
    },
  })
  const last = useQuery({
    queryKey: ['last-fed', id],
    queryFn: async () => {
      const { data } = await supabase!.from('feedings').select('fed_at, outcome').eq('animal_id', id)
        .order('fed_at', { ascending: false }).limit(1)
      return data?.[0] as { fed_at: string; outcome: string } | undefined
    },
  })
  return (
    <>
      <p className="row between">
        <Link to="/animals">← All animals</Link>
        <Link to={`/animals/${id}/edit`}>Edit details</Link>
      </p>
      <h1>{animal.data?.name}</h1>
      {last.data && <p className="muted">Last fed {daysAgo(last.data.fed_at)} ({last.data.outcome})</p>}
      <div className="tabs" role="tablist">
        {tabs.map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>
            {label(t)}
          </button>
        ))}
      </div>
      {tab === 'weight' && <WeightTab id={id} />}
      {tab === 'feeding' && <FeedingTab id={id} />}
      {tab === 'charts' && <ChartsTab id={id} />}
      {tab === 'sheds' && <ShedTab id={id} />}
      {tab === 'health' && <HealthTab id={id} />}
      {tab === 'photos' && animal.data && <PhotosTab animal={animal.data} />}
    </>
  )
}
