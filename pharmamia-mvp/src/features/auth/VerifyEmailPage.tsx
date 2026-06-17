import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { supabase } from '@shared/supabase/client'
import './auth.css'

export function VerifyEmailPage() {
  const [params] = useSearchParams()
  const email = params.get('email') ?? ''
  const [resendLoading, setResendLoading] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [toastVisible, setToastVisible] = useState(false)

  async function handleResend() {
    if (resendLoading || cooldown > 0) return
    setResendLoading(true)
    try {
      await supabase.auth.resend({ type: 'signup', email })
      setToastVisible(true)
      setTimeout(() => setToastVisible(false), 2600)
      setCooldown(30)
      const timer = setInterval(() => {
        setCooldown(s => {
          if (s <= 1) { clearInterval(timer); return 0 }
          return s - 1
        })
      }, 1000)
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <div className="auth-screen" style={{ position: 'relative' }}>
      <div className="topbar">
        <Link to="/register" className="topbar-back" aria-label="Torna alla registrazione">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
        </Link>
        <span className="topbar-title">Verifica email</span>
      </div>

      <div className="verify-wrap">
        <div className="verify-icon">
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="2"/>
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
          </svg>
        </div>

        <h1 className="auth-title">Controlla la tua email</h1>
        <p className="auth-subtitle" style={{ marginTop: 8 }}>Ti abbiamo inviato un link di conferma a:</p>

        <div className="verify-email-pill">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--c-primary)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 5L2 7"/>
          </svg>
          <span>{email || 'la tua email'}</span>
        </div>

        <div className="verify-steps">
          <div className="verify-step">
            <span className="verify-step-num">1</span>
            <span className="verify-step-text">Apri l'email di <strong>PharmaMia</strong> nella tua casella di posta.</span>
          </div>
          <div className="verify-step">
            <span className="verify-step-num">2</span>
            <span className="verify-step-text">Tocca il pulsante <strong>"Conferma email"</strong> nel messaggio.</span>
          </div>
          <div className="verify-step">
            <span className="verify-step-num">3</span>
            <span className="verify-step-text">Torna qui: verrai portata direttamente alla tua dashboard.</span>
          </div>
        </div>

        <button
          className="btn btn-outline btn-full"
          onClick={handleResend}
          disabled={resendLoading || cooldown > 0}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/>
          </svg>
          {cooldown > 0 ? `Reinvia tra ${cooldown}s` : 'Reinvia email'}
        </button>

        <p className="resend-row">
          Email sbagliata? <Link to="/register" className="auth-link" style={{ fontSize: '.8rem' }}>Modifica indirizzo</Link>
        </p>
        <p className="resend-row" style={{ marginTop: 8 }}>
          <Link to="/login" className="auth-link" style={{ fontSize: '.8rem' }}>Torna all'accesso</Link>
        </p>
      </div>

      {toastVisible && (
        <div className="confirm-wrap" style={{ background: 'transparent', alignItems: 'flex-end', padding: '0 0 28px' }}>
          <div style={{
            background: 'var(--c-text)',
            color: '#fff',
            fontSize: '.8rem',
            fontWeight: 600,
            padding: '11px 18px',
            borderRadius: 'var(--r-full)',
            boxShadow: 'var(--sh-lg)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4FD3A8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            Email di conferma reinviata
          </div>
        </div>
      )}
    </div>
  )
}
