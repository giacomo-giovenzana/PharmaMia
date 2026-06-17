import { test, expect } from '@playwright/test'

test.use({
  video: 'on',
  launchOptions: { slowMo: 300 },
})

test('demo: developer launches app and confirms PWA manifest', async ({ page }) => {
  // Start from clean state
  await page.goto('/')

  // App heading is visible
  await expect(page.getByRole('heading', { name: /pharmamia/i })).toBeVisible()

  // Verify PWA manifest is accessible
  const response = await page.request.get('/manifest.webmanifest')
  expect(response.status()).toBe(200)
  const manifest = await response.json() as { name: string }
  expect(manifest.name).toBe('PharmaMia')

  // Hold end state for 1.5s so video captures the final frame
  await expect(page.getByRole('heading', { name: /pharmamia/i })).toBeVisible()
  await page.waitForTimeout(1500)
})
