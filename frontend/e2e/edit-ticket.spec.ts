import { expect, test, type APIRequestContext, type Page } from '@playwright/test'
import type { CreateTicketInput, Ticket } from '../src/types/ticket.ts'

// User flows for "Redigera ärende" (docs/specs/redigera-ärende.md), against the full stack.
// Each test creates its own tickets through the API and only looks at them.

const CONFIRMATION = 'Ärendet har uppdaterats.'

const unique = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

async function createTicket(request: APIRequestContext): Promise<Ticket> {
  const input: CreateTicketInput = {
    title: `E2E redigera ${unique()}`,
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

async function readTicket(request: APIRequestContext, id: number): Promise<Ticket> {
  const response = await request.get(`/api/tickets/${id}`)
  expect(response.status()).toBe(200)
  return (await response.json()) as Ticket
}

/** Records every PATCH /api/tickets/{id} the page sends. */
function recordPatches(page: Page) {
  const patches: string[] = []
  page.on('request', (request) => {
    if (request.method() === 'PATCH' && /^\/api\/tickets\/\d+$/.test(new URL(request.url()).pathname))
      patches.push(request.url())
  })
  return patches
}

const main = (page: Page) => page.getByRole('main')
const panel = (page: Page) => page.getByRole('complementary', { name: 'Ärendedetaljer' })
const row = (page: Page, ticket: Pick<Ticket, 'ticketNumber' | 'title'>) =>
  main(page).getByRole('button', { name: `${ticket.ticketNumber}: ${ticket.title}`, exact: true })
const editButton = (page: Page) => panel(page).getByRole('button', { name: 'Redigera', exact: true })
const saveButton = (page: Page) =>
  panel(page).getByRole('button', { name: 'Spara ändringar', exact: true })
const cancelButton = (page: Page) => panel(page).getByRole('button', { name: 'Avbryt', exact: true })
const titleHeading = (page: Page, title: string) =>
  panel(page).getByRole('heading', { level: 3, name: title, exact: true })
const confirmation = (page: Page) =>
  page.getByRole('status').filter({ hasText: CONFIRMATION })
const dialog = (page: Page) => page.getByRole('dialog', { name: 'Osparade ändringar' })

const fields = (page: Page) => ({
  title: panel(page).getByRole('textbox', { name: 'Rubrik' }),
  description: panel(page).getByRole('textbox', { name: 'Beskrivning' }),
  category: panel(page).getByRole('combobox', { name: 'Kategori' }),
  priority: panel(page).getByRole('combobox', { name: 'Prioritet' }),
  customerName: panel(page).getByRole('textbox', { name: 'Namn' }),
  customerEmail: panel(page).getByRole('textbox', { name: 'E-postadress' }),
})

// The value of a read-only detail is the <dd> right after its term in the <dl>.
const detail = (page: Page, label: string) =>
  panel(page)
    .getByRole('term')
    .filter({ hasText: new RegExp(`^${label}$`) })
    .locator('+ dd')

async function openTicket(page: Page, ticket: Ticket) {
  await page.goto('/tickets')
  await row(page, ticket).click()
  await expect(titleHeading(page, ticket.title)).toBeVisible()
}

/** Opens the ticket and switches the panel to edit mode. */
async function startEditing(page: Page, ticket: Ticket) {
  await openTicket(page, ticket)
  await expect(editButton(page)).toBeVisible()
  await editButton(page).click()
  await expect(fields(page).title).toBeVisible()
}

/** With A in edit mode and changed, selects B and expects the dialog (AK-10). */
async function selectOtherAndExpectDialog(page: Page, other: Ticket) {
  await row(page, other).click()
  await expect(dialog(page)).toBeVisible()
  await expect(dialog(page)).toContainText('Du har ändringar som inte är sparade.')
}

test('AK-7: "Redigera" shows the six fields with the ticket\'s current values', async ({
  page,
  request,
}) => {
  const ticket = await createTicket(request)

  await startEditing(page, ticket)

  const f = fields(page)
  await expect(f.title).toHaveValue(ticket.title)
  await expect(f.description).toHaveValue(ticket.description)
  await expect(f.category).toHaveValue(ticket.category)
  await expect(f.priority).toHaveValue(ticket.priority)
  await expect(f.customerName).toHaveValue(ticket.customerName)
  await expect(f.customerEmail).toHaveValue(ticket.customerEmail)
  await expect(f.title).toBeFocused()
  await expect(editButton(page)).toBeHidden()
  await expect(panel(page).getByRole('heading', { name: 'Ändra status' })).toBeHidden()
  await expect(panel(page).getByRole('heading', { name: 'Historik' })).toBeVisible()
})

test('AK-1 and AK-9: a valid change is saved, shown in the panel and the list, and announced', async ({
  page,
  request,
}) => {
  const ticket = await createTicket(request)
  const newTitle = `E2E ändrad ${unique()}`
  await startEditing(page, ticket)

  await fields(page).title.fill(newTitle)
  await fields(page).priority.selectOption({ label: 'Låg' })
  await saveButton(page).click()

  await expect(titleHeading(page, newTitle)).toBeVisible()
  await expect(detail(page, 'Prioritet')).toHaveText('Låg')
  await expect(fields(page).title).toBeHidden()
  await expect(row(page, { ticketNumber: ticket.ticketNumber, title: newTitle })).toBeVisible()
  await expect(confirmation(page)).toBeVisible()
  await expect(editButton(page)).toBeFocused()
  const saved = await readTicket(request, ticket.id)
  expect(saved.title).toBe(newTitle)
  expect(saved.priority).toBe('Low')
})

test('AK-8: "Avbryt" saves nothing and returns focus to "Redigera"', async ({ page, request }) => {
  const ticket = await createTicket(request)
  const patches = recordPatches(page)
  await startEditing(page, ticket)

  await fields(page).title.fill(`E2E inte sparad ${unique()}`)
  await cancelButton(page).click()

  await expect(titleHeading(page, ticket.title)).toBeVisible()
  await expect(fields(page).title).toBeHidden()
  await expect(editButton(page)).toBeFocused()
  expect(patches).toEqual([])
  expect((await readTicket(request, ticket.id)).title).toBe(ticket.title)
})

test('AK-2 and AK-12: invalid values show the Felfall messages on the fields and save nothing', async ({
  page,
  request,
}) => {
  const ticket = await createTicket(request)
  const patches = recordPatches(page)
  await startEditing(page, ticket)
  const f = fields(page)

  await f.title.fill('')
  await f.customerEmail.fill('anna@example')
  await saveButton(page).click()

  await expect(f.title).toHaveAttribute('aria-invalid', 'true')
  await expect(f.title).toHaveAccessibleDescription('Rubrik måste fyllas i')
  await expect(f.customerEmail).toHaveAttribute('aria-invalid', 'true')
  await expect(f.customerEmail).toHaveAccessibleDescription('Ange en giltig e-postadress')
  await expect(f.description).not.toHaveAttribute('aria-invalid', 'true')
  await expect(f.title).toBeFocused()
  expect(patches).toEqual([])
  const saved = await readTicket(request, ticket.id)
  expect(saved.title).toBe(ticket.title)
  expect(saved.customerEmail).toBe(ticket.customerEmail)
})

test('AK-10 "Spara": the changes are saved and the newly selected ticket is shown', async ({
  page,
  request,
}) => {
  const a = await createTicket(request)
  const b = await createTicket(request)
  const newTitle = `E2E sparad via dialog ${unique()}`
  await startEditing(page, a)
  await fields(page).title.fill(newTitle)

  await selectOtherAndExpectDialog(page, b)
  await expect(dialog(page).getByRole('button', { name: 'Spara', exact: true })).toBeFocused()
  await dialog(page).getByRole('button', { name: 'Spara', exact: true }).click()

  await expect(dialog(page)).toBeHidden()
  await expect(titleHeading(page, b.title)).toBeVisible()
  await expect(editButton(page)).toBeVisible()
  await expect(row(page, b)).toHaveAttribute('aria-pressed', 'true')
  await expect(row(page, { ticketNumber: a.ticketNumber, title: newTitle })).toBeVisible()
  expect((await readTicket(request, a.id)).title).toBe(newTitle)
})

test('AK-10 "Spara" with an invalid value: the old ticket stays in edit mode with the error', async ({
  page,
  request,
}) => {
  const a = await createTicket(request)
  const b = await createTicket(request)
  await startEditing(page, a)
  await fields(page).title.fill('')

  await selectOtherAndExpectDialog(page, b)
  await dialog(page).getByRole('button', { name: 'Spara', exact: true }).click()

  await expect(dialog(page)).toBeHidden()
  await expect(fields(page).title).toHaveAccessibleDescription('Rubrik måste fyllas i')
  await expect(fields(page).title).toBeFocused()
  await expect(row(page, a)).toHaveAttribute('aria-pressed', 'true')
  await expect(row(page, b)).toHaveAttribute('aria-pressed', 'false')
  expect((await readTicket(request, a.id)).title).toBe(a.title)
})

test('AK-10 "Släng ändringar": nothing is saved and the newly selected ticket is shown', async ({
  page,
  request,
}) => {
  const a = await createTicket(request)
  const b = await createTicket(request)
  await startEditing(page, a)
  await fields(page).title.fill(`E2E slängd ${unique()}`)

  await selectOtherAndExpectDialog(page, b)
  await dialog(page).getByRole('button', { name: 'Släng ändringar', exact: true }).click()

  await expect(dialog(page)).toBeHidden()
  await expect(titleHeading(page, b.title)).toBeVisible()
  await expect(fields(page).title).toBeHidden()
  await expect(row(page, a)).toBeVisible()
  expect((await readTicket(request, a.id)).title).toBe(a.title)
})

test('AK-10 "Fortsätt redigera": the changes stay and focus returns to the field', async ({
  page,
  request,
}) => {
  const a = await createTicket(request)
  const b = await createTicket(request)
  const newDescription = `Ändrad beskrivning ${unique()}`
  await startEditing(page, a)
  await fields(page).description.fill(newDescription)

  await selectOtherAndExpectDialog(page, b)
  await dialog(page).getByRole('button', { name: 'Fortsätt redigera', exact: true }).click()

  await expect(dialog(page)).toBeHidden()
  await expect(fields(page).description).toHaveValue(newDescription)
  await expect(fields(page).description).toBeFocused()
  await expect(row(page, a)).toHaveAttribute('aria-pressed', 'true')
})

test('AK-10: Esc in the dialog means "Fortsätt redigera"', async ({ page, request }) => {
  const a = await createTicket(request)
  const b = await createTicket(request)
  const newDescription = `Ändrad beskrivning ${unique()}`
  await startEditing(page, a)
  await fields(page).description.fill(newDescription)

  await selectOtherAndExpectDialog(page, b)
  await page.keyboard.press('Escape')

  await expect(dialog(page)).toBeHidden()
  await expect(fields(page).description).toHaveValue(newDescription)
  await expect(fields(page).description).toBeFocused()
  await expect(row(page, a)).toHaveAttribute('aria-pressed', 'true')
})

test('AK-11: without changes, another ticket is shown directly without a dialog', async ({
  page,
  request,
}) => {
  const a = await createTicket(request)
  const b = await createTicket(request)
  await startEditing(page, a)

  await row(page, b).click()

  await expect(titleHeading(page, b.title)).toBeVisible()
  await expect(fields(page).title).toBeHidden()
  await expect(dialog(page)).toHaveCount(0)
})

test('AK-11: a value that is changed and restored counts as no change', async ({
  page,
  request,
}) => {
  const a = await createTicket(request)
  const b = await createTicket(request)
  await startEditing(page, a)
  await fields(page).title.fill(`E2E tillfällig ${unique()}`)
  await fields(page).title.fill(a.title)

  await row(page, b).click()

  await expect(titleHeading(page, b.title)).toBeVisible()
  await expect(dialog(page)).toHaveCount(0)
})
