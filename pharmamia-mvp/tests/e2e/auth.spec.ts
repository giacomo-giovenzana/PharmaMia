import { test, expect } from '@playwright/test'

// These tests require: pnpm dev + supabase start (with enable_confirmations = false)
// For local Supabase, registration auto-confirms the email.

const testEmail = (tag: string) => `test+${tag}+${Date.now()}@pharmamia-test.it`

test('route protetta reindirizza a /login senza sessione', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL(/\/login/)
  await expect(page.getByRole('heading', { name: /bentornata/i })).toBeVisible()
})

test('credenziali errate mostrano banner di errore', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Email').fill('nonregistrata@test.it')
  await page.getByLabel('Password').fill('wrongpass1')
  await page.getByRole('button', { name: /accedi/i }).click()

  await expect(page.getByRole('alert')).toBeVisible()
  await expect(page.getByRole('alert')).toContainText(/credenziali errate/i)
})

test('email non valida nel form login mostra errore inline', async ({ page }) => {
  await page.goto('/login')
  await page.getByRole('button', { name: /accedi/i }).click()

  await expect(page.getByText(/inserisci un'email valida/i)).toBeVisible()
})

test('registrazione con email già usata mostra banner', async ({ page }) => {
  const email = testEmail('dup')
  const password = 'TestPass1'

  // Prima registrazione
  await page.goto('/register')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByLabel('Conferma password').fill(password)
  await page.getByRole('button', { name: /crea account/i }).click()
  await expect(page).toHaveURL(/\/verify-email|\//)

  // Seconda registrazione con la stessa email
  await page.goto('/register')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByLabel('Conferma password').fill(password)
  await page.getByRole('button', { name: /crea account/i }).click()

  await expect(page.getByRole('alert')).toBeVisible()
  await expect(page.getByRole('alert')).toContainText(/già registrata/i)
})

test('login con credenziali valide reindirizza alla home', async ({ page }) => {
  const email = testEmail('login')
  const password = 'TestPass1'

  // Registra prima
  await page.goto('/register')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByLabel('Conferma password').fill(password)
  await page.getByRole('button', { name: /crea account/i }).click()

  // Logout manuale via URL per resettare stato
  await page.goto('/login')

  // Login
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: /accedi/i }).click()

  await expect(page).toHaveURL('/')
  await expect(page.getByText(/il tuo armadietto/i)).toBeVisible()
})

test('logout invalida la sessione e reindirizza a /login', async ({ page }) => {
  const email = testEmail('logout')
  const password = 'TestPass1'

  // Registra e vai alla home
  await page.goto('/register')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByLabel('Conferma password').fill(password)
  await page.getByRole('button', { name: /crea account/i }).click()

  // Naviga alla home (auto-login con auto-confirm)
  await page.goto('/')
  await expect(page).toHaveURL('/')

  // Apri menu account e fai logout
  await page.getByRole('button', { name: /menu account/i }).click()
  await page.getByRole('button', { name: /esci/i }).click()
  await page.getByRole('button', { name: /esci dall'account/i }).click()

  await expect(page).toHaveURL(/\/login/)
})
