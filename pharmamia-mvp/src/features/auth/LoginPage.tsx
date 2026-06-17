import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { validateEmail, mapAuthError } from './validation'
import './auth.css'

export function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [globalError, setGlobalError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setGlobalError(null)

    const emailErr = validateEmail(email)
    setEmailError(emailErr)
    if (emailErr) return

    setLoading(true)
    try {
      await signIn(email, password)
      navigate('/', { replace: true })
    } catch (err: unknown) {
      setGlobalError(mapAuthError(err as { message?: string; code?: string; status?: number }))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-hero">
        <div className="logo">
          <div className="logo-mark">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/>
              <path d="m8.5 8.5 7 7"/>
            </svg>
          </div>
          <span className="logo-wordmark">Pharma<span>Mia</span></span>
        </div>
        <h1 className="auth-title">Bentornata</h1>
        <p className="auth-subtitle">Accedi per ritrovare il tuo armadietto dei farmaci, sincronizzato su ogni dispositivo.</p>
      </div>

      <form className="auth-body" onSubmit={handleSubmit} noValidate>
        {globalError && (
          <div className="form-notice danger" role="alert">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span><strong>Credenziali errate.</strong> <span className="form-notice-text">{globalError}</span></span>
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
            {emailError}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="password">Password</label>
          <div className="input-affix">
            <input
              className="form-input"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="current-password"
              placeholder="La tua password"
              value={password}
              onChange={e => setPassword(e.target.value)}
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
        </div>

        <div className="auth-aux">
          <span />
          <span className="auth-link" style={{ cursor: 'default' }}>Password dimenticata?</span>
        </div>

        <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
          {loading ? 'Accesso in corso…' : 'Accedi'}
          {!loading && (
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
            </svg>
          )}
        </button>
      </form>

      <div className="auth-footer">
        Non hai un account? <Link to="/register">Registrati</Link>
      </div>
    </div>
  )
}
