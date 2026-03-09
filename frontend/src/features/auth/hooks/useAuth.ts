'use client'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function useAuth() {
  const router = useRouter()
  const supabase = createClient()

  const signUp = async (email: string, password: string, returnTo?: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
    if (data.session) router.push(returnTo || '/coach/dashboard')
    return data
  }

  const signIn = async (email: string, password: string, returnTo?: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    router.push(returnTo || '/coach/dashboard')
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const requestPasswordReset = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    })
    if (error) throw error
  }

  return { signUp, signIn, signOut, requestPasswordReset }
}
