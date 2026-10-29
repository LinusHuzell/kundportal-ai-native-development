import { expect, test } from '@playwright/test'

type Ticket = {
  id: number
  title: string
  priority: string
  status: string
  createdAt: string
}

const sampleTickets: Ticket[] = [
  {
    id: 42,
    title: 'Site access lift inspection',
    priority: 'High',
    status: 'InProgress',
    createdAt: '2026-10-28T08:30:00Z',
  },
  {
    id: 41,
    title: 'Missing fasteners in delivery',
    priority: 'Medium',
    status: 'New',
    createdAt: '2026-10-27T14:15:00Z',
  },
]

test('ticket list renders all returned tickets and required fields', async ({ page }) => {
  await page.route('**/api/tickets', (route) => route.fulfill({ json: sampleTickets }))

  await page.goto('/tickets')

  const rows = page.getByRole('listitem')
  await expect(rows).toHaveCount(sampleTickets.length)
  await expect(rows.nth(0).getByText('Ärende #42')).toBeVisible()
  await expect(rows.nth(0).getByRole('heading', { name: 'Site access lift inspection' })).toBeVisible()
  await expect(rows.nth(0).getByText('Hög', { exact: true })).toBeVisible()
  await expect(rows.nth(0).getByText('Pågår')).toBeVisible()
  await expect(rows.nth(0).locator('time')).toHaveAttribute('datetime', sampleTickets[0].createdAt)
  await expect(rows.nth(1).getByText('Ärende #41')).toBeVisible()
  await expect(page.getByRole('region', { name: 'Ärendestatistik' })).toContainText('2')
})

test('ticket list shows loading while the request is pending', async ({ page }) => {
  let finishRequest!: () => void
  const requestGate = new Promise<void>((resolve) => {
    finishRequest = resolve
  })

  await page.route('**/api/tickets', async (route) => {
    await requestGate
    await route.fulfill({ json: [] })
  })

  await page.goto('/tickets')
  await expect(page.getByRole('status')).toHaveText('Hämtar ärenden...')

  finishRequest()
  await expect(page.getByText('Inga ärenden att visa.')).toBeVisible()
})

test('ticket list shows an empty state', async ({ page }) => {
  await page.route('**/api/tickets', (route) => route.fulfill({ json: [] }))

  await page.goto('/tickets')

  await expect(page.getByText('Inga ärenden att visa.')).toBeVisible()
})

test('ticket list shows an error state and retry action', async ({ page }) => {
  await page.route('**/api/tickets', (route) => route.fulfill({ status: 503, json: { title: 'Unavailable' } }))

  await page.goto('/tickets')

  await expect(page.getByRole('alert')).toContainText('HTTP 503')
  await expect(page.getByRole('button', { name: 'Försök igen' })).toBeVisible()
})

test('ticket list displays all API tickets in newest-first order', async ({ page, request }) => {
  const response = await request.get('/api/tickets')
  expect(response.ok()).toBeTruthy()

  const tickets = (await response.json()) as Ticket[]
  expect(tickets.length).toBeGreaterThanOrEqual(5)

  const sortedTickets = [...tickets].sort(
    (left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt) || right.id - left.id,
  )
  expect(tickets.map((ticket) => ticket.id)).toEqual(sortedTickets.map((ticket) => ticket.id))

  await page.goto('/tickets')
  const rows = page.getByRole('listitem')
  await expect(rows).toHaveCount(tickets.length)

  for (const [index, ticket] of tickets.entries()) {
    const row = rows.nth(index)
    await expect(row.getByText(`Ärende #${ticket.id}`)).toBeVisible()
    await expect(row.getByRole('heading', { name: ticket.title })).toBeVisible()
    await expect(row.getByText(ticket.priority === 'High' ? 'Hög' : ticket.priority === 'Medium' ? 'Medel' : 'Låg', { exact: true })).toBeVisible()
    await expect(row.getByText(ticket.status === 'InProgress'
      ? 'Pågår'
      : ticket.status === 'WaitingForCustomer'
        ? 'Väntar på kund'
        : ticket.status === 'New' ? 'Nytt' : 'Stängt', { exact: true })).toBeVisible()
    await expect(row.locator('time')).toHaveAttribute('datetime', ticket.createdAt)
  }
})