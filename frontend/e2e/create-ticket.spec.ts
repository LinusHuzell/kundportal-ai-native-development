import { expect, test, type Locator, type Page } from '@playwright/test'

// User flows for "Registrera ärende" (docs/specs/registrera-ärende.md), against the full stack.
// The GET endpoints are still stubs, so saves are checked on the POST response and
// "nothing is saved" is checked as "no POST was sent".

const uniqueTitle = () => `E2E ${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

const isCreateTicket = (method: string, url: string) =>
  method === 'POST' && new URL(url).pathname === '/api/tickets'

function recordCreateRequests(page: Page) {
  const requests: string[] = []
  page.on('request', (request) => {
    if (isCreateTicket(request.method(), request.url())) requests.push(request.url())
  })
  return requests
}

async function openDrawer(page: Page) {
  const openButton = page.getByRole('button', { name: 'Registrera ärende', exact: true })
  await expect(openButton).toBeVisible()
  await openButton.click()
  const dialog = page.getByRole('dialog', { name: 'Registrera ärende' })
  await expect(dialog).toBeVisible()
  return { openButton, dialog }
}

const fields = (dialog: Locator) => ({
  title: dialog.getByRole('textbox', { name: 'Rubrik' }),
  description: dialog.getByRole('textbox', { name: 'Beskrivning' }),
  category: dialog.getByRole('combobox', { name: 'Kategori' }),
  priority: dialog.getByRole('combobox', { name: 'Prioritet' }),
  customerName: dialog.getByRole('textbox', { name: 'Namn' }),
  customerEmail: dialog.getByRole('textbox', { name: 'E-postadress' }),
})

async function fillValidForm(dialog: Locator, title: string) {
  const f = fields(dialog)
  await f.title.fill(title)
  await f.description.fill('Beställde för två veckor sedan.')
  await f.category.selectOption({ label: 'Fakturor' })
  await f.customerName.fill('Anna Andersson')
  await f.customerEmail.fill('anna@example.com')
}

// The native dialog moves focus back on its own as soon as it closes, before the app has handled
// the close event. A focus check right after "hidden" could then pass even if the app later moves
// focus elsewhere. So wait until the app has removed the drawer. A closed <dialog> is already
// gone from the accessibility tree, so this looks for the element, not a role.
async function expectDrawerClosed(page: Page, dialog: Locator) {
  await expect(dialog).toBeHidden()
  await expect(page.locator('dialog')).toHaveCount(0)
}

const save = (dialog: Locator) => dialog.getByRole('button', { name: 'Spara ärende' }).click()

async function expectEmptyForm(dialog: Locator) {
  const f = fields(dialog)
  await expect(f.title).toHaveValue('')
  await expect(f.description).toHaveValue('')
  await expect(f.category).toHaveValue('')
  await expect(f.priority).toHaveValue('Medium')
  await expect(f.customerName).toHaveValue('')
  await expect(f.customerEmail).toHaveValue('')
}

test.beforeEach(async ({ page }) => {
  await page.goto('/tickets')
})

test('AK-7: Registrera ärende opens the form in a drawer over the ticket list', async ({
  page,
}) => {
  await openDrawer(page)

  await expect(page.getByRole('heading', { name: 'Ärenden', exact: true })).toBeVisible()
})

// Screen readers announce that the button opens a dialog before it is pressed.
test('AK-7: the Registrera ärende button says that it opens a dialog', async ({ page }) => {
  await expect(
    page.getByRole('button', { name: 'Registrera ärende', exact: true }),
  ).toHaveAttribute('aria-haspopup', 'dialog')
})

test('AK-2: priority starts as Medel and is saved as Medium', async ({ page }) => {
  const { dialog } = await openDrawer(page)
  const { priority } = fields(dialog)
  await expect(priority).toHaveValue('Medium')
  await expect(priority.getByRole('option', { name: 'Medel', selected: true })).toBeAttached()

  await fillValidForm(dialog, uniqueTitle())
  const response = page.waitForResponse((r) => isCreateTicket(r.request().method(), r.url()))
  await save(dialog)

  expect(await (await response).json()).toMatchObject({ priority: 'Medium' })
})

test('AK-3: each error is shown on its field and nothing is sent', async ({ page }) => {
  const requests = recordCreateRequests(page)
  const { dialog } = await openDrawer(page)
  const f = fields(dialog)

  await save(dialog)

  const expected: [Locator, string][] = [
    [f.title, 'Rubrik måste fyllas i'],
    [f.description, 'Beskrivning måste fyllas i'],
    [f.category, 'Välj en kategori'],
    [f.customerName, 'Namn måste fyllas i'],
    [f.customerEmail, 'E-postadress måste fyllas i'],
  ]
  for (const [field, message] of expected) {
    await expect(field).toHaveAttribute('aria-invalid', 'true')
    await expect(field).toHaveAccessibleDescription(message)
  }
  await expect(f.priority).not.toHaveAttribute('aria-invalid', 'true')
  expect(requests).toHaveLength(0)
})

test('AK-3: an email in the wrong format gets the format error', async ({ page }) => {
  const requests = recordCreateRequests(page)
  const { dialog } = await openDrawer(page)
  await fillValidForm(dialog, uniqueTitle())
  const { customerEmail } = fields(dialog)
  await customerEmail.fill('anna.example.com')

  await save(dialog)

  await expect(customerEmail).toHaveAttribute('aria-invalid', 'true')
  await expect(customerEmail).toHaveAccessibleDescription('Ange en giltig e-postadress')
  expect(requests).toHaveLength(0)
})

test('AK-11: focus moves to the first field with an error', async ({ page }) => {
  const { dialog } = await openDrawer(page)

  await save(dialog)

  await expect(fields(dialog).title).toBeFocused()
})

test('AK-11: focus skips valid fields to the first field with an error', async ({ page }) => {
  const { dialog } = await openDrawer(page)
  await fillValidForm(dialog, uniqueTitle())
  await fields(dialog).customerEmail.fill('anna@example')

  await save(dialog)

  await expect(fields(dialog).customerEmail).toBeFocused()
})

test('AK-8: Esc closes the drawer, sends nothing and returns focus', async ({ page }) => {
  const requests = recordCreateRequests(page)
  const { openButton, dialog } = await openDrawer(page)
  await fillValidForm(dialog, uniqueTitle())

  await page.keyboard.press('Escape')

  await expectDrawerClosed(page, dialog)
  await expect(openButton).toBeFocused()
  expect(requests).toHaveLength(0)
})

test('AK-8: Stäng closes the drawer, sends nothing and returns focus', async ({ page }) => {
  const requests = recordCreateRequests(page)
  const { openButton, dialog } = await openDrawer(page)
  await fillValidForm(dialog, uniqueTitle())

  await dialog.getByRole('button', { name: 'Stäng' }).click()

  await expectDrawerClosed(page, dialog)
  await expect(openButton).toBeFocused()
  expect(requests).toHaveLength(0)
})

// The backdrop has no role or name, so these tests click by position relative to the drawer.
test('AK-8: a click outside the drawer closes it, sends nothing and returns focus', async ({
  page,
}) => {
  const requests = recordCreateRequests(page)
  const { openButton, dialog } = await openDrawer(page)
  await fillValidForm(dialog, uniqueTitle())
  const box = await dialog.boundingBox()
  if (!box) throw new Error('The drawer has no bounding box')

  await page.mouse.click(box.x / 2, box.y + box.height / 2)

  await expectDrawerClosed(page, dialog)
  await expect(openButton).toBeFocused()
  expect(requests).toHaveLength(0)
})

test('AK-8: a click on an empty part of the drawer keeps it open', async ({ page }) => {
  // Tall enough that the drawer has empty space below the form; at 720 px the form fills it.
  await page.setViewportSize({ width: 1280, height: 1600 })
  const { dialog } = await openDrawer(page)
  const box = await dialog.boundingBox()
  if (!box) throw new Error('The drawer has no bounding box')

  await page.mouse.click(box.x + box.width / 2, box.y + box.height - 4)

  await expect(dialog).toBeVisible()
})

test('AK-8: the form is empty again after the drawer is closed', async ({ page }) => {
  const { dialog } = await openDrawer(page)
  await fillValidForm(dialog, uniqueTitle())
  await fields(dialog).priority.selectOption({ label: 'Hög' })
  await dialog.getByRole('button', { name: 'Stäng' }).click()

  await openDrawer(page)

  await expectEmptyForm(dialog)
})

test('AK-1, AK-9: a valid ticket is saved, the drawer closes and a confirmation is announced', async ({
  page,
}) => {
  const title = uniqueTitle()
  const { openButton, dialog } = await openDrawer(page)
  await fillValidForm(dialog, title)
  const response = page.waitForResponse((r) => isCreateTicket(r.request().method(), r.url()))

  await save(dialog)

  const created = await response
  expect(created.status()).toBe(201)
  const ticket = await created.json()
  expect(ticket).toMatchObject({ title, status: 'New', category: 'Invoices' })
  expect(Number.isNaN(Date.parse(ticket.createdAt))).toBe(false)
  await expectDrawerClosed(page, dialog)
  await expect(
    page.getByRole('status').filter({ hasText: 'Ärendet har registrerats.' }),
  ).toHaveText('Ärendet har registrerats.')
  await expect(openButton).toBeFocused()
})

test('AK-9: the form is empty again after a ticket is saved', async ({ page }) => {
  const { dialog } = await openDrawer(page)
  await fillValidForm(dialog, uniqueTitle())
  await save(dialog)
  await expect(dialog).toBeHidden()

  await openDrawer(page)

  await expectEmptyForm(dialog)
})

test('AK-9: the confirmation disappears after 5 seconds', async ({ page }) => {
  await page.clock.install()
  await page.goto('/tickets')
  const { dialog } = await openDrawer(page)
  await fillValidForm(dialog, uniqueTitle())
  await save(dialog)
  const status = page.getByRole('status').filter({ hasText: 'Ärendet har registrerats.' })
  await expect(status).toHaveText('Ärendet har registrerats.')

  await page.clock.runFor(4_900)
  await expect(status).toHaveText('Ärendet har registrerats.')
  await page.clock.runFor(100)

  await expect(status).toHaveCount(0)
})

test('AK-9: the confirmation disappears when the drawer is opened again', async ({ page }) => {
  const { dialog } = await openDrawer(page)
  await fillValidForm(dialog, uniqueTitle())
  await save(dialog)
  const status = page.getByRole('status').filter({ hasText: 'Ärendet har registrerats.' })
  await expect(status).toHaveText('Ärendet har registrerats.')

  await openDrawer(page)

  await expect(status).toHaveCount(0)
})
