'use client'

import { useMyTeam } from '@/features/team-management/hooks/useTeam'
import { CreateDrillForm } from '@/features/drill-library/components/create-drill-form'

export default function NewDrillPage() {
  const { data: myTeam, isPending } = useMyTeam()

  if (isPending) return <p className="p-8">Loading...</p>

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
    <div className="p-8 max-w-lg mx-auto flex flex-col gap-4">
      <h1 className="text-2xl font-bold">New Drill</h1>
      <CreateDrillForm teamId={myTeam.id} />
    </div>
  )
}
