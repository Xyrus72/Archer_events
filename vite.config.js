import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // the Express API (server/index.js) answers /api and serves uploaded photos in dev
    proxy: { '/api': 'http://localhost:4000', '/uploads': 'http://localhost:4000' },
  },
})
