import { supabase } from '@shared/supabase/client'
import type { Database } from '@shared/supabase/database.types'
import { normalizeGtinToEan13 } from '@domain/gs1'

export type DrugCatalogEntry = Database['public']['Tables']['drugs_catalog']['Row']

export async function lookupByCode(code: string): Promise<DrugCatalogEntry | null> {
  const { data: byEan } = await supabase
    .from('drugs_catalog')
    .select('*')
    .eq('ean_code', code)
    .maybeSingle()

  if (byEan) return byEan

  const { data: byAic } = await supabase
    .from('drugs_catalog')
    .select('*')
    .eq('aic_code', code)
    .maybeSingle()

  return byAic
}

export async function lookupByGs1({ gtin, aic }: { gtin?: string; aic?: string }): Promise<DrugCatalogEntry | null> {
  if (gtin) {
    const ean13 = normalizeGtinToEan13(gtin)
    if (ean13) {
      const { data: byEan } = await supabase
        .from('drugs_catalog')
        .select('*')
        .eq('ean_code', ean13)
        .maybeSingle()
      if (byEan) return byEan
    }
  }

  if (aic) {
    const { data: byAic } = await supabase
      .from('drugs_catalog')
      .select('*')
      .eq('aic_code', aic)
      .maybeSingle()
    if (byAic) return byAic
  }

  return null
}
