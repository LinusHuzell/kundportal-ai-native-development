import { TICKET_CATEGORIES, TICKET_PRIORITIES, type CreateTicketInput } from '../../types/ticket'

/** Form values as typed. Category is '' until the handler picks one. */
export type CreateTicketFormValues = Record<keyof CreateTicketInput, string>

/** At most one error per field. */
export type CreateTicketFieldErrors = Partial<Record<keyof CreateTicketInput, string>>

// Same regex as the backend (CreateTicketValidator), footnote 3 in the spec.
const EMAIL_FORMAT = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const isBlank = (value: string) => value.trim() === ''

const isOneOf = (values: readonly string[], value: string) => values.includes(value)

/**
 * Rules and messages from the Felfall table in docs/specs/registrera-ärende.md.
 * Values are not trimmed, and length counts UTF-16 units, as in the backend.
 */
export function validateTicket(values: CreateTicketFormValues): CreateTicketFieldErrors {
  const errors: CreateTicketFieldErrors = {}

  if (isBlank(values.title)) errors.title = 'Rubrik måste fyllas i'
  else if (values.title.length > 200) errors.title = 'Rubrik får vara högst 200 tecken'

  if (isBlank(values.description)) errors.description = 'Beskrivning måste fyllas i'
  else if (values.description.length > 5000)
    errors.description = 'Beskrivning får vara högst 5000 tecken'

  if (!isOneOf(TICKET_CATEGORIES, values.category)) errors.category = 'Välj en kategori'

  if (!isOneOf(TICKET_PRIORITIES, values.priority)) errors.priority = 'Välj en prioritet'

  if (isBlank(values.customerName)) errors.customerName = 'Namn måste fyllas i'

  if (isBlank(values.customerEmail)) errors.customerEmail = 'E-postadress måste fyllas i'
  else if (!EMAIL_FORMAT.test(values.customerEmail))
    errors.customerEmail = 'Ange en giltig e-postadress'

  return errors
}
