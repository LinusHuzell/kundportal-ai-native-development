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

const ticketsInApiOrder: Ticket[] = [
  { id: 7, title: 'Invoice copy request', priority: 'Low', status: 'Closed', createdAt: '2026-10-28T09:00:00Z' },
  { id: 9, title: 'Damaged pallet on arrival', priority: 'Medium', status: 'WaitingForCustomer', createdAt: '2026-10-28T09:00:00Z' },
  { id: 3, title: 'Return of unused cable', priority: 'High', status: 'New', createdAt: '2026-10-26T13:45:00Z' },
  { id: 5, title: 'Crane booking change', priority: 'Medium', status: 'InProgress', createdAt: '2026-10-25T07:10:00Z' },
]

const expectedLabels: Record<number, { priority: string; status: string }> = {
  7: { priority: 'Låg', status: 'Stängt' },
  9: { priority: 'Medel', status: 'Väntar på kund' },
  3: { priority: 'Hög', status: 'Nytt' },
  5: { priority: 'Medel', status: 'Pågår' },
}

test('ticket list keeps API order and shows Swedish labels for every status and priority', async ({ page }) => {
  await page.route('**/api/tickets', (route) => route.fulfill({ json: ticketsInApiOrder }))

  await page.goto('/tickets')

  const rows = page.getByRole('listitem')
  await expect(rows).toHaveCount(ticketsInApiOrder.length)

  for (const [index, ticket] of ticketsInApiOrder.entries()) {
    const row = rows.nth(index)
    await expect(row.getByText(`Ärende #${ticket.id}`)).toBeVisible()
    await expect(row.getByRole('heading', { name: ticket.title })).toBeVisible()
    await expect(row.getByText(expectedLabels[ticket.id].priority, { exact: true })).toBeVisible()
    await expect(row.getByText(expectedLabels[ticket.id].status, { exact: true })).toBeVisible()
    await expect(row.locator('time')).toHaveAttribute('datetime', ticket.createdAt)
  }
})