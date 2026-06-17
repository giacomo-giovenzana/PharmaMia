import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import type { Database } from '@shared/supabase/database.types'
import { getMedicationById } from './medicationsRepo'
import { getExpiryStatus, daysUntilExpiry } from '@domain/medicationExpiry'
import type { ExpiryStatus } from '@domain/medicationExpiry'
import './medicine-detail.css'

type MedicationRow = Database['public']['Tables']['medications']['Row']

function formatDate(iso: string): string {
  // Converts 'yyyy-mm-dd' → 'dd/mm/yyyy'
  const [year, month, day] = iso.split('-')
  return `${day}/${month}/${year}`
}

function ExpiryBanner({ expiresAt }: { expiresAt: string | null }) {
  if (!expiresAt) {
    return (
      <div className="md-expiry-banner ok">
        <div className="md-expiry-banner-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>
        <div className="md-expiry-banner-body">
          <div className="md-expiry-banner-label">Scadenza</div>
          <div className="md-expiry-banner-date">Non impostata</div>
          <div className="md-expiry-banner-note">Nessuna data di scadenza registrata</div>
        </div>
      </div>
    )
  }

  const status: ExpiryStatus = getExpiryStatus(expiresAt)
  const days = daysUntilExpiry(expiresAt)

  const labelMap: Record<ExpiryStatus, string> = {
    ok: 'Valida',
    warning: 'In scadenza',
    danger: 'Scaduta',
  }

  function expiryNote(): string {
    if (status === 'danger') {
      const absDays = Math.abs(days)
      return absDays === 0 ? 'Scaduta oggi' : `Scaduta da ${absDays} giorn${absDays === 1 ? 'o' : 'i'}`
    }
    if (days === 0) return 'Scade oggi'
    return `Mancan${days === 1 ? 'o' : 'o'} ${days} giorn${days === 1 ? 'o' : 'i'} · usa o sostituisci a breve`
  }

  const badgeClass = status === 'warning' ? 'md-badge md-badge-warning' : status === 'danger' ? 'md-badge md-badge-danger' : undefined

  return (
    <div className={`md-expiry-banner ${status}`}>
      <div className="md-expiry-banner-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      </div>
      <div className="md-expiry-banner-body">
        <div className="md-expiry-banner-label">{labelMap[status]}</div>
        <div className="md-expiry-banner-date">Scade il {formatDate(expiresAt)}</div>
        <div className="md-expiry-banner-note">{expiryNote()}</div>
      </div>
      {badgeClass && (
        <span className={badgeClass}>
          {status === 'danger' ? `${Math.abs(days)}g fa` : `${days} giorni`}
        </span>
      )}
    </div>
  )
}

export function MedicineDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [medication, setMedication] = useState<MedicationRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) {
      setError('ID farmaco non valido.')
      setLoading(false)
      return
    }

    setLoading(true)
    getMedicationById(id)
      .then(data => {
        setMedication(data)
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Impossibile caricare il farmaco.'
        setError(msg)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [id])

  if (loading) {
    return (
      <div className="md-screen">
        <div className="md-topbar">
          <button
            className="md-topbar-back"
            aria-label="Torna indietro"
            onClick={() => navigate(-1)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <span className="md-topbar-title">Scheda farmaco</span>
        </div>
        <div className="md-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 60 }}>
          <span style={{ color: 'var(--c-text-3)', fontSize: '.9rem' }}>Caricamento…</span>
        </div>
      </div>
    )
  }

  if (error || !medication) {
    return (
      <div className="md-screen">
        <div className="md-topbar">
          <button
            className="md-topbar-back"
            aria-label="Torna indietro"
            onClick={() => navigate(-1)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <span className="md-topbar-title">Scheda farmaco</span>
        </div>
        <div className="md-body" style={{ padding: '20px' }}>
          <div
            style={{
              background: 'var(--c-danger-lt)',
              border: '1px solid rgba(214,78,78,.18)',
              borderRadius: 'var(--r-md)',
              padding: '14px 16px',
              color: 'var(--c-danger)',
              fontSize: '.85rem',
              fontWeight: 500,
            }}
            role="alert"
          >
            {error ?? 'Farmaco non trovato.'}
          </div>
          <button
            className="btn btn-ghost"
            style={{ marginTop: 16 }}
            onClick={() => navigate(-1)}
          >
            Torna indietro
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="md-screen">
      {/* Topbar */}
      <div className="md-topbar">
        <button
          className="md-topbar-back"
          aria-label="Torna indietro"
          onClick={() => navigate(-1)}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span className="md-topbar-title">Scheda farmaco</span>
        <div className="md-topbar-actions">
          <button
            className="md-topbar-icon-btn"
            aria-label="Modifica farmaco"
            title="Modifica"
            onClick={() => navigate(`/medicine/${id}/edit`)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z" />
            </svg>
          </button>
        </div>
      </div>

      <div className="md-body">
        {/* Hero */}
        <div className="md-hero">
          <div className="md-hero-icon">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
            </svg>
          </div>
          <div className="md-hero-name">{medication.name}</div>
          {medication.notes && (
            <div className="md-hero-sub">{medication.notes}</div>
          )}
        </div>

        {/* Expiry banner */}
        <ExpiryBanner expiresAt={medication.expires_at} />

        {/* Info grid */}
        <div className="md-info-grid">
          {/* Quantity tile */}
          <div className="md-info-tile">
            <div className="md-info-tile-head">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              </svg>
              Disponibili
            </div>
            <div>
              <span className="md-info-tile-val">{medication.quantity}</span>
            </div>
            <div className="md-info-tile-unit">{medication.unit}</div>
          </div>

          {/* Location tile */}
          <div className="md-info-tile">
            <div className="md-info-tile-head">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              Posizione
            </div>
            {medication.location ? (
              <div className="md-info-tile-text">{medication.location}</div>
            ) : (
              <div className="md-info-tile-text muted">Non impostata</div>
            )}
          </div>
        </div>

        {/* Detail rows */}
        <div className="md-detail-list">
          {/* Expiry date row */}
          <div className="md-detail-row">
            <span className="md-detail-row-key">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              Data di scadenza
            </span>
            <span className="md-detail-row-val">
              {medication.expires_at ? formatDate(medication.expires_at) : '—'}
            </span>
          </div>

          {/* Quantity row */}
          <div className="md-detail-row">
            <span className="md-detail-row-key">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              </svg>
              Quantità disponibile
            </span>
            <span className="md-detail-row-val">
              {medication.quantity} {medication.unit}
            </span>
          </div>

          {/* Location row */}
          <div className="md-detail-row">
            <span className="md-detail-row-key">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              Posizione
            </span>
            <span className="md-detail-row-val">
              {medication.location ?? '—'}
            </span>
          </div>

          {/* Lot row — only if present */}
          {medication.lot && (
            <div className="md-detail-row">
              <span className="md-detail-row-key">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                </svg>
                Lotto
              </span>
              <span className="md-detail-row-val">{medication.lot}</span>
            </div>
          )}

          {/* Serial row — only if present */}
          {medication.serial && (
            <div className="md-detail-row">
              <span className="md-detail-row-key">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
                  <circle cx="12" cy="12" r="2" />
                </svg>
                Numero seriale
              </span>
              <span className="md-detail-row-val">{medication.serial}</span>
            </div>
          )}

          {/* Notes row — only if present */}
          {medication.notes && (
            <div className="md-detail-row">
              <span className="md-detail-row-key">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
                Note
              </span>
              <span className="md-detail-row-val">{medication.notes}</span>
            </div>
          )}
        </div>

        <div style={{ height: 24 }} />
      </div>

      {/* Footer */}
      <div className="md-footer">
        <button
          type="button"
          className="btn btn-ghost"
          style={{ flexShrink: 0 }}
          onClick={() => navigate(-1)}
        >
          Indietro
        </button>
        <button
          type="button"
          className="btn btn-primary btn-full"
          onClick={() => navigate(`/medicine/${id}/edit`)}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z" />
          </svg>
          Modifica
        </button>
      </div>
    </div>
  )
}
