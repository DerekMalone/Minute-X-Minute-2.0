'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTeamStore } from '@/stores/useTeamStore'
import { InviteLinkManager } from '@/features/team-management/components/invite-link-manager'

export default function InvitePage() {
  const teamId = useTeamStore((s) => s.teamId)
  const router = useRouter()

  useEffect(() => {
    if (!teamId) router.replace('/coach/team')
  }, [teamId, router])

  if (!teamId) return null

  return (
    <div className="p-8">
      <h1 className="mb-6 text-2xl font-bold">Invite Players</h1>
      <InviteLinkManager teamId={teamId} />
    </div>
  )
}
