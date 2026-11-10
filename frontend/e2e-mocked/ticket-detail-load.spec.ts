import { expect, test, type Page, type Route } from '@playwright/test'
import type { ProblemDetails } from '../src/api/client.ts'
import type { Ticket } from '../src/types/ticket.ts'

// AK-4 and AK-5: a slow response, a server error and a network failure cannot be produced on
// demand by the real stack, so GET /api/tickets is mocked here.

const ticket: Ticket = {
  id: 42,
  ticketNumber: 'SR-2026-1042',
  title: 'Paketet har inte kommit',
  description: 'Beställde för två veckor sedan.',
  category: 'OrdersDeliveries',
  priority: 'Medium',
  status: 'New',
  customerName: 'Anna Andersson',
  customerEmail: 'anna@example.com',
  createdAt: '2026-11-10T13:30:00Z',
}

const LOAD_FAILED = 'Kunde inte hämta ärenden. Försök igen.'

async function mockListTickets(page: Page, handler: (route: Route) => Promise<void>) {
  await page.route('**/api/tickets', (route) =>
    route.request().method() === 'GET' ? handler(route) : route.fallback(),
  )
  await page.route(`**/api/tickets/${ticket.id}`, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(ticket),
    }),
  )
  await page.route(`**/api/tickets/${ticket.id}/history`, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) }),
  )
}

const main = (page: Page) => page.getByRole('main')

test('AK-22: the ticket list shows the total number of tickets', async ({ page }) => {
  await mockListTickets(page, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([ticket]),
    }),
  )

  await page.goto('/tickets')

  await expect(main(page).getByRole('heading', { name: 'Alla ärenden (1)' })).toBeVisible()
})

test('AK-4: Laddar ärenden… is announced while the ticket list is loading', async ({ page }) => {
  let respond!: () => void
  const responseAllowed = new Promise<void>((resolve) => (respond = resolve))
  await mockListTickets(page, async (route) => {
    await responseAllowed
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([ticket]),
    })
  })

  await page.goto('/tickets')

  await expect(main(page).getByRole('status').filter({ hasText: 'Laddar ärenden…' })).toHaveText(
    'Laddar ärenden…',
  )
  respond()
  await expect(main(page).getByRole('heading', { level: 1, name: 'Ärenden' })).toBeVisible()
  await expect(
    main(page).getByRole('button', { name: `${ticket.ticketNumber}: ${ticket.title}` }),
  ).toBeVisible()
  await expect(main(page).getByText('VALT ÄRENDE')).toBeVisible()
  await expect(main(page).getByRole('heading', { name: 'Ärendedetaljer' })).toBeVisible()
  await expect(main(page).getByText('Laddar ärenden…')).toHaveCount(0)
})

test('AK-5: a server error is announced when the ticket list cannot be loaded', async ({ page }) => {
  const problem: ProblemDetails = {
    type: 'https://tools.ietf.org/html/rfc9110#section-15.6.1',
    title: 'An error occurred while processing your request.',
    status: 500,
  }
  await mockListTickets(page, (route) =>
    route.fulfill({
      status: 500,
      contentType: 'application/problem+json',
      body: JSON.stringify(problem),
    }),
  )

  await page.goto('/tickets')

  await expect(main(page).getByRole('alert')).toHaveText(LOAD_FAILED)
  await expect(main(page).getByRole('heading', { level: 1, name: 'Ärenden' })).toBeVisible()
})

test('AK-22: an empty ticket list shows a zero count', async ({ page }) => {
  await mockListTickets(page, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    }),
  )

  await page.goto('/tickets')

  await expect(main(page).getByRole('heading', { name: 'Alla ärenden (0)' })).toBeVisible()
  await expect(main(page).getByText('Inga ärenden hittades.')).toBeVisible()
})

test('AK-5: a network failure is announced when the ticket list cannot be loaded', async ({ page }) => {
  await mockListTickets(page, (route) => route.abort('failed'))

  await page.goto('/tickets')

  await expect(main(page).getByRole('alert')).toHaveText(LOAD_FAILED)
  await expect(main(page).getByRole('heading', { level: 1, name: 'Ärenden' })).toBeVisible()
})

test('AK-21: a ticket detail failure is announced while the list remains available', async ({
  page,
}) => {
  await page.route('**/api/tickets', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([ticket]),
    }),
  )
  await page.route(`**/api/tickets/${ticket.id}`, (route) =>
    route.fulfill({
      status: 500,
      contentType: 'application/problem+json',
      body: JSON.stringify({ status: 500, title: 'Server error' }),
    }),
  )

  await page.goto('/tickets')

  await expect(main(page).getByRole('alert')).toHaveText('Ärendedetaljerna är inte tillgängliga.')
  await expect(
    main(page).getByRole('button', { name: `${ticket.ticketNumber}: ${ticket.title}` }),
  ).toBeVisible()
})
