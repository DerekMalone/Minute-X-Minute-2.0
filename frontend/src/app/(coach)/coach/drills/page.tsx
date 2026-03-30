'use client'

import Link from 'next/link'
import { useMyTeam } from '@/features/team-management/hooks/useTeam'
import { useDrills } from '@/features/drill-library/hooks/useDrills'
import { DrillList } from '@/features/drill-library/components/drill-list'
import { Button } from '@/components/ui/button'

export default function DrillsPage() {
  const { data: myTeam, isPending: teamPending } = useMyTeam()
  const { data: drills, isPending: drillsPending } = useDrills(myTeam?.id)

  if (teamPending || drillsPending) return <p className="p-8">Loading...</p>

  if (!myTeam) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">
          Create a team first to start building your drill library.
        </p>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-2xl mx-auto flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Drill Library</h1>
        <Button asChild>
          <Link href="/coach/drills/new">New Drill</Link>
        </Button>
      </div>
      <DrillList drills={drills ?? []} />
    </div>
  )
}
