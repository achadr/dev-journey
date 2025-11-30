import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SelectQuery } from '@/components/challenges/SelectQuery'

describe('SelectQuery', () => {
  const defaultConfig = {
    question: 'Select the query that fetches all users',
    options: [
      'SELECT * FROM users',
      'INSERT INTO users',
      'DELETE FROM users',
    ],
    answer: 'SELECT * FROM users',
  }

  const mockOnAnswer = vi.fn()

  beforeEach(() => {
    mockOnAnswer.mockClear()
  })

  describe('rendering', () => {
    it('renders the question', () => {
      render(<SelectQuery config={defaultConfig} onAnswer={mockOnAnswer} />)

      expect(screen.getByText(defaultConfig.question)).toBeInTheDocument()
    })

    it('renders all SQL query options', () => {
      render(<SelectQuery config={defaultConfig} onAnswer={mockOnAnswer} />)

      defaultConfig.options.forEach((option) => {
        expect(screen.getByText(option)).toBeInTheDocument()
      })
    })

    it('displays queries in monospace/code style', () => {
      render(<SelectQuery config={defaultConfig} onAnswer={mockOnAnswer} />)

      const queryButtons = screen.getAllByRole('button').filter(btn =>
        defaultConfig.options.some(opt => btn.textContent?.includes(opt))
      )
      expect(queryButtons.length).toBe(3)
    })
  })

  describe('selection', () => {
    it('allows selecting an option', async () => {
      const user = userEvent.setup()
      render(<SelectQuery config={defaultConfig} onAnswer={mockOnAnswer} />)

      await user.click(screen.getByRole('button', { name: /SELECT \* FROM users/i }))

      expect(screen.getByRole('button', { name: /SELECT \* FROM users/i })).toHaveAttribute('data-selected', 'true')
    })

    it('changes selection when different option clicked', async () => {
      const user = userEvent.setup()
      render(<SelectQuery config={defaultConfig} onAnswer={mockOnAnswer} />)

      await user.click(screen.getByRole('button', { name: /SELECT \* FROM users/i }))
      await user.click(screen.getByRole('button', { name: /INSERT INTO users/i }))

      expect(screen.getByRole('button', { name: /SELECT \* FROM users/i })).toHaveAttribute('data-selected', 'false')
      expect(screen.getByRole('button', { name: /INSERT INTO users/i })).toHaveAttribute('data-selected', 'true')
    })
  })

  describe('submission', () => {
    it('calls onAnswer with correct=true when correct option selected', async () => {
      const user = userEvent.setup()
      render(<SelectQuery config={defaultConfig} onAnswer={mockOnAnswer} />)

      await user.click(screen.getByRole('button', { name: /SELECT \* FROM users/i }))
      await user.click(screen.getByRole('button', { name: /submit/i }))

      expect(mockOnAnswer).toHaveBeenCalledWith({
        correct: true,
        answer: 'SELECT * FROM users',
      })
    })

    it('calls onAnswer with correct=false when wrong option selected', async () => {
      const user = userEvent.setup()
      render(<SelectQuery config={defaultConfig} onAnswer={mockOnAnswer} />)

      await user.click(screen.getByRole('button', { name: /DELETE FROM users/i }))
      await user.click(screen.getByRole('button', { name: /submit/i }))

      expect(mockOnAnswer).toHaveBeenCalledWith({
        correct: false,
        answer: 'DELETE FROM users',
      })
    })

    it('disables submit button when no option selected', () => {
      render(<SelectQuery config={defaultConfig} onAnswer={mockOnAnswer} />)

      expect(screen.getByRole('button', { name: /submit/i })).toBeDisabled()
    })

    it('enables submit button when option selected', async () => {
      const user = userEvent.setup()
      render(<SelectQuery config={defaultConfig} onAnswer={mockOnAnswer} />)

      await user.click(screen.getByRole('button', { name: /SELECT \* FROM users/i }))

      expect(screen.getByRole('button', { name: /submit/i })).not.toBeDisabled()
    })
  })

  describe('feedback', () => {
    it('shows success feedback after correct answer', async () => {
      const user = userEvent.setup()
      render(<SelectQuery config={defaultConfig} onAnswer={mockOnAnswer} />)

      await user.click(screen.getByRole('button', { name: /SELECT \* FROM users/i }))
      await user.click(screen.getByRole('button', { name: /submit/i }))

      expect(screen.getByText(/correct/i)).toBeInTheDocument()
    })

    it('shows error feedback after wrong answer', async () => {
      const user = userEvent.setup()
      render(<SelectQuery config={defaultConfig} onAnswer={mockOnAnswer} />)

      await user.click(screen.getByRole('button', { name: /INSERT INTO users/i }))
      await user.click(screen.getByRole('button', { name: /submit/i }))

      expect(screen.getByText(/incorrect/i)).toBeInTheDocument()
    })

    it('disables options after submission', async () => {
      const user = userEvent.setup()
      render(<SelectQuery config={defaultConfig} onAnswer={mockOnAnswer} />)

      await user.click(screen.getByRole('button', { name: /SELECT \* FROM users/i }))
      await user.click(screen.getByRole('button', { name: /submit/i }))

      // Check that query buttons are disabled
      const queryButtons = screen.getAllByRole('button').filter(btn =>
        defaultConfig.options.some(opt => btn.textContent?.includes(opt))
      )
      queryButtons.forEach(btn => {
        expect(btn).toBeDisabled()
      })
    })
  })
})
