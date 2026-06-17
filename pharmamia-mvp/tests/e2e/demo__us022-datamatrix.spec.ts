import { test, expect } from '@playwright/test'
import { installAuthMock } from './helpers/medicationsHelper'
import { installScanSeam, buildGs1Payload } from './helpers/scanSeam'

// Demo scenario — US-022
// Giulia apre "Aggiungi farmaco", punta la fotocamera su un DataMatrix GS1 di un
// farmaco a catalogo AIFA → il form mostra nome/principio attivo da AIFA e
// scadenza/lotto/seriale pre-compilati → salva → la scheda mostra scadenza, lotto e seriale.

test.use({
  video: 'on',
  launchOptions: { slowMo: 300 },
})

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
const GTIN14 = '08001234567890'
const EXPIRY_YYMMDD = '270331' // 2027-03-31
const LOT = 'LOT2027'
const SERIAL = 'SER98765'

const GS1_PAYLOAD = buildGs1Payload({ gtin14: GTIN14, expiryYYMMDD: EXPIRY_YYMMDD, lot: LOT, serial: SERIAL })

const CATALOG_ENTRY = {
  id: 'cat-uuid-022',
  aic_code: '001234567',
  ean_code: '8001234567890', // GTIN14 without leading '0' → 8001234567890 (13 chars)
  name: 'ASPIRINA 500 mg COMPRESSE',
  active_ingredient: 'acido acetilsalicilico',
  form: 'compressa',
  dosage: '500 mg',
  atc_code: 'B01AC06',
  manufacturer: 'Bayer',
  package_desc: '20 compresse',
  is_otc: true,
  requires_prescription: false,
  created_at: '2024-01-01T00:00:00Z',
}

const SAVED_MED = {
  id: 'med-022-001',
  household_id: 'hh-demo',
  catalog_id: 'cat-uuid-022',
  name: 'ASPIRINA 500 mg COMPRESSE',
  quantity: 1,
  unit: 'pz',
  expires_at: '2027-03-31',
  location: null,
  notes: null,
  lot: LOT,
  serial: SERIAL,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

// ---------------------------------------------------------------------------
// Demo test
// ---------------------------------------------------------------------------
test('Demo US-022: DataMatrix farmaco noto → form pre-compilato → scheda con lotto e seriale', async ({ page }) => {
  await installAuthMock(page)

  // Stub catalog lookup — the app calls drugs_catalog?ean_code=eq.<ean13>
  await page.route('**/rest/v1/drugs_catalog*', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([CATALOG_ENTRY]),
    })
  })

  // Stub medications POST (insert)
  await page.route('**/rest/v1/medications*', async route => {
    const method = route.request().method().toUpperCase()
    if (method === 'POST') {
      await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify([SAVED_MED]) })
      return
    }
    if (method === 'GET') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([SAVED_MED]) })
      return
    }
    await route.continue()
  })

  await page.route('**/rpc/ensure_personal_household*', async route => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify('hh-demo') })
  })

  // Install GS1 DataMatrix seam BEFORE navigating
  await installScanSeam(page, { rawValue: GS1_PAYLOAD, format: 'data_matrix' })

  // Giulia va alla pagina scan
  await page.goto('/scan')
  await expect(page.getByText('Scansione farmaco')).toBeVisible()

  // Scanner rileva il DataMatrix — lo sheet appare con il farmaco da catalogo
  await expect(page.getByText('Farmaco trovato nel database AIFA')).toBeVisible({ timeout: 8000 })
  await expect(page.getByText('ASPIRINA 500 mg COMPRESSE')).toBeVisible()

  // Giulia clicca "Aggiungi all'inventario"
  await page.getByRole('button', { name: /aggiungi all'inventario/i }).click()

  // Form pre-compilato — scadenza, nome, lotto
  await expect(page.getByText('Conferma farmaco')).toBeVisible()
  await expect(page.getByLabelText(/nome \*/i)).toHaveValue('ASPIRINA 500 mg COMPRESSE')
  await expect(page.locator('#mf-expires')).toHaveValue('2027-03-31')
  await expect(page.locator('#mf-lot')).toHaveValue(LOT)
  await expect(page.locator('#mf-serial')).toHaveValue(SERIAL)

  // Giulia salva
  await page.getByRole('button', { name: /salva farmaco/i }).click()

  // Scheda farmaco mostra lotto e seriale
  await expect(page).toHaveURL(/\/medicine\/med-022-001/, { timeout: 8000 })
  await expect(page.getByText('31/03/2027')).toBeVisible()
  await expect(page.getByText(LOT)).toBeVisible()
  await expect(page.getByText(SERIAL)).toBeVisible()

  // Hold final state visible for 1.5s so the recording captures the outcome
  await page.waitForTimeout(1500)
})
