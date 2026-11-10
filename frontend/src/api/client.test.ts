import { afterEach, describe, expect, it, vi } from 'vitest'
import type { CreateTicketInput, Ticket } from '../types/ticket'
import { API_BASE_URL, ApiError, api, type ProblemDetails } from './client'

const input: CreateTicketInput = {
  title: 'Paketet har inte kommit',
  description: 'Beställde för två veckor sedan.',
  category: 'OrdersDeliveries',
  priority: 'Medium',
  customerName: 'Anna Andersson',
  customerEmail: 'anna@example.com',
}

const ticket: Ticket = { ...input, id: 1, ticketNumber: 'SR-2026-1001', status: 'New', createdAt: '2026-11-09T09:30:00Z' }

const respond = (status: number, body: unknown, contentType = 'application/json') =>
  vi
    .fn()
    .mockResolvedValue(
      new Response(JSON.stringify(body), { status, headers: { 'Content-Type': contentType } }),
    )

const validationProblem = (errors: Record<string, string[]>): ProblemDetails => ({
  type: 'https://tools.ietf.org/html/rfc9110#section-15.5.1',
  title: 'One or more validation errors occurred.',
  status: 400,
  errors,
})

const createTicketError = () => api.createTicket(input).catch((error: unknown) => error)

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('api.createTicket', () => {
  it('posts the input as JSON to /tickets and returns the created ticket', async () => {
    const fetchMock = respond(201, ticket)
    vi.stubGlobal('fetch', fetchMock)

    await expect(api.createTicket(input)).resolves.toEqual(ticket)

    expect(fetchMock).toHaveBeenCalledWith(`${API_BASE_URL}/tickets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
  })

  it('turns a 400 with errors into field errors', async () => {
    vi.stubGlobal(
      'fetch',
      respond(
        400,
        validationProblem({
          title: ['Rubrik måste fyllas i'],
          customerEmail: ['Ange en giltig e-postadress'],
        }),
        'application/problem+json',
      ),
    )

    const error = await createTicketError()

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({
      status: 400,
      fieldErrors: {
        title: 'Rubrik måste fyllas i',
        customerEmail: 'Ange en giltig e-postadress',
      },
    })
  })

  it('uses the first message when a field has several', async () => {
    vi.stubGlobal(
      'fetch',
      respond(400, validationProblem({ title: ['Första', 'Andra'] }), 'application/problem+json'),
    )

    const error = await createTicketError()

    expect(error).toMatchObject({ status: 400, fieldErrors: { title: 'Första' } })
  })

  it('turns a 400 without errors into an error without field errors', async () => {
    const problem: ProblemDetails = { title: 'Bad Request', status: 400 }
    vi.stubGlobal('fetch', respond(400, problem, 'application/problem+json'))

    const error = await createTicketError()

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 400, fieldErrors: undefined })
  })

  it('turns a 500 into an error without field errors', async () => {
    const problem: ProblemDetails = { title: 'An error occurred', status: 500 }
    vi.stubGlobal('fetch', respond(500, problem, 'application/problem+json'))

    const error = await createTicketError()

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 500, fieldErrors: undefined })
  })

  it('turns a network failure into an error without field errors', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))

    const error = await createTicketError()

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 0, fieldErrors: undefined })
  })
})
