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
  lookupByGs1: vi.fn(),
}))

// ---------------------------------------------------------------------------
// Mock gs1 domain
// ---------------------------------------------------------------------------
vi.mock('@domain/gs1', () => ({
  parseGs1: vi.fn().mockReturnValue(null),
}))

import { useBarcodeScanner } from './useBarcodeScanner'
import { lookupByCode, lookupByGs1 } from './drugLookup'
import { parseGs1 } from '@domain/gs1'
import type { DrugCatalogEntry } from './drugLookup'

const mockUseBarcodeScanner = useBarcodeScanner as Mock
const mockLookupByCode = lookupByCode as Mock
const mockLookupByGs1 = lookupByGs1 as Mock
const mockParseGs1 = parseGs1 as Mock

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
    mockLookupByGs1.mockResolvedValue(null)
    mockParseGs1.mockReturnValue(null) // default: not a GS1 code
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

  // ---------------------------------------------------------------------------
  // GS1 DataMatrix flows (US-022)
  // ---------------------------------------------------------------------------

  it('DataMatrix farmaco trovato: mostra lo sheet "Farmaco trovato" e naviga con gs1Prefill', async () => {
    const user = userEvent.setup()
    const drug: DrugCatalogEntry = {
      id: 'uuid-001',
      aic_code: '012345678',
      ean_code: '7007123456784',
      name: 'Tachipirina 1000mg',
      active_ingredient: 'Paracetamolo',
      form: 'Compresse',
      dosage: null,
      atc_code: null,
      manufacturer: null,
      package_desc: null,
      is_otc: true,
      requires_prescription: false,
      created_at: '2024-01-01T00:00:00Z',
    }

    mockParseGs1.mockReturnValue({
      gtin: '07007123456784',
      expiresAt: '2027-03-31',
      lot: 'LOT1',
      serial: 'SER1',
    })
    mockLookupByGs1.mockResolvedValue(drug)

    const { getByRole } = renderScanPage()

    await act(async () => {
      capturedOnDetected?.('010700712345678417270331\x1d10LOT1\x1d21SER1')
    })

    await waitFor(() => {
      expect(screen.getByText('Tachipirina 1000mg')).toBeInTheDocument()
    })

    // Navigate to form
    const addBtn = getByRole('button', { name: /aggiungi all'inventario/i })
    await user.click(addBtn)

    await waitFor(() => {
      expect(screen.getByText('Form farmaco')).toBeInTheDocument()
    })
  })

  it('DataMatrix farmaco non a catalogo: mostra lo sheet "Prodotto non in catalogo AIFA"', async () => {
    mockParseGs1.mockReturnValue({
      gtin: '09999999999999',
      expiresAt: '2027-06-30',
      lot: 'LOTTO99',
      serial: null,
    })
    mockLookupByGs1.mockResolvedValue(null)

    renderScanPage()

    await act(async () => {
      capturedOnDetected?.('010999999999999917270630\x1d10LOTTO99')
    })

    await waitFor(() => {
      expect(screen.getByText('Prodotto non in catalogo AIFA')).toBeInTheDocument()
    })
  })

  it('barcode lineare ancora funzionante dopo l\'aggiunta GS1 (regressione)', async () => {
    // parseGs1 returns null → falls through to lookupByCode
    mockParseGs1.mockReturnValue(null)
    mockLookupByCode.mockResolvedValue(null)

    renderScanPage()

    await act(async () => {
      capturedOnDetected?.('1234567890123')
    })

    await waitFor(() => {
      expect(screen.getByText('Farmaco non trovato')).toBeInTheDocument()
    })

    expect(mockLookupByCode).toHaveBeenCalledWith('1234567890123')
    expect(mockLookupByGs1).not.toHaveBeenCalled()
  })
})
