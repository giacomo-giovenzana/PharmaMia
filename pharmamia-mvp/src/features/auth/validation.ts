const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

export function validateEmail(email: string): string | null {
  if (!EMAIL_RE.test(email.trim())) return 'Inserisci un\'email valida'
  return null
}

export function validatePassword(password: string): string | null {
  if (password.length < 8) return 'La password deve avere almeno 8 caratteri'
  if (!/\d/.test(password)) return 'La password deve contenere almeno un numero'
  return null
}

export function validatePasswordMatch(password: string, confirm: string): string | null {
  if (password !== confirm) return 'Le password non coincidono'
  return null
}

interface AuthError {
  message?: string
  code?: string
  status?: number
}

export function mapAuthError(error: AuthError): string {
  const msg = error.message?.toLowerCase() ?? ''
  const code = error.code ?? ''

  if (
    code === 'user_already_exists' ||
    msg.includes('user already registered') ||
    msg.includes('already been registered') ||
    msg.includes('email address is already registered')
  ) {
    return 'Email già registrata. Esiste già un account con questa email.'
  }

  if (msg.includes('email not confirmed')) {
    return 'Email non confermata. Controlla la tua casella di posta.'
  }

  if (msg.includes('rate limit') || error.status === 429) {
    return 'Troppi tentativi. Attendi qualche minuto e riprova.'
  }

  if (
    code === 'invalid_credentials' ||
    msg.includes('invalid login credentials') ||
    msg.includes('invalid_credentials') ||
    (!msg.includes('email not confirmed') && msg.includes('invalid'))
  ) {
    return 'Credenziali errate. Controlla l\'email e la password e riprova.'
  }

  if (msg.includes('network') || msg.includes('fetch')) {
    return 'Errore di connessione. Verifica la tua connessione Internet.'
  }

  return 'Si è verificato un errore. Riprova più tardi.'
}
