import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

interface PublicAnimal {
  name: string
  species: string
  morph: string | null
  sex: 'male' | 'female' | 'unknown'
  hatch_date: string | null
  status: string
  enclosure: { label: string; location: string | null } | null
}

function age(hatch: string | null) {
  if (!hatch) return null
  const d = new Date(hatch + 'T00:00:00')
  let months = (new Date().getFullYear() - d.getFullYear()) * 12 + new Date().getMonth() - d.getMonth()
  if (new Date().getDate() < d.getDate()) months--
  if (months < 0) return null
  if (months < 24) return `${months} mo`
  const y = Math.floor(months / 12)
  return `${y} yr${months % 12 ? ` ${months % 12} mo` : ''}`
}

export default function AnimalPublic() {
  const { token } = useParams()
  const { data, isLoading, error } = useQuery({
    queryKey: ['public-animal', token],
    queryFn: async () => {
      const { data, error } = await supabase!.rpc('get_animal_public', { p_token: token })
      if (error) throw error
      return data as PublicAnimal | null
    },
  })

  return (
    <main className="page">
      {isLoading && <p>Loading…</p>}
      {error && <p className="error">Could not load this animal.</p>}
      {data === null && <p>This QR code is no longer valid.</p>}
      {data && (
        <>
          <h1>{data.name}</h1>
          <dl className="facts">
            <dt>Species</dt><dd>{data.species}</dd>
            {data.morph && <><dt>Morph</dt><dd>{data.morph}</dd></>}
            {data.sex !== 'unknown' && <><dt>Sex</dt><dd>{data.sex}</dd></>}
            {age(data.hatch_date) && <><dt>Age</dt><dd>{age(data.hatch_date)}</dd></>}
            {data.status !== 'active' && <><dt>Status</dt><dd>{data.status}</dd></>}
            <dt>Enclosure</dt>
            <dd>
              {data.enclosure
                ? [data.enclosure.label, data.enclosure.location].filter(Boolean).join(' · ')
                : 'Not assigned'}
            </dd>
          </dl>
        </>
      )}
    </main>
  )
}
