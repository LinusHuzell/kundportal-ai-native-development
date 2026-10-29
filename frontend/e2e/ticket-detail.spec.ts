import { expect, test } from '@playwright/test'

const ticket = {
  id: 42,
  title: 'Site access lift inspection',
  description: 'Arrange the scheduled lift inspection before the site handover.',
  category: 'Other',
  priority: 'High',
  status: 'New',
  customerName: 'Alex Contractor',
  customerEmail: 'alex.contractor@example.com',
  createdAt: '2026-10-28T08:30:00Z',
}

test('ticket list opens details and persists a status change through the API', async ({ page }) => {
  let currentTicket = { ...ticket }
  await page.route('**/api/tickets', (route) => route.fulfill({ json: [currentTicket] }))
  await page.route('**/api/tickets/42', (route) => route.fulfill({ json: currentTicket }))
  await page.route('**/api/tickets/42/status', async (route) => {
    const requestBody = route.request().postDataJSON() as { status: string }
    currentTicket = { ...currentTicket, status: requestBody.status }
    await route.fulfill({ json: currentTicket })
  })

  await page.goto('/tickets')
  await page.getByRole('link', { name: /Ärende #42/ }).click()

  await expect(page).toHaveURL(/\/tickets\/42$/)
  await expect(page.getByRole('heading', { name: ticket.title })).toBeVisible()
  await expect(page.getByText(ticket.description)).toBeVisible()
  await expect(page.getByText(ticket.customerEmail)).toBeVisible()

  await page.getByLabel('Status').selectOption('InProgress')
  await page.getByRole('button', { name: 'Spara status' }).click()

  await expect(page.getByRole('status')).toHaveText('Statusen har uppdaterats.')
  await expect(page.getByLabel('Status')).toHaveValue('InProgress')
  expect(currentTicket.status).toBe('InProgress')
})