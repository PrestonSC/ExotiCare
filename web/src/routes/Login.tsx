import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import { getRememberedEmail, rememberEmail } from '../lib/remember'

export default function Login() {
  const { session } = useAuth()
  const [email, setEmail] = useState(getRememberedEmail())
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (session) return <Navigate to="/dashboard" replace />

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!supabase) return setError('Supabase is not configured.')
    setBusy(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    else rememberEmail(email.trim())
    setBusy(false)
  }

  return (
    <main className="page narrow">
      <h1>ExotiCare</h1>
      <form onSubmit={submit} className="stack">
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="username" />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
        </label>
        {error && <p className="error">{error}</p>}
        <button disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
    </main>
  )
}
