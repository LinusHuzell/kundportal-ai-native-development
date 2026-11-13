import { expect, test, type APIRequestContext, type Page } from '@playwright/test'
import { formatCreatedAt } from '../src/features/ticket-detail/formatCreatedAt.ts'
import type {
  CreateTicketInput,
  Ticket,
  TicketHistoryEvent,
  TicketStatus,
} from '../src/types/ticket.ts'

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

async function changeStatus(request: APIRequestContext, ticket: Ticket, status: TicketStatus) {
  const response = await request.put(`/api/tickets/${ticket.id}/status`, { data: { status } })
  expect(response.status()).toBe(200)
}

async function getHistory(
  request: APIRequestContext,
  ticket: Ticket,
): Promise<TicketHistoryEvent[]> {
  const response = await request.get(`/api/tickets/${ticket.id}/history`)
  expect(response.status()).toBe(200)
  return (await response.json()) as TicketHistoryEvent[]
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

test('AK-1 (status changes): a status change shows both Swedish labels and its datetime', async ({
  page,
  request,
}) => {
  const ticket = await createTicket(request)
  await changeStatus(request, ticket, 'InProgress')
  const statusChanged = (await getHistory(request, ticket)).find(
    (event) => event.type === 'StatusChanged',
  )
  expect(statusChanged).toBeDefined()
  const occurredAt = statusChanged!.occurredAt

  await openTicket(page, ticket)

  const item = history(page)
    .getByRole('listitem')
    .filter({ hasText: 'Förändrad status: Nytt -> Pågående' })
  await expect(item).toHaveCount(1)
  const time = item.locator('time')
  await expect(time).toHaveText(formatCreatedAt(occurredAt, TIME_ZONE))
  await expect(time).toHaveAttribute('datetime', new Date(occurredAt).toISOString())
})

test('AK-2 (status changes): created and status-change events follow the API order', async ({
  page,
  request,
}) => {
  const ticket = await createTicket(request)
  await changeStatus(request, ticket, 'InProgress')
  await changeStatus(request, ticket, 'Closed')
  const expectedTypes = (await getHistory(request, ticket)).map((event) => event.type)
  expect(expectedTypes).toEqual(['StatusChanged', 'StatusChanged', 'Created'])

  await openTicket(page, ticket)

  await expect(history(page).getByRole('listitem')).toContainText([
    'Förändrad status: Pågående -> Avslutat',
    'Förändrad status: Nytt -> Pågående',
    'Ärendet registrerades',
  ])
})

test('AK-3 (status changes): saving another status refetches the history without reloading', async ({
  page,
  request,
}) => {
  const ticket = await createTicket(request)
  await openTicket(page, ticket)
  await expect(history(page).getByRole('listitem')).toContainText('Ärendet registrerades')
  const historyRequests = recordHistoryRequests(page)
  const url = page.url()
  await page.evaluate(() => {
    ;(globalThis as unknown as { noReload: boolean }).noReload = true
  })

  await statusSelect(page).selectOption('Closed')
  await main(page).getByRole('button', { name: 'Spara status' }).click()

  await expect(main(page).getByRole('status').filter({ hasText: 'Status ändrad' })).toHaveText(
    'Status ändrad till Avslutat',
  )
  await expect(history(page).getByRole('listitem')).toContainText([
    'Förändrad status: Nytt -> Avslutat',
    'Ärendet registrerades',
  ])
  expect(historyRequests).toHaveLength(1)
  expect(page.url()).toBe(url)
  expect(
    await page.evaluate(() => (globalThis as unknown as { noReload?: boolean }).noReload),
  ).toBe(true)
})

test('saving the same status again does not refetch the history', async ({ page, request }) => {
  const ticket = await createTicket(request)
  await changeStatus(request, ticket, 'Closed')
  await openTicket(page, ticket)
  await expect(history(page).getByRole('listitem')).toHaveCount(2)
  const historyRequests = recordHistoryRequests(page)

  await main(page).getByRole('button', { name: 'Spara status' }).click()

  await expect(main(page).getByRole('status').filter({ hasText: 'Status ändrad' })).toHaveText(
    'Status ändrad till Avslutat',
  )
  await expect(history(page).getByRole('listitem')).toHaveCount(2)
  expect(historyRequests).toHaveLength(0)
})