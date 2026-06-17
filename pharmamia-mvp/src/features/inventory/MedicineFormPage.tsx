import { useEffect, useState } from 'react'
import { useNavigate, useLocation, useParams } from 'react-router-dom'
import { supabase } from '@shared/supabase/client'
import type { DrugCatalogEntry } from '@features/scanning/drugLookup'
import type { Database } from '@shared/supabase/database.types'
import { validateExpiryDate } from '@domain/medicationExpiry'
import { getMedicationById, updateMedication, insertMedication } from './medicationsRepo'
import './medicine-form.css'

type MedicationInsert = Database['public']['Tables']['medications']['Insert']

type Gs1Prefill = { expiresAt?: string; lot?: string; serial?: string }
type LocationState = { draft?: DrugCatalogEntry | null; gs1?: Gs1Prefill } | null

const UNIT_OPTIONS = ['pz', 'ml', 'mg', 'compresse', 'bustine'] as const
const LOCATION_PRESETS = ['Armadio bagno', 'Cassetto cucina', 'Borsa', 'Frigorifero'] as const

function parseNotes(notes: string | null): { activeIngredient: string; form: string } {
  if (!notes) return { activeIngredient: '', form: '' }
  const parts = notes.split(';').map(s => s.trim())
  let activeIngredient = ''
  let medicationForm = ''
  for (const part of parts) {
    if (part.startsWith('Principio attivo: ')) activeIngredient = part.slice('Principio attivo: '.length)
    if (part.startsWith('Forma: ')) medicationForm = part.slice('Forma: '.length)
  }
  return { activeIngredient, form: medicationForm }
}

export function MedicineFormPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams<{ id: string }>()
  const isEditMode = Boolean(id)

  const state = (location.state as LocationState) ?? null
  const draft = isEditMode ? null : (state?.draft ?? null)
  const gs1 = isEditMode ? null : (state?.gs1 ?? null)

  const [loadingEdit, setLoadingEdit] = useState(isEditMode)
  const [name, setName] = useState(draft?.name ?? '')
  const [activeIngredient, setActiveIngredient] = useState(draft?.active_ingredient ?? '')
  const [form, setForm] = useState(draft?.form ?? '')
  const [quantity, setQuantity] = useState(1)
  const [unit, setUnit] = useState<string>('pz')
  const [expiresAt, setExpiresAt] = useState(gs1?.expiresAt ?? '')
  const [lot, setLot] = useState(gs1?.lot ?? '')
  const [serial, setSerial] = useState(gs1?.serial ?? '')
  const [location_, setLocation] = useState('')
  const [saving, setSaving] = useState(false)
  const [nameError, setNameError] = useState<string | null>(null)
  const [expiryError, setExpiryError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isEditMode || !id) return

    setLoadingEdit(true)
    getMedicationById(id)
      .then(med => {
        setName(med.name)
        setQuantity(med.quantity)
        setUnit(med.unit)
        setExpiresAt(med.expires_at ?? '')
        setLot(med.lot ?? '')
        setSerial(med.serial ?? '')
        setLocation(med.location ?? '')
        const parsed = parseNotes(med.notes)
        setActiveIngredient(parsed.activeIngredient)
        setForm(parsed.form)
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Impossibile caricare il farmaco.'
        setError(msg)
      })
      .finally(() => setLoadingEdit(false))
  }, [id, isEditMode])

  const pageTitle = isEditMode ? 'Modifica farmaco' : (draft ? 'Conferma farmaco' : gs1 ? 'Aggiungi farmaco' : 'Aggiungi farmaco')

  function handleLocationPill(preset: string) {
    setLocation(prev => (prev === preset ? '' : preset))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setNameError(null)
    setExpiryError(null)

    if (name.trim() === '') {
      setNameError('Il nome del farmaco è obbligatorio.')
      document.getElementById('mf-name')?.focus()
      return
    }

    const expiryValidation = validateExpiryDate(expiresAt)
    if (!expiryValidation.ok) {
      setExpiryError(expiryValidation.error ?? 'Data di scadenza non valida.')
      document.getElementById('mf-expires')?.focus()
      return
    }

    if (quantity < 0) {
      setError('La quantità non può essere negativa.')
      return
    }

    setSaving(true)
    try {
      const notes = [
        activeIngredient.trim() !== '' ? `Principio attivo: ${activeIngredient.trim()}` : null,
        form.trim() !== '' ? `Forma: ${form.trim()}` : null,
      ]
        .filter(Boolean)
        .join('; ') || null

      if (isEditMode && id) {
        await updateMedication(id, {
          name: name.trim(),
          quantity,
          unit,
          expires_at: expiresAt,
          location: location_.trim() !== '' ? location_.trim() : null,
          notes,
          lot: lot.trim() !== '' ? lot.trim() : null,
          serial: serial.trim() !== '' ? serial.trim() : null,
        })
        navigate(`/medicine/${id}`, { state: { saved: true } })
      } else {
        const { data: householdId, error: rpcError } = await supabase.rpc('ensure_personal_household')
        if (rpcError) throw rpcError
        if (!householdId) throw new Error('Impossibile ottenere il nucleo familiare.')

        const row: MedicationInsert = {
          household_id: householdId,
          catalog_id: draft?.id ?? null,
          name: name.trim(),
          quantity,
          unit,
          expires_at: expiresAt,
          location: location_.trim() !== '' ? location_.trim() : null,
          notes,
          lot: lot.trim() !== '' ? lot.trim() : null,
          serial: serial.trim() !== '' ? serial.trim() : null,
        }
        const { id: newId } = await insertMedication(row)
        navigate(`/medicine/${newId}`, { state: { saved: true } })
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Errore durante il salvataggio. Riprova.'
      setError(msg)
    } finally {
      setSaving(false)
    }
  }

  if (loadingEdit) {
    return (
      <div className="mf-screen">
        <div className="mf-topbar">
          <button className="mf-topbar-back" aria-label="Torna indietro" onClick={() => navigate(-1)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <span className="mf-topbar-title">Modifica farmaco</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 60 }}>
          <span style={{ color: 'var(--c-text-3)', fontSize: '.9rem' }}>Caricamento…</span>
        </div>
      </div>
    )
  }

  return (
    <div className="mf-screen">
      <div className="mf-topbar">
        <button
          className="mf-topbar-back"
          aria-label="Torna indietro"
          onClick={() => navigate(-1)}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span className="mf-topbar-title">{pageTitle}</span>
      </div>

      <form className="mf-body" onSubmit={(e) => { void handleSubmit(e) }}>
        <div className="mf-hero">
          {draft && (
            <div className="mf-source-chip">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Dati da database AIFA
            </div>
          )}
          {!draft && gs1 && (
            <div className="mf-source-chip">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Scadenza/lotto/seriale da DataMatrix
            </div>
          )}
          <div className="mf-hero-icon">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
            </svg>
          </div>
          {(draft || isEditMode) && name && (
            <div className="mf-hero-name">{name}</div>
          )}
          {draft && (draft.active_ingredient ?? draft.form) && (
            <div className="mf-hero-sub">
              {[draft.active_ingredient, draft.form, draft.dosage].filter(Boolean).join(' · ')}
            </div>
          )}
        </div>

        <div className="mf-section">
          <div className="mf-section-title">Dati farmaco</div>

          <div className="form-group">
            <label className="form-label" htmlFor="mf-name">Nome *</label>
            <input
              id="mf-name"
              className={`form-input${nameError ? ' input-error' : ''}`}
              type="text"
              value={name}
              onChange={e => { setName(e.target.value); if (nameError) setNameError(null) }}
              placeholder="es. Tachipirina 1000 mg"
              aria-invalid={nameError ? 'true' : undefined}
              aria-describedby={nameError ? 'mf-name-error' : undefined}
            />
            {nameError && (
              <span id="mf-name-error" className="mf-field-error" role="alert">
                {nameError}
              </span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="mf-active-ingredient">Principio attivo</label>
            <input
              id="mf-active-ingredient"
              className="form-input"
              type="text"
              value={activeIngredient}
              onChange={e => setActiveIngredient(e.target.value)}
              placeholder="es. Paracetamolo"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="mf-form">Forma</label>
            <input
              id="mf-form"
              className="form-input"
              type="text"
              value={form}
              onChange={e => setForm(e.target.value)}
              placeholder="es. Compresse"
            />
          </div>
        </div>

        <div className="divider" />

        <div className="mf-section">
          <div className="mf-section-title">Dettagli confezione</div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="mf-quantity">Quantità</label>
              <input
                id="mf-quantity"
                className="form-input"
                type="number"
                min="0"
                value={quantity}
                onChange={e => setQuantity(Number(e.target.value))}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="mf-unit">Unità</label>
              <select
                id="mf-unit"
                className="form-input"
                value={unit}
                onChange={e => setUnit(e.target.value)}
              >
                {UNIT_OPTIONS.map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="mf-expires">Data scadenza *</label>
            <input
              id="mf-expires"
              className={`form-input${expiryError ? ' input-error' : ''}`}
              type="date"
              value={expiresAt}
              onChange={e => { setExpiresAt(e.target.value); if (expiryError) setExpiryError(null) }}
              aria-invalid={expiryError ? 'true' : undefined}
              aria-describedby={expiryError ? 'mf-expires-error' : undefined}
            />
            {expiryError && (
              <span id="mf-expires-error" className="mf-field-error" role="alert">
                {expiryError}
              </span>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="mf-lot">Lotto</label>
              <input
                id="mf-lot"
                className="form-input"
                type="text"
                value={lot}
                onChange={e => setLot(e.target.value)}
                placeholder="es. ABC1234"
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="mf-serial">Numero seriale</label>
              <input
                id="mf-serial"
                className="form-input"
                type="text"
                value={serial}
                onChange={e => setSerial(e.target.value)}
                placeholder="es. 98765432"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Posizione</label>
            <div className="mf-location-pills">
              {LOCATION_PRESETS.map(preset => (
                <button
                  key={preset}
                  type="button"
                  className={`mf-location-pill${location_ === preset ? ' active' : ''}`}
                  onClick={() => handleLocationPill(preset)}
                >
                  {preset}
                </button>
              ))}
            </div>
            <input
              className="form-input"
              style={{ marginTop: 8 }}
              type="text"
              value={location_}
              onChange={e => setLocation(e.target.value)}
              placeholder="oppure scrivi qui…"
            />
          </div>
        </div>

        {error && (
          <div className="mf-error-banner" role="alert">
            {error}
          </div>
        )}

        <div className="mf-footer">
          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={saving}
          >
            {saving ? (
              'Salvataggio…'
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {isEditMode ? 'Aggiorna farmaco' : 'Salva farmaco'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
