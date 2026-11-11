import { useState } from 'react'
import { EXPORT_TABLES, download, fetchAll, toCsv } from '../lib/export'
import { supabase } from '../lib/supabase'

export default function Settings() {
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
    download(`reptiles-${stamp}.json`, JSON.stringify(out, null, 2), 'application/json')
  })
  const exportCsv = (t: string) => run(t, async () =>
    download(`${t}-${stamp}.csv`, toCsv(await fetchAll(t)), 'text/csv'))

  return (
    <>
      <h1>Settings</h1>
      <section className="stack">
        <h2>Export your data</h2>
        <p className="muted">
          Everything except the photo files themselves (their records are included). Keep a copy somewhere safe.
        </p>
        <div><button disabled={busy !== null} onClick={exportJson}>{busy === 'json' ? 'Exporting…' : 'Download everything (JSON)'}</button></div>
        <details>
          <summary>Individual tables (CSV)</summary>
          <div className="row" style={{ marginTop: 8 }}>
            {EXPORT_TABLES.map((t) => (
              <button key={t} className="secondary" disabled={busy !== null} onClick={() => exportCsv(t)}>
                {busy === t ? '…' : t}
              </button>
            ))}
          </div>
        </details>
        {error && <p className="error">{error}</p>}
      </section>
      <section className="stack">
        <h2>Account</h2>
        <div><button className="secondary" onClick={() => supabase?.auth.signOut()}>Sign out</button></div>
      </section>
    </>
  )
}
