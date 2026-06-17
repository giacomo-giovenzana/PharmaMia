// Test di integrazione: verifica ensure_personal_household() e RLS medications
// Richiede: supabase start && supabase db reset
// Esegui normalmente con: pnpm test:run (si auto-skippa se il DB non è raggiungibile)

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../../shared/supabase/database.types'

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

// Credenziali test deterministiche — l'utente viene creato in beforeAll se non esiste
const TEST_EMAIL = 'test-household@pharmamia.local'
const TEST_PASSWORD = 'PharmaMia_Test_2026!'

describe('Supabase locale — ensure_personal_household + medications RLS', () => {
  let supabase!: SupabaseClient<Database>
  let dbReachable = false
  let testUserId: string | undefined

  beforeAll(async () => {
    dbReachable = await isSupabaseReachable()
    if (!dbReachable) return

    supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

    // Prova a fare sign-in; se l'utente non esiste, lo crea (local Supabase ha auto-confirm)
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    })

    if (signInError) {
      // L'utente non esiste ancora: registrazione + auto-confirm locale
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      })
      if (signUpError) throw new Error(`signUp fallito: ${signUpError.message}`)

      testUserId = signUpData.user?.id

      // Dopo signUp su Supabase locale con auto-confirm, la sessione è già attiva;
      // facciamo comunque sign-in esplicito per essere sicuri
      await supabase.auth.signInWithPassword({ email: TEST_EMAIL, password: TEST_PASSWORD })
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      testUserId = user?.id
    }
  })

  afterAll(async () => {
    if (!dbReachable) return
    await supabase.auth.signOut()
  })

  it('ensure_personal_household() crea un household e una membership admin alla prima chiamata', async () => {
    if (!dbReachable) return

    const { data: householdId, error } = await supabase.rpc('ensure_personal_household')

    expect(error).toBeNull()
    expect(householdId).toBeDefined()
    expect(typeof householdId).toBe('string')
    // UUID v4 format: 8-4-4-4-12 hex chars
    expect(householdId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    )

    // Verifica che esista un record in household_members con ruolo admin per questo utente
    const { data: membership, error: memberError } = await supabase
      .from('household_members')
      .select('*')
      .eq('household_id', householdId!)
      .eq('user_id', testUserId!)
      .single()

    expect(memberError).toBeNull()
    expect(membership).toBeDefined()
    expect(membership?.role).toBe('admin')
  })

  it('ensure_personal_household() è idempotente: restituisce lo stesso household_id alla seconda chiamata', async () => {
    if (!dbReachable) return

    const { data: firstId, error: firstError } = await supabase.rpc('ensure_personal_household')
    expect(firstError).toBeNull()

    const { data: secondId, error: secondError } = await supabase.rpc('ensure_personal_household')
    expect(secondError).toBeNull()

    expect(firstId).toBe(secondId)
  })

  it('dopo ensure_personal_household(), INSERT in medications con household_id ritornato ha successo ed è leggibile via SELECT', async () => {
    if (!dbReachable) return

    // Ottieni l'household_id dell'utente autenticato
    const { data: householdId, error: rpcError } = await supabase.rpc('ensure_personal_household')
    expect(rpcError).toBeNull()
    expect(householdId).toBeTruthy()

    const testMedication: Database['public']['Tables']['medications']['Insert'] = {
      household_id: householdId!,
      name: 'Tachipirina 1000mg (test)',
      quantity: 10,
      unit: 'compresse',
    }

    // INSERT
    const { data: inserted, error: insertError } = await supabase
      .from('medications')
      .insert(testMedication)
      .select('*')
      .single()

    expect(insertError).toBeNull()
    expect(inserted).toBeDefined()
    expect(inserted?.household_id).toBe(householdId)
    expect(inserted?.name).toBe(testMedication.name)
    expect(inserted?.quantity).toBe(testMedication.quantity)

    // SELECT — verifica che la riga sia leggibile per questo utente via RLS
    const { data: fetched, error: fetchError } = await supabase
      .from('medications')
      .select('*')
      .eq('id', inserted!.id)
      .single()

    expect(fetchError).toBeNull()
    expect(fetched).toBeDefined()
    expect(fetched?.id).toBe(inserted!.id)
    expect(fetched?.name).toBe(testMedication.name)

    // Cleanup: rimuove la riga di test per non inquinare gli altri test
    await supabase.from('medications').delete().eq('id', inserted!.id)
  })
})
