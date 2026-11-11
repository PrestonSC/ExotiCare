import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Home from './routes/Home'
import AnimalPublic from './routes/AnimalPublic'

const queryClient = new QueryClient()

// Hash routing so deep links (QR codes) work on GitHub Pages: /#/a/<token>
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/a/:token" element={<AnimalPublic />} />
        </Routes>
      </HashRouter>
    </QueryClientProvider>
  </React.StrictMode>,
)
