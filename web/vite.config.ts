import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Served from https://prestonsc.github.io/ReptileManagement/
export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? '/ReptileManagement/' : '/',
  plugins: [react()],
})
