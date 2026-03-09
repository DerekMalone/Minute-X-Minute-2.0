import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { JoinTeamPage } from './join-team-page'

const mockMutate = vi.fn()
const mockUseValidateInvite = vi.fn()
const mockUseRedeemInvite = vi.fn()
const mockRouterReplace = vi.fn()

// vi.hoisted ensures this is available inside the vi.mock factory below
const mockGetSession = vi.hoisted(() =>
  vi.fn().mockResolvedValue({ data: { session: null } })
)

vi.mock('@/features/team-management/hooks/useInvite', () => ({
  useValidateInvite: () => mockUseValidateInvite(),
  useRedeemInvite: () => mockUseRedeemInvite(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockRouterReplace }),
}))

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: { getSession: mockGetSession },
  }),
}))

beforeEach(() => {
  mockMutate.mockClear()
  mockRouterReplace.mockClear()
  mockGetSession.mockResolvedValue({ data: { session: null } })
  mockUseValidateInvite.mockReturnValue({ data: undefined, isPending: true })
  mockUseRedeemInvite.mockReturnValue({ mutate: mockMutate, isPending: false, isSuccess: false })
})

describe('JoinTeamPage', () => {
  it('renders loading state while useValidateInvite is pending', () => {
    mockUseValidateInvite.mockReturnValue({ data: undefined, isPending: true })

    render(<JoinTeamPage token="abc123" />)

    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('renders error message when validate returns null (expired/invalid)', () => {
    mockUseValidateInvite.mockReturnValue({ data: null, isPending: false })

    render(<JoinTeamPage token="abc123" />)

    expect(
      screen.getByText(/this invite link has expired or is no longer valid/i)
    ).toBeInTheDocument()
  })

  it('renders team name and auth buttons when invite is valid', () => {
    mockUseValidateInvite.mockReturnValue({
      data: { teamId: 'team-1', teamName: 'Lacrosse Lions' },
      isPending: false,
    })

    render(<JoinTeamPage token="abc123" />)

    expect(screen.getByText(/lacrosse lions/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /create account/i })).toBeInTheDocument()
  })

  it('"Sign in" link points to /login?returnTo=/join/{token}', () => {
    mockUseValidateInvite.mockReturnValue({
      data: { teamId: 'team-1', teamName: 'Test Team' },
      isPending: false,
    })

    render(<JoinTeamPage token="tok123" />)

    const link = screen.getByRole('link', { name: /sign in/i })
    expect(link).toHaveAttribute('href', '/login?returnTo=/join/tok123')
  })

  it('"Create account" link points to /signup?returnTo=/join/{token}', () => {
    mockUseValidateInvite.mockReturnValue({
      data: { teamId: 'team-1', teamName: 'Test Team' },
      isPending: false,
    })

    render(<JoinTeamPage token="tok123" />)

    const link = screen.getByRole('link', { name: /create account/i })
    expect(link).toHaveAttribute('href', '/signup?returnTo=/join/tok123')
  })

  it('calls redeemInvite.mutate and redirects when user is authenticated and invite is valid', async () => {
    mockGetSession.mockResolvedValueOnce({ data: { session: { access_token: 'tok' } } })
    mockUseValidateInvite.mockReturnValue({
      data: { teamId: 'team-1', teamName: 'Test Team' },
      isPending: false,
    })

    render(<JoinTeamPage token="abc123" />)

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith(
        'abc123',
        expect.objectContaining({ onSuccess: expect.any(Function) })
      )
    })
  })

  it('shows error message when redeemInvite fails', async () => {
    mockGetSession.mockResolvedValueOnce({ data: { session: { access_token: 'tok' } } })
    mockUseValidateInvite.mockReturnValue({
      data: { teamId: 'team-1', teamName: 'Test Team' },
      isPending: false,
    })
    mockUseRedeemInvite.mockReturnValue({
      mutate: vi.fn().mockImplementation((_, opts) => opts?.onError?.()),
      isPending: false,
      isSuccess: false,
    })

    render(<JoinTeamPage token="abc123" />)

    await waitFor(() => {
      expect(screen.getByText(/failed to join team/i)).toBeInTheDocument()
    })
  })
})
