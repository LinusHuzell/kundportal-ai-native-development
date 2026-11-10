import { describe, expect, it } from 'vitest'
import { formatCreatedAt } from './formatCreatedAt'

describe('formatCreatedAt', () => {
  it('AK-2: shows the date and time in Swedish format in the given time zone', () => {
    expect(formatCreatedAt('2026-11-10T13:30:00Z', 'Europe/Stockholm')).toBe('10 nov. 2026 14:30')
  })

  it('uses the given time zone', () => {
    expect(formatCreatedAt('2026-11-10T13:30:00Z', 'UTC')).toBe('10 nov. 2026 13:30')
  })
})
