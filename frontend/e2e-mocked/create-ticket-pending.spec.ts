import { expect, test, type Request } from '@playwright/test'
import type { Ticket } from '../src/types/ticket.ts'

// AK-12: a slow response cannot be produced on demand by the real stack. Against a fast real
// response the drawer closes before the second click, so the test would pass without the guard.

const ticket: Ticket = {
  id: 1,
  ticketNumber: 'SR-2026-1001',
  title: 'Paketet har inte kommit',
  description: 'Beställde för två veckor sedan.',
  category: 'Invoices',
  priority: 'Medium',
  status: 'New',
  customerName: 'Anna Andersson',
  customerEmail: 'anna@example.com',
  createdAt: '2026-11-09T09:30:00Z',
}

test('AK-12: saving again while a save is in progress sends no new request', async ({ page }) => {
  let respond!: () => void
  const responseAllowed = new Promise<void>((resolve) => (respond = resolve))
  await page.route('**/api/tickets', async (route) => {
    if (route.request().method() !== 'POST') return route.fallback()
    await responseAllowed
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify(ticket),
    })
  })

  await page.goto('/tickets')
  const openButton = page.getByRole('button', { name: 'Registrera ärende', exact: true })
  await expect(openButton).toBeVisible()
  await openButton.click()
  const dialog = page.getByRole('dialog', { name: 'Registrera ärende' })
  await dialog.getByRole('textbox', { name: 'Rubrik' }).fill(ticket.title)
  await dialog.getByRole('textbox', { name: 'Beskrivning' }).fill(ticket.description)
  await dialog.getByRole('combobox', { name: 'Kategori' }).selectOption(ticket.category)
  await dialog.getByRole('textbox', { name: 'Namn' }).fill(ticket.customerName)
  await dialog.getByRole('textbox', { name: 'E-postadress' }).fill(ticket.customerEmail)
  const saveButton = dialog.getByRole('button', { name: 'Spara ärende' })

  const isCreate = (r: Request) =>
    r.method() === 'POST' && new URL(r.url()).pathname === '/api/tickets'
  const firstRequest = page.waitForRequest(isCreate)
  await saveButton.click()
  await firstRequest
  // Waiting for something not to happen: give a second request one second to show up.
  const secondRequestSent = page.waitForRequest(isCreate, { timeout: 1_000 }).then(
    () => true,
    () => false,
  )

  await saveButton.click()

  expect(await secondRequestSent).toBe(false)
  respond()
  await expect(dialog).toBeHidden()
})
