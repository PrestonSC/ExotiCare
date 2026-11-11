import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Animal } from '../lib/types'

type Row = Animal & {
  placements: { end_at: string | null; enclosure: { label: string } | null }[]
}

export default function Animals() {
  const { data, error, isLoading } = useQuery({
    queryKey: ['animals'],
    queryFn: async () => {
      const { data, error } = await supabase!
        .from('animals')
        .select('*, placements(end_at, enclosure:enclosures(label))')
        .order('name')
      if (error) throw error
      return data as unknown as Row[]
    },
  })

  return (
    <>
      <div className="row between">
        <h1>Animals</h1>
        <Link className="btn" to="/animals/new">Add animal</Link>
      </div>
      {isLoading && <p>Loading…</p>}
      {error && <p className="error">{(error as Error).message}</p>}
      {data?.length === 0 && <p>No animals yet. Add your first one.</p>}
      <ul className="cards">
        {data?.map((a) => {
          const current = a.placements.find((p) => p.end_at === null)
          return (
            <li key={a.id}>
              <Link to={`/animals/${a.id}`}>
                <strong>{a.name}</strong>
                <span>{[a.morph, a.sex !== 'unknown' ? a.sex : null].filter(Boolean).join(' · ') || a.species}</span>
                <span className="muted">
                  {a.status !== 'active' ? `${a.status} · ` : ''}
                  {current?.enclosure?.label ?? 'No enclosure'}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </>
  )
}
