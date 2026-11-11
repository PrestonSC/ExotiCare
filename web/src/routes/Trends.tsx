import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import TimeChart from '../components/TimeChart'
import type { Animal, Weight } from '../lib/types'

const MAX = 8 // the categorical palette has 8 validated slots; hues are never cycled

export default function Trends() {
  // animal id -> palette slot (1..8). A slot is kept for as long as the animal stays selected,
  // so toggling one animal never repaints the others.
  const [slots, setSlots] = useState<Record<string, number>>({})
  const [initialised, setInitialised] = useState(false)

  const { data, isLoading, error } = useQuery({
    queryKey: ['trends'],
    queryFn: async () => {
      const [a, w] = await Promise.all([
        supabase!.from('animals').select('id, name').in('status', ['active', 'breeder']).order('name'),
        supabase!.from('weights').select('animal_id, measured_at, grams').order('measured_at').limit(5000),
      ])
      if (a.error) throw a.error
      if (w.error) throw w.error
      return { animals: a.data as Pick<Animal, 'id' | 'name'>[], weights: w.data as Pick<Weight, 'animal_id' | 'measured_at' | 'grams'>[] }
    },
  })

  if (isLoading) return <p>Loading…</p>
  if (error || !data) return <p className="error">{(error as Error)?.message ?? 'Could not load'}</p>

  if (!initialised) {
    const start: Record<string, number> = {}
    data.animals.filter((a) => data.weights.some((w) => w.animal_id === a.id)).slice(0, MAX)
      .forEach((a, i) => { start[a.id] = i + 1 })
    setSlots(start); setInitialised(true)
  }

  const used = new Set(Object.values(slots))
  const toggle = (id: string) => setSlots((cur) => {
    if (cur[id]) { const { [id]: _drop, ...rest } = cur; return rest }
    const free = Array.from({ length: MAX }, (_, i) => i + 1).find((n) => !Object.values(cur).includes(n))
    return free ? { ...cur, [id]: free } : cur
  })

  const series = data.animals.filter((a) => slots[a.id]).map((a) => ({
    id: a.id, name: a.name, color: `var(--series-${slots[a.id]})`,
    points: data.weights.filter((w) => w.animal_id === a.id).map((w) => ({ t: +new Date(w.measured_at), v: Number(w.grams) })),
  })).filter((s) => s.points.length > 0)

  return (
    <>
      <h1>Trends</h1>
      <h2>Weight</h2>
      <div className="row filters">
        {data.animals.map((a) => (
          <label key={a.id} className="chip">
            <input type="checkbox" checked={Boolean(slots[a.id])} onChange={() => toggle(a.id)}
                   disabled={!slots[a.id] && used.size >= MAX} />
            {slots[a.id] && <i className="key" style={{ background: `var(--series-${slots[a.id]})` }} />}
            {a.name}
          </label>
        ))}
      </div>
      {data.animals.length > MAX && <p className="muted">Up to {MAX} animals can be compared at once.</p>}
      {series.length === 0
        ? <p className="muted">Select an animal with logged weights.</p>
        : <TimeChart title="Weight over time, by animal" unit=" g" series={series} />}
    </>
  )
}
