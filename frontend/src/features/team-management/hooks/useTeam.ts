import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { apiFetch, ApiError } from '@/lib/api'
import { useTeamStore } from '@/stores/useTeamStore'
import type { TeamDto } from '@/features/team-management/types'

export function useMyTeam() {
  return useQuery<TeamDto | null>({
    queryKey: ['team', 'my'],
    queryFn: async () => {
      try {
        return await apiFetch<TeamDto>('/api/teams/my')
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) return null
        throw err
      }
    },
    retry: false,
  })
}

export function useCreateTeam() {
  const queryClient = useQueryClient()
  const setTeam = useTeamStore((s) => s.setTeam)

  return useMutation({
    mutationFn: (name: string) =>
      apiFetch<TeamDto>('/api/teams', {
        method: 'POST',
        body: JSON.stringify({ name }),
      }),
    onSuccess: (team) => {
      queryClient.invalidateQueries({ queryKey: ['team'] })
      setTeam(team.id, team.name, team.role)
    },
  })
}

export function useDeleteTeam() {
  const queryClient = useQueryClient()
  const router = useRouter()
  const clearTeam = useTeamStore((s) => s.clearTeam)

  return useMutation({
    mutationFn: (teamId: string) =>
      apiFetch(`/api/teams/${teamId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team'] })
      clearTeam()
      router.push('/coach/team')
    },
  })
}
