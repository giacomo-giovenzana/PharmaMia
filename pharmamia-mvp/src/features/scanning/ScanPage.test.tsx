import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { ScanPage } from './ScanPage'
import type { ScanError } from './useBarcodeScanner'

// ---------------------------------------------------------------------------
// Hoisted capture variable for onDetected callback
// ---------------------------------------------------------------------------
let capturedOnDetected: ((code: string) => void) | null = null

// ---------------------------------------------------------------------------
// Mock useBarcodeScanner
// ---------------------------------------------------------------------------
vi.mock('./useBarcodeScanner', () => ({
  useBarcodeScanner: vi.fn(({ onDetected }: { onDetected: (code: string) => void }) => {
    capturedOnDetected = onDetected
    return { scanning: true, result: null, error: null, toggleTorch: vi.fn() }
  }),
}))

// ---------------------------------------------------------------------------
// Mock drugLookup
// ---------------------------------------------------------------------------
vi.mock('./drugLookup', () => ({
  lookupByCode: vi.fn(),
}))

// ---------------------------------------------------------------------------
// Mock scan.css (handled by vitest's css transform, but explicit for safety)
// ---------------------------------------------------------------------------

import { useBarcodeScanner } from './useBarcodeScanner'
import { lookupByCode } from './drugLookup'
import type { DrugCatalogEntry } from './drugLookup'

const mockUseBarcodeScanner = useBarcodeScanner as Mock
const mockLookupByCode = lookupByCode as Mock

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------
function renderScanPage() {
  return render(
    <MemoryRouter initialEntries={['/scan']}>
      <Routes>
        <Route path="/scan" element={<ScanPage />} />
        <Route path="/medicine/new" element={<div>Form farmaco</div>} />
        <Route path="/" element={<div>Home</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('ScanPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    capturedOnDetected = null

    // Default: no error, scanner running
    mockUseBarcodeScanner.mockImplementation(
      ({ onDetected }: { onDetected: (code: string) => void }) => {
        capturedOnDetected = onDetected
        return { scanning: true, result: null, error: null, toggleTorch: vi.fn() }
      },
    )

    mockLookupByCode.mockResolvedValue(null)
  })

  it('mostra il link "Inserisci manualmente" quando non c\'è errore e lo sheet è nascosto', () => {
    renderScanPage()

    // The manual button outside the error overlay is visible when no error and sheet hidden
    const buttons = screen.getAllByRole('button', { name: /inserisci manualmente/i })
    expect(buttons.length).toBeGreaterThan(0)
  })

  it('mostra il chip di stato "In ascolto…" al primo render', () => {
    renderScanPage()
    expect(screen.getByText('In ascolto…')).toBeInTheDocument()
  })

  it('mostra l\'overlay di errore con il messaggio corretto quando error.type === "permission_denied"', () => {
    const error: ScanError = { type: 'permission_denied' }
    mockUseBarcodeScanner.mockImplementation(
      ({ onDetected }: { onDetected: (code: string) => void }) => {
        capturedOnDetected = onDetected
        return { scanning: false, result: null, error, toggleTorch: vi.fn() }
      },
    )

    renderScanPage()

    expect(screen.getByText('Fotocamera non disponibile')).toBeInTheDocument()
    expect(
      screen.getByText(
        /Permesso fotocamera negato\. Abilita l'accesso alla fotocamera nelle impostazioni del browser\./i,
      ),
    ).toBeInTheDocument()
  })

  it('mostra l\'overlay di errore quando error.type === "camera_unavailable"', () => {
    const error: ScanError = { type: 'camera_unavailable' }
    mockUseBarcodeScanner.mockImplementation(
      ({ onDetected }: { onDetected: (code: string) => void }) => {
        capturedOnDetected = onDetected
        return { scanning: false, result: null, error, toggleTorch: vi.fn() }
      },
    )

    renderScanPage()

    expect(screen.getByText('Fotocamera non disponibile')).toBeInTheDocument()
    expect(
      screen.getByText(/Nessuna fotocamera disponibile su questo dispositivo\./i),
    ).toBeInTheDocument()
  })

  it('mostra "Farmaco non trovato" nello sheet quando il codice non è nel database', async () => {
    mockLookupByCode.mockResolvedValue(null)

    renderScanPage()

    await act(async () => {
      capturedOnDetected?.('1234567890123')
    })

    await waitFor(() => {
      expect(screen.getByText('Farmaco non trovato')).toBeInTheDocument()
    })
  })

  it('mostra il nome del farmaco nello sheet quando il codice è trovato nel database', async () => {
    const drug: DrugCatalogEntry = {
      id: 'uuid-001',
      aic_code: '012345678',
      ean_code: '1234567890123',
      name: 'Tachipirina 1000mg',
      active_ingredient: 'Paracetamolo',
      form: 'Compresse',
      dosage: '1000 mg',
      atc_code: 'N02BE01',
      manufacturer: 'Angelini',
      package_desc: '20 compresse',
      is_otc: true,
      requires_prescription: false,
      created_at: '2024-01-01T00:00:00Z',
    }
    mockLookupByCode.mockResolvedValue(drug)

    renderScanPage()

    await act(async () => {
      capturedOnDetected?.('1234567890123')
    })

    await waitFor(() => {
      expect(screen.getByText('Tachipirina 1000mg')).toBeInTheDocument()
    })
  })

  it('mostra il pulsante "Inserisci manualmente" nell\'overlay di errore che naviga a /medicine/new', async () => {
    const user = userEvent.setup()
    const error: ScanError = { type: 'permission_denied' }
    mockUseBarcodeScanner.mockImplementation(
      ({ onDetected }: { onDetected: (code: string) => void }) => {
        capturedOnDetected = onDetected
        return { scanning: false, result: null, error, toggleTorch: vi.fn() }
      },
    )

    renderScanPage()

    // The "Inserisci manualmente" button appears inside the error overlay
    const btn = screen.getByRole('button', { name: /inserisci manualmente/i })
    await user.click(btn)

    await waitFor(() => {
      expect(screen.getByText('Form farmaco')).toBeInTheDocument()
    })
  })
})
