import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { MedicineFormPage } from './MedicineFormPage'
import type { DrugCatalogEntry } from '@features/scanning/drugLookup'

// ---------------------------------------------------------------------------
// Mock Supabase client
// ---------------------------------------------------------------------------
vi.mock('@shared/supabase/client', () => ({
  supabase: {
    rpc: vi.fn(),
    from: vi.fn(),
  },
}))

// ---------------------------------------------------------------------------
// Mock medicationsRepo (used in edit mode)
// ---------------------------------------------------------------------------
vi.mock('./medicationsRepo', () => ({
  getMedicationById: vi.fn(),
  updateMedication: vi.fn(),
  insertMedication: vi.fn(),
}))

import { supabase } from '@shared/supabase/client'
import { insertMedication as _insertMedication } from './medicationsRepo'

const mockRpc = supabase.rpc as Mock
const mockFrom = supabase.from as Mock
const mockInsertMedication = _insertMedication as Mock

// ---------------------------------------------------------------------------
// Sample DrugCatalogEntry
// ---------------------------------------------------------------------------
const sampleDraft: DrugCatalogEntry = {
  id: 'uuid-001',
  aic_code: '012345678',
  ean_code: '8001234567890',
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

// A valid future date for tests that now require expiry
const FUTURE_DATE = '2099-12-31'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function renderWithDraft(draft: DrugCatalogEntry | null) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: '/medicine/new', state: { draft } }]}>
      <Routes>
        <Route path="/medicine/new" element={<MedicineFormPage />} />
        <Route path="/medicine/:id" element={<div>Detail</div>} />
        <Route path="/" element={<div>Home</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

function renderEmpty() {
  return render(
    <MemoryRouter initialEntries={['/medicine/new']}>
      <Routes>
        <Route path="/medicine/new" element={<MedicineFormPage />} />
        <Route path="/medicine/:id" element={<div>Detail</div>} />
        <Route path="/" element={<div>Home</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('MedicineFormPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Default mock chain for from().insert().select().single()
    mockFrom.mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { id: 'new-uuid' }, error: null }),
        }),
      }),
    })

    // insertMedication from the repo is mocked at module level.
    // In insert-mode (non-edit) tests the existing assertions check mockFrom / mockInsert,
    // so we make insertMedication call-through to the supabase chain so those assertions
    // continue to hold.
    mockInsertMedication.mockImplementation(async (data: Record<string, unknown>) => {
      const chain = mockFrom('medications')
      const result = await chain.insert(data).select().single()
      if (result.error) throw result.error
      return { id: result.data.id as string }
    })
  })

  it('mostra il form vuoto con titolo "Aggiungi farmaco" quando non c\'è draft in state', () => {
    renderEmpty()

    expect(screen.getByText('Aggiungi farmaco')).toBeInTheDocument()
    expect(screen.getByLabelText(/nome \*/i)).toHaveValue('')
    expect(screen.getByLabelText(/principio attivo/i)).toHaveValue('')
    expect(screen.getByLabelText(/forma/i)).toHaveValue('')
  })

  it('pre-compila nome, principio attivo, forma dal draft e mostra il chip "Dati da database AIFA"', () => {
    renderWithDraft(sampleDraft)

    expect(screen.getByText('Dati da database AIFA')).toBeInTheDocument()
    expect(screen.getByLabelText(/nome \*/i)).toHaveValue('Tachipirina 1000mg')
    expect(screen.getByLabelText(/principio attivo/i)).toHaveValue('Paracetamolo')
    expect(screen.getByLabelText(/forma/i)).toHaveValue('Compresse')
  })

  it('mostra errore inline sotto il campo Nome con aria-invalid quando si invia il form con nome vuoto', async () => {
    renderEmpty()

    // jsdom doesn't block submit on `required` — submit directly to bypass native validation
    const form = screen.getByRole('button', { name: /salva farmaco/i }).closest('form')!
    fireEvent.submit(form)

    await waitFor(() => {
      expect(screen.getByText(/il nome del farmaco è obbligatorio/i)).toBeInTheDocument()
    })

    // Inline error has role="alert" and aria-invalid on the input
    const nameInput = screen.getByLabelText(/nome \*/i)
    expect(nameInput).toHaveAttribute('aria-invalid', 'true')
    expect(nameInput).toHaveAttribute('aria-describedby', 'mf-name-error')

    // The insert should NOT have been called
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('l\'errore inline scompare quando l\'utente digita nel campo Nome', async () => {
    const user = userEvent.setup()
    renderEmpty()

    const form = screen.getByRole('button', { name: /salva farmaco/i }).closest('form')!
    fireEvent.submit(form)

    await waitFor(() => {
      expect(screen.getByText(/il nome del farmaco è obbligatorio/i)).toBeInTheDocument()
    })

    const nameInput = screen.getByLabelText(/nome \*/i)
    await user.type(nameInput, 'A')

    await waitFor(() => {
      expect(screen.queryByText(/il nome del farmaco è obbligatorio/i)).not.toBeInTheDocument()
    })

    expect(nameInput).not.toHaveAttribute('aria-invalid')
  })

  it('mostra errore inline sulla scadenza quando viene inviato il form senza data di scadenza', async () => {
    const user = userEvent.setup()
    renderEmpty()

    await user.type(screen.getByLabelText(/nome \*/i), 'Aspirina')
    const form = screen.getByRole('button', { name: /salva farmaco/i }).closest('form')!
    fireEvent.submit(form)

    await waitFor(() => {
      expect(screen.getByText(/la data di scadenza è obbligatoria/i)).toBeInTheDocument()
    })

    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('mostra errore inline sulla scadenza quando viene inserita una data passata', async () => {
    const user = userEvent.setup()
    renderEmpty()

    await user.type(screen.getByLabelText(/nome \*/i), 'Aspirina')
    fireEvent.change(screen.getByLabelText(/data scadenza/i), { target: { value: '2020-01-01' } })
    const form = screen.getByRole('button', { name: /salva farmaco/i }).closest('form')!
    fireEvent.submit(form)

    await waitFor(() => {
      expect(screen.getByText(/non può essere nel passato/i)).toBeInTheDocument()
    })

    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('salvataggio manuale valido (senza draft) chiama ensure_personal_household e insert con catalog_id null', async () => {
    const user = userEvent.setup()

    mockRpc.mockResolvedValue({ data: 'household-uuid', error: null })
    const mockSingle = vi.fn().mockResolvedValue({ data: { id: 'new-uuid' }, error: null })
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockInsert = vi.fn().mockReturnValue({ select: mockSelect })
    mockFrom.mockReturnValue({ insert: mockInsert })

    renderEmpty()

    await user.type(screen.getByLabelText(/nome \*/i), 'Aspirina')
    fireEvent.change(screen.getByLabelText(/data scadenza/i), { target: { value: FUTURE_DATE } })

    await user.click(screen.getByRole('button', { name: /salva farmaco/i }))

    await waitFor(() => {
      expect(mockRpc).toHaveBeenCalledWith('ensure_personal_household')
      expect(mockFrom).toHaveBeenCalledWith('medications')
    })

    // catalog_id must be null for manual entry (no draft)
    const insertCall = mockInsert.mock.calls[0][0]
    expect(insertCall).toMatchObject({ catalog_id: null, name: 'Aspirina' })

    await waitFor(() => {
      expect(screen.getByText('Detail')).toBeInTheDocument()
    })
  })

  it('chiama RPC + insert e naviga alla scheda dettaglio dopo un salvataggio valido', async () => {
    const user = userEvent.setup()

    mockRpc.mockResolvedValue({ data: 'household-uuid', error: null })
    const mockSingle = vi.fn().mockResolvedValue({ data: { id: 'new-uuid' }, error: null })
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockInsert = vi.fn().mockReturnValue({ select: mockSelect })
    mockFrom.mockReturnValue({ insert: mockInsert })

    renderWithDraft(sampleDraft)

    fireEvent.change(screen.getByLabelText(/data scadenza/i), { target: { value: FUTURE_DATE } })
    await user.click(screen.getByRole('button', { name: /salva farmaco/i }))

    await waitFor(() => {
      expect(mockRpc).toHaveBeenCalledWith('ensure_personal_household')
      expect(mockFrom).toHaveBeenCalledWith('medications')
    })

    await waitFor(() => {
      expect(screen.getByText('Detail')).toBeInTheDocument()
    })
  })

  it('mostra il banner di errore quando la chiamata RPC fallisce', async () => {
    const user = userEvent.setup()

    // The component catches: err instanceof Error ? err.message : 'Errore durante il salvataggio. Riprova.'
    // Throwing an actual Error ensures the message propagates correctly
    mockRpc.mockResolvedValue({
      data: null,
      error: new Error('Errore RPC simulato'),
    })

    renderWithDraft(sampleDraft)

    fireEvent.change(screen.getByLabelText(/data scadenza/i), { target: { value: FUTURE_DATE } })
    await user.click(screen.getByRole('button', { name: /salva farmaco/i }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getByText(/Errore RPC simulato/i)).toBeInTheDocument()
    })
  })
})

// ---------------------------------------------------------------------------
// Edit mode imports (after vi.mock hoisting)
// ---------------------------------------------------------------------------
import { getMedicationById, updateMedication } from './medicationsRepo'

const mockGetMedicationById = getMedicationById as Mock
const mockUpdateMedication = updateMedication as Mock

// ---------------------------------------------------------------------------
// Sample medication for edit mode tests
// ---------------------------------------------------------------------------
const editMed = {
  id: 'med-edit-001',
  household_id: 'hh-001',
  catalog_id: null,
  name: 'Aspirina 500mg',
  quantity: 10,
  unit: 'compresse',
  expires_at: '2099-06-15',
  location: 'Cassetto cucina',
  notes: 'Principio attivo: Acido acetilsalicilico',
  lot: null,
  serial: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

// ---------------------------------------------------------------------------
// Edit mode helper
// ---------------------------------------------------------------------------
function renderEditMode(id: string) {
  return render(
    <MemoryRouter initialEntries={[`/medicine/${id}/edit`]}>
      <Routes>
        <Route path="/medicine/:id/edit" element={<MedicineFormPage />} />
        <Route path="/medicine/:id" element={<div>Detail</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

// ---------------------------------------------------------------------------
// Edit mode tests
// ---------------------------------------------------------------------------
describe('MedicineFormPage — modalità edit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('mostra il testo di caricamento inizialmente in modalità edit', () => {
    // Never resolves during this test
    mockGetMedicationById.mockReturnValue(new Promise(() => {}))

    renderEditMode('med-edit-001')

    expect(screen.getByText(/caricamento/i)).toBeInTheDocument()
  })

  it('pre-popola nome, quantità e posizione dal farmaco esistente', async () => {
    mockGetMedicationById.mockResolvedValue(editMed)

    renderEditMode('med-edit-001')

    await waitFor(() => {
      expect(screen.getByLabelText(/nome \*/i)).toHaveValue('Aspirina 500mg')
    })

    expect(screen.getByLabelText(/quantità/i)).toHaveValue(10)
    // Location text input
    const locationInputs = screen.getAllByPlaceholderText(/oppure scrivi qui/i)
    expect(locationInputs[0]).toHaveValue('Cassetto cucina')
  })

  it('pre-popola la data di scadenza dal farmaco esistente', async () => {
    mockGetMedicationById.mockResolvedValue(editMed)

    renderEditMode('med-edit-001')

    await waitFor(() => {
      expect(screen.getByLabelText(/data scadenza/i)).toHaveValue('2099-06-15')
    })
  })

  it('mostra il pulsante "Aggiorna farmaco" invece di "Salva farmaco"', async () => {
    mockGetMedicationById.mockResolvedValue(editMed)

    renderEditMode('med-edit-001')

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /aggiorna farmaco/i })).toBeInTheDocument()
    })

    expect(screen.queryByRole('button', { name: /salva farmaco/i })).not.toBeInTheDocument()
  })

  it('blocca il salvataggio con data di scadenza vuota e mostra l\'errore', async () => {
    mockGetMedicationById.mockResolvedValue(editMed)

    renderEditMode('med-edit-001')

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /aggiorna farmaco/i })).toBeInTheDocument()
    })

    // Clear the expiry date
    fireEvent.change(screen.getByLabelText(/data scadenza/i), { target: { value: '' } })

    const form = screen.getByRole('button', { name: /aggiorna farmaco/i }).closest('form')!
    fireEvent.submit(form)

    await waitFor(() => {
      expect(screen.getByText(/la data di scadenza è obbligatoria/i)).toBeInTheDocument()
    })

    expect(mockUpdateMedication).not.toHaveBeenCalled()
  })

  it('blocca il salvataggio con data di scadenza nel passato e mostra l\'errore', async () => {
    mockGetMedicationById.mockResolvedValue(editMed)

    renderEditMode('med-edit-001')

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /aggiorna farmaco/i })).toBeInTheDocument()
    })

    fireEvent.change(screen.getByLabelText(/data scadenza/i), { target: { value: '2020-01-01' } })

    const form = screen.getByRole('button', { name: /aggiorna farmaco/i }).closest('form')!
    fireEvent.submit(form)

    await waitFor(() => {
      expect(screen.getByText(/non può essere nel passato/i)).toBeInTheDocument()
    })

    expect(mockUpdateMedication).not.toHaveBeenCalled()
  })

  it('un aggiornamento valido chiama updateMedication e naviga alla pagina dettaglio', async () => {
    const user = userEvent.setup()
    mockGetMedicationById.mockResolvedValue(editMed)
    mockUpdateMedication.mockResolvedValue(undefined)

    renderEditMode('med-edit-001')

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /aggiorna farmaco/i })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /aggiorna farmaco/i }))

    await waitFor(() => {
      expect(mockUpdateMedication).toHaveBeenCalledWith(
        'med-edit-001',
        expect.objectContaining({
          name: 'Aspirina 500mg',
          quantity: 10,
          unit: 'compresse',
          expires_at: '2099-06-15',
          location: 'Cassetto cucina',
        }),
      )
    })

    await waitFor(() => {
      expect(screen.getByText('Detail')).toBeInTheDocument()
    })
  })

  it('pre-popola lotto e seriale da un farmaco esistente (US-022)', async () => {
    const medWithLot = { ...editMed, lot: 'LOT-EDIT-123', serial: 'SER-EDIT-456' }
    mockGetMedicationById.mockResolvedValue(medWithLot)

    renderEditMode('med-edit-001')

    await waitFor(() => {
      expect(screen.getByLabelText(/lotto/i)).toHaveValue('LOT-EDIT-123')
    })
    expect(screen.getByLabelText(/numero seriale/i)).toHaveValue('SER-EDIT-456')
  })

  it('include lotto e seriale nell\'update quando presenti (US-022)', async () => {
    const user = userEvent.setup()
    const medWithLot = { ...editMed, lot: 'LOTTO1', serial: 'SER1' }
    mockGetMedicationById.mockResolvedValue(medWithLot)
    mockUpdateMedication.mockResolvedValue(undefined)

    renderEditMode('med-edit-001')

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /aggiorna farmaco/i })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /aggiorna farmaco/i }))

    await waitFor(() => {
      expect(mockUpdateMedication).toHaveBeenCalledWith(
        'med-edit-001',
        expect.objectContaining({ lot: 'LOTTO1', serial: 'SER1' }),
      )
    })
  })
})

// ---------------------------------------------------------------------------
// GS1 DataMatrix prefill tests (US-022)
// ---------------------------------------------------------------------------
function renderWithGs1(gs1: { expiresAt?: string; lot?: string; serial?: string }, draft?: DrugCatalogEntry | null) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: '/medicine/new', state: { draft: draft ?? null, gs1 } }]}>
      <Routes>
        <Route path="/medicine/new" element={<MedicineFormPage />} />
        <Route path="/medicine/:id" element={<div>Detail</div>} />
        <Route path="/" element={<div>Home</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('MedicineFormPage — GS1 prefill (US-022)', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockFrom.mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { id: 'new-uuid' }, error: null }),
        }),
      }),
    })
    mockInsertMedication.mockImplementation(async (data: Record<string, unknown>) => {
      const chain = mockFrom('medications')
      const result = await chain.insert(data).select().single()
      if (result.error) throw result.error
      return { id: result.data.id as string }
    })
  })

  it('pre-compila scadenza da state.gs1.expiresAt', () => {
    renderWithGs1({ expiresAt: '2027-03-31' })
    expect(screen.getByLabelText(/data scadenza/i)).toHaveValue('2027-03-31')
  })

  it('pre-compila lotto e seriale da state.gs1', () => {
    renderWithGs1({ expiresAt: '2027-03-31', lot: 'LOT123', serial: 'SER456' })
    expect(screen.getByLabelText(/lotto/i)).toHaveValue('LOT123')
    expect(screen.getByLabelText(/numero seriale/i)).toHaveValue('SER456')
  })

  it('mostra il chip "Scadenza/lotto/seriale da DataMatrix" quando gs1 è presente senza draft', () => {
    renderWithGs1({ expiresAt: '2027-03-31', lot: 'L1' })
    expect(screen.getByText(/scadenza\/lotto\/seriale da datamatrix/i)).toBeInTheDocument()
  })

  it('include lotto e seriale nell\'insert quando presenti (US-022)', async () => {
    const user = userEvent.setup()

    mockRpc.mockResolvedValue({ data: 'household-uuid', error: null })
    const mockSingle = vi.fn().mockResolvedValue({ data: { id: 'new-uuid' }, error: null })
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockInsert = vi.fn().mockReturnValue({ select: mockSelect })
    mockFrom.mockReturnValue({ insert: mockInsert })

    renderWithGs1({ expiresAt: '2027-03-31', lot: 'LOT-GS1', serial: 'SER-GS1' })

    await user.type(screen.getByLabelText(/nome \*/i), 'Farmaco sconosciuto')
    await user.click(screen.getByRole('button', { name: /salva farmaco/i }))

    await waitFor(() => {
      const insertCall = mockInsert.mock.calls[0][0]
      expect(insertCall).toMatchObject({ lot: 'LOT-GS1', serial: 'SER-GS1' })
    })
  })

  it('GS1 + draft (farmaco trovato): mostra chip AIFA e pre-compila scadenza/lotto/seriale', () => {
    renderWithGs1({ expiresAt: '2027-03-31', lot: 'LOTTO1', serial: 'SER1' }, sampleDraft)
    // AIFA chip (draft present)
    expect(screen.getByText('Dati da database AIFA')).toBeInTheDocument()
    // GS1 chip should NOT appear (draft takes precedence for the source chip)
    expect(screen.queryByText(/datamatrix/i)).not.toBeInTheDocument()
    // Prefill still applied
    expect(screen.getByLabelText(/data scadenza/i)).toHaveValue('2027-03-31')
    expect(screen.getByLabelText(/lotto/i)).toHaveValue('LOTTO1')
  })
})
