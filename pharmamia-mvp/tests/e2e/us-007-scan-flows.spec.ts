import { test, expect } from '@playwright/test'
import { installScanSeam } from './helpers/scanSeam'

// US-007: Scan flow — non-demo scenarios (no video recording)
// Fully self-contained via page.route() + localStorage injection — no live Supabase needed.

// ---------------------------------------------------------------------------
// Shared auth mock: injects a fake Supabase session into localStorage BEFORE
// the page loads so that AuthContext.getSession() finds a valid session and
// ProtectedRoute lets the user through to /scan and /medicine/new.
//
// The Supabase JS client stores the session under:
//   `sb-${new URL(supabaseUrl).hostname.split('.')[0]}-auth-token`
// For http://127.0.0.1:54321 that key is `sb-127-auth-token`.
// ---------------------------------------------------------------------------
async function installAuthMock(page: import('@playwright/test').Page) {
  const fakeUser = {
    id: 'test-user-id',
    aud: 'authenticated',
    role: 'authenticated',
    email: 'test-us007@pharmamia.local',
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
  }

  const fakeSession = {
    access_token: 'fake-access-token-e2e',
    refresh_token: 'fake-refresh-token-e2e',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user: fakeUser,
  }

  // Inject session into localStorage before page scripts run.
  // The key matches the Supabase JS SDK derivation for http://127.0.0.1:54321.
  await page.addInitScript(({ session }: { session: unknown }) => {
    localStorage.setItem('sb-127-auth-token', JSON.stringify(session))
  }, { session: fakeSession })

  // Also mock the /auth/v1/user endpoint so that supabase.auth.getUser()
  // calls (which the SDK makes to validate the token) return our fake user.
  await page.route('**/auth/v1/user*', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(fakeUser),
    })
  })
}

// ---------------------------------------------------------------------------
// Scenario A: Barcode non trovato — fallback manuale
// ---------------------------------------------------------------------------
test('Scenario A: barcode non trovato mostra "Farmaco non trovato" e permette inserimento manuale', async ({ page }) => {
  const UNKNOWN_EAN = '9999999999999'

  // Mock auth
  await installAuthMock(page)

  // Mock drugs_catalog to return empty (not found)
  await page.route('**/rest/v1/drugs_catalog*', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      // maybeSingle() returns null when Supabase returns an empty array with
      // the Accept: application/vnd.pgrst.object+json header — but since we
      // can't perfectly replicate PostgREST behaviour here, we return null
      // directly which the client translates to null via maybeSingle().
      body: JSON.stringify(null),
    })
  })

  // Install scan seam with unknown EAN BEFORE navigating to /scan
  await installScanSeam(page, UNKNOWN_EAN)

  // Navigate to scan page
  await page.goto('/scan')
  await expect(page).toHaveURL(/\/scan/)

  // Wait for the "not found" sheet to appear
  await expect(page.getByText('Farmaco non trovato')).toBeVisible({ timeout: 8000 })

  // The sheet also shows "Codice non riconosciuto"
  await expect(page.getByText(/codice non riconosciuto/i)).toBeVisible()

  // Click "Inserisci manualmente"
  await page.getByRole('button', { name: /inserisci manualmente/i }).click()

  // Should navigate to /medicine/new
  await expect(page).toHaveURL(/\/medicine\/new/)

  // Form title should be "Aggiungi farmaco" (no draft — no AIFA chip)
  await expect(page.getByText('Aggiungi farmaco')).toBeVisible()
  await expect(page.getByText(/dati da database AIFA/i)).not.toBeVisible()
})

// ---------------------------------------------------------------------------
// Scenario B: Permesso fotocamera negato — fallback manuale
// ---------------------------------------------------------------------------
test('Scenario B: permesso fotocamera negato mostra errore e pulsante inserimento manuale', async ({ page }) => {
  // Stub getUserMedia to throw NotAllowedError — must be done via addInitScript
  // BEFORE navigating so the error fires on mount.
  await page.addInitScript(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nav = navigator as any
    const rejectWithNotAllowed = () => {
      const err = new Error('Permission denied by user')
      err.name = 'NotAllowedError'
      return Promise.reject(err)
    }
    if (nav.mediaDevices) {
      nav.mediaDevices.getUserMedia = rejectWithNotAllowed
    } else {
      Object.defineProperty(nav, 'mediaDevices', {
        configurable: true,
        value: { getUserMedia: rejectWithNotAllowed },
      })
    }
  })

  // Mock auth so ProtectedRoute lets us through
  await installAuthMock(page)

  await page.goto('/scan')
  await expect(page).toHaveURL(/\/scan/)

  // The ScanPage renders an error overlay with the permission-denied message
  await expect(
    page.getByText(/permesso fotocamera negato/i)
  ).toBeVisible({ timeout: 8000 })

  // "Inserisci manualmente" button must be visible and clickable inside the error overlay
  const manualBtn = page.getByRole('button', { name: /inserisci manualmente/i })
  await expect(manualBtn).toBeVisible()

  // Clicking it navigates to /medicine/new
  await manualBtn.click()
  await expect(page).toHaveURL(/\/medicine\/new/)
})
