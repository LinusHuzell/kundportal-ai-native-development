/// <reference types="vite/client" />
// The reference and the .ts extension let e2e-mocked/ (tsconfig.node.json) import the types below.
import type {
  CreateTicketInput,
  Ticket,
  TicketHistoryEvent,
  TicketStatus,
  UpdateTicketInput,
} from '../types/ticket.ts'

/**
 * API client. listTickets, createTicket, getTicket, getTicketHistory and updateTicketStatus follow
 * docs/api/kontrakt.md; the other methods are still stubs.
 * Base URL is configured via VITE_API_BASE_URL (see .env.example).
 */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

/** Field-level validation errors, e.g. { title: 'Rubrik måste fyllas i' }. */
export type FieldErrors = Record<string, string>

/** RFC 9457 problem+json, as HttpValidationProblemDetails in docs/api/openapi.json. */
export interface ProblemDetails {
  type?: string | null
  title?: string | null
  status?: number | null
  detail?: string | null
  instance?: string | null
  errors?: Record<string, string[]>
}

export class ApiError extends Error {
  /** HTTP status, or 0 when the server could not be reached. */
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

/** The first message per field, or undefined when the body has no errors. */
function toFieldErrors(problem: ProblemDetails | undefined): FieldErrors | undefined {
  if (!problem?.errors) return undefined
  const entries = Object.entries(problem.errors).filter(([, messages]) => messages.length > 0)
  return entries.length > 0
    ? Object.fromEntries(entries.map(([field, messages]) => [field, messages[0]]))
    : undefined
}

async function readProblem(response: Response): Promise<ProblemDetails | undefined> {
  try {
    return (await response.json()) as ProblemDetails
  } catch {
    return undefined
  }
}

async function request<T>(path: string, init: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, init)
  } catch (error) {
    throw new ApiError(`Network error: ${String(error)}`, 0)
  }

  if (!response.ok) {
    const problem = await readProblem(response)
    const fieldErrors = response.status === 400 ? toFieldErrors(problem) : undefined
    throw new ApiError(problem?.title ?? `HTTP ${response.status}`, response.status, fieldErrors)
  }

  return (await response.json()) as T
}

export const api = {
  listTickets: (): Promise<Ticket[]> => request<Ticket[]>('/tickets', { method: 'GET' }),
  getTicket: (id: number): Promise<Ticket> => request<Ticket>(`/tickets/${id}`, { method: 'GET' }),
  getTicketHistory: (id: number): Promise<TicketHistoryEvent[]> =>
    request<TicketHistoryEvent[]>(`/tickets/${id}/history`, { method: 'GET' }),
  createTicket: (input: CreateTicketInput): Promise<Ticket> =>
    request<Ticket>('/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    }),
  updateTicket: async (_id: number, _input: UpdateTicketInput): Promise<Ticket> =>
    notImplemented('updateTicket'),
  updateTicketStatus: (id: number, status: TicketStatus): Promise<Ticket> =>
    request<Ticket>(`/tickets/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    }),
}
