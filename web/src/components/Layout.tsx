import { Navigate, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../lib/auth'

export function RequireAuth() {
  const { session, loading } = useAuth()
  if (loading) return <p className="page">Loading…</p>
  if (!session) return <Navigate to="/login" replace />
  return <Outlet />
}

export default function Layout() {
  return (
    <>
      <nav className="nav no-print">
        <NavLink to="/dashboard">Today</NavLink>
        <NavLink to="/animals">Animals</NavLink>
        <NavLink to="/enclosures">Enclosures</NavLink>
        <NavLink to="/labels">Labels</NavLink>
        <NavLink to="/settings" className="push">Settings</NavLink>
      </nav>
      <main className="page">
        <Outlet />
      </main>
    </>
  )
}
