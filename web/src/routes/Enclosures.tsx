import { useState, type FormEvent } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import CleanRow from '../components/CleanRow'
import { cleanStatus } from '../lib/due'
import { loadCleanings, type CleaningRow } from '../lib/cleanings'
import type { Animal, Enclosure, Placement } from '../lib/types'

type Draft = { label: string; location: string; type: string; notes: string; spot: string; full: string }
const blank: Draft = { label: '', location: '', type: '', notes: '', spot: '1', full: '30' }
const days = (v: string, fallback: number) => Math.min(365, Math.max(1, Math.round(Number(v)) || fallback))
const clean = (d: Draft) => ({
  label: d.label.trim(), location: d.location.trim() || null,
  type: d.type.trim() || null, notes: d.notes.trim() || null,
  spot_clean_interval_days: days(d.spot, 1), full_clean_interval_days: days(d.full, 30),
})
const toDraft = (e: Enclosure): Draft => ({
  label: e.label, location: e.location ?? '', type: e.type ?? '', notes: e.notes ?? '',
  spot: String(e.spot_clean_interval_days), full: String(e.full_clean_interval_days),
})

function Fields({ d, set }: { d: Draft; set: (d: Draft) => void }) {
  return (
    <>
      <label>Label<input value={d.label} onChange={(e) => set({ ...d, label: e.target.value })} required placeholder="Rack A-3" /></label>
      <label>Location<input value={d.location} onChange={(e) => set({ ...d, location: e.target.value })} placeholder="Reptile room" /></label>
      <label>Type<input value={d.type} onChange={(e) => set({ ...d, type: e.target.value })} placeholder="Tub, rack, vivarium…" /></label>
      <div className="two-col">
        <label>Spot clean every (days)
          <input type="number" min="1" max="365" inputMode="numeric" value={d.spot} onChange={(e) => set({ ...d, spot: e.target.value })} />
        </label>
        <label>Full clean every (days)
          <input type="number" min="1" max="365" inputMode="numeric" value={d.full} onChange={(e) => set({ ...d, full: e.target.value })} />
        </label>
      </div>
      <label>Notes<textarea rows={2} value={d.notes} onChange={(e) => set({ ...d, notes: e.target.value })} /></label>
    </>
  )
}

function EnclosureCard({ e, occupant, cleanings, onChange }: {
  e: Enclosure; occupant?: string; cleanings: CleaningRow[]; onChange: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [d, setD] = useState<Draft>(toDraft(e))
  const [error, setError] = useState<string | null>(null)
  const st = cleanStatus(cleanings, e.spot_clean_interval_days, e.full_clean_interval_days)

  async function save(ev: FormEvent) {
    ev.preventDefault()
    const { error } = await supabase!.from('enclosures').update(clean(d)).eq('id', e.id)
    if (error) return setError(error.message)
    setEditing(false); onChange()
  }
  async function remove() {
    if (!confirm(`Delete ${e.label}? Its cleaning history is deleted too.`)) return
    const { error } = await supabase!.from('enclosures').delete().eq('id', e.id)
    if (error) return setError(error.message)
    onChange()
  }

  if (editing)
    return (
      <li>
        <form onSubmit={save} className="stack">
          <Fields d={d} set={setD} />
          {error && <p className="error">{error}</p>}
          <div className="row">
            <button>Save</button>
            <button type="button" className="secondary" onClick={() => { setEditing(false); setD(toDraft(e)) }}>Cancel</button>
            <button type="button" className="danger" onClick={remove}>Delete</button>
          </div>
        </form>
      </li>
    )

  return (
    <li>
      <div className="enc-head">
        <div>
          <h3>{e.label}</h3>
          <div className="muted enc-sub">
            {[occupant ?? 'Empty', e.location, e.type].filter(Boolean).join(' · ')}
          </div>
        </div>
        <button className="secondary tiny" onClick={() => setEditing(true)}>Edit</button>
      </div>
      <CleanRow enclosureId={e.id} kind="spot" status={st.spot} lastAt={st.lastSpotAt} onChange={onChange} />
      <CleanRow enclosureId={e.id} kind="full" status={st.full} lastAt={st.lastFullAt} onChange={onChange} />
      {error && <p className="error">{error}</p>}
    </li>
  )
}

export default function Enclosures() {
  const qc = useQueryClient()
  const [d, setD] = useState<Draft>(blank)
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['enclosures-page'],
    queryFn: async () => {
      const sb = supabase!
      const [enc, cl, pl, an] = await Promise.all([
        sb.from('enclosures').select('*').order('label'),
        loadCleanings().then((data) => ({ data, error: null })),
        sb.from('placements').select('animal_id, enclosure_id').is('end_at', null),
        sb.from('animals').select('id, name'),
      ])
      for (const r of [enc, cl, pl, an]) if (r.error) throw r.error
      return {
        enclosures: enc.data as Enclosure[],
        cleanings: cl.data,
        placements: pl.data as Pick<Placement, 'animal_id' | 'enclosure_id'>[],
        animals: an.data as Pick<Animal, 'id' | 'name'>[],
      }
    },
  })
  const refresh = () => qc.invalidateQueries()

  async function add(ev: FormEvent) {
    ev.preventDefault()
    setError(null)
    const { error } = await supabase!.from('enclosures').insert(clean(d))
    if (error) return setError(error.message)
    setD(blank); setAdding(false); refresh()
  }

  return (
    <>
      <div className="row between">
        <h1>Enclosures</h1>
        {!adding && <button onClick={() => setAdding(true)}>Add enclosure</button>}
      </div>
      {adding && (
        <form onSubmit={add} className="stack card">
          <h2>Add enclosure</h2>
          <Fields d={d} set={setD} />
          {error && <p className="error">{error}</p>}
          <div className="row">
            <button>Add</button>
            <button type="button" className="secondary" onClick={() => { setAdding(false); setError(null) }}>Cancel</button>
          </div>
        </form>
      )}
      {isLoading && <p>Loading…</p>}
      <ul className="cards">
        {data?.enclosures.map((e) => {
          const animalId = data.placements.find((p) => p.enclosure_id === e.id)?.animal_id
          return (
            <EnclosureCard key={e.id} e={e} onChange={refresh}
              occupant={data.animals.find((a) => a.id === animalId)?.name}
              cleanings={data.cleanings.filter((c) => c.enclosure_id === e.id)} />
          )
        })}
      </ul>
      {data?.enclosures.length === 0 && <p>No enclosures yet.</p>}
    </>
  )
}
