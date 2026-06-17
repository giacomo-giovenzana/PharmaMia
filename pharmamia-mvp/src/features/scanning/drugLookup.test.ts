import { describe, it, expect, vi, beforeEach } from 'vitest'
import { lookupByCode, lookupByGs1 } from './drugLookup'
import { catalogToDraft } from '@domain/medicationDraft'
import type { DrugCatalogEntry } from './drugLookup'

const { maybeSingleMock } = vi.hoisted(() => ({
  maybeSingleMock: vi.fn(),
}))

vi.mock('@shared/supabase/client', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: maybeSingleMock,
    }),
  },
}))

const baseEntry: DrugCatalogEntry = {
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

describe('lookupByCode', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('restituisce il farmaco quando il codice EAN corrisponde', async () => {
    maybeSingleMock.mockResolvedValueOnce({ data: baseEntry })

    const result = await lookupByCode('8001234567890')

    expect(result).toEqual(baseEntry)
  })

  it('restituisce il farmaco quando EAN non trova nulla ma AIC corrisponde', async () => {
    maybeSingleMock
      .mockResolvedValueOnce({ data: null })
      .mockResolvedValueOnce({ data: baseEntry })

    const result = await lookupByCode('012345678')

    expect(result).toEqual(baseEntry)
  })

  it('restituisce null quando né EAN né AIC corrispondono', async () => {
    maybeSingleMock
      .mockResolvedValueOnce({ data: null })
      .mockResolvedValueOnce({ data: null })

    const result = await lookupByCode('0000000')

    expect(result).toBeNull()
  })
})

describe('lookupByGs1', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('normalizza GTIN-14 in EAN-13 e cerca per ean_code', async () => {
    maybeSingleMock.mockResolvedValueOnce({ data: baseEntry })

    const result = await lookupByGs1({ gtin: '08001234567890' })

    expect(result).toEqual(baseEntry)
  })

  it('fallback su aic quando EAN non trova nulla', async () => {
    maybeSingleMock
      .mockResolvedValueOnce({ data: null })   // EAN miss
      .mockResolvedValueOnce({ data: baseEntry }) // AIC hit

    const result = await lookupByGs1({ gtin: '08001234567890', aic: '012345678' })

    expect(result).toEqual(baseEntry)
  })

  it('cerca direttamente per aic se gtin non è presente', async () => {
    maybeSingleMock.mockResolvedValueOnce({ data: baseEntry })

    const result = await lookupByGs1({ aic: '012345678' })

    expect(result).toEqual(baseEntry)
  })

  it('restituisce null se né GTIN né AIC trovano risultati', async () => {
    maybeSingleMock
      .mockResolvedValueOnce({ data: null })
      .mockResolvedValueOnce({ data: null })

    const result = await lookupByGs1({ gtin: '00000000000000', aic: '000000000' })

    expect(result).toBeNull()
  })

  it('restituisce null se chiamato senza argomenti', async () => {
    const result = await lookupByGs1({})
    expect(result).toBeNull()
  })
})

describe('catalogToDraft', () => {
  it('mappa correttamente tutti i campi del catalogo', () => {
    const draft = catalogToDraft(baseEntry)

    expect(draft).toEqual({
      name: 'Tachipirina 1000mg',
      active_ingredient: 'Paracetamolo',
      form: 'Compresse',
      dosage: '1000 mg',
      catalog_id: 'uuid-001',
      quantity: 0,
      unit: 'pz',
    })
  })

  it('preserva i valori null per i campi opzionali', () => {
    const entryWithNulls: DrugCatalogEntry = {
      ...baseEntry,
      active_ingredient: null,
      form: null,
      dosage: null,
    }

    const draft = catalogToDraft(entryWithNulls)

    expect(draft.active_ingredient).toBeNull()
    expect(draft.form).toBeNull()
    expect(draft.dosage).toBeNull()
  })
})
