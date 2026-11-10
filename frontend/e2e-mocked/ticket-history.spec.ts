import { expect, test, type Page, type Route } from '@playwright/test'
import type { ProblemDetails } from '../src/api/client.ts'
import type { Ticket, TicketHistoryEvent } from '../src/types/ticket.ts'

// AK-7 and AK-10 to AK-12 for "Ärendehistorik i detaljvyn"
// (docs/specs/ärendehistorik-presentation-detaljvy.md). The ticket and history APIs are mocked.

const ticket: Ticket = {
  id: 42,
  ticketNumber: 'SR-2026-1042',
  title: 'Paketet har inte kommit',
  description: 'Beställde för två veckor sedan.',
  category: 'OrdersDeliveries',
  priority: 'Medium',
  status: 'InProgress',
  customerName: 'Anna Andersson',
  customerEmail: 'anna@example.com',
  createdAt: '2026-11-10T13:30:00Z',
}

const historyFailed = 'Historiken kunde inte hämtas. Försök igen.'

async function mockTicketApi(page: Page, handleHistory: (route: Route) => Promise<void>) {
  await page.route(`**/api/tickets/${ticket.id}`, (route) =>
    route.request().method() === 'GET'
      ? route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(ticket),
        })
      : route.fallback(),
  )
  await page.route(`**/api/tickets/${ticket.id}/history`, (route) =>
    route.request().method() === 'GET' ? handleHistory(route) : route.fallback(),
  )
  await page.route(`**/api/tickets/${ticket.id}/status`, (route) =>
    route.request().method() === 'PUT'
      ? route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ...ticket, status: 'Closed' }),
        })
      : route.fallback(),
  )
}

const main = (page: Page) => page.getByRole('main')
const history = (page: Page) => main(page).getByRole('region', { name: 'Historik' })

async function openTicket(page: Page) {
  await page.goto(`/tickets/${ticket.id}`)
  await expect(main(page).getByRole('heading', { level: 1, name: ticket.title })).toBeVisible()
}

async function expectTicketAndStatusForm(page: Page) {
  await expect(main(page).getByRole('heading', { level: 1, name: ticket.title })).toBeVisible()
  const status = main(page).getByRole('combobox', { name: 'Status' })
  await expect(status).toBeVisible()
  await status.selectOption('Closed')
  await main(page).getByRole('button', { name: 'Spara status' }).click()
  await expect(main(page).getByRole('status').filter({ hasText: 'Status ändrad' })).toHaveText(
    'Status ändrad till Avslutat',
  )
}

test('AK-7: a server error announces a history error and leaves ticket actions working', async ({
  page,
}) => {
  const problem: ProblemDetails = {
    type: 'https://tools.ietf.org/html/rfc9110#section-15.6.1',
    title: 'An error occurred while processing your request.',
    status: 500,
  }
  await mockTicketApi(page, (route) =>
    route.fulfill({
      status: 500,
      contentType: 'application/problem+json',
      body: JSON.stringify(problem),
    }),
  )

  await openTicket(page)

  await expect(history(page).getByRole('alert')).toHaveText(historyFailed)
  await expectTicketAndStatusForm(page)
})

test('AK-7: a network error announces a history error and leaves ticket actions working', async ({
  page,
}) => {
  await mockTicketApi(page, (route) => route.abort('failed'))

  await openTicket(page)

  await expect(history(page).getByRole('alert')).toHaveText(historyFailed)
  await expectTicketAndStatusForm(page)
})

test('D-5: a 404 shows the same history error', async ({ page }) => {
  const problem: ProblemDetails = {
    type: 'https://tools.ietf.org/html/rfc9110#section-15.5.5',
    title: 'Not Found',
    status: 404,
  }
  await mockTicketApi(page, (route) =>
    route.fulfill({
      status: 404,
      contentType: 'application/problem+json',
      body: JSON.stringify(problem),
    }),
  )

  await openTicket(page)

  await expect(history(page).getByRole('alert')).toHaveText(historyFailed)
})

test('AK-10: empty history shows the empty state without a list', async ({ page }) => {
  const events: TicketHistoryEvent[] = []
  await mockTicketApi(page, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(events) }),
  )

  await openTicket(page)

  await expect(history(page).getByText('Det finns inga händelser för ärendet.')).toBeVisible()
  await expect(history(page).getByRole('list')).toHaveCount(0)
})

test('AK-11: a pending history response shows loading while the ticket is available', async ({
  page,
}) => {
  let respond!: () => void
  const responseAllowed = new Promise<void>((resolve) => (respond = resolve))
  const events: TicketHistoryEvent[] = [
    { type: 'Created', occurredAt: '2026-11-10T13:30:00Z' },
  ]
  await mockTicketApi(page, async (route) => {
    await responseAllowed
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(events),
    })
  })

  await page.goto(`/tickets/${ticket.id}`)

  await expect(main(page).getByRole('heading', { level: 1, name: ticket.title })).toBeVisible()
  await expect(history(page).getByRole('status')).toHaveText('Laddar historik…')
  respond()
  await expect(history(page).getByRole('listitem')).toContainText('Ärendet registrerades')
  await expect(history(page).getByText('Laddar historik…')).toHaveCount(0)
})

test('AK-12: unknown event types are filtered while known events remain', async ({ page }) => {
  const events: TicketHistoryEvent[] = [
    { type: 'CustomerReplied', occurredAt: '2026-11-10T13:31:00Z' },
    { type: 'Created', occurredAt: '2026-11-10T13:30:00Z' },
  ]
  await mockTicketApi(page, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(events) }),
  )

  await openTicket(page)

  await expect(history(page).getByRole('list')).toHaveCount(1)
  await expect(history(page).getByRole('listitem')).toHaveCount(1)
  await expect(history(page).getByRole('listitem')).toContainText('Ärendet registrerades')
  await expect(history(page).getByText('CustomerReplied')).toHaveCount(0)
})