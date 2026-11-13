import type { Ticket } from '../../types/ticket'
import type { CreateTicketFormValues } from '../create-ticket/validateTicket'
import { EDIT_FIELDS } from './editTicket'

/**
 * True when at least one field differs from the saved ticket (AK-10, AK-11).
 * Compares exact values, without trimming, so a field that is changed and then restored
 * counts as unchanged.
 */
export function hasChanges(ticket: Ticket, values: CreateTicketFormValues): boolean {
  return EDIT_FIELDS.some((field) => values[field] !== ticket[field])
}
