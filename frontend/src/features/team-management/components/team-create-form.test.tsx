import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TeamCreateForm } from './team-create-form'

const mockMutate = vi.fn()
const mockUseCreateTeam = vi.fn()

vi.mock('@/features/team-management/hooks/useTeam', () => ({
  useCreateTeam: () => mockUseCreateTeam(),
}))

beforeEach(() => {
  mockMutate.mockClear()
  mockUseCreateTeam.mockReturnValue({
    mutate: mockMutate,
    isPending: false,
    isError: false,
    error: null,
  })
})

describe('TeamCreateForm', () => {
  it('renders the team name input', () => {
    render(<TeamCreateForm />)
    expect(screen.getByPlaceholderText('e.g. Lake Norman Lacrosse')).toBeInTheDocument()
  })

  it('shows "Team name is required" when submitted empty', async () => {
    const user = userEvent.setup()
    render(<TeamCreateForm />)

    await user.click(screen.getByRole('button', { name: /create team/i }))

    expect(await screen.findByText('Team name is required')).toBeInTheDocument()
    expect(mockMutate).not.toHaveBeenCalled()
  })

  it('shows "Team name is required" when submitted with whitespace only', async () => {
    const user = userEvent.setup()
    render(<TeamCreateForm />)

    await user.type(screen.getByPlaceholderText('e.g. Lake Norman Lacrosse'), '   ')
    await user.click(screen.getByRole('button', { name: /create team/i }))

    expect(await screen.findByText('Team name is required')).toBeInTheDocument()
    expect(mockMutate).not.toHaveBeenCalled()
  })

  it('calls createTeam.mutate with the submitted name on valid submit', async () => {
    const user = userEvent.setup()
    render(<TeamCreateForm />)

    await user.type(screen.getByPlaceholderText('e.g. Lake Norman Lacrosse'), 'Lake Norman Lacrosse')
    await user.click(screen.getByRole('button', { name: /create team/i }))

    expect(mockMutate).toHaveBeenCalledWith('Lake Norman Lacrosse')
  })

  it('shows loading state while submitting', () => {
    mockUseCreateTeam.mockReturnValue({
      mutate: mockMutate,
      isPending: true,
      isError: false,
      error: null,
    })

    render(<TeamCreateForm />)

    expect(screen.getByRole('button', { name: /creating/i })).toBeDisabled()
  })
})
