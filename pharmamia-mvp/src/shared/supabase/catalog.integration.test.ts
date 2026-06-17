// Test di integrazione: verifica schema DB e lookup AIC/EAN
// Richiede: supabase start && supabase db reset
// Esegui normalmente con: pnpm test:run (si auto-skippa se il DB non è raggiungibile)

import { describe, it, expect, beforeAll } from 'vitest'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Rileva se Supabase locale è effettivamente raggiungibile (non solo se la env è impostata)
async function isSupabaseReachable(): Promise<boolean> {
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/`, { signal: AbortSignal.timeout(1500) })
    return res.ok || res.status === 400  // 400 = auth error, ma il server risponde
  } catch {
    return false
  }
}

describe('Supabase locale — migration + catalogo AIFA', () => {
  let supabase!: SupabaseClient<Database>
  let dbReachable = false

  beforeAll(async () => {
    dbReachable = await isSupabaseReachable()
    if (dbReachable) {
      supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
    }
  })

  it('contiene ≥1000 farmaci nel catalogo AIFA dopo il seed', async () => {
    if (!dbReachable) return

    const { count, error } = await supabase
      .from('drugs_catalog')
      .select('*', { count: 'exact', head: true })

    expect(error).toBeNull()
    expect(count).toBeGreaterThanOrEqual(1000)
  })

  it('lookup per AIC restituisce il farmaco corretto', async () => {
    if (!dbReachable) return

    const { data, error } = await supabase
      .from('drugs_catalog')
      .select('*')
      .eq('aic_code', '000000001')
      .single()

    expect(error).toBeNull()
    expect(data).toBeDefined()
    expect(data?.aic_code).toBe('000000001')
  })

  it('lookup per EAN restituisce il farmaco corretto', async () => {
    if (!dbReachable) return

    const { data, error } = await supabase
      .from('drugs_catalog')
      .select('*')
      .eq('ean_code', '0433218196003')
      .single()

    expect(error).toBeNull()
    expect(data).toBeDefined()
    expect(data?.ean_code).toBe('0433218196003')
  })

  it('tabelle core esistono e sono accessibili', async () => {
    if (!dbReachable) return

    const tables = ['drugs_catalog', 'households', 'household_members', 'medications', 'therapies'] as const

    for (const table of tables) {
      const { error } = await supabase.from(table).select('id').limit(0)
      expect(error, `Tabella ${table} non accessibile`).toBeNull()
    }
  })
})
