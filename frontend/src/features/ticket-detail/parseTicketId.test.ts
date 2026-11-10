import { describe, expect, it } from 'vitest'
import { parseTicketId } from './parseTicketId'

describe('parseTicketId', () => {
  it('returns the number for a positive whole number', () => {
    expect(parseTicketId('42')).toBe(42)
  })

  it('accepts leading zeros, like the backend route', () => {
    expect(parseTicketId('01')).toBe(1)
  })

  it('accepts the largest id the backend route accepts', () => {
    expect(parseTicketId('2147483647')).toBe(2147483647)
  })

  it.each([undefined, '', 'abc', '0', '-1', '1.5', '1e3', ' 1', '0x1', '2147483648'])(
    'returns undefined for %j',
    (value) => {
      expect(parseTicketId(value)).toBeUndefined()
    },
  )
})
