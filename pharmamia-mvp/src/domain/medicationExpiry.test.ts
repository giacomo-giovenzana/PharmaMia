import { describe, it, expect } from 'vitest'
import { validateExpiryDate, getExpiryStatus, daysUntilExpiry } from './medicationExpiry'

// ---------------------------------------------------------------------------
// Helpers — compute dynamic date strings without mocking the module
// ---------------------------------------------------------------------------
function toDateStr(d: Date): string {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-')
}

function addDays(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return toDateStr(d)
}

const TODAY = addDays(0)

// ---------------------------------------------------------------------------
// validateExpiryDate
// ---------------------------------------------------------------------------
describe('validateExpiryDate', () => {
  it('returns { ok: false } with required error for empty string', () => {
    const result = validateExpiryDate('')
    expect(result.ok).toBe(false)
    expect(result.error).toBe('La data di scadenza è obbligatoria.')
  })

  it('returns { ok: false } with required error for null', () => {
    const result = validateExpiryDate(null)
    expect(result.ok).toBe(false)
    expect(result.error).toBe('La data di scadenza è obbligatoria.')
  })

  it('returns { ok: false } with required error for undefined', () => {
    const result = validateExpiryDate(undefined)
    expect(result.ok).toBe(false)
    expect(result.error).toBe('La data di scadenza è obbligatoria.')
  })

  it('returns { ok: false } with past-date error for a past date', () => {
    const result = validateExpiryDate('2020-01-01')
    expect(result.ok).toBe(false)
    expect(result.error).toBe('La data di scadenza non può essere nel passato.')
  })

  it('returns { ok: true } for today\'s date', () => {
    const result = validateExpiryDate(TODAY)
    expect(result.ok).toBe(true)
    expect(result.error).toBeUndefined()
  })

  it('returns { ok: true } for a future date', () => {
    const result = validateExpiryDate('2099-12-31')
    expect(result.ok).toBe(true)
    expect(result.error).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// getExpiryStatus
// ---------------------------------------------------------------------------
describe('getExpiryStatus', () => {
  it('returns "danger" for a clearly past date', () => {
    expect(getExpiryStatus('2020-01-01')).toBe('danger')
  })

  it('returns "danger" for today\'s date (equal to today means expired)', () => {
    expect(getExpiryStatus(TODAY)).toBe('danger')
  })

  it('returns "ok" for a date 31 days in the future', () => {
    expect(getExpiryStatus(addDays(31))).toBe('ok')
  })

  it('returns "warning" for a date 29 days in the future', () => {
    expect(getExpiryStatus(addDays(29))).toBe('warning')
  })
})

// ---------------------------------------------------------------------------
// daysUntilExpiry
// ---------------------------------------------------------------------------
describe('daysUntilExpiry', () => {
  it('returns 0 for today\'s date', () => {
    expect(daysUntilExpiry(TODAY)).toBe(0)
  })

  it('returns 5 for a date 5 days in the future', () => {
    expect(daysUntilExpiry(addDays(5))).toBe(5)
  })
})
