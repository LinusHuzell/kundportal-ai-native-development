import { expect, test, type APIRequestContext, type Page } from '@playwright/test'
import { formatCreatedAt } from '../src/features/ticket-detail/formatCreatedAt.ts'
import type { CreateTicketInput, Ticket, TicketStatus } from '../src/types/ticket.ts'

// User flows for "Visa ärende och ändra status" (docs/specs/visa-ärende-och-ändra-status.md),
// against the full stack. Each test creates its own ticket through the API.

// Skapad is shown in the browser's time zone, so fix it to compare with a known zone.
const TIME_ZONE = 'Europe/Stockholm'
test.use({ timezoneId: TIME_ZONE })

const uniqueTitle = () => `E2E ${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

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

async function setStatus(request: APIRequestContext, id: number, status: TicketStatus) {
  const response = await request.put(`/api/tickets/${id}/status`, { data: { status } })
  expect(response.status()).toBe(200)
}

const isStatusUpdate = (method: string, url: string) =>
  method === 'PUT' && /^\/api\/tickets\/\d+\/status$/.test(new URL(url).pathname)

function recordRequests(page: Page, matches: (method: string, url: string) => boolean) {
  const requests: string[] = []
  page.on('request', (request) => {
    if (matches(request.method(), request.url())) requests.push(request.url())
  })
  return requests
}

const main = (page: Page) => page.getByRole('main')
// The value of a detail is the <dd> right after its term in the <dl>.
const detail = (page: Page, label: string) =>
  main(page)
    .getByRole('term')
    .filter({ hasText: new RegExp(`^${label}$`) })
    .locator('+ dd')
const statusSelect = (page: Page) => main(page).getByRole('combobox', { name: 'Status' })
const saveButton = (page: Page) => main(page).getByRole('button', { name: 'Spara status' })

async function openTicket(page: Page, ticket: Ticket) {
  await page.goto('/tickets')
  await main(page).getByRole('button', { name: `${ticket.ticketNumber}: ${ticket.title}` }).click()
  await expect(main(page).getByRole('heading', { level: 3, name: ticket.title })).toBeVisible()
}

test('AK-1: the selected ticket shows its title and labeled details', async ({
  page,
  request,
}) => {
  const ticket = await createTicket(request)

  await openTicket(page, ticket)

  await expect(detail(page, 'Ärendenummer')).toHaveText(ticket.ticketNumber)
  await expect(detail(page, 'Status')).toHaveText('Nytt')
  await expect(detail(page, 'Prioritet')).toHaveText('Hög')
  await expect(detail(page, 'Kategori')).toHaveText('Returer/reklamation')
  await expect(detail(page, 'Skapad')).toHaveText(formatCreatedAt(ticket.createdAt, TIME_ZONE))
  await expect(detail(page, 'Namn')).toHaveText(ticket.customerName)
  await expect(detail(page, 'E-post')).toHaveText(ticket.customerEmail)
  await expect(detail(page, 'Beskrivning')).toHaveText(ticket.description)
})

test('AK-3: an unknown legacy ticket URL redirects to the list', async ({ page }) => {
  await page.goto('/tickets/2147483647')

  await expect(page).toHaveURL(/\/tickets$/)
  await expect(main(page).getByRole('heading', { name: 'Ärenden', exact: true })).toBeVisible()
})

const longCreatedAt = (createdAt: string) =>
  new Intl.DateTimeFormat('sv-SE', {
    dateStyle: 'long',
    timeStyle: 'long',
    timeZone: TIME_ZONE,
  }).format(new Date(createdAt))

test('AK-23: hovering the list date shows the full local timestamp and keeps the short date', async ({
  page,
  request,
}) => {
  const ticket = await createTicket(request)
  await page.goto('/tickets')
  const row = main(page).getByRole('button', { name: `${ticket.ticketNumber}: ${ticket.title}` })
  const shortDate = new Intl.DateTimeFormat('sv-SE', {
    dateStyle: 'medium',
    timeZone: TIME_ZONE,
  }).format(new Date(ticket.createdAt))
  const date = row.getByText(shortDate, { exact: true })
  const tooltip = row.getByRole('tooltip')

  await expect(tooltip).toBeHidden()
  await date.hover()

  await expect(tooltip).toBeVisible()
  await expect(tooltip).toHaveText(longCreatedAt(ticket.createdAt))
  await expect(date).toBeVisible()
  await tooltip.hover()
  await expect(tooltip).toBeVisible()
  await page.getByRole('heading', { name: 'Ärenden', exact: true }).hover()
  await expect(tooltip).toBeHidden()

  await page.setViewportSize({ width: 390, height: 844 })
  await date.hover()
  await expect(tooltip).toBeVisible()
  const rowBounds = await row.boundingBox()
  const tooltipBounds = await tooltip.boundingBox()
  expect(rowBounds).not.toBeNull()
  expect(tooltipBounds).not.toBeNull()
  expect(tooltipBounds!.x).toBeGreaterThanOrEqual(rowBounds!.x)
  expect(tooltipBounds!.x + tooltipBounds!.width).toBeLessThanOrEqual(
    rowBounds!.x + rowBounds!.width,
  )
})

test('AK-24: focusing the row shows and describes its full timestamp without another tab stop', async ({
  page,
  request,
}) => {
  const ticket = await createTicket(request)
  await page.goto('/tickets')
  const row = main(page).getByRole('button', { name: `${ticket.ticketNumber}: ${ticket.title}` })
  await row.focus()

  await expect(row.getByRole('tooltip')).toBeVisible()
  await expect(row).toHaveAccessibleDescription(longCreatedAt(ticket.createdAt))
  await page.keyboard.press('Tab')
  await expect(row).not.toBeFocused()
  await expect(row.getByRole('tooltip')).toBeHidden()
})

test('AK-25: Escape dismisses the timestamp without changing selection or focus', async ({
  page,
  request,
}) => {
  const ticket = await createTicket(request)
  await openTicket(page, ticket)
  const row = main(page).getByRole('button', { name: `${ticket.ticketNumber}: ${ticket.title}` })
  await row.focus()
  const tooltip = row.getByRole('tooltip')
  await expect(tooltip).toBeVisible()

  await page.keyboard.press('Escape')

  await expect(tooltip).toBeHidden()
  await expect(row).toBeFocused()
  await expect(row).toHaveAttribute('aria-pressed', 'true')
  await page.keyboard.press('Tab')
  await page.keyboard.press('Shift+Tab')
  await expect(row).toBeFocused()
  await expect(tooltip).toBeVisible()

  await page.keyboard.press('Tab')
  await row.getByText(new Intl.DateTimeFormat('sv-SE', {
    dateStyle: 'medium',
    timeZone: TIME_ZONE,
  }).format(new Date(ticket.createdAt)), { exact: true }).hover()
  await expect(tooltip).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(tooltip).toBeHidden()
  await expect(row).toHaveAttribute('aria-pressed', 'true')
})

test('AK-3: an invalid legacy ticket URL redirects without a ticket API request', async ({
  page,
}) => {
  const requests = recordRequests(
    page,
    (method, url) =>
      method === 'GET' && /^\/api\/tickets\/\d+$/.test(new URL(url).pathname),
  )

  await page.goto('/tickets/abc')

  await expect(page).toHaveURL(/\/tickets$/)
  await expect(main(page).getByRole('heading', { name: 'Ärenden', exact: true })).toBeVisible()
  expect(requests).toHaveLength(0)
})

test('AK-6: a legacy ticket URL selects the matching ticket on the list', async ({
  page,
  request,
}) => {
  const ticket = await createTicket(request)
  await page.goto(`/tickets/${ticket.id}`)

  await expect(page).toHaveURL(/\/tickets$/)
  await expect(main(page).getByRole('heading', { level: 3, name: ticket.title })).toBeVisible()
})

test('AK-6: an invalid legacy ticket URL leads to the list', async ({
  page,
}) => {
  await page.goto('/tickets/abc')

  await expect(page).toHaveURL(/\/tickets$/)
  await expect(main(page).getByRole('heading', { name: 'Ärenden', exact: true })).toBeVisible()
})

test('AK-6: selecting another ticket updates the panel without leaving the homepage', async ({
  page,
  request,
}) => {
  const firstTicket = await createTicket(request)
  const secondTicket = await createTicket(request)
  await openTicket(page, firstTicket)

  await main(page)
    .getByRole('button', { name: `${secondTicket.ticketNumber}: ${secondTicket.title}` })
    .click()

  await expect(page).toHaveURL(/\/tickets$/)
  await expect(
    main(page).getByRole('heading', { level: 3, name: secondTicket.title }),
  ).toBeVisible()
})

test('AK-7: a new ticket has Nytt selected, all four statuses and Nytt cannot be chosen', async ({
  page,
  request,
}) => {
  const ticket = await createTicket(request)

  await openTicket(page, ticket)

  const select = statusSelect(page)
  await expect(select).toHaveValue('New')
  await expect(select.getByRole('option')).toHaveText([
    'Nytt',
    'Pågående',
    'Väntar på kund',
    'Avslutat',
  ])
  await expect(select.getByRole('option', { name: 'Nytt' })).toBeDisabled()
})

test('AK-7: the ticket’s current status is selected', async ({ page, request }) => {
  const ticket = await createTicket(request)
  await setStatus(request, ticket.id, 'WaitingForCustomer')

  await openTicket(page, ticket)

  await expect(statusSelect(page)).toHaveValue('WaitingForCustomer')
})

test('AK-8: saving a new status updates the details, announces it and keeps focus on the button', async ({
  page,
  request,
}) => {
  const ticket = await createTicket(request)
  await openTicket(page, ticket)
  await statusSelect(page).selectOption({ label: 'Väntar på kund' })

  await saveButton(page).click()

  await expect(main(page).getByRole('status').filter({ hasText: 'Status ändrad' })).toHaveText(
    'Status ändrad till Väntar på kund',
  )
  await expect(detail(page, 'Status')).toHaveText('Väntar på kund')
  await expect(
    main(page).getByRole('button', { name: `${ticket.ticketNumber}: ${ticket.title}` }),
  ).toContainText('Väntar på kund')
  await expect(saveButton(page)).toBeFocused()
})

test('AK-9: the new status is still shown after a reload', async ({ page, request }) => {
  const ticket = await createTicket(request)
  await openTicket(page, ticket)
  await statusSelect(page).selectOption({ label: 'Avslutat' })
  const response = page.waitForResponse((r) => isStatusUpdate(r.request().method(), r.url()))
  await saveButton(page).click()
  expect((await response).status()).toBe(200)

  await page.reload()
  await main(page).getByRole('button', { name: `${ticket.ticketNumber}: ${ticket.title}` }).click()

  await expect(detail(page, 'Status')).toHaveText('Avslutat')
  await expect(statusSelect(page)).toHaveValue('Closed')
})

test('AK-10: saving with Nytt selected shows an error on the list, focuses it and sends nothing', async ({
  page,
  request,
}) => {
  const requests = recordRequests(page, isStatusUpdate)
  const ticket = await createTicket(request)
  await openTicket(page, ticket)

  await saveButton(page).click()

  const select = statusSelect(page)
  await expect(select).toHaveAttribute('aria-invalid', 'true')
  await expect(select).toHaveAccessibleDescription('Välj en ny status')
  await expect(select).toBeFocused()
  expect(requests).toHaveLength(0)
})
