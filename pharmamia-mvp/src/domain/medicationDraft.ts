import type { DrugCatalogEntry } from '@features/scanning/drugLookup'

export type MedicationDraft = {
  name: string
  active_ingredient: string | null
  form: string | null
  dosage: string | null
  catalog_id: string
  quantity: number
  unit: string
}

export function catalogToDraft(entry: DrugCatalogEntry): MedicationDraft {
  return {
    name: entry.name,
    active_ingredient: entry.active_ingredient,
    form: entry.form,
    dosage: entry.dosage,
    catalog_id: entry.id,
    quantity: 0,
    unit: 'pz',
  }
}
