import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { daysAgo } from '../lib/format'
import type { Due } from '../lib/due'

export type CleanKind = 'spot' | 'full'
const NAME: Record<CleanKind, string> = { spot: 'Spot clean', full: 'Full clean' }

const plural = (n: number) => `${n} day${n === 1 ? '' : 's'}`
function phrase(d: Due) {
  if (d.state === 'never') return 'due now'
  if (d.state === 'due') return d.days === 0 ? 'due today' : `overdue by ${plural(d.days)}`
  return d.days === 1 ? 'due tomorrow' : `due in ${plural(d.days)}`
}

/** "Spot clean · due today · last 1 day ago" with a Done button, and a short Undo after logging. */
export default function CleanRow({
  enclosureId, kind, status, lastAt, onChange,
}: { enclosureId: string; kind: CleanKind; status: Due; lastAt?: string; onChange: () => void }) {
  const [undoId, setUndoId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const timer = useRef<number>()
  useEffect(() => () => window.clearTimeout(timer.current), [])

  async function done() {
    setBusy(true); setError(null)
    const { data, error } = await supabase!.from('cleanings').insert({ enclosure_id: enclosureId, kind }).select('id').single()
    setBusy(false)
    if (error) return setError(error.message)
    setUndoId(data.id)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setUndoId(null), 8000)
    onChange()
  }
  async function undo() {
    if (!undoId) return
    const { error } = await supabase!.from('cleanings').delete().eq('id', undoId)
    if (error) return setError(error.message)
    setUndoId(null); onChange()
  }

  const late = status.state === 'due' || status.state === 'never'
  return (
    <div className="clean-row">
      <div className="clean-info">
        <strong>{NAME[kind]}</strong>
        <span className={late ? 'late' : 'muted'}>
          {phrase(status)}
        </span>
        <span className="muted small">{lastAt ? `last ${daysAgo(lastAt)}` : 'not logged yet'}</span>
        {error && <span className="error small">{error}</span>}
      </div>
      {undoId
        ? <button className="secondary compact" onClick={undo}>Undo</button>
        : <button className="compact" disabled={busy} onClick={done}>{busy ? '…' : 'Done'}</button>}
    </div>
  )
}
