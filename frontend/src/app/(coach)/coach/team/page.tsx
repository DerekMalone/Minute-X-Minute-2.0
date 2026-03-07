'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useMyTeam } from '@/features/team-management/hooks/useTeam'
import { TeamCreateForm } from '@/features/team-management/components/team-create-form'
import { TeamHeader } from '@/features/team-management/components/team-header'
import { useTeamStore } from '@/stores/useTeamStore'

export default function TeamPage() {
  const { data: team, isPending } = useMyTeam()
  const setTeam = useTeamStore((s) => s.setTeam)

  useEffect(() => {
    if (team) setTeam(team.id, team.name, team.role)
  }, [team, setTeam])

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
      {team ? (
        <>
          <TeamHeader team={team} />
          <Link
            href="/coach/team/invite"
            className="mt-4 inline-block rounded border border-mx-text/20 px-4 py-2 hover:bg-mx-text/5"
          >
            Invite Players
          </Link>
        </>
      ) : (
        <TeamCreateForm />
      )}
    </div>
  )
}
