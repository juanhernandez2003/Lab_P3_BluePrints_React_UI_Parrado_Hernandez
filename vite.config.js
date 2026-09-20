import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const target = env.VITE_BACKEND_URL || 'http://localhost:8080'
  // Proxy hacia el backend del Lab P2: el navegador ve un solo origen y no hay problemas de CORS.
  const proxy = {
    '/api': { target, changeOrigin: true },
    '/auth': { target, changeOrigin: true },
  }
  return {
    plugins: [react()],
    server: { port: 5173, proxy },
    preview: { port: 4173, proxy },
  }
})
