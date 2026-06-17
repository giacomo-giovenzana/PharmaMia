import { useCallback, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBarcodeScanner, type ScanError } from './useBarcodeScanner'
import { lookupByCode, type DrugCatalogEntry } from './drugLookup'
import './scan.css'

type SheetState =
  | { type: 'hidden' }
  | { type: 'found';     drug: DrugCatalogEntry }
  | { type: 'not_found'; code: string }

function errorMessage(error: ScanError): string {
  switch (error.type) {
    case 'permission_denied':
      return 'Permesso fotocamera negato. Abilita l\'accesso alla fotocamera nelle impostazioni del browser.'
    case 'camera_unavailable':
      return 'Nessuna fotocamera disponibile su questo dispositivo.'
    case 'api_unavailable':
      return 'Il browser non supporta l\'accesso alla fotocamera. Usa un browser moderno.'
    case 'scan_failed':
      return 'Errore durante la scansione. Riprova o inserisci il codice manualmente.'
  }
}

export function ScanPage() {
  const navigate = useNavigate()
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [sheet, setSheet] = useState<SheetState>({ type: 'hidden' })
  const [torchOn, setTorchOn] = useState(false)
  const [scanState, setScanState] = useState<'listening' | 'detected' | 'found'>('listening')

  const handleDetected = useCallback(async (code: string) => {
    setScanState('detected')
    const drug = await lookupByCode(code)
    if (drug) {
      setScanState('found')
      setSheet({ type: 'found', drug })
    } else {
      setScanState('found')
      setSheet({ type: 'not_found', code })
    }
  }, [])

  const { error, toggleTorch } = useBarcodeScanner({ videoRef, onDetected: handleDetected })

  async function handleTorchToggle() {
    await toggleTorch()
    setTorchOn(v => !v)
  }

  function resetScan() {
    setSheet({ type: 'hidden' })
    setScanState('listening')
  }

  const chipLabel =
    scanState === 'detected' ? 'Codice rilevato…' :
    scanState === 'found'    ? 'Trovato!' :
    'In ascolto…'

  const dotClass =
    scanState === 'detected' ? 'scan-dot detected' :
    scanState === 'found'    ? 'scan-dot found' :
    'scan-dot'

  return (
    <div className="scan-screen">
      {/* Top bar */}
      <div className="scan-topbar">
        <button
          className="scan-topbar-close"
          aria-label="Chiudi scansione"
          onClick={() => navigate('/')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <span className="scan-topbar-title">Scansione farmaco</span>
        <button
          className={`scan-topbar-torch${torchOn ? ' torch-on' : ''}`}
          aria-label={torchOn ? 'Spegni torcia' : 'Accendi torcia'}
          onClick={() => { void handleTorchToggle() }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
        </button>
      </div>

      {/* Camera viewport */}
      <div className="scan-viewport">
        {/* Simulated camera background */}
        <div className="scan-camera" />

        {/* Real video (visually hidden behind overlay) */}
        <video
          ref={videoRef}
          className="scan-video"
          autoPlay
          playsInline
          muted
        />

        {/* Dark overlays creating cut-out */}
        <div className="scan-overlay-top" />
        <div className="scan-overlay-bottom" />
        <div className="scan-overlay-left" />
        <div className="scan-overlay-right" />

        {/* Status chip */}
        <div className="scan-indicator">
          <div className="scan-state-chip">
            <span className={dotClass} />
            {chipLabel}
          </div>
        </div>

        {/* Scan frame with corners and animated line */}
        <div className="scan-frame">
          <div className="scan-frame-corners">
            <div className="scan-corner tl" />
            <div className="scan-corner tr" />
            <div className="scan-corner bl" />
            <div className="scan-corner br" />
            <div className="scan-line" />
          </div>
        </div>

        {/* Hint text */}
        {!error && (
          <div className="scan-hint">
            Inquadra il barcode o il codice AIC<br />della confezione del farmaco
          </div>
        )}

        {/* Manual entry button */}
        {!error && sheet.type === 'hidden' && (
          <div className="scan-manual">
            <button
              className="scan-manual-btn"
              onClick={() => navigate('/medicine/new')}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Inserisci manualmente
            </button>
          </div>
        )}

        {/* Camera / scan error overlay */}
        {error && (
          <div className="scan-error-overlay">
            <div className="scan-error-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <div className="scan-error-title">Fotocamera non disponibile</div>
            <div className="scan-error-desc">{errorMessage(error)}</div>
            <button
              className="scan-manual-btn"
              style={{ marginTop: 8 }}
              onClick={() => navigate('/medicine/new')}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Inserisci manualmente
            </button>
          </div>
        )}

        {/* Result bottom sheet — found */}
        {sheet.type === 'found' && (
          <div className="result-sheet">
            <div className="result-handle" />
            <div className="result-found-tag">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Farmaco trovato nel database AIFA
            </div>
            <div className="result-med-name">{sheet.drug.name}</div>
            <div className="result-med-sub">
              {[sheet.drug.active_ingredient, sheet.drug.manufacturer, sheet.drug.package_desc]
                .filter(Boolean)
                .join(' · ')}
            </div>

            <div className="result-db-row">
              <div className="result-db-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <ellipse cx="12" cy="5" rx="9" ry="3" />
                  <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                  <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                </svg>
              </div>
              {sheet.drug.form || sheet.drug.dosage ? (
                <>
                  {sheet.drug.form && (
                    <div className="result-db-info">
                      <div className="result-db-label">Forma</div>
                      <div className="result-db-val">{sheet.drug.form}</div>
                    </div>
                  )}
                  {sheet.drug.dosage && (
                    <div className="result-db-info">
                      <div className="result-db-label">Dosaggio</div>
                      <div className="result-db-val">{sheet.drug.dosage}</div>
                    </div>
                  )}
                </>
              ) : (
                <div className="result-db-info">
                  <div className="result-db-label">Codice AIC</div>
                  <div className="result-db-val">{sheet.drug.aic_code}</div>
                </div>
              )}
            </div>

            <div className="result-actions">
              <button
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={() => navigate('/medicine/new', { state: { draft: sheet.type === 'found' ? sheet.drug : null } })}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Aggiungi all'inventario
              </button>
              <button className="btn btn-ghost" onClick={resetScan} aria-label="Scansiona di nuovo">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <polyline points="1 4 1 10 7 10" />
                  <path d="M3.51 15a9 9 0 1 0 .49-3.78" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Result bottom sheet — not found */}
        {sheet.type === 'not_found' && (
          <div className="result-sheet">
            <div className="result-handle" />
            <div className="result-not-found-tag">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
              Farmaco non trovato
            </div>
            <div className="result-med-name">Codice non riconosciuto</div>
            <div className="result-not-found-text">
              Farmaco non trovato nel database AIFA per il codice <strong>{sheet.code}</strong>.
              Puoi inserire i dati manualmente.
            </div>
            <div className="result-actions">
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={resetScan}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <polyline points="1 4 1 10 7 10" />
                  <path d="M3.51 15a9 9 0 1 0 .49-3.78" />
                </svg>
                Riprova
              </button>
              <button
                className="btn btn-ghost"
                onClick={() => navigate('/medicine/new')}
              >
                Inserisci manualmente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
