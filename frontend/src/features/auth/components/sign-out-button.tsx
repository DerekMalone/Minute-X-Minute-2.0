'use client'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/features/auth/hooks/useAuth'

export function SignOutButton() {
  const { signOut } = useAuth()

  return (
    <Button
      type="button"
      onClick={() => signOut()}
      className="min-h-[44px] bg-mx-surface-2 text-mx-text hover:bg-mx-surface-2/80"
    >
      Sign out
    </Button>
  )
}
