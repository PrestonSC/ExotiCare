import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './lib/auth'
import Layout, { RequireAuth } from './components/Layout'
import Home from './routes/Home'
import Login from './routes/Login'
import Animals from './routes/Animals'
import AnimalEdit from './routes/AnimalEdit'
import Enclosures from './routes/Enclosures'
import Labels from './routes/Labels'
import AnimalPublic from './routes/AnimalPublic'
import './styles.css'

const queryClient = new QueryClient()

// Hash routing so deep links (QR codes) work on GitHub Pages: /#/a/<token>
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <HashRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/a/:token" element={<AnimalPublic />} />
            <Route element={<RequireAuth />}>
              <Route element={<Layout />}>
                <Route path="/animals" element={<Animals />} />
                <Route path="/animals/:id" element={<AnimalEdit />} />
                <Route path="/enclosures" element={<Enclosures />} />
                <Route path="/labels" element={<Labels />} />
              </Route>
            </Route>
          </Routes>
        </HashRouter>
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>,
)
