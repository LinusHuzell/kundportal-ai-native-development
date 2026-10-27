import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const configDir = dirname(fileURLToPath(import.meta.url))
const certDir = process.env.DEV_CERT_DIR ?? resolve(configDir, '../.certs')
const backendProxy = {
  target: process.env.API_PROXY_TARGET ?? 'https://localhost:7289',
  changeOrigin: true,
  // Local dev cert is self-signed.
  secure: false,
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Needed so the dev server is reachable from outside a Docker container.
    host: true,
    port: 5173,
    https: process.env.DEV_HTTPS === 'true'
      ? {
          cert: readFileSync(resolve(certDir, 'localhost.pem')),
          key: readFileSync(resolve(certDir, 'localhost.key')),
        }
      : undefined,
    proxy: {
      '/api': backendProxy,
    },
    watch: { usePolling: process.env.CHOKIDAR_USEPOLLING === 'true' },
  },
  test: {
    // Unit tests live next to the code. Playwright specs in e2e/ are run separately.
    include: ['src/**/*.test.{ts,tsx}'],
    environment: 'node',
  },
})
