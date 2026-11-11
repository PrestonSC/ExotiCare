import { supabaseConfigured } from '../lib/supabase'

export default function Home() {
  return (
    <main style={{ padding: 16, maxWidth: 640, margin: '0 auto' }}>
      <h1>Reptile Management</h1>
      <p>
        Backend:{' '}
        {supabaseConfigured ? 'Supabase configured' : 'Supabase not configured yet'}
      </p>
    </main>
  )
}
