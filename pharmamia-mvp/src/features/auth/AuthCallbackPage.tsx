import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@shared/supabase/client'

export function AuthCallbackPage() {
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      navigate(data.session ? '/' : '/login', { replace: true })
    })
  }, [navigate])

  return null
}
