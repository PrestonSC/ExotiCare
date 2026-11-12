import React, { lazy, Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './lib/auth'
import Layout, { MaybeLayout, RequireAuth } from './components/Layout'
import Dashboard from './routes/Dashboard'
import Home from './routes/Home'
import Login from './routes/Login'
import Animals from './routes/Animals'
import AnimalEdit from './routes/AnimalEdit'
import Enclosures from './routes/Enclosures'
import Care from './routes/Care'
import Settings from './routes/Settings'
import Trends from './routes/Trends'
import Labels from './routes/Labels'
// The care guide is large (text and diagrams), so it loads on demand rather than with the app.
const Guides = lazy(() => import('./routes/Guides'))
const GuideArticle = lazy(() => import('./routes/GuideArticle'))
import AnimalPublic from './routes/AnimalPublic'
import './styles.css'

const queryClient = new QueryClient()

// Hash routing so deep links (QR codes) work on GitHub Pages: /#/a/<token>
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <HashRouter>
          <Suspense fallback={<p className="page">Loading…</p>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/a/:token" element={<AnimalPublic />} />
            <Route element={<MaybeLayout />}>
              <Route path="/guides" element={<Guides />} />
              <Route path="/guides/:slug" element={<GuideArticle />} />
            </Route>
            <Route element={<RequireAuth />}>
              <Route element={<Layout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/animals" element={<Animals />} />
                <Route path="/animals/new" element={<AnimalEdit />} />
                <Route path="/animals/:id/edit" element={<AnimalEdit />} />
                <Route path="/animals/:id" element={<Navigate to="care" replace />} />
                <Route path="/animals/:id/care" element={<Care />} />
                <Route path="/enclosures" element={<Enclosures />} />
                <Route path="/trends" element={<Trends />} />
                <Route path="/labels" element={<Labels />} />
                <Route path="/settings" element={<Settings />} />
              </Route>
            </Route>
          </Routes>
          </Suspense>
        </HashRouter>
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>,
)
