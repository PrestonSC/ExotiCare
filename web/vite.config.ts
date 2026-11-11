import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Served from https://prestonsc.github.io/ReptileManagement/
const base = process.env.GITHUB_ACTIONS ? '/ReptileManagement/' : '/'

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Reptile Management',
        short_name: 'Reptiles',
        description: 'Care records for my ball pythons',
        theme_color: '#2f7d4f',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: base,
        scope: base,
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      // Cache the app shell only. Data requests always go to the network
      // (the scan page keeps its own last-good copy in localStorage).
      workbox: { globPatterns: ['**/*.{js,css,html,svg,png}'], navigateFallback: 'index.html' },
    }),
  ],
})
