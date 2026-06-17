import { test, expect } from '@playwright/test'
import { installAuthMock } from './helpers/medicationsHelper'

// US-009 — non-demo e2e flows (no video)
// All backend calls are intercepted by page.route() — no live Supabase needed.

const BASE_MED = {
  id: 'med-001',
  household_id: 'hh-001',
  catalog_id: null,
  name: 'Tachipirina 1000mg',
  quantity: 15,
  unit: 'compresse',
  expires_at: '2099-12-31',
  location: 'Armadietto bagno',
  notes: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

// ---------------------------------------------------------------------------
// Scenario 1: aggiunta farmaco → scheda mostra scadenza, quantità, posizione
// ---------------------------------------------------------------------------
test('Scenario 1: aggiunta con scadenza+quantità+posizione → scheda mostra i tre dati', async ({ page }) => {
  await installAuthMock(page)

  // POST returns the new medication row; GET by id returns the same row for the detail page
  await page.route('**/rest/v1/medications*', async route => {
    const method = route.request().method().toUpperCase()
    if (method === 'POST') {
      await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify([BASE_MED]) })
      return
    }
    if (method === 'GET') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([BASE_MED]) })
      return
    }
    await route.continue()
  })

  await page.route('**/rpc/ensure_personal_household*', async route => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify('hh-001') })
  })

  await page.goto('/medicine/new')
  await expect(page.getByText('Aggiungi farmaco')).toBeVisible()

  // Fill name
  await page.getByLabel(/nome \*/i).fill('Tachipirina 1000mg')

  // Fill expiry date
  await page.locator('#mf-expires').fill('2099-12-31')

  // Fill quantity (clear default then type)
  await page.locator('#mf-quantity').clear()
  await page.locator('#mf-quantity').fill('15')

  // Select unit
  await page.locator('#mf-unit').selectOption('compresse')

  // Fill location (free text input)
  await page.getByPlaceholder(/oppure scrivi qui/i).fill('Armadietto bagno')

  // Submit
  await page.getByRole('button', { name: /salva farmaco/i }).click()

  // Should navigate to detail page
  await expect(page).toHaveURL(/\/medicine\/med-001/, { timeout: 8000 })

  // All three fields visible in detail
  await expect(page.getByText('31/12/2099')).toBeVisible()
  await expect(page.getByText('15')).toBeVisible()
  await expect(page.getByText('Armadietto bagno')).toBeVisible()
})

// ---------------------------------------------------------------------------
// Scenario 2: modifica di un campo → scheda aggiornata
// ---------------------------------------------------------------------------
test('Scenario 2: modifica di un campo → scheda aggiornata immediatamente', async ({ page }) => {
  const updatedMed = { ...BASE_MED, quantity: 10 }

  await installAuthMock(page)

  // Counter to return different data for the two GET calls:
  // call 0 = edit form preload (initial), call 1+ = detail after save (updated)
  let getCallCount = 0

  await page.route('**/rest/v1/medications*', async route => {
    const method = route.request().method().toUpperCase()
    const url = route.request().url()

    if (method === 'GET' && /id=eq\./.test(url)) {
      const med = getCallCount === 0 ? BASE_MED : updatedMed
      getCallCount++
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([med]) })
      return
    }
    if (method === 'PATCH') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([updatedMed]) })
      return
    }
    await route.continue()
  })

  // Navigate directly to edit page
  await page.goto('/medicine/med-001/edit')

  // Wait for form to load (exit loading state)
  await expect(page.getByLabel(/nome \*/i)).toBeVisible({ timeout: 8000 })
  await expect(page.getByLabel(/nome \*/i)).toHaveValue('Tachipirina 1000mg')

  // Change quantity from 15 to 10
  const quantityInput = page.locator('#mf-quantity')
  await quantityInput.clear()
  await quantityInput.fill('10')

  // Save
  await page.getByRole('button', { name: /aggiorna farmaco/i }).click()

  // Should navigate to detail page
  await expect(page).toHaveURL(/\/medicine\/med-001/, { timeout: 8000 })

  // Detail page shows updated quantity
  await expect(page.getByText('10')).toBeVisible()
  await expect(page.getByRole('button', { name: /aggiorna farmaco/i })).not.toBeVisible()
})

// ---------------------------------------------------------------------------
// Scenario 3: scadenza nel passato → errore, salvataggio bloccato
// ---------------------------------------------------------------------------
test('Scenario 3: data di scadenza nel passato → errore e salvataggio bloccato', async ({ page }) => {
  await installAuthMock(page)

  await page.goto('/medicine/new')
  await expect(page.getByText('Aggiungi farmaco')).toBeVisible()

  // Fill name
  await page.getByLabel(/nome \*/i).fill('Tachipirina 1000mg')

  // Set a past expiry date
  await page.locator('#mf-expires').fill('2020-01-01')

  // Attempt to save
  await page.getByRole('button', { name: /salva farmaco/i }).click()

  // Error message should appear inline
  await expect(page.getByText(/non può essere nel passato/i)).toBeVisible()

  // URL must remain on the form (save was blocked)
  await expect(page).toHaveURL(/\/medicine\/new/)
})
