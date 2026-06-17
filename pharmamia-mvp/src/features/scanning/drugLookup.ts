import { supabase } from '@shared/supabase/client'
import type { Database } from '@shared/supabase/database.types'

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
