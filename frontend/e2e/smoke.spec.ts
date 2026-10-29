import { expect, test } from '@playwright/test'

test('app shell renders and redirects / to the ticket list', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL(/\/tickets$/)
  await expect(page.getByRole('link', { name: 'Kundserviceportal' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Serviceärenden' })).toBeVisible()
})

test('navigation reaches the new ticket page', async ({ page }) => {
  await page.goto('/tickets')
  await page.getByRole('link', { name: 'Nytt ärende' }).click()
  await expect(page).toHaveURL(/\/tickets\/new$/)
  await expect(page.getByRole('heading', { name: 'Nytt ärende' })).toBeVisible()
})
