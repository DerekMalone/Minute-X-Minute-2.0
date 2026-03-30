import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CreateDrillForm } from './create-drill-form'

const mockMutate = vi.hoisted(() => vi.fn())
const mockPush = vi.hoisted(() => vi.fn())

vi.mock('@/features/drill-library/hooks/useCreateDrill', () => ({
  useCreateDrill: () => ({
    mutate: mockMutate,
    isPending: false,
  }),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

beforeEach(() => {
  mockMutate.mockClear()
  mockPush.mockClear()
})

describe('CreateDrillForm', () => {
  it('renders name input with autofocus', () => {
    render(<CreateDrillForm teamId="team-1" />)
    const input = screen.getByPlaceholderText(/drill name/i)
    expect(input).toBeInTheDocument()
    expect(input).toHaveFocus()
  })

  it('shows "Drill name is required" when blurred with empty value', async () => {
    render(<CreateDrillForm teamId="team-1" />)
    const input = screen.getByPlaceholderText(/drill name/i)
    fireEvent.blur(input)

    await waitFor(() => {
      expect(screen.getByText(/drill name is required/i)).toBeInTheDocument()
    })
    expect(mockMutate).not.toHaveBeenCalled()
  })

  it('does not call mutate when name is whitespace-only', async () => {
    render(<CreateDrillForm teamId="team-1" />)
    const input = screen.getByPlaceholderText(/drill name/i)
    fireEvent.change(input, { target: { value: '   ' } })
    fireEvent.blur(input)

    await waitFor(() => {
      expect(screen.getByText(/drill name is required/i)).toBeInTheDocument()
    })
    expect(mockMutate).not.toHaveBeenCalled()
  })

  it('calls mutate with trimmed name when Enter is pressed', async () => {
    render(<CreateDrillForm teamId="team-1" />)
    const input = screen.getByPlaceholderText(/drill name/i)
    fireEvent.change(input, { target: { value: '  Box Drill  ' } })
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' })

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith(
        { name: 'Box Drill' },
        expect.objectContaining({ onSuccess: expect.any(Function) })
      )
    })
  })

  it('calls mutate with trimmed name when input is blurred', async () => {
    render(<CreateDrillForm teamId="team-1" />)
    const input = screen.getByPlaceholderText(/drill name/i)
    fireEvent.change(input, { target: { value: 'Shooting Drill' } })
    fireEvent.blur(input)

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith(
        { name: 'Shooting Drill' },
        expect.objectContaining({ onSuccess: expect.any(Function) })
      )
    })
  })

  it('navigates to /coach/drills/[id] on mutation success', async () => {
    mockMutate.mockImplementation((_, opts) =>
      opts?.onSuccess?.({ id: 'drill-abc', name: 'Box Drill' })
    )
    render(<CreateDrillForm teamId="team-1" />)
    const input = screen.getByPlaceholderText(/drill name/i)
    fireEvent.change(input, { target: { value: 'Box Drill' } })
    fireEvent.blur(input)

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/coach/drills/drill-abc')
    })
  })
})
