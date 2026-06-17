import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './AuthContext'
import { LoginPage } from './LoginPage'

vi.mock('@shared/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
      signInWithPassword: vi.fn(),
    },
  },
}))

import { supabase } from '@shared/supabase/client'

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<div>Home</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  )
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(supabase.auth.getSession as Mock).mockResolvedValue({ data: { session: null } })
    ;(supabase.auth.onAuthStateChange as Mock).mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    })
  })

  it('mostra il form di login', () => {
    renderLogin()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /accedi/i })).toBeInTheDocument()
  })

  it('mostra errore se email non valida al submit', async () => {
    const user = userEvent.setup()
    renderLogin()

    await user.click(screen.getByRole('button', { name: /accedi/i }))

    expect(screen.getByText(/inserisci un'email valida/i)).toBeInTheDocument()
  })

  it('mostra banner errore per credenziali errate', async () => {
    ;(supabase.auth.signInWithPassword as Mock).mockResolvedValue({
      error: { message: 'Invalid login credentials', code: 'invalid_credentials' },
    })

    const user = userEvent.setup()
    renderLogin()

    await user.type(screen.getByLabelText('Email'), 'giulia@email.it')
    await user.type(screen.getByLabelText('Password'), 'sbagliata1')
    await user.click(screen.getByRole('button', { name: /accedi/i }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })
  })

  it('chiama signInWithPassword con le credenziali corrette', async () => {
    ;(supabase.auth.signInWithPassword as Mock).mockResolvedValue({
      data: { session: { user: { id: '1' }, access_token: 'tok' } },
      error: null,
    })
    ;(supabase.auth.onAuthStateChange as Mock).mockImplementation((cb) => {
      cb('SIGNED_IN', { user: { id: '1' }, access_token: 'tok' })
      return { data: { subscription: { unsubscribe: vi.fn() } } }
    })

    const user = userEvent.setup()
    renderLogin()

    await user.type(screen.getByLabelText('Email'), 'giulia@email.it')
    await user.type(screen.getByLabelText('Password'), 'correctpass1')
    await user.click(screen.getByRole('button', { name: /accedi/i }))

    await waitFor(() => {
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'giulia@email.it',
        password: 'correctpass1',
      })
    })
  })

  it('link "Registrati" è presente', () => {
    renderLogin()
    expect(screen.getByRole('link', { name: /registrati/i })).toBeInTheDocument()
  })
})
