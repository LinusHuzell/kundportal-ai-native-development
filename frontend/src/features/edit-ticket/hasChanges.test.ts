import { describe, expect, it } from 'vitest'
import type { Ticket } from '../../types/ticket'
import type { CreateTicketFormValues } from '../create-ticket/validateTicket'
import { hasChanges } from './hasChanges'

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

// Written out instead of using toFormValues, so these tests do not depend on it.
const saved: CreateTicketFormValues = {
  title: 'Paketet har inte kommit',
  description: 'Beställde för två veckor sedan.',
  category: 'OrdersDeliveries',
  priority: 'Medium',
  customerName: 'Anna Andersson',
  customerEmail: 'anna@example.com',
}

describe('hasChanges', () => {
  it('is false when every field has the saved value', () => {
    expect(hasChanges(ticket, saved)).toBe(false)
  })

  it.each<[keyof CreateTicketFormValues, string]>([
    ['title', 'Paketet kom fram trasigt'],
    ['description', 'Kartongen var söndrig.'],
    ['category', 'ReturnsComplaints'],
    ['priority', 'High'],
    ['customerName', 'Bertil Berg'],
    ['customerEmail', 'bertil@example.com'],
  ])('is true when %s differs from the saved value', (field, value) => {
    expect(hasChanges(ticket, { ...saved, [field]: value })).toBe(true)
  })

  it('is false when a field is changed and then restored', () => {
    const edited = { ...saved, title: 'Paketet kom fram trasigt' }
    const restored = { ...edited, title: saved.title }

    expect(hasChanges(ticket, restored)).toBe(false)
  })

  it('is true when only a space is added, since values are not trimmed', () => {
    expect(hasChanges(ticket, { ...saved, customerName: 'Anna Andersson ' })).toBe(true)
  })
})
