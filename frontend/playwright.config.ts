import { defineConfig, devices } from '@playwright/test'

const devHttps = process.env.DEV_HTTPS === 'true'
// A port of its own, so local runs do not collide with the dev stack on 5173.
const localPort = 5174
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `${devHttps ? 'https' : 'http'}://localhost:${localPort}`

export default defineConfig({
  fullyParallel: true,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    ignoreHTTPSErrors: devHttps,
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'fullstack', testDir: './e2e', use: { ...devices['Desktop Chrome'] } },
    { name: 'mocked', testDir: './e2e-mocked', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: `npm run dev -- --port ${localPort} --strictPort`,
        url: baseURL,
        ignoreHTTPSErrors: devHttps,
        reuseExistingServer: !process.env.CI,
      },
})
