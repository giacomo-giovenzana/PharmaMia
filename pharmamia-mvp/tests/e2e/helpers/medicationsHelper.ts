import type { Page } from '@playwright/test'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// ---------------------------------------------------------------------------
// Derive the Supabase localStorage key from the project's .env file so that
// auth injection works whether tests run against a local Supabase instance
// (http://127.0.0.1:54321 → key "sb-127-auth-token") or against the cloud
// project used by the reused dev server.
// ---------------------------------------------------------------------------
function resolveStorageKey(): string {
  try {
    const envPath = resolve(__dirname, '../../.env')
    const content = readFileSync(envPath, 'utf-8')
    const match = content.match(/^VITE_SUPABASE_URL=(.+)$/m)
    if (match) {
      const url = match[1].trim()
      const projectRef = new URL(url).hostname.split('.')[0]
      return `sb-${projectRef}-auth-token`
    }
  } catch { /* fall through to default */ }
  return 'sb-127-auth-token'
}

const SUPABASE_STORAGE_KEY = resolveStorageKey()

// ---------------------------------------------------------------------------
// Auth mock — injects a fake Supabase session into localStorage BEFORE the
// page loads so that AuthContext.getSession() finds a valid session and
// ProtectedRoute lets the user through.
// ---------------------------------------------------------------------------
export async function installAuthMock(page: Page): Promise<void> {
  const fakeUser = {
    id: 'test-user-id',
    aud: 'authenticated',
    role: 'authenticated',
    email: 'test-us009@pharmamia.local',
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
  // Use the key derived from the actual VITE_SUPABASE_URL in .env.
  await page.addInitScript(({ key, session }: { key: string; session: unknown }) => {
    localStorage.setItem(key, JSON.stringify(session))
  }, { key: SUPABASE_STORAGE_KEY, session: fakeSession })

  // Mock auth validation endpoints so the SDK never makes real network calls
  // to Supabase cloud (which would fail with a fake token).
  await page.route('**/auth/v1/user*', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(fakeUser),
    })
  })

  // Token refresh — return a valid refreshed session so autoRefreshToken
  // doesn't invalidate the injected session mid-test.
  await page.route('**/auth/v1/token*', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        access_token: 'fake-access-token-e2e',
        refresh_token: 'fake-refresh-token-e2e',
        token_type: 'bearer',
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        user: fakeUser,
      }),
    })
  })
}

// ---------------------------------------------------------------------------
// Medications API mock options
// ---------------------------------------------------------------------------
export type MockOptions = {
  /** Response body for GET /rest/v1/medications?id=eq.* (single object; wrapped in array for Supabase) */
  getMedById?: Record<string, unknown>
  /** Response body for PATCH /rest/v1/medications* */
  patchResponse?: Record<string, unknown>
  /** Response body for POST /rest/v1/medications* */
  postResponse?: Record<string, unknown>
}

// ---------------------------------------------------------------------------
// installMedicationsMock — intercepts Supabase REST calls for medications and
// the ensure_personal_household RPC used during medication persistence flows.
// ---------------------------------------------------------------------------
export async function installMedicationsMock(page: Page, options: MockOptions = {}): Promise<void> {
  const { getMedById, patchResponse, postResponse } = options

  // Intercept all /rest/v1/medications* traffic and dispatch by HTTP method.
  await page.route('**/rest/v1/medications*', async route => {
    const method = route.request().method().toUpperCase()
    const url = route.request().url()

    if (method === 'GET' && /id=eq\./.test(url)) {
      // Supabase returns arrays; maybeSingle() / single() picks the first row.
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(getMedById != null ? [getMedById] : []),
      })
      return
    }

    if (method === 'PATCH') {
      const body = patchResponse ?? (getMedById != null ? [{ id: 'med-001', ...getMedById }] : [{ id: 'med-001' }])
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(body),
      })
      return
    }

    if (method === 'POST') {
      const body = postResponse ?? (getMedById != null ? [{ id: 'med-001', ...getMedById }] : [{ id: 'med-001' }])
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(body),
      })
      return
    }

    // Fall through for any other method (e.g. HEAD, DELETE) — pass to network.
    await route.continue()
  })

  // Supabase RPC: ensure_personal_household returns the household id as a string.
  await page.route('**/rpc/ensure_personal_household*', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify('hh-001'),
    })
  })
}
