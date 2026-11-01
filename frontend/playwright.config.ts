import { defineConfig, devices } from '@playwright/test'

const devHttps = process.env.DEV_HTTPS === 'true'
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `${devHttps ? 'https' : 'http'}://localhost:5173`

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
        command: 'npm run dev',
        url: baseURL,
        ignoreHTTPSErrors: devHttps,
        reuseExistingServer: !process.env.CI,
      },
})
