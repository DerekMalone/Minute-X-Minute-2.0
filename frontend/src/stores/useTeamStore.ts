import { create } from 'zustand'

interface TeamState {
  teamId: string | null
  teamName: string | null
  role: string | null
  setTeam: (id: string, name: string, role: string) => void
  clearTeam: () => void
}

export const useTeamStore = create<TeamState>((set) => ({
  teamId: null,
  teamName: null,
  role: null,
  setTeam: (id, name, role) => set({ teamId: id, teamName: name, role }),
  clearTeam: () => set({ teamId: null, teamName: null, role: null }),
}))
