import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { animalUrl } from '../lib/qr'
import type { Animal, AnimalStatus, Enclosure, Placement, Sex } from '../lib/types'

type Form = {
  name: string; species: string; morph: string; sex: Sex
  hatch_date: string; acquired_date: string; source: string
  price: string; status: AnimalStatus; notes: string
}

const empty: Form = {
  name: '', species: 'Python regius', morph: '', sex: 'unknown',
  hatch_date: '', acquired_date: '', source: '', price: '', status: 'active', notes: '',
}

const toForm = (a: Animal): Form => ({
  name: a.name, species: a.species, morph: a.morph ?? '', sex: a.sex,
  hatch_date: a.hatch_date ?? '', acquired_date: a.acquired_date ?? '', source: a.source ?? '',
  price: a.price?.toString() ?? '', status: a.status, notes: a.notes ?? '',
})

const toRow = (f: Form) => ({
  name: f.name.trim(), species: f.species.trim() || 'Python regius',
  morph: f.morph.trim() || null, sex: f.sex,
  hatch_date: f.hatch_date || null, acquired_date: f.acquired_date || null,
  source: f.source.trim() || null, price: f.price ? Number(f.price) : null,
  status: f.status, notes: f.notes.trim() || null,
})

export default function AnimalEdit() {
  const { id } = useParams()
  const isNew = id === 'new'
  const nav = useNavigate()
  const qc = useQueryClient()
  const [form, setForm] = useState<Form>(empty)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const animal = useQuery({
    queryKey: ['animal', id],
    enabled: !isNew,
    queryFn: async () => {
      const { data, error } = await supabase!.from('animals').select('*').eq('id', id!).single()
      if (error) throw error
      return data as Animal
    },
  })
  useEffect(() => { if (animal.data) setForm(toForm(animal.data)) }, [animal.data])

  const enclosures = useQuery({
    queryKey: ['enclosures'],
    queryFn: async () => {
      const { data, error } = await supabase!.from('enclosures').select('*').order('label')
      if (error) throw error
      return data as Enclosure[]
    },
  })
  const placements = useQuery({
    queryKey: ['placements-open'],
    queryFn: async () => {
      const { data, error } = await supabase!.from('placements').select('*').is('end_at', null)
      if (error) throw error
      return data as Placement[]
    },
  })

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }))
  const refresh = () => qc.invalidateQueries()

  async function save(e: FormEvent) {
    e.preventDefault()
    setBusy(true); setError(null)
    const q = isNew
      ? supabase!.from('animals').insert(toRow(form)).select('id').single()
      : supabase!.from('animals').update(toRow(form)).eq('id', id!).select('id').single()
    const { data, error } = await q
    setBusy(false)
    if (error) return setError(error.message)
    refresh()
    nav(isNew ? `/animals/${data.id}` : '/animals')
  }

  async function remove() {
    if (!confirm(`Delete ${form.name}? This also deletes their history and cannot be undone.`)) return
    const { error } = await supabase!.from('animals').delete().eq('id', id!)
    if (error) return setError(error.message)
    refresh(); nav('/animals')
  }

  const open = placements.data ?? []
  const currentEnc = open.find((p) => p.animal_id === id)?.enclosure_id ?? ''
  const takenBy = (encId: string) => open.find((p) => p.enclosure_id === encId && p.animal_id !== id)

  async function move(encId: string) {
    setError(null)
    const { error } = await supabase!.rpc('move_animal', { p_animal: id, p_enclosure: encId || null })
    if (error) return setError(error.message)
    refresh()
  }

  async function rotate() {
    if (!confirm('Replace this animal\'s QR code? Any printed label for it will stop working.')) return
    const { error } = await supabase!.rpc('rotate_animal_token', { p_animal: id })
    if (error) return setError(error.message)
    refresh()
  }

  if (!isNew && animal.isLoading) return <p>Loading…</p>

  return (
    <>
      <h1>{isNew ? 'Add animal' : form.name || 'Animal'}</h1>
      {!isNew && <p><Link className="btn" to={`/animals/${id}/care`}>Care log: weight, feeding, sheds, health</Link></p>}
      <form onSubmit={save} className="stack">
        <label>Name<input value={form.name} onChange={(e) => set('name', e.target.value)} required /></label>
        <label>Species<input value={form.species} onChange={(e) => set('species', e.target.value)} /></label>
        <label>Morph / genes<input value={form.morph} onChange={(e) => set('morph', e.target.value)} /></label>
        <label>Sex
          <select value={form.sex} onChange={(e) => set('sex', e.target.value as Sex)}>
            <option value="unknown">Unknown</option><option value="male">Male</option><option value="female">Female</option>
          </select>
        </label>
        <label>Status
          <select value={form.status} onChange={(e) => set('status', e.target.value as AnimalStatus)}>
            <option value="active">Active</option><option value="breeder">Breeder</option>
            <option value="sold">Sold</option><option value="deceased">Deceased</option>
          </select>
        </label>
        <label>Hatch date<input type="date" value={form.hatch_date} onChange={(e) => set('hatch_date', e.target.value)} /></label>
        <label>Acquired<input type="date" value={form.acquired_date} onChange={(e) => set('acquired_date', e.target.value)} /></label>
        <label>Source<input value={form.source} onChange={(e) => set('source', e.target.value)} /></label>
        <label>Price paid<input type="number" step="0.01" min="0" value={form.price} onChange={(e) => set('price', e.target.value)} /></label>
        <label>Notes<textarea rows={4} value={form.notes} onChange={(e) => set('notes', e.target.value)} /></label>
        {error && <p className="error">{error}</p>}
        <div className="row">
          <button disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
          <button type="button" className="secondary" onClick={() => nav('/animals')}>Back</button>
          {!isNew && <button type="button" className="danger" onClick={remove}>Delete</button>}
        </div>
      </form>

      {!isNew && animal.data && (
        <section className="stack">
          <h2>QR code</h2>
          <a href={animalUrl(animal.data.public_token)} target="_blank" rel="noreferrer">Open public page</a>
          <div className="row">
            <button type="button" className="secondary" onClick={rotate}>Rotate QR code</button>
          </div>
        </section>
      )}

      {!isNew && (
        <section className="stack">
          <h2>Enclosure</h2>
          <select value={currentEnc} onChange={(e) => move(e.target.value)}>
            <option value="">None</option>
            {enclosures.data?.map((en) => (
              <option key={en.id} value={en.id} disabled={Boolean(takenBy(en.id))}>
                {en.label}{takenBy(en.id) ? ' (occupied)' : ''}
              </option>
            ))}
          </select>
        </section>
      )}
    </>
  )
}
