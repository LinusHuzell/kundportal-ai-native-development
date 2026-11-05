import { expect, test } from '@playwright/test'

// Example of a mocked test. The ticket list does not call the API yet, so this
// only shows the pattern. Delete this file when the first real error-state test
// is added to e2e-mocked/, e.g. that the user sees an understandable message on a 500.
test('ticket list page renders when the API returns a server error', async ({ page }) => {
  await page.route('**/api/**', (route) =>
    route.fulfill({
      status: 500,
      contentType: 'application/problem+json',
      body: JSON.stringify({ title: 'An error occurred', status: 500 }),
    }),
  )

  await page.goto('/tickets')

  await expect(page.getByRole('heading', { name: 'Tickets' })).toBeVisible()
})
