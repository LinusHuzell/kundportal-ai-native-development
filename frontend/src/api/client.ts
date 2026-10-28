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
  getTicket: async (_id: number): Promise<Ticket> => notImplemented('getTicket'),
  createTicket: async (_input: CreateTicketInput): Promise<Ticket> =>
    notImplemented('createTicket'),
  updateTicket: async (_id: number, _input: UpdateTicketInput): Promise<Ticket> =>
    notImplemented('updateTicket'),
  updateTicketStatus: async (_id: number, _status: TicketStatus): Promise<Ticket> =>
    notImplemented('updateTicketStatus'),
}
