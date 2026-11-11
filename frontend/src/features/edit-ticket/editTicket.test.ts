import { describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../api/client'
import type { Ticket } from '../../types/ticket'
import type { CreateTicketFormValues } from '../create-ticket/validateTicket'
import { firstFieldWithError, saveTicketEdit, toFormValues } from './editTicket'

const ticket: Ticket = {
  id: 7,
  ticketNumber: 'SR-2026-1007',
  title: 'Paketet har inte kommit',
  description: 'Beställde för två veckor sedan.',
  category: 'OrdersDeliveries',
  priority: 'Medium',
  status: 'InProgress',
  customerName: 'Anna Andersson',
  customerEmail: 'anna@example.com',
  createdAt: '2026-11-09T09:30:00Z',
}

const edited: CreateTicketFormValues = {
  title: 'Paketet kom fram trasigt',
  description: 'Kartongen var söndrig.',
  category: 'ReturnsComplaints',
  priority: 'High',
  customerName: 'Anna Andersson',
  customerEmail: 'anna@example.com',
}

describe('toFormValues', () => {
  it.each<keyof CreateTicketFormValues>([
    'title',
    'description',
    'category',
    'priority',
    'customerName',
    'customerEmail',
  ])("starts %s with the ticket's current value", (field) => {
    expect(toFormValues(ticket)[field]).toBe(ticket[field])
  })

  it('contains only the six editable fields', () => {
    expect(Object.keys(toFormValues(ticket)).sort()).toEqual(
      ['category', 'customerEmail', 'customerName', 'description', 'priority', 'title'],
    )
  })
})

describe('firstFieldWithError', () => {
  it('returns the first field with an error in form order', () => {
    expect(
      firstFieldWithError({
        customerEmail: 'Ange en giltig e-postadress',
        description: 'Beskrivning måste fyllas i',
      }),
    ).toBe('description')
  })

  it('returns undefined when there are no errors', () => {
    expect(firstFieldWithError({})).toBeUndefined()
  })
})

describe('saveTicketEdit', () => {
  it('sends all six fields for the ticket and returns the saved ticket', async () => {
    const saved: Ticket = {
      ...ticket,
      title: 'Paketet kom fram trasigt',
      description: 'Kartongen var söndrig.',
      category: 'ReturnsComplaints',
      priority: 'High',
    }
    const update = vi.fn().mockResolvedValue(saved)

    const result = await saveTicketEdit(7, edited, update)

    expect(update).toHaveBeenCalledOnce()
    expect(update).toHaveBeenCalledWith(7, edited)
    expect(result).toEqual({ kind: 'saved', ticket: saved })
  })

  it('returns every validation error and sends no request when fields break a rule', async () => {
    const update = vi.fn()

    const result = await saveTicketEdit(
      7,
      { ...edited, title: '   ', customerEmail: 'anna@example' },
      update,
    )

    expect(update).not.toHaveBeenCalled()
    expect(result).toEqual({
      kind: 'invalid',
      errors: {
        title: 'Rubrik måste fyllas i',
        customerEmail: 'Ange en giltig e-postadress',
      },
    })
  })

  it('returns the field errors from a 400', async () => {
    const update = vi
      .fn()
      .mockRejectedValue(
        new ApiError('One or more validation errors occurred.', 400, {
          customerName: 'Namn måste fyllas i',
        }),
      )

    const result = await saveTicketEdit(7, edited, update)

    expect(result).toEqual({ kind: 'invalid', errors: { customerName: 'Namn måste fyllas i' } })
  })

  it.each([
    ['a 404', 404],
    ['a 500', 500],
    ['a network failure', 0],
    ['a 400 without field errors', 400],
  ])('returns failed on %s', async (_case, status) => {
    const update = vi.fn().mockRejectedValue(new ApiError('Request failed', status))

    const result = await saveTicketEdit(7, edited, update)

    expect(result).toEqual({ kind: 'failed' })
  })
})
