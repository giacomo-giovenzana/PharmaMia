import { render, screen, act } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '@features/auth/AuthContext'
import App from './App'

vi.mock('@shared/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
  },
}))

describe('App', () => {
  it('reindirizza a /login quando non autenticato', async () => {
    await act(async () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <AuthProvider>
            <App />
          </AuthProvider>
        </MemoryRouter>
      )
    })

    expect(screen.getByRole('heading', { name: /bentornata/i })).toBeInTheDocument()
  })
})
