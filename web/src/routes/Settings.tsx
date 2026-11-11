import { useState } from 'react'
import { Link } from 'react-router-dom'
import { daysAgo } from '../lib/format'
import { EXPORT_TABLES, cleaningLog, download, fetchAll, toCsv } from '../lib/export'
import { supabase } from '../lib/supabase'

const LAST_KEY = 'rm_last_export'
const getLast = () => { try { return localStorage.getItem(LAST_KEY) } catch { return null } }

export default function Settings() {
  const [last, setLast] = useState<string | null>(getLast())
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const stamp = new Date().toISOString().slice(0, 10)

  async function run(name: string, fn: () => Promise<void>) {
    setBusy(name); setError(null)
    try { await fn() } catch (e) { setError((e as Error).message) }
    setBusy(null)
  }

  const exportJson = () => run('json', async () => {
    const out: Record<string, unknown> = { exported_at: new Date().toISOString() }
    for (const t of EXPORT_TABLES) out[t] = await fetchAll(t)
    out.cleaning_log = await cleaningLog() // readable version of the calendar history
    download(`exoticare-${stamp}.json`, JSON.stringify(out, null, 2), 'application/json')
    const now = new Date().toISOString()
    try { localStorage.setItem(LAST_KEY, now) } catch { /* storage unavailable */ }
    setLast(now)
  })
  const exportCsv = (t: string) => run(t, async () =>
    download(`${t}-${stamp}.csv`, toCsv(t === 'cleaning_log' ? await cleaningLog() : await fetchAll(t)), 'text/csv'))

  return (
    <>
      <h1>Settings</h1>
      <section className="stack">
        <h2>Back up your data</h2>
        <p className="muted">
          Downloads everything: animals, enclosures, weights, feedings, sheds, health, photos (records only, not the image
          files) and the full cleaning history including spot and full cleans and the planned schedule dates.
          Keep the file somewhere safe. {last ? `Last backup from this device: ${daysAgo(last)}.` : 'No backup from this device yet.'}
        </p>
        <div><button disabled={busy !== null} onClick={exportJson}>{busy === 'json' ? 'Preparing…' : 'Back up everything (JSON)'}</button></div>
        <details>
          <summary>Individual tables (CSV)</summary>
          <div className="row" style={{ marginTop: 8 }}>
            {[...EXPORT_TABLES, 'cleaning_log'].map((t) => (
              <button key={t} className="secondary" disabled={busy !== null} onClick={() => exportCsv(t)}>
                {busy === t ? '…' : t}
              </button>
            ))}
          </div>
        </details>
        {error && <p className="error">{error}</p>}
      </section>
      <section className="stack">
        <h2>QR labels</h2>
        <p className="muted">Print one name + QR code per animal.</p>
        <div><Link className="btn" to="/labels">Open label sheet</Link></div>
      </section>
      <section className="stack">
        <h2>Account</h2>
        <div><button className="secondary" onClick={() => supabase?.auth.signOut()}>Sign out</button></div>
      </section>
    </>
  )
}
