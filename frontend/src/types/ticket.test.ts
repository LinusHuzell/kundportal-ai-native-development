import { describe, expect, it } from 'vitest'
import {
  CATEGORY_LABELS,
  PRIORITY_LABELS,
  STATUS_LABELS,
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
} from './ticket'

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

// Swedish display labels from docs/avgränsningar.md, shown in the create ticket form.
describe('ticket display labels', () => {
  it('has a Swedish label for each category', () => {
    expect(CATEGORY_LABELS).toEqual({
      OrdersDeliveries: 'Beställningar/leveranser',
      Invoices: 'Fakturor',
      ReturnsComplaints: 'Returer/reklamation',
      Other: 'Övrigt',
    })
  })

  it('has a Swedish label for each priority', () => {
    expect(PRIORITY_LABELS).toEqual({ Low: 'Låg', Medium: 'Medel', High: 'Hög' })
  })
})

// Swedish status labels from Visning in docs/specs/visa-ärende-och-ändra-status.md.
describe('ticket status labels', () => {
  it('has a Swedish label for each status', () => {
    expect(STATUS_LABELS).toEqual({
      New: 'Nytt',
      InProgress: 'Pågående',
      WaitingForCustomer: 'Väntar på kund',
      Closed: 'Avslutat',
    })
  })
})
