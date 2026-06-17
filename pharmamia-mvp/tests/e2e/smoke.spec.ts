import { test, expect } from '@playwright/test'

test('app loads and shows PharmaMia heading', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /pharmamia/i })).toBeVisible()
})

test('PWA manifest is accessible', async ({ page }) => {
  const response = await page.request.get('/manifest.webmanifest')
  expect(response.status()).toBe(200)
  const manifest = await response.json() as { name: string }
  expect(manifest.name).toBe('PharmaMia')
})
