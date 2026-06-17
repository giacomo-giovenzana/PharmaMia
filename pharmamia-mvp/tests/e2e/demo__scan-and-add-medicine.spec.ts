import { test, expect } from '@playwright/test'
import { installScanSeam } from './helpers/scanSeam'

// Demo scenario for US-007: Giulia scansiona un farmaco e lo aggiunge all'inventario
// Fully self-contained via page.route() mocks — no live Supabase needed.

test.use({
  video: 'on',
  launchOptions: { slowMo: 300 },
})

const TACHIPIRINA_EAN = '0433218196003'

const TACHIPIRINA_ENTRY = {
  id: 1,
  aic_code: '000000001',
  ean_code: TACHIPIRINA_EAN,
  name: 'TACHIPIRINA 500 mg COMPRESSE',
  active_ingredient: 'paracetamolo',
  form: 'compressa',
  dosage: '500 mg',
  manufacturer: null,
  package_desc: null,
  created_at: '2024-01-01T00:00:00.000Z',
}

/**
 * Mock the Supabase backend so the full demo flow runs without a live server:
 *  - localStorage injection → fake session (bypasses getSession() HTTP call)
 *  - auth/v1/user   → fake user (SDK validates token against this endpoint)
 *  - rest/v1/drugs_catalog → TACHIPIRINA entry
 *  - rest/v1/rpc/ensure_personal_household → fake household UUID
 *  - rest/v1/medications (POST) → successful insert
 *
 * The localStorage key `sb-127-auth-token` is derived from:
 *   `sb-${new URL('http://127.0.0.1:54321').hostname.split('.')[0]}-auth-token`
 */
async function installSupabaseMock(page: import('@playwright/test').Page) {
  const fakeUser = {
    id: 'demo-user-id',
    aud: 'authenticated',
    role: 'authenticated',
    email: 'demo@pharmamia.local',
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
  }

  const fakeSession = {
    access_token: 'fake-access-token-demo',
    refresh_token: 'fake-refresh-token-demo',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user: fakeUser,
  }

  // Inject session into localStorage BEFORE the page loads so AuthContext
  // finds a valid session without any HTTP round-trip.
  await page.addInitScript(({ session }: { session: unknown }) => {
    localStorage.setItem('sb-127-auth-token', JSON.stringify(session))
  }, { session: fakeSession })

  // Mock user validation endpoint
  await page.route('**/auth/v1/user*', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(fakeUser),
    })
  })

  // Mock drugs_catalog lookup — return TACHIPIRINA
  await page.route('**/rest/v1/drugs_catalog*', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(TACHIPIRINA_ENTRY),
    })
  })

  // Mock ensure_personal_household RPC
  await page.route('**/rest/v1/rpc/ensure_personal_household*', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify('demo-household-uuid'),
    })
  })

  // Mock medications insert
  await page.route('**/rest/v1/medications*', async route => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    } else {
      await route.continue()
    }
  })
}

test('demo: Giulia scansiona un farmaco e lo aggiunge all\'inventario', async ({ page }) => {
  // Install all mocks BEFORE any navigation so init scripts and routes are in place
  await installSupabaseMock(page)
  await installScanSeam(page, TACHIPIRINA_EAN)

  // 1. Open app — the injected localStorage session makes ProtectedRoute pass
  await page.goto('/')

  // 2. Home page — click "Aggiungi farmaco"
  await expect(page.getByRole('button', { name: /aggiungi farmaco/i })).toBeVisible()
  await page.getByRole('button', { name: /aggiungi farmaco/i }).click()

  // 3. Should navigate to /scan
  await expect(page).toHaveURL(/\/scan/)

  // 4. Wait for the BarcodeDetector stub to fire and lookupByCode to return TACHIPIRINA
  //    The result bottom sheet appears when the drug is found
  await expect(page.getByText('TACHIPIRINA 500 mg COMPRESSE')).toBeVisible({ timeout: 8000 })

  // 5. Assert the "found" tag is visible
  await expect(page.getByText(/farmaco trovato nel database AIFA/i)).toBeVisible()

  // 6. Click "Aggiungi all'inventario"
  await page.getByRole('button', { name: /aggiungi all'inventario/i }).click()

  // 7. Should navigate to /medicine/new with form pre-filled
  await expect(page).toHaveURL(/\/medicine\/new/)

  // 8. Assert the AIFA chip is present (draft mode)
  await expect(page.getByText(/dati da database AIFA/i)).toBeVisible()

  // 9. Assert the name field contains TACHIPIRINA
  await expect(page.getByLabel('Nome *')).toHaveValue(/TACHIPIRINA/i)

  // 10. Click "Salva farmaco" — hits mocked RPC + insert endpoints
  await page.getByRole('button', { name: /salva farmaco/i }).click()

  // 11. Should navigate to / (home page) after successful save
  await expect(page).toHaveURL('/', { timeout: 8000 })

  // 12. Hold final state for video capture
  await page.waitForTimeout(1500)
})
