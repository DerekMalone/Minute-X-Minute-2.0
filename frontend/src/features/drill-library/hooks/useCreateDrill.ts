import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'
import type { CreateDrillRequest, DrillDto } from '../types'

export function useCreateDrill(teamId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: CreateDrillRequest) =>
      apiFetch<DrillDto>(`/api/drills?teamId=${teamId}`, {
        method: 'POST',
        body: JSON.stringify(request),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drills', teamId] })
    },
  })
}
