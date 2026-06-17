import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import { getMedicationById, updateMedication, insertMedication } from './medicationsRepo'

// ---------------------------------------------------------------------------
// Mock Supabase client
// ---------------------------------------------------------------------------
vi.mock('@shared/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

import { supabase } from '@shared/supabase/client'

const mockFrom = supabase.from as Mock

// ---------------------------------------------------------------------------
// Shared fixture
// ---------------------------------------------------------------------------
const mockRow = {
  id: 'med-uuid-001',
  name: 'Tachipirina 1000mg',
  active_ingredient: 'Paracetamolo',
  form: 'Compresse',
  dosage: '1000 mg',
  quantity: 20,
  expiry_date: '2026-12-31',
  household_id: 'hh-uuid-001',
  catalog_id: null,
  lot: null,
  serial: null,
  created_at: '2024-01-01T00:00:00Z',
}

// ---------------------------------------------------------------------------
// getMedicationById
// ---------------------------------------------------------------------------
describe('getMedicationById', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns the row when supabase returns data', async () => {
    const mockSingle = vi.fn().mockResolvedValue({ data: mockRow, error: null })
    const mockEq = vi.fn().mockReturnValue({ single: mockSingle })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    mockFrom.mockReturnValue({ select: mockSelect })

    const result = await getMedicationById(mockRow.id)

    expect(mockFrom).toHaveBeenCalledWith('medications')
    expect(mockSelect).toHaveBeenCalledWith('*')
    expect(mockEq).toHaveBeenCalledWith('id', mockRow.id)
    expect(mockSingle).toHaveBeenCalled()
    expect(result).toEqual(mockRow)
  })

  it('throws when supabase returns an error', async () => {
    const dbError = new Error('DB error')
    const mockSingle = vi.fn().mockResolvedValue({ data: null, error: dbError })
    const mockEq = vi.fn().mockReturnValue({ single: mockSingle })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    mockFrom.mockReturnValue({ select: mockSelect })

    await expect(getMedicationById(mockRow.id)).rejects.toThrow('DB error')
  })
})

// ---------------------------------------------------------------------------
// updateMedication
// ---------------------------------------------------------------------------
describe('updateMedication', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('resolves without throwing when update succeeds', async () => {
    const mockEq = vi.fn().mockResolvedValue({ error: null })
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq })
    mockFrom.mockReturnValue({ update: mockUpdate })

    const updates = { quantity: 10 }
    await expect(updateMedication(mockRow.id, updates)).resolves.toBeUndefined()

    expect(mockFrom).toHaveBeenCalledWith('medications')
    expect(mockUpdate).toHaveBeenCalledWith(updates)
    expect(mockEq).toHaveBeenCalledWith('id', mockRow.id)
  })

  it('throws when update returns an error', async () => {
    const dbError = new Error('Update failed')
    const mockEq = vi.fn().mockResolvedValue({ error: dbError })
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq })
    mockFrom.mockReturnValue({ update: mockUpdate })

    await expect(updateMedication(mockRow.id, { quantity: 5 })).rejects.toThrow('Update failed')
  })
})

// ---------------------------------------------------------------------------
// insertMedication
// ---------------------------------------------------------------------------
describe('insertMedication', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns { id: row.id } on success', async () => {
    const newRow = { ...mockRow, id: 'new-uuid' }
    const mockSingle = vi.fn().mockResolvedValue({ data: newRow, error: null })
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockInsert = vi.fn().mockReturnValue({ select: mockSelect })
    mockFrom.mockReturnValue({ insert: mockInsert })

    const insertData = {
      name: 'Tachipirina 1000mg',
      household_id: 'hh-uuid-001',
    }
    const result = await insertMedication(insertData)

    expect(mockFrom).toHaveBeenCalledWith('medications')
    expect(mockInsert).toHaveBeenCalledWith(insertData)
    expect(mockSelect).toHaveBeenCalled()
    expect(mockSingle).toHaveBeenCalled()
    expect(result).toEqual({ id: 'new-uuid' })
  })

  it('throws when insert returns an error', async () => {
    const dbError = new Error('Insert failed')
    const mockSingle = vi.fn().mockResolvedValue({ data: null, error: dbError })
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockInsert = vi.fn().mockReturnValue({ select: mockSelect })
    mockFrom.mockReturnValue({ insert: mockInsert })

    await expect(
      insertMedication({ name: 'Aspirina', household_id: 'hh-uuid-001' }),
    ).rejects.toThrow('Insert failed')
  })

  it('propaga i campi lot e serial nell\'insert (US-022 persistenza)', async () => {
    const newRow = { ...mockRow, id: 'new-uuid-lot', lot: 'LOT123', serial: 'SER456' }
    const mockSingle = vi.fn().mockResolvedValue({ data: newRow, error: null })
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockInsert = vi.fn().mockReturnValue({ select: mockSelect })
    mockFrom.mockReturnValue({ insert: mockInsert })

    const insertData = {
      name: 'Tachipirina 1000mg',
      household_id: 'hh-uuid-001',
      lot: 'LOT123',
      serial: 'SER456',
    }
    const result = await insertMedication(insertData)

    expect(mockInsert).toHaveBeenCalledWith(insertData)
    expect(result).toEqual({ id: 'new-uuid-lot' })
  })
})

// ---------------------------------------------------------------------------
// updateMedication — lot/serial (US-022)
// ---------------------------------------------------------------------------
describe('updateMedication — lot e serial', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('propaga i campi lot e serial nell\'update', async () => {
    const mockEq = vi.fn().mockResolvedValue({ error: null })
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq })
    mockFrom.mockReturnValue({ update: mockUpdate })

    const updates = { lot: 'NEWLOT', serial: 'NEWSER' }
    await updateMedication(mockRow.id, updates)

    expect(mockUpdate).toHaveBeenCalledWith(updates)
  })
})
