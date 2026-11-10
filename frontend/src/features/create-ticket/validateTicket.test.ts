import { describe, expect, it } from 'vitest'
import { validateTicket, type CreateTicketFormValues } from './validateTicket'

// Rules and messages come from the Felfall table in docs/specs/registrera-ärende.md (AK-3).
const valid: CreateTicketFormValues = {
  title: 'Paketet har inte kommit',
  description: 'Beställde för två veckor sedan.',
  category: 'OrdersDeliveries',
  priority: 'Medium',
  customerName: 'Anna Andersson',
  customerEmail: 'anna@example.com',
}

const withValues = (values: Partial<CreateTicketFormValues>) =>
  validateTicket({ ...valid, ...values })

describe('validateTicket', () => {
  it('accepts a valid form', () => {
    expect(validateTicket(valid)).toEqual({})
  })

  describe('title', () => {
    it('rejects an empty title', () => {
      expect(withValues({ title: '' })).toEqual({ title: 'Rubrik måste fyllas i' })
    })

    it('rejects a title with only spaces', () => {
      expect(withValues({ title: '   ' })).toEqual({ title: 'Rubrik måste fyllas i' })
    })

    it('accepts a title of 200 characters', () => {
      expect(withValues({ title: 'a'.repeat(200) })).toEqual({})
    })

    it('rejects a title of 201 characters', () => {
      expect(withValues({ title: 'a'.repeat(201) })).toEqual({
        title: 'Rubrik får vara högst 200 tecken',
      })
    })
  })

  describe('description', () => {
    it('rejects an empty description', () => {
      expect(withValues({ description: '' })).toEqual({
        description: 'Beskrivning måste fyllas i',
      })
    })

    it('rejects a description with only spaces', () => {
      expect(withValues({ description: '  \n ' })).toEqual({
        description: 'Beskrivning måste fyllas i',
      })
    })

    it('accepts a description of 5000 characters', () => {
      expect(withValues({ description: 'a'.repeat(5000) })).toEqual({})
    })

    it('rejects a description of 5001 characters', () => {
      expect(withValues({ description: 'a'.repeat(5001) })).toEqual({
        description: 'Beskrivning får vara högst 5000 tecken',
      })
    })
  })

  describe('category', () => {
    it('rejects a form where no category is chosen', () => {
      expect(withValues({ category: '' })).toEqual({ category: 'Välj en kategori' })
    })

    it('rejects an unknown category', () => {
      expect(withValues({ category: 'Foo' })).toEqual({ category: 'Välj en kategori' })
    })
  })

  describe('priority', () => {
    it('rejects a missing priority', () => {
      expect(withValues({ priority: '' })).toEqual({ priority: 'Välj en prioritet' })
    })

    it('rejects an unknown priority', () => {
      expect(withValues({ priority: 'Foo' })).toEqual({ priority: 'Välj en prioritet' })
    })

    it('rejects a priority with the wrong case', () => {
      expect(withValues({ priority: 'medium' })).toEqual({ priority: 'Välj en prioritet' })
    })
  })

  describe('customer name', () => {
    it('rejects an empty name', () => {
      expect(withValues({ customerName: '' })).toEqual({ customerName: 'Namn måste fyllas i' })
    })

    it('rejects a name with only spaces', () => {
      expect(withValues({ customerName: '   ' })).toEqual({ customerName: 'Namn måste fyllas i' })
    })
  })

  describe('customer email', () => {
    it('rejects an empty email', () => {
      expect(withValues({ customerEmail: '' })).toEqual({
        customerEmail: 'E-postadress måste fyllas i',
      })
    })

    it('rejects an email with only spaces', () => {
      expect(withValues({ customerEmail: '   ' })).toEqual({
        customerEmail: 'E-postadress måste fyllas i',
      })
    })

    it.each([
      ['no @', 'anna.example.com'],
      ['two @', 'anna@@example.com'],
      ['no dot after @', 'anna@example'],
      ['a space', 'anna @example.com'],
      ['a trailing newline', 'anna@example.com\n'],
    ])('rejects an email with %s', (_case, email) => {
      expect(withValues({ customerEmail: email })).toEqual({
        customerEmail: 'Ange en giltig e-postadress',
      })
    })

    it('accepts an email with capital letters', () => {
      expect(withValues({ customerEmail: 'Anna@Example.COM' })).toEqual({})
    })
  })

  it('reports every invalid field at once', () => {
    const empty: CreateTicketFormValues = {
      title: '',
      description: '',
      category: '',
      priority: '',
      customerName: '',
      customerEmail: '',
    }

    expect(validateTicket(empty)).toEqual({
      title: 'Rubrik måste fyllas i',
      description: 'Beskrivning måste fyllas i',
      category: 'Välj en kategori',
      priority: 'Välj en prioritet',
      customerName: 'Namn måste fyllas i',
      customerEmail: 'E-postadress måste fyllas i',
    })
  })
})
