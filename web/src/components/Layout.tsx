import type { ReactNode } from 'react'
import { Link, Navigate, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../lib/auth'

export function RequireAuth() {
  const { session, loading } = useAuth()
  if (loading) return <p className="page">Loading…</p>
  if (!session) return <Navigate to="/login" replace />
  return <Outlet />
}

const Icon = ({ children }: { children: ReactNode }) => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"
       strokeLinecap="round" strokeLinejoin="round" aria-hidden>{children}</svg>
)

const tabs = [
  { to: '/dashboard', label: 'Today', icon: <Icon><circle cx="12" cy="12" r="9" /><path d="M8 12.5l3 3 5-6" /></Icon> },
  { to: '/animals', label: 'Animals', icon: <Icon><path d="M17 6c-3-3-9-2-10 2-1 3 1 5 4 5s5 2 3 5c-2 3-7 2-9 0" /><circle cx="17.5" cy="6.5" r=".6" /></Icon> },
  { to: '/enclosures', label: 'Enclosures', icon: <Icon><rect x="3" y="6" width="18" height="13" rx="2" /><path d="M3 11h18M8 6V4h8v2" /></Icon> },
  { to: '/trends', label: 'Trends', icon: <Icon><path d="M3 20h18M5 16l4-5 4 3 6-8" /></Icon> },
  { to: '/settings', label: 'Settings', icon: <Icon><path d="M4 7h10M18 7h2M4 17h2M10 17h10" /><circle cx="16" cy="7" r="2" /><circle cx="8" cy="17" r="2" /></Icon> },
]

/** Pages anyone can read (the care guide): full app chrome when signed in, a plain page otherwise. */
export function MaybeLayout() {
  const { session } = useAuth()
  if (session) return <Layout />
  return (
    <main className="page">
      <p className="row between"><strong>ExotiCare</strong><Link to="/login">Sign in</Link></p>
      <Outlet />
    </main>
  )
}

export default function Layout() {
  return (
    <>
      <main className="page with-tabbar">
        <Outlet />
      </main>
      <nav className="tabbar no-print" aria-label="Main">
        {tabs.map((t) => (
          <NavLink key={t.to} to={t.to}>{t.icon}<span>{t.label}</span></NavLink>
        ))}
      </nav>
    </>
  )
}
