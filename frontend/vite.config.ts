import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Needed so the dev server is reachable from outside a Docker container.
    host: true,
    port: 5173,
  },
  test: {
    // Unit tests live next to the code. Playwright specs in e2e/ are run separately.
    include: ['src/**/*.test.{ts,tsx}'],
    environment: 'node',
  },
})
