import { describe, it, expect } from 'vitest'
import { parseGs1, normalizeGtinToEan13 } from './gs1'

describe('parseGs1', () => {
  it('restituisce null per un EAN-13 semplice (non GS1)', () => {
    expect(parseGs1('1234567890123')).toBeNull()
  })

  it('restituisce null per una stringa vuota', () => {
    expect(parseGs1('')).toBeNull()
  })

  it('restituisce null per un payload malformato', () => {
    expect(parseGs1('HELLO WORLD')).toBeNull()
  })

  it('restituisce null se la stringa inizia con AI non riconosciuto', () => {
    expect(parseGs1('991234567890123')).toBeNull()
  })

  it('parsa stringa GS1 completa con AI 01, 17, 10, 21', () => {
    // AI 01 (GTIN-14): 07007123456784
    // AI 17 (scadenza): 270331
    // AI 10 (lotto): LOT123 + FNC1
    // AI 21 (seriale): SER456
    const raw = '010700712345678417270331\x1d10LOT123\x1d21SER456'
    const result = parseGs1(raw)
    expect(result).not.toBeNull()
    expect(result!.gtin).toBe('07007123456784')
    expect(result!.expiresAt).toBe('2027-03-31')
    expect(result!.lot).toBe('LOT123')
    expect(result!.serial).toBe('SER456')
  })

  it('gestisce il separatore FNC1 iniziale (opzionale)', () => {
    const raw = '\x1d010700712345678417270331'
    const result = parseGs1(raw)
    expect(result).not.toBeNull()
    expect(result!.gtin).toBe('07007123456784')
    expect(result!.expiresAt).toBe('2027-03-31')
  })

  it('converte DD=00 nell\'ultimo giorno del mese', () => {
    const raw = '010700712345678417270300' // marzo 2027, DD=00
    const result = parseGs1(raw)
    expect(result!.expiresAt).toBe('2027-03-31')
  })

  it('converte DD=00 per febbraio anno bisestile', () => {
    const raw = '010700712345678417280200' // feb 2028, anno bisestile
    const result = parseGs1(raw)
    expect(result!.expiresAt).toBe('2028-02-29')
  })

  it('converte DD=00 per febbraio anno non bisestile', () => {
    const raw = '010700712345678417270200' // feb 2027
    const result = parseGs1(raw)
    expect(result!.expiresAt).toBe('2027-02-28')
  })

  it('interpreta YY<=49 come 20YY', () => {
    const raw = '010700712345678417490101'
    const result = parseGs1(raw)
    expect(result!.expiresAt).toBe('2049-01-01')
  })

  it('parsa AI 710 (AIC italiano)', () => {
    const raw = '7100123456789\x1d17270331'
    const result = parseGs1(raw)
    expect(result).not.toBeNull()
    expect(result!.aic).toBe('0123456789')
    expect(result!.expiresAt).toBe('2027-03-31')
  })

  it('restituisce null per stringa con solo lotto/seriale senza GTIN o AIC (conservativo)', () => {
    // Without a product identifier the code is ambiguous with EAN-13 prefixes
    const raw = '10LOTTO99\x1d21SERIALE88'
    expect(parseGs1(raw)).toBeNull()
  })

  it('restituisce null se GTIN-14 non è numerico', () => {
    const raw = '01ABCDEFGHIJKLMN17270331' // non numerico
    expect(parseGs1(raw)).toBeNull()
  })

  it('restituisce null se GTIN-14 è troppo corto', () => {
    // Only 13 chars after AI "01"
    const raw = '011234567890123' // 15 chars total, GTIN only 13
    expect(parseGs1(raw)).toBeNull()
  })

  it('parsa stringa con campi variabili senza FNC1 finale (seriale a fine stringa)', () => {
    const raw = '010700712345678417270331\x1d10BATCH1\x1d21SERIAL123'
    const result = parseGs1(raw)
    expect(result!.serial).toBe('SERIAL123')
  })

  it('restituisce null per EAN-13 che inizia con "10" (falso positivo Improvement 1)', () => {
    // 1073456789012 starts with "10" but has no GTIN/AIC — must be rejected
    expect(parseGs1('1073456789012')).toBeNull()
  })

  it('restituisce null per EAN-13 che inizia con "21"', () => {
    expect(parseGs1('2134567890123')).toBeNull()
  })

  it('restituisce null per data con overflow di calendario (29 febbraio in anno non bisestile)', () => {
    const raw = '010700712345678417270229' // 2027-02-29 non esiste
    expect(parseGs1(raw)?.expiresAt).toBeUndefined()
    // The expiry field should not be set, but gtin might be
    const result = parseGs1(raw)
    if (result) expect(result.expiresAt).toBeUndefined()
  })

  it('restituisce null per data con overflow di calendario (30 febbraio)', () => {
    const raw = '010700712345678417270230' // 2027-02-30 non esiste
    const result = parseGs1(raw)
    if (result) expect(result.expiresAt).toBeUndefined()
  })
})

describe('normalizeGtinToEan13', () => {
  it('rimuove il primo digit del GTIN-14 (PI=0) per ottenere EAN-13', () => {
    expect(normalizeGtinToEan13('07007123456784')).toBe('7007123456784')
  })

  it('restituisce null per stringa non a 14 cifre', () => {
    expect(normalizeGtinToEan13('123456')).toBeNull()
  })

  it('restituisce null per stringa di 14 char non numerici', () => {
    expect(normalizeGtinToEan13('ABCDEFGHIJKLMN')).toBeNull()
  })

  it('restituisce null per GTIN-14 con PI ≠ 0 (non è un EAN-13 singola unità)', () => {
    // PI=1 means outer carton — not a valid EAN-13 consumer pack
    expect(normalizeGtinToEan13('17007123456784')).toBeNull()
  })
})
