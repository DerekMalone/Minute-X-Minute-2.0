'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useValidateInvite, useRedeemInvite } from '@/features/team-management/hooks/useInvite'

export function JoinTeamPage({ token }: { token: string }) {
  const router = useRouter()
  const { data: invite, isPending } = useValidateInvite(token)
  const redeemInvite = useRedeemInvite()
  const [redeemError, setRedeemError] = useState<string | null>(null)

  useEffect(() => {
    // Skip if a redeem is already in-flight or succeeded (prevents duplicate requests on re-render)
    if (redeemInvite.isPending || redeemInvite.isSuccess) return
    const checkAndRedeem = async () => {
      const supabase = createClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (session && invite) {
        redeemInvite.mutate(token, {
          onSuccess: () => router.replace('/player/home'),
          onError: () => setRedeemError('Failed to join team. Please try again.'),
        })
      }
    }
    checkAndRedeem()
  }, [invite, token]) // eslint-disable-line react-hooks/exhaustive-deps -- router and redeemInvite.mutate are stable references

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-mx-bg">
        <p className="text-mx-text">Loading...</p>
      </div>
    )
  }

  if (!invite) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-mx-bg px-6">
        <p className="text-center text-mx-text">
          This invite link has expired or is no longer valid
        </p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-mx-bg px-6">
      <h1 className="text-2xl font-bold text-mx-text">Join {invite.teamName}</h1>
      <p className="text-mx-text/70">Sign in or create an account to join this team.</p>
      {redeemError && <p className="text-sm text-mx-red">{redeemError}</p>}
      <div className="flex w-full max-w-sm flex-col gap-3">
        <Link
          href={`/login?returnTo=/join/${token}`}
          className="flex min-h-[44px] items-center justify-center rounded-md bg-mx-teal px-4 font-semibold text-white hover:bg-mx-teal/90"
        >
          Sign in
        </Link>
        <Link
          href={`/signup?returnTo=/join/${token}`}
          className="flex min-h-[44px] items-center justify-center rounded-md border border-mx-teal px-4 font-semibold text-mx-teal hover:bg-mx-teal/10"
        >
          Create account
        </Link>
      </div>
    </div>
  )
}
