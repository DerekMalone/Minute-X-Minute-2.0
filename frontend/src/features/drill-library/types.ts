export interface DrillDto {
  id: string
  teamId: string
  name: string
  description: string | null
  category: string | null
  difficulty: string | null
  durationMinutes: number | null
  positionTags: string[]
  createdAt: string
  updatedAt: string
}

export interface CreateDrillRequest {
  name: string
  description?: string
  category?: string
  difficulty?: string
  durationMinutes?: number
  positionTags?: string[]
}

export const DRILL_CATEGORIES = ['Offense', 'Defense', 'Transition', 'Ground Balls', 'Conditioning', 'Goalie'] as const
export type DrillCategory = typeof DRILL_CATEGORIES[number]

export const DRILL_DIFFICULTIES = ['Easy', 'Medium', 'Hard'] as const
export type DrillDifficulty = typeof DRILL_DIFFICULTIES[number]
