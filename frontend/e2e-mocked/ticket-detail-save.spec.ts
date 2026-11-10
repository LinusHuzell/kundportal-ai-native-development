import { expect, test, type Page, type Request, type Route } from '@playwright/test'
import type { ProblemDetails } from '../src/api/client.ts'
import type { Ticket } from '../src/types/ticket.ts'

// AK-11 and AK-12: a slow response, a server error and a network failure cannot be produced on
// demand by the real stack, so the ticket API is mocked here. The mocked suite has no backend,
// so GET /api/tickets/42 is mocked as well.

const ticket: Ticket = {
  id: 42,
  title: 'Paketet har inte kommit',
  description: 'Beställde för två veckor sedan.',
  category: 'OrdersDeliveries',
  priority: 'Medium',
  status: 'InProgress',
  customerName: 'Anna Andersson',
  customerEmail: 'anna@example.com',
  createdAt: '2026-11-10T13:30:00Z',
}

const SAVE_FAILED = 'Statusen kunde inte sparas. Försök igen.'

async function mockTicketApi(page: Page, handleStatusUpdate: (route: Route) => Promise<void>) {
  await page.route(`**/api/tickets/${ticket.id}`, (route) =>
    route.request().method() === 'GET'
      ? route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(ticket),
        })
      : route.fallback(),
  )
  await page.route(`**/api/tickets/${ticket.id}/status`, (route) =>
    route.request().method() === 'PUT' ? handleStatusUpdate(route) : route.fallback(),
  )
}

const main = (page: Page) => page.getByRole('main')
const statusSelect = (page: Page) => main(page).getByRole('combobox', { name: 'Status' })

async function openTicketAndChoose(page: Page, label: string) {
  await page.goto(`/tickets/${ticket.id}`)
  await expect(main(page).getByRole('heading', { level: 1, name: ticket.title })).toBeVisible()
  await statusSelect(page).selectOption({ label })
}

const isStatusUpdate = (r: Request) =>
  r.method() === 'PUT' && new URL(r.url()).pathname === `/api/tickets/${ticket.id}/status`

test('AK-11: saving again while a save is in progress sends no new request', async ({ page }) => {
  let respond!: () => void
  const responseAllowed = new Promise<void>((resolve) => (respond = resolve))
  await mockTicketApi(page, async (route) => {
    await responseAllowed
    const updated: Ticket = { ...ticket, status: 'Closed' }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(updated),
    })
  })
  await openTicketAndChoose(page, 'Avslutat')

  const firstRequest = page.waitForRequest(isStatusUpdate)
  await main(page).getByRole('button', { name: 'Spara status' }).click()
  await firstRequest
  const savingButton = main(page).getByRole('button', { name: 'Sparar…' })
  await expect(savingButton).toBeDisabled()
  await expect(savingButton).toBeFocused()
  // Waiting for something not to happen: give a second request one second to show up.
  const secondRequestSent = page.waitForRequest(isStatusUpdate, { timeout: 1_000 }).then(
    () => true,
    () => false,
  )

  // The button keeps focus while saving, so Enter submits the form again unless the app stops it.
  await page.keyboard.press('Enter')

  expect(await secondRequestSent).toBe(false)
  respond()
  await expect(main(page).getByRole('status').filter({ hasText: 'Status ändrad' })).toHaveText(
    'Status ändrad till Avslutat',
  )
})

async function expectSaveFailed(page: Page) {
  await expect(main(page).getByRole('alert').filter({ hasText: SAVE_FAILED })).toHaveText(
    SAVE_FAILED,
  )
  await expect(statusSelect(page)).toHaveValue('Closed')
  await expect(
    main(page)
      .getByRole('term')
      .filter({ hasText: /^Status$/ })
      .locator('+ dd'),
  ).toHaveText('Pågående')
}

test('AK-12: a server error is announced and keeps the chosen and the saved status', async ({
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
  await openTicketAndChoose(page, 'Avslutat')

  await main(page).getByRole('button', { name: 'Spara status' }).click()

  await expectSaveFailed(page)
})

test('AK-12: a network failure is announced and keeps the chosen and the saved status', async ({
  page,
}) => {
  await mockTicketApi(page, (route) => route.abort('failed'))
  await openTicketAndChoose(page, 'Avslutat')

  await main(page).getByRole('button', { name: 'Spara status' }).click()

  await expectSaveFailed(page)
})
