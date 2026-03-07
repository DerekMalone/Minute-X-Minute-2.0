export interface TeamDto {
  id: string
  name: string
  sport: string
  role: string
  createdAt: string
}

export interface InviteDto {
  id: string
  token: string
  expiresAt: string
  createdAt: string
}
