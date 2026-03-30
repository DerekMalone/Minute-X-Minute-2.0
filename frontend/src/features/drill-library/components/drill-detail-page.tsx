'use client'

import Link from 'next/link'
import { useDrills } from '../hooks/useDrills'
import { useMyTeam } from '@/features/team-management/hooks/useTeam'

interface Props {
  drillId: string
}

export function DrillDetailPage({ drillId }: Props) {
  const { data: myTeam } = useMyTeam()
  const { data: drills, isPending } = useDrills(myTeam?.id)

  const drill = drills?.find((d) => d.id === drillId)

  if (isPending) return <p className="p-8">Loading...</p>
  if (!drill) return <p className="p-8">Drill not found.</p>

  return (
    <div className="p-8 max-w-2xl mx-auto flex flex-col gap-6">
      <div>
        <Link href="/coach/drills" className="text-sm text-muted-foreground hover:underline">
          ← Back to library
        </Link>
      </div>

      <h1 className="text-2xl font-bold">{drill.name}</h1>

      <div className="flex flex-col gap-4 text-sm text-muted-foreground">
        <div>
          <span className="font-medium text-foreground">Category: </span>
          {drill.category ?? <span className="italic">Not set</span>}
        </div>
        <div>
          <span className="font-medium text-foreground">Difficulty: </span>
          {drill.difficulty ?? <span className="italic">Not set</span>}
        </div>
        <div>
          <span className="font-medium text-foreground">Duration: </span>
          {drill.durationMinutes ? `${drill.durationMinutes} min` : <span className="italic">Not set</span>}
        </div>
        <div>
          <span className="font-medium text-foreground">Position tags: </span>
          {drill.positionTags.length > 0 ? drill.positionTags.join(', ') : <span className="italic">None</span>}
        </div>
        {drill.description && (
          <div>
            <span className="font-medium text-foreground">Description: </span>
            {drill.description}
          </div>
        )}
      </div>
    </div>
  )
}
