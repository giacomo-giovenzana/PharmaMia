import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './AuthContext'
import { ProtectedRoute } from './ProtectedRoute'

vi.mock('@shared/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
  },
}))

import { supabase } from '@shared/supabase/client'

function TestWrapper({ initialPath = '/' }: { initialPath?: string }) {
  return (
    <MemoryRouter initialEntries={[initialPath]}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<div>Pagina Login</div>} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <div>Contenuto Protetto</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  )
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('reindirizza a /login senza sessione', async () => {
    ;(supabase.auth.getSession as Mock).mockResolvedValue({ data: { session: null } })

    await act(async () => {
      render(<TestWrapper />)
    })

    expect(screen.getByText('Pagina Login')).toBeInTheDocument()
    expect(screen.queryByText('Contenuto Protetto')).not.toBeInTheDocument()
  })

  it('mostra il contenuto con sessione valida', async () => {
    const fakeSession = { user: { id: '123', email: 'test@test.it' }, access_token: 'tok' }
    ;(supabase.auth.getSession as Mock).mockResolvedValue({ data: { session: fakeSession } })

    await act(async () => {
      render(<TestWrapper />)
    })

    expect(screen.getByText('Contenuto Protetto')).toBeInTheDocument()
    expect(screen.queryByText('Pagina Login')).not.toBeInTheDocument()
  })

  it('reagisce a onAuthStateChange quando la sessione scade', async () => {
    let authChangeCallback: (event: string, session: null) => void = () => {}

    ;(supabase.auth.getSession as Mock).mockResolvedValue({
      data: { session: { user: { id: '123' }, access_token: 'tok' } },
    })
    ;(supabase.auth.onAuthStateChange as Mock).mockImplementation((cb) => {
      authChangeCallback = cb
      return { data: { subscription: { unsubscribe: vi.fn() } } }
    })

    await act(async () => {
      render(<TestWrapper />)
    })

    expect(screen.getByText('Contenuto Protetto')).toBeInTheDocument()

    await act(async () => {
      authChangeCallback('SIGNED_OUT', null)
    })

    expect(screen.getByText('Pagina Login')).toBeInTheDocument()
  })
})
