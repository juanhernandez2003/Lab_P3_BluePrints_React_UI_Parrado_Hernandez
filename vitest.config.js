import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.js',
    // Las pruebas siempre usan el mock, sin retardo, sin importar el .env local.
    env: { VITE_USE_MOCK: 'true', VITE_MOCK_DELAY_MS: '0', VITE_MOCK_WRITE_FAIL_RATE: '0', VITE_API_BASE_URL: '/api/v1' },
  },
})
