import { describe, it, expect } from 'vitest'
import { validateEmail, validatePassword, validatePasswordMatch, mapAuthError } from './validation'

describe('validateEmail', () => {
  it('accetta email valida', () => {
    expect(validateEmail('giulia@email.it')).toBeNull()
    expect(validateEmail('user+tag@example.co.uk')).toBeNull()
  })

  it('rifiuta email senza @', () => {
    expect(validateEmail('nonvalida')).not.toBeNull()
  })

  it('rifiuta email senza dominio', () => {
    expect(validateEmail('user@')).not.toBeNull()
  })

  it('rifiuta stringa vuota', () => {
    expect(validateEmail('')).not.toBeNull()
  })

  it('rifiuta email con spazi', () => {
    expect(validateEmail('giulia @email.it')).not.toBeNull()
  })
})

describe('validatePassword', () => {
  it('accetta password con 8+ caratteri e numero', () => {
    expect(validatePassword('password1')).toBeNull()
    expect(validatePassword('Secure123!')).toBeNull()
  })

  it('rifiuta password troppo corta', () => {
    expect(validatePassword('abc123')).not.toBeNull()
  })

  it('rifiuta password senza numero', () => {
    expect(validatePassword('passwordlunga')).not.toBeNull()
  })

  it('rifiuta stringa vuota', () => {
    expect(validatePassword('')).not.toBeNull()
  })
})

describe('validatePasswordMatch', () => {
  it('restituisce null se le password coincidono', () => {
    expect(validatePasswordMatch('password1', 'password1')).toBeNull()
  })

  it('restituisce errore se le password non coincidono', () => {
    expect(validatePasswordMatch('password1', 'password2')).not.toBeNull()
  })

  it('distingue maiuscole/minuscole', () => {
    expect(validatePasswordMatch('Password1', 'password1')).not.toBeNull()
  })

  it('rifiuta confirm vuoto', () => {
    expect(validatePasswordMatch('password1', '')).not.toBeNull()
  })
})

describe('mapAuthError', () => {
  it('mappa user_already_exists in messaggio italiano', () => {
    const msg = mapAuthError({ code: 'user_already_exists' })
    expect(msg).toMatch(/già registrata/i)
  })

  it('mappa "user already registered" in messaggio italiano', () => {
    const msg = mapAuthError({ message: 'User already registered' })
    expect(msg).toMatch(/già registrata/i)
  })

  it('mappa invalid_credentials in messaggio italiano', () => {
    const msg = mapAuthError({ code: 'invalid_credentials' })
    expect(msg).toMatch(/credenziali errate/i)
  })

  it('mappa "Invalid login credentials" in messaggio italiano', () => {
    const msg = mapAuthError({ message: 'Invalid login credentials' })
    expect(msg).toMatch(/credenziali errate/i)
  })

  it('mappa "email not confirmed" in messaggio italiano', () => {
    const msg = mapAuthError({ message: 'Email not confirmed' })
    expect(msg).toMatch(/non confermata/i)
  })

  it('mappa rate limit (status 429) in messaggio italiano', () => {
    const msg = mapAuthError({ status: 429 })
    expect(msg).toMatch(/troppi tentativi/i)
  })

  it('restituisce messaggio generico per errori sconosciuti', () => {
    const msg = mapAuthError({ message: 'Unexpected server error' })
    expect(msg).toMatch(/errore/i)
  })

  it('gestisce errore senza campi', () => {
    const msg = mapAuthError({})
    expect(typeof msg).toBe('string')
    expect(msg.length).toBeGreaterThan(0)
  })
})
