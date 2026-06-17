import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import './auth.css'

interface AccountMenuProps {
  onClose: () => void
}

export function AccountMenu({ onClose }: AccountMenuProps) {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const initials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : '?'

  async function handleSignOut() {
    setLoading(true)
    try {
      await signOut()
      navigate('/login', { replace: true })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="overlay-backdrop" onClick={onClose}>
        <div className="account-sheet" onClick={e => e.stopPropagation()}>
          <div className="account-head">
            <div className="avatar avatar-teal" style={{ width: 48, height: 48, fontSize: '1rem' }}>
              {initials}
            </div>
            <div className="account-head-info">
              <div className="account-head-name">{user?.email ?? ''}</div>
              <div className="account-head-mail">{user?.email ?? ''}</div>
            </div>
          </div>

          <div className="divider" style={{ margin: '8px 0' }} />

          <button
            className="account-menu-item danger"
            onClick={() => setConfirmOpen(true)}
          >
            <span className="account-menu-ico">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </span>
            <span className="account-menu-label">Esci</span>
          </button>

          <button className="btn btn-ghost btn-full mt-8" onClick={onClose}>
            Chiudi
          </button>
        </div>
      </div>

      {confirmOpen && (
        <div className="confirm-wrap">
          <div className="confirm-card slide-up">
            <div className="confirm-ico">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </div>
            <h2 className="confirm-title">Vuoi uscire?</h2>
            <p className="confirm-desc">La sessione verrà chiusa su questo dispositivo. Dovrai inserire di nuovo le tue credenziali per rientrare.</p>
            <div className="confirm-actions">
              <button className="btn btn-danger btn-full" onClick={handleSignOut} disabled={loading}>
                {loading ? 'Uscita in corso…' : 'Esci dall\'account'}
              </button>
              <button className="btn btn-ghost btn-full" onClick={() => setConfirmOpen(false)}>
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
