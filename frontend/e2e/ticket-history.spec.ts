import { expect, test, type APIRequestContext, type Page } from '@playwright/test'
import { formatCreatedAt } from '../src/features/ticket-detail/formatCreatedAt.ts'
import type { CreateTicketInput, Ticket } from '../src/types/ticket.ts'

// User flows for "Ärendehistorik i detaljvyn" (docs/specs/ärendehistorik-presentation-detaljvy.md),
// against the full stack. Each test creates its own ticket through the API.

const TIME_ZONE = 'Europe/Stockholm'
test.use({ timezoneId: TIME_ZONE })

const uniqueTitle = () => `History E2E ${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

async function createTicket(request: APIRequestContext): Promise<Ticket> {
  const input: CreateTicketInput = {
    title: uniqueTitle(),
    description: 'Varan var trasig när den kom.',
    category: 'ReturnsComplaints',
    priority: 'High',
    customerName: 'Anna Andersson',
    customerEmail: 'anna@example.com',
  }
  const response = await request.post('/api/tickets', { data: input })
  expect(response.status()).toBe(201)
  return (await response.json()) as Ticket
}

const isHistoryGet = (method: string, url: string) =>
  method === 'GET' && /^\/api\/tickets\/\d+\/history$/.test(new URL(url).pathname)

function recordHistoryRequests(page: Page) {
  const requests: string[] = []
  page.on('request', (request) => {
    if (isHistoryGet(request.method(), request.url())) requests.push(request.url())
  })
  return requests
}

const main = (page: Page) => page.getByRole('main')
const history = (page: Page) => main(page).getByRole('region', { name: 'Historik' })
const statusSelect = (page: Page) => main(page).getByRole('combobox', { name: 'Status' })

async function openTicket(page: Page, ticket: Ticket) {
  await page.goto('/tickets')
  await main(page).getByRole('button', { name: `${ticket.ticketNumber}: ${ticket.title}` }).click()
  await expect(main(page).getByRole('heading', { level: 3, name: ticket.title })).toBeVisible()
}

test('AK-6: the registered event is shown with its normalized datetime', async ({ page, request }) => {
  const ticket = await createTicket(request)

  await openTicket(page, ticket)

  const section = history(page)
  await expect(section.getByRole('heading', { level: 2, name: 'Historik' })).toBeVisible()
  await expect(section.getByRole('listitem')).toContainText('Ärendet registrerades')
  const time = section.locator('time')
  await expect(time).toHaveText(formatCreatedAt(ticket.createdAt, TIME_ZONE))
  await expect(time).toHaveAttribute('datetime', new Date(ticket.createdAt).toISOString())
})

test('AK-20: the homepage selected-ticket panel includes status and history', async ({
  page,
  request,
}) => {
  const ticket = await createTicket(request)

  await page.goto('/tickets')
  await main(page)
    .getByRole('button', { name: `${ticket.ticketNumber}: ${ticket.title}` })
    .click()

  await expect(main(page).getByRole('combobox', { name: 'Status' })).toHaveValue(ticket.status)
  await expect(history(page).getByRole('listitem')).toContainText('Ärendet registrerades')
})

test('D-1: an unknown legacy ticket URL redirects to the list', async ({ page }) => {
  await page.goto('/tickets/2147483647')

  await expect(page).toHaveURL(/\/tickets$/)
  await expect(main(page).getByRole('heading', { name: 'Ärenden', exact: true })).toBeVisible()
})

test('D-6: saving a status does not fetch the history again', async ({ page, request }) => {
  const ticket = await createTicket(request)
  const historyRequests = recordHistoryRequests(page)

  await openTicket(page, ticket)
  await expect(history(page).getByRole('listitem')).toContainText('Ärendet registrerades')
  await statusSelect(page).selectOption('Closed')
  await main(page).getByRole('button', { name: 'Spara status' }).click()
  await expect(main(page).getByRole('status').filter({ hasText: 'Status ändrad' })).toHaveText(
    'Status ändrad till Avslutat',
  )

  expect(historyRequests).toHaveLength(1)
})