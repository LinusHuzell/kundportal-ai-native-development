// Domain model, derived from docs/avgränsningar.md.
// NOTE: enum values are provisional until the backend API contract exists.

export const TICKET_STATUSES = ['New', 'InProgress', 'WaitingForCustomer', 'Closed'] as const
export type TicketStatus = (typeof TICKET_STATUSES)[number]

export const TICKET_PRIORITIES = ['Low', 'Medium', 'High'] as const
export type TicketPriority = (typeof TICKET_PRIORITIES)[number]

export const TICKET_CATEGORIES = [
  'OrdersDeliveries',
  'Invoices',
  'ReturnsComplaints',
  'Other',
] as const
export type TicketCategory = (typeof TICKET_CATEGORIES)[number]

export interface Ticket {
  id: number
  title: string
  description: string
  category: TicketCategory
  priority: TicketPriority
  status: TicketStatus
  customerName: string
  customerEmail: string
  createdAt: string // ISO 8601
}

export type CreateTicketInput = Omit<Ticket, 'id' | 'status' | 'createdAt'>
export type UpdateTicketInput = Partial<CreateTicketInput>
