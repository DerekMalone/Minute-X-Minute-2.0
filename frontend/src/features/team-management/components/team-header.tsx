'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useDeleteTeam } from '@/features/team-management/hooks/useTeam'
import type { TeamDto } from '@/features/team-management/types'

interface TeamHeaderProps {
  team: TeamDto
}

export function TeamHeader({ team }: TeamHeaderProps) {
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const deleteTeam = useDeleteTeam()

  return (
    <div>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-mx-text text-2xl font-bold">{team.name}</h2>
          <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded bg-mx-teal/10 text-mx-teal">
            Head Coach
          </span>
        </div>
        <Button variant="destructive" onClick={() => setIsDeleteOpen(true)}>
          Delete team
        </Button>
      </div>

      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {team.name}?</DialogTitle>
            <DialogDescription>
              This will permanently delete your team, all players, and all drills. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteTeam.isPending}
              onClick={() => deleteTeam.mutate(team.id)}
            >
              {deleteTeam.isPending ? 'Deleting...' : 'Delete Team'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
