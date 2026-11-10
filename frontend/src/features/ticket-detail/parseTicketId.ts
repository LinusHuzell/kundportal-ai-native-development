const MAX_ID = 2147483647

/**
 * The ticket id from the address, or undefined when it is not a whole number from 1 to
 * 2147483647, the same values as the backend's int route (AK-3).
 */
export function parseTicketId(value: string | undefined): number | undefined {
  if (!value || !/^\d+$/.test(value)) return undefined
  const id = Number(value)
  return id >= 1 && id <= MAX_ID ? id : undefined
}
