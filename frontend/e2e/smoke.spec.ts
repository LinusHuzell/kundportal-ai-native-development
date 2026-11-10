import { expect, test } from '@playwright/test'

test('app shell renders and redirects / to the ticket list', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL(/\/tickets$/)
  await expect(page.getByRole('link', { name: 'Customer Service Portal' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Tickets' })).toBeVisible()
})

// Screen readers pick the voice from the page language; the UI text is Swedish.
test('the page language is Swedish', async ({ page }) => {
  await page.goto('/tickets')
  await expect(page.locator('html')).toHaveAttribute('lang', 'sv')
})

// The button lives in the top navigation so tickets can be registered from every page
// (Beslut in docs/specs/registrera-ärende.md). The detail page is a placeholder that loads nothing,
// so /tickets/1 does not depend on seed data.
test('Registrera ärende is reachable from every page', async ({ page }) => {
  for (const path of ['/tickets', '/tickets/1']) {
    await page.goto(path)
    const openButton = page.getByRole('button', { name: 'Registrera ärende', exact: true })
    await expect(openButton).toBeVisible()
    await openButton.click()
    await expect(page.getByRole('dialog', { name: 'Registrera ärende' })).toBeVisible()
  }
})
