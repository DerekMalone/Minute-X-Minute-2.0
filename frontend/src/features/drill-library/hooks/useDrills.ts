import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'
import type { DrillDto } from '../types'

export function useDrills(teamId: string | undefined) {
  return useQuery<DrillDto[]>({
    queryKey: ['drills', teamId],
    queryFn: () => apiFetch<DrillDto[]>(`/api/drills?teamId=${teamId}`),
    enabled: !!teamId,
  })
}
