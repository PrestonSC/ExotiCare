import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getRememberedEmail, rememberEmail } from '../lib/remember'

/** Password wall on the public scan page. Signs in, then jumps straight to this animal's care log. */
export default function Unlock({ token }: { token: string }) {
  const nav = useNavigate()
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState(getRememberedEmail())
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true); setError(null)
    const { error } = await supabase!.auth.signInWithPassword({ email: email.trim(), password })
    if (error) { setBusy(false); return setError(error.message) }
    rememberEmail(email.trim())
    const { data } = await supabase!.from('animals').select('id').eq('public_token', token).maybeSingle()
    setBusy(false)
    if (data?.id) nav(`/animals/${data.id}/care`)
    else setError('Signed in, but this QR code does not belong to your account.')
  }

  if (!open) return <p><button onClick={() => setOpen(true)}>Unlock to edit</button></p>
  return (
    <form onSubmit={submit} className="stack card">
      <label>Email
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="username" />
      </label>
      <label>Password
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
               autoComplete="current-password" autoFocus={Boolean(email)} />
      </label>
      {error && <p className="error">{error}</p>}
      <div className="row">
        <button disabled={busy}>{busy ? 'Unlocking…' : 'Unlock'}</button>
        <button type="button" className="secondary" onClick={() => setOpen(false)}>Cancel</button>
      </div>
    </form>
  )
}
