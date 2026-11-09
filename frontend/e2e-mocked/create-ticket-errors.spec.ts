import { expect, test, type Locator, type Page, type Route } from '@playwright/test'
import type { ProblemDetails } from '../src/api/client.ts'

// AK-10: server errors and network failures cannot be produced on demand by the real stack,
// so POST /api/tickets is mocked here. Everything else goes to the dev server as usual.

const values = {
  title: 'Paketet har inte kommit',
  description: 'Beställde för två veckor sedan.',
  category: 'Invoices',
  priority: 'High',
  customerName: 'Anna Andersson',
  customerEmail: 'anna@example.com',
}

async function mockCreateTicket(page: Page, handler: (route: Route) => Promise<void>) {
  await page.route('**/api/tickets', (route) =>
    route.request().method() === 'POST' ? handler(route) : route.fallback(),
  )
}

async function openAndFillDrawer(page: Page) {
  await page.goto('/tickets')
  const openButton = page.getByRole('button', { name: 'Registrera ärende', exact: true })
  await expect(openButton).toBeVisible()
  await openButton.click()
  const dialog = page.getByRole('dialog', { name: 'Registrera ärende' })
  await dialog.getByRole('textbox', { name: 'Rubrik' }).fill(values.title)
  await dialog.getByRole('textbox', { name: 'Beskrivning' }).fill(values.description)
  await dialog.getByRole('combobox', { name: 'Kategori' }).selectOption(values.category)
  await dialog.getByRole('combobox', { name: 'Prioritet' }).selectOption(values.priority)
  await dialog.getByRole('textbox', { name: 'Namn' }).fill(values.customerName)
  await dialog.getByRole('textbox', { name: 'E-postadress' }).fill(values.customerEmail)
  return dialog
}

async function expectDrawerKeptWithError(dialog: Locator) {
  await expect(dialog.getByRole('alert')).toHaveText('Ärendet kunde inte sparas. Försök igen.')
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('textbox', { name: 'Rubrik' })).toHaveValue(values.title)
  await expect(dialog.getByRole('textbox', { name: 'Beskrivning' })).toHaveValue(values.description)
  await expect(dialog.getByRole('combobox', { name: 'Kategori' })).toHaveValue(values.category)
  await expect(dialog.getByRole('combobox', { name: 'Prioritet' })).toHaveValue(values.priority)
  await expect(dialog.getByRole('textbox', { name: 'Namn' })).toHaveValue(values.customerName)
  await expect(dialog.getByRole('textbox', { name: 'E-postadress' })).toHaveValue(
    values.customerEmail,
  )
}

test('AK-10: a server error keeps the drawer open with the values and an announced message', async ({
  page,
}) => {
  const problem: ProblemDetails = {
    type: 'https://tools.ietf.org/html/rfc9110#section-15.6.1',
    title: 'An error occurred while processing your request.',
    status: 500,
  }
  await mockCreateTicket(page, (route) =>
    route.fulfill({
      status: 500,
      contentType: 'application/problem+json',
      body: JSON.stringify(problem),
    }),
  )
  const dialog = await openAndFillDrawer(page)

  await dialog.getByRole('button', { name: 'Spara ärende' }).click()

  await expectDrawerKeptWithError(dialog)
})

test('AK-10: a network failure keeps the drawer open with the values and an announced message', async ({
  page,
}) => {
  await mockCreateTicket(page, (route) => route.abort('failed'))
  const dialog = await openAndFillDrawer(page)

  await dialog.getByRole('button', { name: 'Spara ärende' }).click()

  await expectDrawerKeptWithError(dialog)
})
