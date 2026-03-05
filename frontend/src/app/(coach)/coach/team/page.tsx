'use client'

import { useMyTeam } from '@/features/team-management/hooks/useTeam'
import { TeamCreateForm } from '@/features/team-management/components/team-create-form'
import { TeamHeader } from '@/features/team-management/components/team-header'

export default function TeamPage() {
  const { data: team, isPending } = useMyTeam()

  if (isPending) {
    return (
      <div className="p-8">
        <div className="h-8 w-48 rounded bg-mx-text/10 animate-pulse mb-4" />
        <div className="h-4 w-24 rounded bg-mx-text/10 animate-pulse" />
      </div>
    )
  }

  return (
    <div className="p-8">
      {team ? <TeamHeader team={team} /> : <TeamCreateForm />}
    </div>
  )
}
