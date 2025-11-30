import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AddHeaders } from '@/components/challenges/AddHeaders'

describe('AddHeaders', () => {
  const defaultConfig = {
    requiredHeaders: ['Authorization'],
    headerHints: {
      Authorization: 'Bearer token for authentication',
    },
  }

  const mockOnAnswer = vi.fn()

  beforeEach(() => {
    mockOnAnswer.mockClear()
  })

  describe('rendering', () => {
    it('renders instruction text', () => {
      render(<AddHeaders config={defaultConfig} onAnswer={mockOnAnswer} />)

      expect(screen.getByText(/add.*headers/i)).toBeInTheDocument()
    })

    it('renders header input fields for each required header', () => {
      render(<AddHeaders config={defaultConfig} onAnswer={mockOnAnswer} />)

      expect(screen.getByLabelText(/authorization/i)).toBeInTheDocument()
    })

    it('renders hints for headers', () => {
      render(<AddHeaders config={defaultConfig} onAnswer={mockOnAnswer} />)

      expect(screen.getByText(/bearer token/i)).toBeInTheDocument()
    })

    it('renders multiple header inputs when multiple required', () => {
      const multiConfig = {
        requiredHeaders: ['Authorization', 'Content-Type'],
        headerHints: {
          Authorization: 'Bearer token',
          'Content-Type': 'application/json',
        },
      }

      render(<AddHeaders config={multiConfig} onAnswer={mockOnAnswer} />)

      expect(screen.getByLabelText(/authorization/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/content-type/i)).toBeInTheDocument()
    })
  })

  describe('input', () => {
    it('allows typing header values', async () => {
      const user = userEvent.setup()
      render(<AddHeaders config={defaultConfig} onAnswer={mockOnAnswer} />)

      const input = screen.getByLabelText(/authorization/i)
      await user.type(input, 'Bearer abc123')

      expect(input).toHaveValue('Bearer abc123')
    })

    it('shows common header suggestions', () => {
      render(<AddHeaders config={defaultConfig} onAnswer={mockOnAnswer} />)

      expect(screen.getByRole('button', { name: /bearer/i })).toBeInTheDocument()
    })

    it('applies suggestion when clicked', async () => {
      const user = userEvent.setup()
      render(<AddHeaders config={defaultConfig} onAnswer={mockOnAnswer} />)

      await user.click(screen.getByRole('button', { name: /bearer/i }))

      const input = screen.getByLabelText(/authorization/i)
      expect(input).toHaveValue('Bearer ')
    })
  })

  describe('submission', () => {
    it('disables submit when fields are empty', () => {
      render(<AddHeaders config={defaultConfig} onAnswer={mockOnAnswer} />)

      expect(screen.getByRole('button', { name: /submit/i })).toBeDisabled()
    })

    it('enables submit when all fields have values', async () => {
      const user = userEvent.setup()
      render(<AddHeaders config={defaultConfig} onAnswer={mockOnAnswer} />)

      const input = screen.getByLabelText(/authorization/i)
      await user.type(input, 'Bearer token123')

      expect(screen.getByRole('button', { name: /submit/i })).not.toBeDisabled()
    })

    it('calls onAnswer with headers on submit', async () => {
      const user = userEvent.setup()
      render(<AddHeaders config={defaultConfig} onAnswer={mockOnAnswer} />)

      const input = screen.getByLabelText(/authorization/i)
      await user.type(input, 'Bearer token123')
      await user.click(screen.getByRole('button', { name: /submit/i }))

      expect(mockOnAnswer).toHaveBeenCalledWith({
        correct: true,
        headers: { Authorization: 'Bearer token123' },
      })
    })

    it('marks correct=false when header value format is wrong', async () => {
      const user = userEvent.setup()
      render(<AddHeaders config={defaultConfig} onAnswer={mockOnAnswer} />)

      const input = screen.getByLabelText(/authorization/i)
      await user.type(input, 'invalid')
      await user.click(screen.getByRole('button', { name: /submit/i }))

      expect(mockOnAnswer).toHaveBeenCalledWith({
        correct: false,
        headers: { Authorization: 'invalid' },
      })
    })
  })

  describe('feedback', () => {
    it('shows success feedback after correct submission', async () => {
      const user = userEvent.setup()
      render(<AddHeaders config={defaultConfig} onAnswer={mockOnAnswer} />)

      const input = screen.getByLabelText(/authorization/i)
      await user.type(input, 'Bearer token123')
      await user.click(screen.getByRole('button', { name: /submit/i }))

      expect(screen.getByText(/correct/i)).toBeInTheDocument()
    })

    it('shows error feedback after incorrect submission', async () => {
      const user = userEvent.setup()
      render(<AddHeaders config={defaultConfig} onAnswer={mockOnAnswer} />)

      const input = screen.getByLabelText(/authorization/i)
      await user.type(input, 'wrong')
      await user.click(screen.getByRole('button', { name: /submit/i }))

      expect(screen.getByText(/incorrect/i)).toBeInTheDocument()
    })

    it('disables inputs after submission', async () => {
      const user = userEvent.setup()
      render(<AddHeaders config={defaultConfig} onAnswer={mockOnAnswer} />)

      const input = screen.getByLabelText(/authorization/i)
      await user.type(input, 'Bearer token123')
      await user.click(screen.getByRole('button', { name: /submit/i }))

      expect(input).toBeDisabled()
    })
  })
})
