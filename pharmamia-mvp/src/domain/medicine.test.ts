import { describe, it, expect } from 'vitest'

describe('Medicine domain', () => {
  it('returns true for a valid medicine name', () => {
    const isValid = (name: string) => name.trim().length > 0
    expect(isValid('Tachipirina')).toBe(true)
  })
})
