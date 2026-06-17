import { test, expect } from '@playwright/test'
import { installAuthMock } from './helpers/medicationsHelper'

// US-009 — Demo: Giulia aggiunge un farmaco con scadenza, compresse e posizione.
// Video is scoped to this file only; global config keeps video: 'off'.
//
// Demonstrates:
//   Giulia aggiunge un farmaco, inserisce scadenza, numero di compresse rimanenti
//   e posizione "armadietto bagno"; nel dettaglio del farmaco tutte e tre le
//   informazioni sono visibili e modificabili.

test.use({
  video: 'on',
  launchOptions: { slowMo: 300 },
  viewport: { width: 1280, height: 720 },
})

const DEMO_MED = {
  id: 'med-demo-001',
  household_id: 'hh-001',
  catalog_id: null,
  name: 'Tachipirina 1000mg',
  quantity: 15,
  unit: 'compresse',
  expires_at: '2027-06-30',
  location: 'Armadietto bagno',
  notes: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

test('demo__user-adds-medicine-with-expiry-quantity-location', async ({ page }) => {
  await installAuthMock(page)

  // Mock POST (insert) and GET (detail load)
  await page.route('**/rest/v1/medications*', async route => {
    const method = route.request().method().toUpperCase()
    if (method === 'POST') {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify([DEMO_MED]),
      })
      return
    }
    if (method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([DEMO_MED]),
      })
      return
    }
    await route.continue()
  })

  await page.route('**/rpc/ensure_personal_household*', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify('hh-001'),
    })
  })

  // --- Initial state: empty add form ---
  await page.goto('/medicine/new')
  await expect(page.getByText('Aggiungi farmaco')).toBeVisible()

  // --- Step 1: Enter medication name ---
  await page.getByLabel(/nome \*/i).fill('Tachipirina 1000mg')

  // --- Step 2: Enter expiry date ---
  await page.locator('#mf-expires').fill('2027-06-30')

  // --- Step 3: Enter quantity ---
  await page.locator('#mf-quantity').clear()
  await page.locator('#mf-quantity').fill('15')

  // --- Step 4: Select unit ---
  await page.locator('#mf-unit').selectOption('compresse')

  // --- Step 5: Enter location (free text) ---
  await page.getByPlaceholder(/oppure scrivi qui/i).fill('Armadietto bagno')

  // --- Step 6: Save ---
  await page.getByRole('button', { name: /salva farmaco/i }).click()

  // --- Final state: detail page shows all three fields ---
  await expect(page).toHaveURL(/\/medicine\/med-demo-001/, { timeout: 8000 })

  await expect(page.getByText('30/06/2027')).toBeVisible()
  await expect(page.getByText('15')).toBeVisible()
  await expect(page.getByText('Armadietto bagno')).toBeVisible()

  // Hold end state visible for at least 1.5 s so the video captures the outcome
  await page.waitForTimeout(1500)
})
