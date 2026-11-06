import { expect, test } from '@playwright/test'
import type { Ticket } from '../src/types/ticket.js'

const tickets: Ticket[] = [
  {
    id: 2,
    ticketNumber: 'SR-NEWER',
    title: 'Newer ticket',
    description: 'Recent issue',
    category: 'Invoices',
    priority: 'High',
    status: 'InProgress',
    customerName: '',
    customerEmail: '',
    createdAt: '2026-11-01T10:00:00Z',
  },
  {
    id: 1,
    ticketNumber: 'SR-OLDER',
    title: 'Older ticket',
    description: 'Earlier issue',
    category: 'Other',
    priority: 'Low',
    status: 'New',
    customerName: '',
    customerEmail: '',
    createdAt: '2026-10-01T10:00:00Z',
  },
]

test('ticket list displays each ticket with its required information', async ({ page }) => {
  await page.route('**/api/tickets', (route) => route.fulfill({ json: tickets }))
  await page.goto('/tickets')

  await expect(page.getByRole('heading', { name: 'Tickets', exact: true })).toBeVisible()
  const cards = page.getByRole('article', { name: /SR-/ })
  await expect(cards).toHaveCount(2)
  await expect(cards.nth(0)).toContainText('SR-NEWER')
  await expect(cards.nth(0)).toContainText('Newer ticket')
  await expect(cards.nth(0)).toContainText('High')
  await expect(cards.nth(0)).toContainText('InProgress')
  await expect(cards.nth(0)).toContainText('1 Nov 2026')
  await expect(cards.nth(1)).toContainText('SR-OLDER')
})

test('ticket list shows a loading state while the request is pending', async ({ page }) => {
  await page.route('**/api/tickets', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 300))
    await route.fulfill({ json: tickets })
  })

  await page.goto('/tickets')

  await expect(page.getByRole('status')).toHaveText('Loading tickets...')
  await expect(page.getByRole('article', { name: /SR-/ })).toHaveCount(2)
})

test('ticket list shows an empty state when there are no tickets', async ({ page }) => {
  await page.route('**/api/tickets', (route) => route.fulfill({ json: [] }))
  await page.goto('/tickets')

  await expect(page.getByText('No tickets found.')).toBeVisible()
})

test('ticket list shows an error when the API returns a server error', async ({ page }) => {
  await page.route('**/api/tickets', (route) =>
    route.fulfill({
      status: 500,
      contentType: 'application/problem+json',
      body: JSON.stringify({ title: 'An error occurred', status: 500 }),
    }),
  )
  await page.goto('/tickets')

  await expect(page.getByRole('alert')).toHaveText('Tickets could not be loaded. Please try again.')
})
