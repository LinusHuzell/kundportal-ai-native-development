import type { CreateTicketInput, Ticket, TicketStatus, UpdateTicketInput } from '../types/ticket'

/** Base URL is configured via VITE_API_BASE_URL. */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

/** Field-level validation errors, e.g. { title: 'Title is required' }. */
export type FieldErrors = Record<string, string>

export class ApiError extends Error {
  status: number
  fieldErrors?: FieldErrors
  constructor(message: string, status: number, fieldErrors?: FieldErrors) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

const notImplemented = (name: string): never => {
  throw new ApiError(`${name}: API contract not defined yet`, 501)
}

export const api = {
  listTickets: async (): Promise<Ticket[]> => {
    const response = await fetch(`${API_BASE_URL}/tickets`)

    if (!response.ok) {
      throw new ApiError(`Unable to load tickets (HTTP ${response.status}).`, response.status)
    }

    return response.json() as Promise<Ticket[]>
  },
  getTicket: async (id: number): Promise<Ticket> => {
    const response = await fetch(`${API_BASE_URL}/tickets/${id}`)

    if (!response.ok) {
      throw new ApiError(`Unable to load ticket (HTTP ${response.status}).`, response.status)
    }

    return response.json() as Promise<Ticket>
  },
  createTicket: async (_input: CreateTicketInput): Promise<Ticket> =>
    notImplemented('createTicket'),
  updateTicket: async (_id: number, _input: UpdateTicketInput): Promise<Ticket> =>
    notImplemented('updateTicket'),
  updateTicketStatus: async (id: number, status: TicketStatus): Promise<Ticket> => {
    const response = await fetch(`${API_BASE_URL}/tickets/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })

    if (!response.ok) {
      throw new ApiError(`Unable to update ticket status (HTTP ${response.status}).`, response.status)
    }

    return response.json() as Promise<Ticket>
  },
}
