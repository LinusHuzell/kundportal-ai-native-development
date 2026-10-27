import { describe, expect, it } from 'vitest'
import { TICKET_CATEGORIES, TICKET_PRIORITIES, TICKET_STATUSES } from './ticket'

// Guards the domain values against accidental drift from docs/avgränsningar.md.
// Replace or extend with validation tests once the form logic exists.
describe('ticket domain values', () => {
  it('has the four agreed statuses in workflow order', () => {
    expect(TICKET_STATUSES).toEqual(['New', 'InProgress', 'WaitingForCustomer', 'Closed'])
  })

  it('has the three agreed priorities', () => {
    expect(TICKET_PRIORITIES).toEqual(['Low', 'Medium', 'High'])
  })

  it('has the four agreed categories', () => {
    expect(TICKET_CATEGORIES).toEqual([
      'OrdersDeliveries',
      'Invoices',
      'ReturnsComplaints',
      'Other',
    ])
  })
})
