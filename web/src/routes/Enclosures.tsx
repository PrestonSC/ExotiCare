import { useState, type FormEvent } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { daysAgo, label } from '../lib/format'
import type { Cleaning, Enclosure } from '../lib/types'

type Draft = { label: string; location: string; type: string; notes: string; clean: string }
const blank: Draft = { label: '', location: '', type: '', notes: '', clean: '14' }
const clean = (d: Draft) => ({
  label: d.label.trim(), location: d.location.trim() || null,
  type: d.type.trim() || null, notes: d.notes.trim() || null,
  clean_interval_days: Math.min(365, Math.max(1, Number(d.clean) || 14)),
})

function Fields({ d, set }: { d: Draft; set: (d: Draft) => void }) {
  return (
    <>
      <label>Label<input value={d.label} onChange={(e) => set({ ...d, label: e.target.value })} required placeholder="Rack A-3" /></label>
      <label>Location<input value={d.location} onChange={(e) => set({ ...d, location: e.target.value })} placeholder="Reptile room" /></label>
      <label>Type<input value={d.type} onChange={(e) => set({ ...d, type: e.target.value })} placeholder="Tub, rack, vivarium…" /></label>
      <label>Clean every (days)<input type="number" min="1" max="365" value={d.clean} onChange={(e) => set({ ...d, clean: e.target.value })} /></label>
      <label>Notes<textarea rows={2} value={d.notes} onChange={(e) => set({ ...d, notes: e.target.value })} /></label>
    </>
  )
}

function Row({ e, last, onChange }: { e: Enclosure; last?: Cleaning; onChange: () => void }) {
  const [editing, setEditing] = useState(false)
  const [d, setD] = useState<Draft>({ label: e.label, location: e.location ?? '', type: e.type ?? '', notes: e.notes ?? '', clean: String(e.clean_interval_days) })
  const [error, setError] = useState<string | null>(null)

  async function save(ev: FormEvent) {
    ev.preventDefault()
    const { error } = await supabase!.from('enclosures').update(clean(d)).eq('id', e.id)
    if (error) return setError(error.message)
    setEditing(false); onChange()
  }
  async function logCleaning(kind: Cleaning['kind']) {
    const { error } = await supabase!.from('cleanings').insert({ enclosure_id: e.id, kind })
    if (error) return setError(error.message)
    onChange()
  }
  async function remove() {
    if (!confirm(`Delete ${e.label}?`)) return
    const { error } = await supabase!.from('enclosures').delete().eq('id', e.id)
    if (error) return setError(error.message)
    onChange()
  }

  if (!editing)
    return (
      <li>
        <div className="row between">
          <div>
            <strong>{e.label}</strong>
            <div className="muted">{[e.location, e.type].filter(Boolean).join(' · ')}</div>
          </div>
          <button className="secondary" onClick={() => setEditing(true)}>Edit</button>
        </div>
        <p className="muted">
          {last ? `Last cleaned ${daysAgo(last.cleaned_at)} (${label(last.kind).toLowerCase()})` : 'Never cleaned'}
        </p>
        <div className="row">
          <span className="muted">Log cleaning:</span>
          <button className="secondary" onClick={() => logCleaning('spot')}>Spot</button>
          <button className="secondary" onClick={() => logCleaning('full')}>Full</button>
          <button className="secondary" onClick={() => logCleaning('substrate')}>Substrate</button>
          <button className="secondary" onClick={() => logCleaning('disinfect')}>Disinfect</button>
        </div>
        {error && <p className="error">{error}</p>}
      </li>
    )
  return (
    <li>
      <form onSubmit={save} className="stack">
        <Fields d={d} set={setD} />
        {error && <p className="error">{error}</p>}
        <div className="row">
          <button>Save</button>
          <button type="button" className="secondary" onClick={() => setEditing(false)}>Cancel</button>
          <button type="button" className="danger" onClick={remove}>Delete</button>
        </div>
      </form>
    </li>
  )
}

export default function Enclosures() {
  const qc = useQueryClient()
  const [d, setD] = useState<Draft>(blank)
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { data, isLoading } = useQuery({
    queryKey: ['enclosures'],
    queryFn: async () => {
      const { data, error } = await supabase!.from('enclosures').select('*').order('label')
      if (error) throw error
      return data as Enclosure[]
    },
  })
  const cleanings = useQuery({
    queryKey: ['cleanings'],
    queryFn: async () => {
      const { data, error } = await supabase!.from('cleanings').select('*').order('cleaned_at', { ascending: false })
      if (error) throw error
      return data as Cleaning[]
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
        {data?.map((e) => <Row key={e.id} e={e} last={cleanings.data?.find((c) => c.enclosure_id === e.id)} onChange={refresh} />)}
      </ul>
      {data?.length === 0 && <p>No enclosures yet.</p>}
    </>
  )
}
