import { test, expect } from '@playwright/test'

// Demo scenario for US-004: registration → auto-confirm → home → logout → login
// Requires: pnpm dev + supabase start (enable_confirmations = false for auto-confirm)

test.use({
  video: 'on',
  launchOptions: { slowMo: 300 },
})

test('demo: utente si registra, accede alla home e fa logout', async ({ page }) => {
  const email = `demo+${Date.now()}@pharmamia-test.it`
  const password = 'DemoPass1'

  // 1. Stato iniziale: app aperta, nessuna sessione → redirect a /login
  await page.goto('/')
  await expect(page).toHaveURL(/\/login/)
  await expect(page.getByRole('heading', { name: /bentornata/i })).toBeVisible()

  // 2. Naviga alla registrazione
  await page.getByRole('link', { name: /registrati/i }).click()
  await expect(page).toHaveURL(/\/register/)
  await expect(page.getByRole('heading', { name: /crea il tuo account/i })).toBeVisible()

  // 3. Compila il form di registrazione
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByLabel('Conferma password').fill(password)

  // 4. Invia registrazione
  await page.getByRole('button', { name: /crea account/i }).click()

  // 5. Con auto-confirm attivo, sessione creata — naviga alla home
  await page.goto('/')
  await expect(page).toHaveURL('/')
  await expect(page.getByText(/il tuo armadietto/i)).toBeVisible()

  // 6. Apri menu account
  await page.getByRole('button', { name: /menu account/i }).click()
  await expect(page.getByText(/esci/i).first()).toBeVisible()

  // 7. Avvia logout → conferma
  await page.getByRole('button', { name: /^esci$/i }).click()
  await expect(page.getByRole('heading', { name: /vuoi uscire/i })).toBeVisible()
  await page.getByRole('button', { name: /esci dall'account/i }).click()

  // 8. Sessione invalidata → redirect a /login
  await expect(page).toHaveURL(/\/login/)
  await expect(page.getByRole('heading', { name: /bentornata/i })).toBeVisible()

  // 9. Login con le stesse credenziali
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: /accedi/i }).click()

  // 10. Di nuovo nella home — stato finale visibile
  await expect(page).toHaveURL('/')
  await expect(page.getByText(/il tuo armadietto/i)).toBeVisible()
  await page.waitForTimeout(1500)
})
