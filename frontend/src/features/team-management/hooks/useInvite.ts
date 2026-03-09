import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch, ApiError } from '@/lib/api'
import type { InviteDto, ValidateInviteDto, RedeemInviteResponse } from '@/features/team-management/types'

export function useActiveInvite(teamId: string | null) {
  return useQuery<InviteDto | null>({
    queryKey: ['invite', 'active', teamId],
    queryFn: async () => {
      try {
        return await apiFetch<InviteDto>(`/api/invites/active?teamId=${teamId}`)
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) return null
        throw err
      }
    },
    enabled: !!teamId,
    retry: false,
  })
}

export function useGenerateInvite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (teamId: string) =>
      apiFetch<InviteDto>('/api/invites', {
        method: 'POST',
        body: JSON.stringify({ teamId }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invite', 'active'] })
    },
  })
}

export function useValidateInvite(token: string | null) {
  return useQuery<ValidateInviteDto | null>({
    queryKey: ['invite', 'validate', token],
    queryFn: async () => {
      try {
        return await apiFetch<ValidateInviteDto>(`/api/invites/validate?token=${token}`)
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) return null
        throw err
      }
    },
    enabled: !!token,
    retry: false,
  })
}

export function useRedeemInvite() {
  return useMutation({
    mutationFn: (token: string) =>
      apiFetch<RedeemInviteResponse>('/api/invites/redeem', {
        method: 'POST',
        body: JSON.stringify({ token }),
      }),
  })
}
