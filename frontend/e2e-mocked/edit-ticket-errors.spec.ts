import { expect, test, type Page, type Request, type Route } from '@playwright/test'
import type { ProblemDetails } from '../src/api/client.ts'
import type { Ticket } from '../src/types/ticket.ts'

// "Redigera ärende" (docs/specs/redigera-ärende.md): a server error, a network failure and a slow
// response cannot be produced on demand by the real stack, so the ticket API is mocked here.

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

const NEW_TITLE = 'Paketet kom fram trasigt'
const SAVE_FAILED = 'Ärendet kunde inte sparas. Försök igen.'

const json = (body: unknown) => ({
  status: 200,
  contentType: 'application/json',
  body: JSON.stringify(body),
})

async function mockTicketApi(page: Page, handlePatch: (route: Route) => Promise<void>) {
  await page.route('**/api/tickets', (route) =>
    route.request().method() === 'GET' ? route.fulfill(json([ticket])) : route.fallback(),
  )
  await page.route(`**/api/tickets/${ticket.id}`, (route) => {
    const method = route.request().method()
    if (method === 'PATCH') return handlePatch(route)
    if (method === 'GET') return route.fulfill(json(ticket))
    return route.fallback()
  })
  await page.route(`**/api/tickets/${ticket.id}/history`, (route) => route.fulfill(json([])))
}

const isPatch = (r: Request) =>
  r.method() === 'PATCH' && new URL(r.url()).pathname === `/api/tickets/${ticket.id}`

const panel = (page: Page) => page.getByRole('complementary', { name: 'Ärendedetaljer' })
const titleField = (page: Page) => panel(page).getByRole('textbox', { name: 'Rubrik' })
const saveButton = (page: Page) =>
  panel(page).getByRole('button', { name: 'Spara ändringar', exact: true })

async function editTitle(page: Page) {
  await page.goto('/tickets')
  await page
    .getByRole('main')
    .getByRole('button', { name: `${ticket.ticketNumber}: ${ticket.title}`, exact: true })
    .click()
  const editButton = panel(page).getByRole('button', { name: 'Redigera', exact: true })
  await expect(editButton).toBeVisible()
  await editButton.click()
  await titleField(page).fill(NEW_TITLE)
}

async function expectKeptWithError(page: Page) {
  await expect(panel(page).getByRole('alert').filter({ hasText: SAVE_FAILED })).toBeVisible()
  await expect(titleField(page)).toHaveValue(NEW_TITLE)
  await expect(saveButton(page)).toBeVisible()
}

test('AK-1: a server error keeps the form with the values and an announced message', async ({
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
  await editTitle(page)

  await saveButton(page).click()

  await expectKeptWithError(page)
})

test('AK-1: a network failure keeps the form with the values and an announced message', async ({
  page,
}) => {
  await mockTicketApi(page, (route) => route.abort('failed'))
  await editTitle(page)

  await saveButton(page).click()

  await expectKeptWithError(page)
})

test('AK-13: saving again during a slow response sends one request, and "Avbryt" is disabled', async ({
  page,
}) => {
  let respond!: () => void
  const responseAllowed = new Promise<void>((resolve) => (respond = resolve))
  await mockTicketApi(page, async (route) => {
    await responseAllowed
    await route.fulfill(json({ ...ticket, title: NEW_TITLE } satisfies Ticket))
  })
  const patches: string[] = []
  page.on('request', (r) => {
    if (isPatch(r)) patches.push(r.url())
  })
  await editTitle(page)

  const firstRequest = page.waitForRequest(isPatch)
  await saveButton(page).click()
  await firstRequest
  await expect(panel(page).getByRole('button', { name: 'Avbryt', exact: true })).toBeDisabled()
  await saveButton(page).click()

  respond()
  await expect(
    page.getByRole('status').filter({ hasText: 'Ärendet har uppdaterats.' }),
  ).toBeVisible()
  expect(patches).toHaveLength(1)
})
