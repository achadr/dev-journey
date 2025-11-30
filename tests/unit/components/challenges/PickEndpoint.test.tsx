import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PickEndpoint } from '@/components/challenges/PickEndpoint'

describe('PickEndpoint', () => {
  const defaultConfig = {
    question: 'Which endpoint returns a greeting?',
    options: ['/api/users', '/api/hello', '/api/admin'],
    answer: '/api/hello',
  }

  const mockOnAnswer = vi.fn()

  beforeEach(() => {
    mockOnAnswer.mockClear()
  })

  describe('rendering', () => {
    it('renders the question', () => {
      render(<PickEndpoint config={defaultConfig} onAnswer={mockOnAnswer} />)

      expect(screen.getByText(defaultConfig.question)).toBeInTheDocument()
    })

    it('renders all endpoint options', () => {
      render(<PickEndpoint config={defaultConfig} onAnswer={mockOnAnswer} />)

      defaultConfig.options.forEach((option) => {
        expect(screen.getByRole('button', { name: option })).toBeInTheDocument()
      })
    })

    it('displays endpoints in code-like styling', () => {
      render(<PickEndpoint config={defaultConfig} onAnswer={mockOnAnswer} />)

      const button = screen.getByRole('button', { name: '/api/hello' })
      expect(button).toBeInTheDocument()
    })
  })

  describe('selection', () => {
    it('allows selecting an option', async () => {
      const user = userEvent.setup()
      render(<PickEndpoint config={defaultConfig} onAnswer={mockOnAnswer} />)

      await user.click(screen.getByRole('button', { name: '/api/hello' }))

      expect(screen.getByRole('button', { name: '/api/hello' })).toHaveAttribute('data-selected', 'true')
    })

    it('changes selection when different option clicked', async () => {
      const user = userEvent.setup()
      render(<PickEndpoint config={defaultConfig} onAnswer={mockOnAnswer} />)

      await user.click(screen.getByRole('button', { name: '/api/hello' }))
      await user.click(screen.getByRole('button', { name: '/api/users' }))

      expect(screen.getByRole('button', { name: '/api/hello' })).toHaveAttribute('data-selected', 'false')
      expect(screen.getByRole('button', { name: '/api/users' })).toHaveAttribute('data-selected', 'true')
    })
  })

  describe('submission', () => {
    it('calls onAnswer with correct=true when correct option selected', async () => {
      const user = userEvent.setup()
      render(<PickEndpoint config={defaultConfig} onAnswer={mockOnAnswer} />)

      await user.click(screen.getByRole('button', { name: '/api/hello' }))
      await user.click(screen.getByRole('button', { name: /submit/i }))

      expect(mockOnAnswer).toHaveBeenCalledWith({
        correct: true,
        answer: '/api/hello',
      })
    })

    it('calls onAnswer with correct=false when wrong option selected', async () => {
      const user = userEvent.setup()
      render(<PickEndpoint config={defaultConfig} onAnswer={mockOnAnswer} />)

      await user.click(screen.getByRole('button', { name: '/api/users' }))
      await user.click(screen.getByRole('button', { name: /submit/i }))

      expect(mockOnAnswer).toHaveBeenCalledWith({
        correct: false,
        answer: '/api/users',
      })
    })

    it('disables submit button when no option selected', () => {
      render(<PickEndpoint config={defaultConfig} onAnswer={mockOnAnswer} />)

      expect(screen.getByRole('button', { name: /submit/i })).toBeDisabled()
    })

    it('enables submit button when option selected', async () => {
      const user = userEvent.setup()
      render(<PickEndpoint config={defaultConfig} onAnswer={mockOnAnswer} />)

      await user.click(screen.getByRole('button', { name: '/api/hello' }))

      expect(screen.getByRole('button', { name: /submit/i })).not.toBeDisabled()
    })
  })

  describe('feedback', () => {
    it('shows success feedback after correct answer', async () => {
      const user = userEvent.setup()
      render(<PickEndpoint config={defaultConfig} onAnswer={mockOnAnswer} />)

      await user.click(screen.getByRole('button', { name: '/api/hello' }))
      await user.click(screen.getByRole('button', { name: /submit/i }))

      expect(screen.getByText(/correct/i)).toBeInTheDocument()
    })

    it('shows error feedback after wrong answer', async () => {
      const user = userEvent.setup()
      render(<PickEndpoint config={defaultConfig} onAnswer={mockOnAnswer} />)

      await user.click(screen.getByRole('button', { name: '/api/admin' }))
      await user.click(screen.getByRole('button', { name: /submit/i }))

      expect(screen.getByText(/incorrect/i)).toBeInTheDocument()
    })

    it('disables options after submission', async () => {
      const user = userEvent.setup()
      render(<PickEndpoint config={defaultConfig} onAnswer={mockOnAnswer} />)

      await user.click(screen.getByRole('button', { name: '/api/hello' }))
      await user.click(screen.getByRole('button', { name: /submit/i }))

      defaultConfig.options.forEach((option) => {
        expect(screen.getByRole('button', { name: option })).toBeDisabled()
      })
    })
  })
})
