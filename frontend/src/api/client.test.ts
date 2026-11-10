import { afterEach, describe, expect, it, vi } from 'vitest'
import { API_BASE_URL, ApiError, api } from './client'
import type { Ticket } from '../types/ticket'

const tickets: Ticket[] = [
  {
    id: 1,
    ticketNumber: 'SR-2026-1001',
    title: 'Delivery issue',
    description: 'A package is missing.',
    category: 'OrdersDeliveries',
    priority: 'High',
    status: 'New',
    customerName: 'Alex Example',
    customerEmail: 'alex@example.com',
    createdAt: '2026-11-01T10:00:00Z',
  },
]

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('api.listTickets', () => {
  it('returns the ticket list from a successful response', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(tickets), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await expect(api.listTickets()).resolves.toEqual(tickets)
    expect(fetchMock).toHaveBeenCalledWith(`${API_BASE_URL}/tickets`)
  })

  it('throws an ApiError with the response status when the request fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 500 })))

    const request = api.listTickets()

    await expect(request).rejects.toBeInstanceOf(ApiError)
    await expect(request).rejects.toMatchObject({ status: 500 })
  })
})