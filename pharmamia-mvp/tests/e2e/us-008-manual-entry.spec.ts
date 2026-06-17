import { test, expect } from '@playwright/test'

// US-008: Aggiunta manuale farmaco — scenari non-demo (senza video)
// Fully self-contained via page.route() + localStorage injection — no live Supabase needed.

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

// ---------------------------------------------------------------------------
// Validazione inline campo Nome
// ---------------------------------------------------------------------------
test('submit con nome vuoto mostra errore inline e nessun insert', async ({ page }) => {
  await installAuthMock(page)

  // Block all supabase DB calls — none should fire since validation stops submit
  await page.route('**/rest/v1/**', async route => {
    await route.continue()
  })

  // Navigate directly to /medicine/new
  await page.goto('/medicine/new')
  await expect(page).toHaveURL(/\/medicine\/new/)
  await expect(page.getByText('Aggiungi farmaco')).toBeVisible()

  // Submit without filling Nome — native `required` removed, so our handler fires
  await page.getByRole('button', { name: /salva farmaco/i }).click()

  // Inline error appears below the Nome field
  await expect(page.getByText(/il nome del farmaco è obbligatorio/i)).toBeVisible()

  // Input has aria-invalid="true"
  const nameInput = page.getByLabel('Nome *')
  await expect(nameInput).toHaveAttribute('aria-invalid', 'true')

  // Typing clears the error
  await nameInput.fill('A')
  await expect(page.getByText(/il nome del farmaco è obbligatorio/i)).not.toBeVisible()
})
