'use client'

import Link from 'next/link'
import { DrillCard } from './drill-card'
import type { DrillDto } from '../types'

interface Props {
  drills: DrillDto[]
}

export function DrillList({ drills }: Props) {
  if (drills.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Your drill library is empty.</p>
        <Link href="/coach/drills/new" className="text-primary underline mt-2 inline-block">
          Create your first drill
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {drills.map((drill) => (
        <Link key={drill.id} href={`/coach/drills/${drill.id}`}>
          <DrillCard drill={drill} />
        </Link>
      ))}
    </div>
  )
}
