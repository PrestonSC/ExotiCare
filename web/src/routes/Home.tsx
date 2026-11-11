import { Navigate } from 'react-router-dom'
import { supabaseConfigured } from '../lib/supabase'

export default function Home() {
  if (supabaseConfigured) return <Navigate to="/dashboard" replace />
  return (
    <main className="page">
      <h1>ExotiCare</h1>
      <p>Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.</p>
    </main>
  )
}
