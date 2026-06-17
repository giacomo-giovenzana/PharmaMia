import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './AuthContext'
import { RegisterPage } from './RegisterPage'

vi.mock('@shared/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
      signUp: vi.fn(),
    },
  },
}))

import { supabase } from '@shared/supabase/client'

function renderRegister() {
  return render(
    <MemoryRouter initialEntries={['/register']}>
      <AuthProvider>
        <Routes>
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-email" element={<div>Verifica Email</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  )
}

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(supabase.auth.getSession as Mock).mockResolvedValue({ data: { session: null } })
    ;(supabase.auth.onAuthStateChange as Mock).mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    })
  })

  it('mostra il form di registrazione', () => {
    renderRegister()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByLabelText('Conferma password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /crea account/i })).toBeInTheDocument()
  })

  it('mostra errore inline per email non valida', async () => {
    const user = userEvent.setup()
    renderRegister()

    await user.type(screen.getByLabelText('Email'), 'nonvalida')
    await user.click(screen.getByRole('button', { name: /crea account/i }))

    expect(screen.getByText(/inserisci un'email valida/i)).toBeInTheDocument()
  })

  it('mostra errore se le password non coincidono', async () => {
    const user = userEvent.setup()
    renderRegister()

    await user.type(screen.getByLabelText('Email'), 'giulia@email.it')
    await user.type(screen.getByLabelText('Password'), 'Password1')
    await user.type(screen.getByLabelText('Conferma password'), 'Password2')
    await user.click(screen.getByRole('button', { name: /crea account/i }))

    expect(screen.getByText(/le password non coincidono/i)).toBeInTheDocument()
  })

  it('mostra banner "email già registrata"', async () => {
    ;(supabase.auth.signUp as Mock).mockResolvedValue({
      error: { message: 'User already registered', code: 'user_already_exists' },
    })

    const user = userEvent.setup()
    renderRegister()

    await user.type(screen.getByLabelText('Email'), 'giulia@email.it')
    await user.type(screen.getByLabelText('Password'), 'Password1')
    await user.type(screen.getByLabelText('Conferma password'), 'Password1')
    await user.click(screen.getByRole('button', { name: /crea account/i }))

    await waitFor(() => {
      const alert = screen.getByRole('alert')
      expect(alert).toBeInTheDocument()
      expect(alert.textContent).toMatch(/già registrata/i)
    })
  })

  it('chiama signUp con email e password corrette', async () => {
    ;(supabase.auth.signUp as Mock).mockResolvedValue({ error: null })

    const user = userEvent.setup()
    renderRegister()

    await user.type(screen.getByLabelText('Email'), 'giulia@email.it')
    await user.type(screen.getByLabelText('Password'), 'Password1')
    await user.type(screen.getByLabelText('Conferma password'), 'Password1')
    await user.click(screen.getByRole('button', { name: /crea account/i }))

    await waitFor(() => {
      expect(supabase.auth.signUp).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'giulia@email.it', password: 'Password1' })
      )
    })
  })

  it('mostra la pagina verifica email dopo la registrazione', async () => {
    ;(supabase.auth.signUp as Mock).mockResolvedValue({ error: null })

    const user = userEvent.setup()
    renderRegister()

    await user.type(screen.getByLabelText('Email'), 'giulia@email.it')
    await user.type(screen.getByLabelText('Password'), 'Password1')
    await user.type(screen.getByLabelText('Conferma password'), 'Password1')
    await user.click(screen.getByRole('button', { name: /crea account/i }))

    await waitFor(() => {
      expect(screen.getByText('Verifica Email')).toBeInTheDocument()
    })
  })

  it('link "Accedi" è presente', () => {
    renderRegister()
    expect(screen.getByRole('link', { name: /accedi/i })).toBeInTheDocument()
  })
})
