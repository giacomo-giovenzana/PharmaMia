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

import { supabase } from '@shared/supabase/client'

const mockRpc = supabase.rpc as Mock
const mockFrom = supabase.from as Mock

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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function renderWithDraft(draft: DrugCatalogEntry | null) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: '/medicine/new', state: { draft } }]}>
      <Routes>
        <Route path="/medicine/new" element={<MedicineFormPage />} />
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

    // Default mock chain for from().insert()
    mockFrom.mockReturnValue({
      insert: vi.fn().mockResolvedValue({ error: null }),
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

  it('mostra l\'errore di validazione quando si invia il form con nome vuoto', async () => {
    renderEmpty()

    // jsdom doesn't block submit on `required` — submit directly to bypass native validation
    const form = screen.getByRole('button', { name: /salva farmaco/i }).closest('form')!
    fireEvent.submit(form)

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getByText(/il nome del farmaco è obbligatorio/i)).toBeInTheDocument()
    })
  })

  it('chiama RPC + insert e naviga a "/" dopo un salvataggio valido', async () => {
    const user = userEvent.setup()

    mockRpc.mockResolvedValue({ data: 'household-uuid', error: null })
    mockFrom.mockReturnValue({
      insert: vi.fn().mockResolvedValue({ error: null }),
    })

    renderWithDraft(sampleDraft)

    await user.click(screen.getByRole('button', { name: /salva farmaco/i }))

    await waitFor(() => {
      expect(mockRpc).toHaveBeenCalledWith('ensure_personal_household')
      expect(mockFrom).toHaveBeenCalledWith('medications')
    })

    await waitFor(() => {
      expect(screen.getByText('Home')).toBeInTheDocument()
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

    await user.click(screen.getByRole('button', { name: /salva farmaco/i }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getByText(/Errore RPC simulato/i)).toBeInTheDocument()
    })
  })
})
