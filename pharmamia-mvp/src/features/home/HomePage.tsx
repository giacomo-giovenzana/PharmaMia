import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@features/auth/AuthContext'
import { AccountMenu } from '@features/auth/AccountMenu'

export function HomePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [accountOpen, setAccountOpen] = useState(false)

  const initials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : '?'

  return (
    <div style={{ minHeight: '100svh', background: 'var(--c-surface-2)' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '32px 20px 16px',
        background: 'var(--c-surface)',
      }}>
        <div>
          <div style={{ fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--c-text-3)' }}>
            PharmaMia
          </div>
          <div style={{ fontFamily: 'var(--f-display)', fontSize: '1.4rem', fontWeight: 600, color: 'var(--c-text)' }}>
            Il tuo armadietto 💊
          </div>
        </div>
        <button
          className="avatar avatar-teal"
          style={{ width: 40, height: 40, fontSize: '.85rem', cursor: 'pointer', border: 'none' }}
          aria-label="Menu account"
          onClick={() => setAccountOpen(true)}
        >
          {initials}
        </button>
      </div>

      <div className="section" style={{ padding: '24px 20px' }}>
        <p style={{ color: 'var(--c-text-2)', fontSize: '.9rem' }}>
          Nessun farmaco aggiunto. Inizia aggiungendo il primo medicinale al tuo armadietto.
        </p>
        <button
          className="btn btn-primary btn-full"
          style={{ marginTop: 16 }}
          onClick={() => navigate('/scan')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M7 7h2v2H7z" fill="currentColor" />
            <path d="M7 15h2v2H7z" fill="currentColor" />
            <path d="M15 7h2v2h-2z" fill="currentColor" />
            <line x1="11" y1="7" x2="11" y2="9" />
            <line x1="11" y1="11" x2="11" y2="13" />
            <line x1="13" y1="11" x2="17" y2="11" />
            <line x1="13" y1="13" x2="13" y2="17" />
            <line x1="15" y1="15" x2="17" y2="15" />
            <line x1="17" y1="13" x2="17" y2="17" />
          </svg>
          Aggiungi farmaco
        </button>
      </div>

      {accountOpen && (
        <AccountMenu onClose={() => setAccountOpen(false)} />
      )}
    </div>
  )
}
