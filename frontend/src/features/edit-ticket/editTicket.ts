import { ApiError } from '../../api/client'
import type { CreateTicketInput, Ticket, UpdateTicketInput } from '../../types/ticket'
import {
  validateTicket,
  type CreateTicketFieldErrors,
  type CreateTicketFormValues,
} from '../create-ticket/validateTicket'

export type EditField = keyof CreateTicketFormValues

/** The six editable fields, in form order. */
export const EDIT_FIELDS: readonly EditField[] = [
  'title',
  'description',
  'category',
  'priority',
  'customerName',
  'customerEmail',
]

/** The result of a save attempt. The form keeps its values in every case except 'saved'. */
export type SaveResult =
  | { kind: 'saved'; ticket: Ticket }
  | { kind: 'invalid'; errors: CreateTicketFieldErrors }
  | { kind: 'failed' }

/** Same signature as api.updateTicket, passed in so tests can use a fake. */
export type UpdateTicket = (id: number, input: UpdateTicketInput) => Promise<Ticket>

/** The six editable fields with the ticket's current values (AK-7). */
export function toFormValues(ticket: Ticket): CreateTicketFormValues {
  return {
    title: ticket.title,
    description: ticket.description,
    category: ticket.category,
    priority: ticket.priority,
    customerName: ticket.customerName,
    customerEmail: ticket.customerEmail,
  }
}

/** The first field with an error, in form order (AK-12). */
export function firstFieldWithError(errors: CreateTicketFieldErrors): EditField | undefined {
  return EDIT_FIELDS.find((field) => errors[field])
}

/**
 * Validates with validateTicket and, only if every field is valid, sends all six fields
 * (AK-1, AK-2). A 400 with field errors is 'invalid'. A 404, 5xx, network failure or a 400
 * without field errors is 'failed'.
 */
export async function saveTicketEdit(
  id: number,
  values: CreateTicketFormValues,
  update: UpdateTicket,
): Promise<SaveResult> {
  const errors = validateTicket(values)
  if (Object.keys(errors).length > 0) return { kind: 'invalid', errors }

  // validateTicket has checked that category and priority are allowed values.
  const input = Object.fromEntries(
    EDIT_FIELDS.map((field) => [field, values[field]]),
  ) as CreateTicketInput

  try {
    return { kind: 'saved', ticket: await update(id, input) }
  } catch (error) {
    if (error instanceof ApiError && error.fieldErrors) {
      return { kind: 'invalid', errors: error.fieldErrors }
    }
    return { kind: 'failed' }
  }
}
