import { Navigate, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'

export function RequireAuth() {
  const { session, loading } = useAuth()
  if (loading) return <p className="page">Loading…</p>
  if (!session) return <Navigate to="/login" replace />
  return <Outlet />
}

export default function Layout() {
  return (
    <>
      <nav className="nav">
        <NavLink to="/animals">Animals</NavLink>
        <NavLink to="/enclosures">Enclosures</NavLink>
        <button className="link" onClick={() => supabase?.auth.signOut()}>
          Sign out
        </button>
      </nav>
      <main className="page">
        <Outlet />
      </main>
    </>
  )
}
