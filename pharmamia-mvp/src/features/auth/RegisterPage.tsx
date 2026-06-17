import { useState, type FormEvent, type ChangeEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { validateEmail, validatePassword, validatePasswordMatch, mapAuthError } from './validation'
import './auth.css'

function passwordStrength(pw: string): number {
  if (pw.length === 0) return 0
  const hasLen = pw.length >= 8
  const hasNum = /\d/.test(pw)
  const hasMix = /[a-z]/.test(pw) && /[A-Z]/.test(pw)
  const hasSym = /[^A-Za-z0-9]/.test(pw)
  if (hasLen && hasNum && hasMix && hasSym) return 4
  if (hasLen && hasNum && (hasMix || hasSym)) return 3
  if (hasLen && hasNum) return 2
  return 1
}

export function RegisterPage() {
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [confirmError, setConfirmError] = useState<string | null>(null)
  const [globalError, setGlobalError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const strength = passwordStrength(password)
  const hasLen = password.length >= 8
  const hasNum = /\d/.test(password)

  function handlePasswordChange(e: ChangeEvent<HTMLInputElement>) {
    setPassword(e.target.value)
    setPasswordError(null)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setGlobalError(null)

    const emailErr = validateEmail(email)
    const pwErr = validatePassword(password)
    const confirmErr = validatePasswordMatch(password, confirm)

    setEmailError(emailErr)
    setPasswordError(pwErr)
    setConfirmError(confirmErr)

    if (emailErr || pwErr || confirmErr) return

    setLoading(true)
    try {
      await signUp(email, password)
      navigate(`/verify-email?email=${encodeURIComponent(email)}`, { replace: true })
    } catch (err: unknown) {
      const mapped = mapAuthError(err as { message?: string; code?: string; status?: number })
      setGlobalError(mapped)
      if (mapped.includes('già registrata')) setEmailError(' ')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-hero" style={{ paddingTop: 36, paddingBottom: 22 }}>
        <div className="logo">
          <div className="logo-mark">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/>
              <path d="m8.5 8.5 7 7"/>
            </svg>
          </div>
          <span className="logo-wordmark">Pharma<span>Mia</span></span>
        </div>
        <h1 className="auth-title">Crea il tuo account</h1>
        <p className="auth-subtitle">Bastano un'email e una password per mettere al sicuro i tuoi farmaci.</p>
      </div>

      <form className="auth-body" onSubmit={handleSubmit} noValidate>
        {globalError && (
          <div className="form-notice danger" role="alert">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span>
              <strong>
                {globalError.includes('già registrata') ? 'Email già registrata.' : 'Errore.'}
              </strong>{' '}
              <span className="form-notice-text">{globalError}</span>
            </span>
          </div>
        )}

        <div className={`form-group${emailError ? ' is-invalid' : ''}`}>
          <label className="form-label" htmlFor="email">Email</label>
          <input
            className="form-input"
            type="email"
            id="email"
            inputMode="email"
            autoComplete="email"
            placeholder="giulia@email.it"
            value={email}
            onChange={e => { setEmail(e.target.value); setEmailError(null) }}
          />
          <div className="field-error">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            Inserisci un'email valida
          </div>
        </div>

        <div className={`form-group${passwordError ? ' is-invalid' : ''}`}>
          <label className="form-label" htmlFor="password">Password</label>
          <div className="input-affix">
            <input
              className="form-input"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="new-password"
              placeholder="Almeno 8 caratteri"
              value={password}
              onChange={handlePasswordChange}
            />
            <button
              type="button"
              className="input-affix-btn"
              aria-label={showPassword ? 'Nascondi password' : 'Mostra password'}
              onClick={() => setShowPassword(v => !v)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>
              </svg>
            </button>
          </div>
          {password.length > 0 && (
            <>
              <div className="pw-strength" data-level={strength}>
                <span className="pw-bar"/><span className="pw-bar"/><span className="pw-bar"/><span className="pw-bar"/>
              </div>
              <ul className="pw-rules">
                <li className={`pw-rule${hasLen ? ' ok' : ''}`}>
                  <span className="pw-rule-dot">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </span>
                  Almeno 8 caratteri
                </li>
                <li className={`pw-rule${hasNum ? ' ok' : ''}`}>
                  <span className="pw-rule-dot">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </span>
                  Almeno un numero
                </li>
              </ul>
            </>
          )}
          <div className="field-error">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {passwordError}
          </div>
        </div>

        <div className={`form-group${confirmError ? ' is-invalid' : ''}`}>
          <label className="form-label" htmlFor="confirm">Conferma password</label>
          <div className="input-affix">
            <input
              className="form-input"
              type={showConfirm ? 'text' : 'password'}
              id="confirm"
              autoComplete="new-password"
              placeholder="Ripeti la password"
              value={confirm}
              onChange={e => { setConfirm(e.target.value); setConfirmError(null) }}
            />
            <button
              type="button"
              className="input-affix-btn"
              aria-label={showConfirm ? 'Nascondi password' : 'Mostra password'}
              onClick={() => setShowConfirm(v => !v)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>
              </svg>
            </button>
          </div>
          <div className="field-error">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            Le password non coincidono
          </div>
        </div>

        <p className="field-hint" style={{ margin: '-2px 0 18px' }}>
          Registrandoti accetti i{' '}
          <span className="auth-link" style={{ fontSize: '.72rem' }}>Termini</span>
          {' '}e l'
          <span className="auth-link" style={{ fontSize: '.72rem' }}>Informativa privacy</span>.
        </p>

        <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
          {loading ? 'Creazione account…' : 'Crea account'}
          {!loading && (
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
            </svg>
          )}
        </button>
      </form>

      <div className="auth-footer">
        Hai già un account? <Link to="/login">Accedi</Link>
      </div>
    </div>
  )
}
