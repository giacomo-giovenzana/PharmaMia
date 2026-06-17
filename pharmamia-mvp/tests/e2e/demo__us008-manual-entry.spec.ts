import { test, expect } from '@playwright/test'
import { installScanSeam } from './helpers/scanSeam'

// Demo scenario for US-008: Giulia inserisce manualmente un farmaco dall'inventario
// Fully self-contained via page.route() mocks — no live Supabase needed.
//
// Dimostra: Giulia sceglie "Inserimento manuale", compila il form con nome e
// principio attivo, e il farmaco appare nell'inventario; un farmaco inserito
// manualmente è trattato in modo identico a uno scansionato.

test.use({
  video: 'on',
  launchOptions: {
    slowMo: 300,
    // Preserve fake media flags from the project config so getUserMedia works
    // in headless Chromium without real camera hardware.
    args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'],
  },
})

const UNKNOWN_EAN = '9999999999999'
const NEW_MED_UUID = 'us008-new-med-uuid'
// Future date that passes validateExpiryDate
const FUTURE_EXPIRY = '2099-12-31'

async function installAuthMock(page: import('@playwright/test').Page) {
  const fakeUser = {
    id: 'test-user-id',
    aud: 'authenticated',
    role: 'authenticated',
    email: 'test-us008@pharmamia.local',
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
  }

  const fakeSession = {
    access_token: 'fake-access-token-e2e-us008',
    refresh_token: 'fake-refresh-token-e2e-us008',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user: fakeUser,
  }

  await page.addInitScript(({ session }: { session: unknown }) => {
    localStorage.setItem('sb-hzhddndperprjtwodwyb-auth-token', JSON.stringify(session))
  }, { session: fakeSession })

  await page.route('**/auth/v1/user*', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(fakeUser),
    })
  })
}

test('demo__us008: Giulia inserisce manualmente un farmaco dall\'inventario', async ({ page }) => {
  let capturedInsertBody: unknown = null

  await installAuthMock(page)

  // drugs_catalog returns null → "not found" sheet → "Inserisci manualmente"
  await page.route('**/rest/v1/drugs_catalog*', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(null),
    })
  })

  await page.route('**/rest/v1/rpc/ensure_personal_household*', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify('us008-household-uuid'),
    })
  })

  // insertMedication calls: from('medications').insert(data).select().single()
  // single() sets Accept: application/vnd.pgrst.object+json so PostgREST returns
  // a single JSON object (not an array). We mirror that here.
  await page.route('**/rest/v1/medications*', async route => {
    if (route.request().method() === 'POST') {
      capturedInsertBody = JSON.parse(route.request().postData() ?? '{}')
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ id: NEW_MED_UUID, name: 'Aspirina 500 mg' }),
      })
    } else {
      await route.continue()
    }
  })

  await installScanSeam(page, UNKNOWN_EAN)

  // 1. Navigate to /scan (idle state)
  await page.goto('/scan')
  await expect(page).toHaveURL(/\/scan/)

  // 2. Wait for "Farmaco non trovato" sheet (exact match on the tag element)
  await expect(page.getByText('Farmaco non trovato', { exact: true }).first()).toBeVisible({ timeout: 8000 })

  // 3. Click "Inserisci manualmente" from the not-found sheet
  await page.getByRole('button', { name: /inserisci manualmente/i }).click()

  // 4. Should land on /medicine/new without a draft (no AIFA chip)
  await expect(page).toHaveURL(/\/medicine\/new/)
  await expect(page.getByText('Aggiungi farmaco')).toBeVisible()
  await expect(page.getByText(/dati da database AIFA/i)).not.toBeVisible()

  // 5. Fill in Nome (required) and Principio attivo (optional)
  await page.getByLabel('Nome *').fill('Aspirina 500 mg')
  await page.getByLabel(/principio attivo/i).fill('Acido acetilsalicilico')

  // 6. Fill required expiry date (validateExpiryDate requires a future date)
  await page.getByLabel(/data scadenza \*/i).fill(FUTURE_EXPIRY)

  // 7. Save the medicine
  await page.getByRole('button', { name: /salva farmaco/i }).click()

  // 8. Should navigate to the detail page after successful save
  await expect(page).toHaveURL(new RegExp(`/medicine/${NEW_MED_UUID}`), { timeout: 8000 })

  // 9. Verify catalog_id was null (manual entry, not from AIFA catalog)
  const inserted = capturedInsertBody as Record<string, unknown> | null
  expect(inserted).not.toBeNull()
  expect(inserted?.catalog_id).toBeNull()
  expect(inserted?.name).toBe('Aspirina 500 mg')

  // 10. Hold end state for video capture
  await page.waitForTimeout(1500)
})
