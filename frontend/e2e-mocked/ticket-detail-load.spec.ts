import { expect, test, type Page, type Route } from '@playwright/test'
import type { ProblemDetails } from '../src/api/client.ts'
import type { Ticket } from '../src/types/ticket.ts'

// AK-4 and AK-5: a slow response, a server error and a network failure cannot be produced on
// demand by the real stack, so GET /api/tickets/42 is mocked here.

const ticket: Ticket = {
  id: 42,
  title: 'Paketet har inte kommit',
  description: 'Beställde för två veckor sedan.',
  category: 'OrdersDeliveries',
  priority: 'Medium',
  status: 'New',
  customerName: 'Anna Andersson',
  customerEmail: 'anna@example.com',
  createdAt: '2026-11-10T13:30:00Z',
}

const LOAD_FAILED = 'Ärendet kunde inte hämtas. Försök igen senare.'

async function mockGetTicket(page: Page, handler: (route: Route) => Promise<void>) {
  await page.route(`**/api/tickets/${ticket.id}`, (route) =>
    route.request().method() === 'GET' ? handler(route) : route.fallback(),
  )
}

const main = (page: Page) => page.getByRole('main')
const backLink = (page: Page) =>
  main(page).getByRole('link', { name: 'Tillbaka till ärendelistan' })

test('AK-4: Laddar ärende… is announced while the ticket is loading', async ({ page }) => {
  let respond!: () => void
  const responseAllowed = new Promise<void>((resolve) => (respond = resolve))
  await mockGetTicket(page, async (route) => {
    await responseAllowed
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(ticket),
    })
  })

  await page.goto(`/tickets/${ticket.id}`)

  await expect(main(page).getByRole('status')).toHaveText('Laddar ärende…')
  await expect(backLink(page)).toBeVisible()
  respond()
  await expect(main(page).getByRole('heading', { level: 1, name: ticket.title })).toBeVisible()
  await expect(main(page).getByText('Laddar ärende…')).toHaveCount(0)
})

test('AK-5: a server error is announced as Ärendet kunde inte hämtas', async ({ page }) => {
  const problem: ProblemDetails = {
    type: 'https://tools.ietf.org/html/rfc9110#section-15.6.1',
    title: 'An error occurred while processing your request.',
    status: 500,
  }
  await mockGetTicket(page, (route) =>
    route.fulfill({
      status: 500,
      contentType: 'application/problem+json',
      body: JSON.stringify(problem),
    }),
  )

  await page.goto(`/tickets/${ticket.id}`)

  await expect(main(page).getByRole('alert')).toHaveText(LOAD_FAILED)
  await expect(backLink(page)).toBeVisible()
})

test('AK-5: a network failure is announced as Ärendet kunde inte hämtas', async ({ page }) => {
  await mockGetTicket(page, (route) => route.abort('failed'))

  await page.goto(`/tickets/${ticket.id}`)

  await expect(main(page).getByRole('alert')).toHaveText(LOAD_FAILED)
  await expect(backLink(page)).toBeVisible()
})
