import { defineConfig, devices } from '@playwright/test'

const devHttps = process.env.DEV_HTTPS === 'true'
const baseURL = `${devHttps ? 'https' : 'http'}://localhost:5173`

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    ignoreHTTPSErrors: devHttps,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run dev',
    url: baseURL,
    ignoreHTTPSErrors: devHttps,
    reuseExistingServer: !process.env.CI,
  },
})
