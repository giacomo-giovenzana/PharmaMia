import { defineConfig, devices } from '@playwright/test'

const outputDir = process.env.E2E_OUTPUT_DIR ?? 'docs/test-results/US-007'

export default defineConfig({
  testDir: 'tests/e2e',
  outputDir,
  use: {
    baseURL: 'http://localhost:5173',
    viewport: { width: 1280, height: 720 },
    video: 'off',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Provide fake media streams so getUserMedia() works in headless
        // Chromium without real camera hardware.
        launchOptions: {
          args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'],
        },
      },
    },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    // Supply stub env vars so the Supabase client can be instantiated even
    // when the local Supabase instance is not running.  All actual backend
    // calls are intercepted by page.route() inside the e2e tests.
    env: {
      VITE_SUPABASE_URL: 'http://127.0.0.1:54321',
      // Standard Supabase CLI local publishable key (public, non-secret)
      VITE_SUPABASE_PUBLISHABLE_KEY:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRFA0NiK7urOL8uIwRgCdzFNFZpO9p6HNaPmH1RTADU',
    },
  },
})
