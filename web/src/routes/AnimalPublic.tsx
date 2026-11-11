import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import Unlock from '../components/Unlock'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import LineChart from '../components/LineChart'
import { daysAgo, fmtDate, label } from '../lib/format'
import { cleaningStatus, describeDue, feedingStatus } from '../lib/due'

interface PublicAnimal {
  name: string
  photo_path: string | null
  species: string
  morph: string | null
  sex: 'male' | 'female' | 'unknown'
  hatch_date: string | null
  status: string
  enclosure: { label: string; location: string | null } | null
  weights: { at: string; grams: number }[]
  last_fed: { at: string; prey_type: string; prey_stage: string | null; outcome: string } | null
  last_ate_at: string | null
  feed_interval_days: number
  spot_clean_interval_days: number | null
  full_clean_interval_days: number | null
  last_spot_clean: string | null
  last_full_clean: string | null
  last_shed: { at: string; complete: boolean } | null
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

const plural = (n: number) => `${n} day${n === 1 ? '' : 's'}`
function cleanLine(d: { state: string; days: number }, last: string | null) {
  const when = d.state === 'never' ? 'due now' : d.state === 'due'
    ? (d.days === 0 ? 'due today' : `overdue by ${plural(d.days)}`)
    : (d.days === 1 ? 'due tomorrow' : `due in ${plural(d.days)}`)
  return last ? `${when} · last ${daysAgo(last)}` : `${when} · none logged`
}

export default function AnimalPublic() {
  const { token } = useParams()
  const { session } = useAuth()
  const owned = useQuery({
    queryKey: ['owned-animal', token, Boolean(session)],
    enabled: Boolean(session),
    queryFn: async () => {
      const { data } = await supabase!.from('animals').select('id').eq('public_token', token!).maybeSingle()
      return data?.id as string | undefined
    },
  })
  const { data, isLoading, error } = useQuery({
    queryKey: ['public-animal', token],
    queryFn: async () => {
      // Keep the last good copy so a scan still shows something on weak room Wi-Fi.
      const cacheKey = `rm_pub_${token}`
      try {
        const { data, error } = await supabase!.rpc('get_animal_public', { p_token: token })
        if (error) throw error
        try { localStorage.setItem(cacheKey, JSON.stringify({ at: Date.now(), data })) } catch { /* storage unavailable */ }
        return { animal: data as PublicAnimal | null, cachedAt: null as number | null }
      } catch (e) {
        try {
          const raw = localStorage.getItem(cacheKey)
          if (raw) {
            const c = JSON.parse(raw) as { at: number; data: PublicAnimal | null }
            if (c.data) return { animal: c.data, cachedAt: c.at }
          }
        } catch { /* ignore */ }
        throw e
      }
    },
    retry: 1,
  })
  const animal = data?.animal

  return (
    <main className="page">
      {isLoading && <p>Loading…</p>}
      {error && <p className="error">Could not load this animal.</p>}
      {data && animal === null && <p>This QR code is no longer valid.</p>}
      {data?.cachedAt && <p className="banner muted">Offline: showing info saved {daysAgo(new Date(data.cachedAt).toISOString())}.</p>}
      {animal && (
        <>
          {animal.photo_path && <img className="hero" alt={animal.name} src={supabase!.storage.from('animal-public').getPublicUrl(animal.photo_path).data.publicUrl} />}
          <h1>{animal.name}</h1>
          {animal.health_open.map((h, i) => (
            <p key={i} className="flag-box">
              <span className="badge">{label(h.kind)}</span> {h.description}
              <span className="muted"> · since {fmtDate(h.since)}</span>
            </p>
          ))}
          <dl className="facts">
            <dt>Species</dt><dd>{animal.species}</dd>
            {animal.morph && <><dt>Morph</dt><dd>{animal.morph}</dd></>}
            {animal.sex !== 'unknown' && <><dt>Sex</dt><dd>{animal.sex}</dd></>}
            {age(animal.hatch_date) && <><dt>Age</dt><dd>{age(animal.hatch_date)}</dd></>}
            {animal.status !== 'active' && <><dt>Status</dt><dd>{animal.status}</dd></>}
            <dt>Enclosure</dt>
            <dd>
              {animal.enclosure
                ? [animal.enclosure.label, animal.enclosure.location].filter(Boolean).join(' · ')
                : 'Not assigned'}
            </dd>
            {animal.weights.length > 0 && (
              <>
                <dt>Weight</dt>
                <dd>{Number(animal.weights[animal.weights.length - 1].grams)} g
                  <span className="muted"> · {fmtDate(animal.weights[animal.weights.length - 1].at)}</span></dd>
              </>
            )}
            <dt>Last fed</dt>
            <dd>
              {animal.last_fed
                ? `${daysAgo(animal.last_fed.at)} · ${label(animal.last_fed.outcome)} · ${[animal.last_fed.prey_stage, animal.last_fed.prey_type === 'asf' ? 'ASF' : animal.last_fed.prey_type].filter(Boolean).join(' ')}`
                : 'No record'}
            </dd>
            <dt>Next feeding</dt>
            <dd>{describeDue(feedingStatus({ intervalDays: animal.feed_interval_days, lastAteAt: animal.last_ate_at, lastFeed: animal.last_fed ? { at: animal.last_fed.at, outcome: animal.last_fed.outcome } : null }), 'Feeding').replace(/^Feeding:? /, '')}</dd>
            {animal.spot_clean_interval_days && animal.full_clean_interval_days && (
              <>
                <dt>Spot clean</dt>
                <dd>{cleanLine(cleaningStatus(animal.spot_clean_interval_days, animal.last_spot_clean), animal.last_spot_clean)}</dd>
                <dt>Full clean</dt>
                <dd>{cleanLine(cleaningStatus(animal.full_clean_interval_days, animal.last_full_clean), animal.last_full_clean)}</dd>
              </>
            )}
            <dt>Last shed</dt>
            <dd>{animal.last_shed ? `${fmtDate(animal.last_shed.at)}${animal.last_shed.complete ? '' : ' (incomplete)'}` : 'No record'}</dd>
          </dl>
          {animal.weights.length > 1 && (
            <LineChart compact points={animal.weights.map((w) => ({ at: w.at, value: Number(w.grams) }))} />
          )}
          {session
            ? owned.data && <p><Link className="btn" to={`/animals/${owned.data}/care`}>Edit care log</Link></p>
            : <Unlock token={token!} />}
        </>
      )}
    </main>
  )
}
