import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SelectMethod } from '@/components/challenges/SelectMethod'

describe('SelectMethod', () => {
  const defaultConfig = {
    question: 'What HTTP method should you use to fetch data?',
    options: ['GET', 'POST', 'PUT', 'DELETE'],
    answer: 'GET',
    explanation: 'GET is used to retrieve data from a server.',
  }

  const mockOnAnswer = vi.fn()

  beforeEach(() => {
    mockOnAnswer.mockClear()
  })

  describe('rendering', () => {
    it('renders the question', () => {
      render(<SelectMethod config={defaultConfig} onAnswer={mockOnAnswer} />)

      expect(screen.getByText(defaultConfig.question)).toBeInTheDocument()
    })

    it('renders all HTTP method options', () => {
      render(<SelectMethod config={defaultConfig} onAnswer={mockOnAnswer} />)

      defaultConfig.options.forEach((option) => {
        expect(screen.getByRole('button', { name: option })).toBeInTheDocument()
      })
    })

    it('renders method descriptions', () => {
      render(<SelectMethod config={defaultConfig} onAnswer={mockOnAnswer} />)

      expect(screen.getByText(/retrieve data/i)).toBeInTheDocument()
      expect(screen.getByText(/send data/i)).toBeInTheDocument()
      expect(screen.getByText(/update/i)).toBeInTheDocument()
      expect(screen.getByText(/remove/i)).toBeInTheDocument()
    })
  })

  describe('selection', () => {
    it('allows selecting an option', async () => {
      const user = userEvent.setup()
      render(<SelectMethod config={defaultConfig} onAnswer={mockOnAnswer} />)

      await user.click(screen.getByRole('button', { name: 'GET' }))

      expect(screen.getByRole('button', { name: 'GET' })).toHaveAttribute('data-selected', 'true')
    })

    it('changes selection when different option clicked', async () => {
      const user = userEvent.setup()
      render(<SelectMethod config={defaultConfig} onAnswer={mockOnAnswer} />)

      await user.click(screen.getByRole('button', { name: 'GET' }))
      await user.click(screen.getByRole('button', { name: 'POST' }))

      expect(screen.getByRole('button', { name: 'GET' })).toHaveAttribute('data-selected', 'false')
      expect(screen.getByRole('button', { name: 'POST' })).toHaveAttribute('data-selected', 'true')
    })
  })

  describe('submission', () => {
    it('calls onAnswer with correct=true when correct option selected', async () => {
      const user = userEvent.setup()
      render(<SelectMethod config={defaultConfig} onAnswer={mockOnAnswer} />)

      await user.click(screen.getByRole('button', { name: 'GET' }))
      await user.click(screen.getByRole('button', { name: /submit/i }))

      expect(mockOnAnswer).toHaveBeenCalledWith({
        correct: true,
        answer: 'GET',
      })
    })

    it('calls onAnswer with correct=false when wrong option selected', async () => {
      const user = userEvent.setup()
      render(<SelectMethod config={defaultConfig} onAnswer={mockOnAnswer} />)

      await user.click(screen.getByRole('button', { name: 'POST' }))
      await user.click(screen.getByRole('button', { name: /submit/i }))

      expect(mockOnAnswer).toHaveBeenCalledWith({
        correct: false,
        answer: 'POST',
      })
    })

    it('disables submit button when no option selected', () => {
      render(<SelectMethod config={defaultConfig} onAnswer={mockOnAnswer} />)

      expect(screen.getByRole('button', { name: /submit/i })).toBeDisabled()
    })

    it('enables submit button when option selected', async () => {
      const user = userEvent.setup()
      render(<SelectMethod config={defaultConfig} onAnswer={mockOnAnswer} />)

      await user.click(screen.getByRole('button', { name: 'GET' }))

      expect(screen.getByRole('button', { name: /submit/i })).not.toBeDisabled()
    })
  })

  describe('feedback', () => {
    it('shows success feedback after correct answer', async () => {
      const user = userEvent.setup()
      render(<SelectMethod config={defaultConfig} onAnswer={mockOnAnswer} />)

      await user.click(screen.getByRole('button', { name: 'GET' }))
      await user.click(screen.getByRole('button', { name: /submit/i }))

      expect(screen.getByText(/correct/i)).toBeInTheDocument()
      expect(screen.getByText(defaultConfig.explanation)).toBeInTheDocument()
    })

    it('shows error feedback after wrong answer', async () => {
      const user = userEvent.setup()
      render(<SelectMethod config={defaultConfig} onAnswer={mockOnAnswer} />)

      await user.click(screen.getByRole('button', { name: 'DELETE' }))
      await user.click(screen.getByRole('button', { name: /submit/i }))

      expect(screen.getByText(/incorrect/i)).toBeInTheDocument()
    })

    it('disables options after submission', async () => {
      const user = userEvent.setup()
      render(<SelectMethod config={defaultConfig} onAnswer={mockOnAnswer} />)

      await user.click(screen.getByRole('button', { name: 'GET' }))
      await user.click(screen.getByRole('button', { name: /submit/i }))

      defaultConfig.options.forEach((option) => {
        expect(screen.getByRole('button', { name: option })).toBeDisabled()
      })
    })
  })
})
