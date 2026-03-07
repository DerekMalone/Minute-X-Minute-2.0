import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { InviteLinkManager } from './invite-link-manager'

const mockMutate = vi.fn()
const mockUseActiveInvite = vi.fn()
const mockUseGenerateInvite = vi.fn()

vi.mock('@/features/team-management/hooks/useInvite', () => ({
  useActiveInvite: () => mockUseActiveInvite(),
  useGenerateInvite: () => mockUseGenerateInvite(),
}))

beforeEach(() => {
  mockMutate.mockClear()
  mockUseActiveInvite.mockReturnValue({ data: null, isPending: false })
  mockUseGenerateInvite.mockReturnValue({ mutate: mockMutate, isPending: false })
  vi.stubGlobal('navigator', {
    clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
  })
})

describe('InviteLinkManager', () => {
  it('renders "Generate Invite Link" button when no active invite', () => {
    render(<InviteLinkManager teamId="team-1" />)
    expect(screen.getByRole('button', { name: /generate invite link/i })).toBeInTheDocument()
  })

  it('renders invite link and expiry when active invite exists', () => {
    mockUseActiveInvite.mockReturnValue({
      data: { id: '1', token: 'abc123', expiresAt: '2026-03-13T00:00:00Z', createdAt: '2026-03-06T00:00:00Z' },
      isPending: false,
    })

    render(<InviteLinkManager teamId="team-1" />)

    expect(screen.getByText(/abc123/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /copy link/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /regenerate/i })).toBeInTheDocument()
    expect(screen.getByText(/expires/i)).toBeInTheDocument()
  })

  it('calls generateInvite.mutate when "Generate Invite Link" button clicked', async () => {
    const user = userEvent.setup()
    render(<InviteLinkManager teamId="team-1" />)

    await user.click(screen.getByRole('button', { name: /generate invite link/i }))

    expect(mockMutate).toHaveBeenCalledWith('team-1')
  })

  it('shows "Copied!" after clicking "Copy Link"', async () => {
    const user = userEvent.setup()
    mockUseActiveInvite.mockReturnValue({
      data: { id: '1', token: 'abc123', expiresAt: '2026-03-13T00:00:00Z', createdAt: '2026-03-06T00:00:00Z' },
      isPending: false,
    })

    render(<InviteLinkManager teamId="team-1" />)

    await user.click(screen.getByRole('button', { name: /copy link/i }))

    expect(await screen.findByRole('button', { name: /copied!/i })).toBeInTheDocument()
  })

  it('shows loading skeleton when isPending', () => {
    mockUseActiveInvite.mockReturnValue({ data: undefined, isPending: true })

    render(<InviteLinkManager teamId="team-1" />)

    expect(screen.queryByRole('button', { name: /generate invite link/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /copy link/i })).not.toBeInTheDocument()
  })
})
