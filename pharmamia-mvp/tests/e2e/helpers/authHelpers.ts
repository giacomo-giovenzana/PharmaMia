import type { Page } from '@playwright/test'

/**
 * Navigates to /login, fills in the given credentials, and submits the form.
 * Does NOT assert on the resulting URL — callers should add their own assertions
 * depending on whether a successful or failed login is expected.
 */
export async function loginTestUser(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: /accedi/i }).click()
}
