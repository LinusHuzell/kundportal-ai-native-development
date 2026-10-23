import type { CreateTicketInput, Ticket, TicketStatus, UpdateTicketInput } from '../types/ticket'

/**
 * API client stub. The signatures below are a proposal; replace the bodies
 * (and adjust types) once the backend API contract is agreed.
 * Base URL is configured via VITE_API_BASE_URL (see .env.example).
 */
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
  listTickets: async (): Promise<Ticket[]> => notImplemented('listTickets'),
  getTicket: async (_id: number): Promise<Ticket> => notImplemented('getTicket'),
  createTicket: async (_input: CreateTicketInput): Promise<Ticket> =>
    notImplemented('createTicket'),
  updateTicket: async (_id: number, _input: UpdateTicketInput): Promise<Ticket> =>
    notImplemented('updateTicket'),
  updateTicketStatus: async (_id: number, _status: TicketStatus): Promise<Ticket> =>
    notImplemented('updateTicketStatus'),
}
