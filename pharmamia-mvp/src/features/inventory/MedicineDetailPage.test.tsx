import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { MedicineDetailPage } from './MedicineDetailPage'

// ---------------------------------------------------------------------------
// Mock medicationsRepo
// ---------------------------------------------------------------------------
vi.mock('./medicationsRepo', () => ({
  getMedicationById: vi.fn(),
  updateMedication: vi.fn(),
  insertMedication: vi.fn(),
}))

import { getMedicationById } from './medicationsRepo'

const mockGetMedicationById = getMedicationById as Mock

// ---------------------------------------------------------------------------
// Sample medication — far-future expiry → status 'ok', no mocking of domain fns needed
// ---------------------------------------------------------------------------
const sampleMed = {
  id: 'med-001',
  household_id: 'hh-001',
  catalog_id: null,
  name: 'Tachipirina 1000mg',
  quantity: 15,
  unit: 'compresse',
  expires_at: '2099-12-31',
  location: 'Armadietto bagno',
  notes: 'Principio attivo: Paracetamolo',
  lot: null,
  serial: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function renderDetail(id = 'med-001') {
  return render(
    <MemoryRouter initialEntries={[`/medicine/${id}`]}>
      <Routes>
        <Route path="/medicine/:id" element={<MedicineDetailPage />} />
        <Route path="/medicine/:id/edit" element={<div>EditPage</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('MedicineDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('mostra il testo di caricamento mentre il dato viene recuperato', () => {
    // Never resolves during this test
    mockGetMedicationById.mockReturnValue(new Promise(() => {}))

    renderDetail()

    expect(screen.getByText(/caricamento/i)).toBeInTheDocument()
  })

  it('mostra nome, quantità + unità e posizione quando il caricamento ha successo', async () => {
    mockGetMedicationById.mockResolvedValue(sampleMed)

    renderDetail()

    await waitFor(() => {
      expect(screen.getByText('Tachipirina 1000mg')).toBeInTheDocument()
    })

    // Quantity value and unit appear in the info tile
    expect(screen.getByText('15')).toBeInTheDocument()
    expect(screen.getByText('compresse')).toBeInTheDocument()

    // Location appears in the tile
    expect(screen.getAllByText('Armadietto bagno').length).toBeGreaterThan(0)
  })

  it('mostra la data di scadenza formattata come dd/mm/yyyy', async () => {
    mockGetMedicationById.mockResolvedValue(sampleMed)

    renderDetail()

    await waitFor(() => {
      // 2099-12-31 → 31/12/2099 — appears in both expiry banner and detail row
      const matches = screen.getAllByText(/31\/12\/2099/)
      expect(matches.length).toBeGreaterThanOrEqual(1)
    })
  })

  it('mostra il banner di errore quando getMedicationById lancia un\'eccezione', async () => {
    mockGetMedicationById.mockRejectedValue(new Error('Farmaco non trovato'))

    renderDetail()

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getByText(/farmaco non trovato/i)).toBeInTheDocument()
    })
  })

  it('mostra "Non impostata" nel tile posizione quando la posizione è null', async () => {
    mockGetMedicationById.mockResolvedValue({ ...sampleMed, location: null })

    renderDetail()

    await waitFor(() => {
      expect(screen.getByText('Non impostata')).toBeInTheDocument()
    })
  })

  it('mostra "—" nel dettaglio posizione quando la posizione è null', async () => {
    mockGetMedicationById.mockResolvedValue({ ...sampleMed, location: null })

    renderDetail()

    await waitFor(() => {
      // The detail row renders medication.location ?? '—'
      expect(screen.getByText('—')).toBeInTheDocument()
    })
  })

  it('mostra lotto e seriale nelle righe di dettaglio quando presenti (US-022)', async () => {
    const medWithLot = { ...sampleMed, lot: 'LOT-VISIBLE', serial: 'SER-VISIBLE' }
    mockGetMedicationById.mockResolvedValue(medWithLot)

    renderDetail()

    await waitFor(() => {
      expect(screen.getByText('LOT-VISIBLE')).toBeInTheDocument()
      expect(screen.getByText('SER-VISIBLE')).toBeInTheDocument()
    })

    expect(screen.getByText('Lotto')).toBeInTheDocument()
    expect(screen.getByText('Numero seriale')).toBeInTheDocument()
  })

  it('non mostra le righe Lotto e Numero seriale quando sono null (US-022)', async () => {
    mockGetMedicationById.mockResolvedValue(sampleMed) // lot: null, serial: null

    renderDetail()

    await waitFor(() => {
      expect(screen.getByText('Tachipirina 1000mg')).toBeInTheDocument()
    })

    expect(screen.queryByText('Lotto')).not.toBeInTheDocument()
    expect(screen.queryByText('Numero seriale')).not.toBeInTheDocument()
  })

  it('naviga alla pagina di modifica quando si clicca il pulsante "Modifica" nel footer', async () => {
    const user = userEvent.setup()
    mockGetMedicationById.mockResolvedValue(sampleMed)

    renderDetail()

    await waitFor(() => {
      expect(screen.getByText('Tachipirina 1000mg')).toBeInTheDocument()
    })

    // The footer button has exact text "Modifica"; the topbar icon button has aria-label "Modifica farmaco"
    // getAllByRole returns all matches — pick the footer one (exact name 'Modifica')
    const modifyButtons = screen.getAllByRole('button', { name: /modifica/i })
    // Click the last one, which is the footer primary CTA
    await user.click(modifyButtons[modifyButtons.length - 1])

    await waitFor(() => {
      expect(screen.getByText('EditPage')).toBeInTheDocument()
    })
  })
})
