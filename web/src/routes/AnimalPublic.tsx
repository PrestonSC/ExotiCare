import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import LineChart from '../components/LineChart'
import { daysAgo, fmtDate, label } from '../lib/format'

interface PublicAnimal {
  name: string
  species: string
  morph: string | null
  sex: 'male' | 'female' | 'unknown'
  hatch_date: string | null
  status: string
  enclosure: { label: string; location: string | null } | null
  weights: { at: string; grams: number }[]
  last_fed: { at: string; prey_type: string; prey_stage: string | null; outcome: string } | null
  last_shed: { at: string; complete: boolean } | null
  last_cleaned: { at: string; kind: string } | null
  health_open: { kind: string; description: string; since: string }[]
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
          {data.health_open.map((h, i) => (
            <p key={i} className="flag-box">
              <span className="badge">{label(h.kind)}</span> {h.description}
              <span className="muted"> · since {fmtDate(h.since)}</span>
            </p>
          ))}
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
            {data.weights.length > 0 && (
              <>
                <dt>Weight</dt>
                <dd>{Number(data.weights[data.weights.length - 1].grams)} g
                  <span className="muted"> · {fmtDate(data.weights[data.weights.length - 1].at)}</span></dd>
              </>
            )}
            <dt>Last fed</dt>
            <dd>
              {data.last_fed
                ? `${daysAgo(data.last_fed.at)} · ${label(data.last_fed.outcome)} · ${[data.last_fed.prey_stage, data.last_fed.prey_type === 'asf' ? 'ASF' : data.last_fed.prey_type].filter(Boolean).join(' ')}`
                : 'No record'}
            </dd>
            <dt>Last cleaned</dt>
            <dd>{data.last_cleaned ? `${daysAgo(data.last_cleaned.at)} · ${data.last_cleaned.kind}` : 'No record'}</dd>
            <dt>Last shed</dt>
            <dd>{data.last_shed ? `${fmtDate(data.last_shed.at)}${data.last_shed.complete ? '' : ' (incomplete)'}` : 'No record'}</dd>
          </dl>
          {data.weights.length > 1 && (
            <LineChart compact points={data.weights.map((w) => ({ at: w.at, value: Number(w.grams) }))} />
          )}
        </>
      )}
    </main>
  )
}
