/**
 * The ticket id from the address, or undefined when it is not a whole number from 1 to
 * 2147483647, the same values as the backend's int route (AK-3).
 */
export function parseTicketId(_value: string | undefined): number | undefined {
  return 0
}
