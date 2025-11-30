import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MiddlewareSequence } from '@/components/challenges/MiddlewareSequence'

describe('MiddlewareSequence', () => {
  const defaultConfig = {
    steps: ['validate-token', 'check-permissions', 'rate-limit'],
    correctOrder: [0, 1, 2],
  }

  const mockOnAnswer = vi.fn()

  beforeEach(() => {
    mockOnAnswer.mockClear()
  })

  describe('rendering', () => {
    it('renders instruction text', () => {
      render(<MiddlewareSequence config={defaultConfig} onAnswer={mockOnAnswer} />)

      expect(screen.getByText(/order.*middleware/i)).toBeInTheDocument()
    })

    it('renders all middleware steps', () => {
      render(<MiddlewareSequence config={defaultConfig} onAnswer={mockOnAnswer} />)

      defaultConfig.steps.forEach((step) => {
        expect(screen.getByText(step)).toBeInTheDocument()
      })
    })

    it('renders move up/down buttons for each step', () => {
      render(<MiddlewareSequence config={defaultConfig} onAnswer={mockOnAnswer} />)

      const upButtons = screen.getAllByRole('button', { name: /move up/i })
      const downButtons = screen.getAllByRole('button', { name: /move down/i })

      expect(upButtons.length).toBe(3)
      expect(downButtons.length).toBe(3)
    })
  })

  describe('reordering', () => {
    it('moves item up when up button clicked', async () => {
      const user = userEvent.setup()
      render(<MiddlewareSequence config={defaultConfig} onAnswer={mockOnAnswer} />)

      // Get all items initially
      const items = screen.getAllByTestId('middleware-item')
      expect(items[0]).toHaveTextContent('validate-token')
      expect(items[1]).toHaveTextContent('check-permissions')

      // Click move up on second item
      const upButtons = screen.getAllByRole('button', { name: /move up/i })
      await user.click(upButtons[1])

      // Check new order
      const reorderedItems = screen.getAllByTestId('middleware-item')
      expect(reorderedItems[0]).toHaveTextContent('check-permissions')
      expect(reorderedItems[1]).toHaveTextContent('validate-token')
    })

    it('moves item down when down button clicked', async () => {
      const user = userEvent.setup()
      render(<MiddlewareSequence config={defaultConfig} onAnswer={mockOnAnswer} />)

      // Click move down on first item
      const downButtons = screen.getAllByRole('button', { name: /move down/i })
      await user.click(downButtons[0])

      // Check new order
      const reorderedItems = screen.getAllByTestId('middleware-item')
      expect(reorderedItems[0]).toHaveTextContent('check-permissions')
      expect(reorderedItems[1]).toHaveTextContent('validate-token')
    })

    it('disables up button for first item', () => {
      render(<MiddlewareSequence config={defaultConfig} onAnswer={mockOnAnswer} />)

      const upButtons = screen.getAllByRole('button', { name: /move up/i })
      expect(upButtons[0]).toBeDisabled()
    })

    it('disables down button for last item', () => {
      render(<MiddlewareSequence config={defaultConfig} onAnswer={mockOnAnswer} />)

      const downButtons = screen.getAllByRole('button', { name: /move down/i })
      expect(downButtons[downButtons.length - 1]).toBeDisabled()
    })
  })

  describe('submission', () => {
    it('calls onAnswer with correct=true when order is correct', async () => {
      const user = userEvent.setup()
      render(<MiddlewareSequence config={defaultConfig} onAnswer={mockOnAnswer} />)

      // Order is already correct, just submit
      await user.click(screen.getByRole('button', { name: /submit/i }))

      expect(mockOnAnswer).toHaveBeenCalledWith({
        correct: true,
        order: [0, 1, 2],
      })
    })

    it('calls onAnswer with correct=false when order is wrong', async () => {
      const user = userEvent.setup()
      render(<MiddlewareSequence config={defaultConfig} onAnswer={mockOnAnswer} />)

      // Swap first two items
      const downButtons = screen.getAllByRole('button', { name: /move down/i })
      await user.click(downButtons[0])

      await user.click(screen.getByRole('button', { name: /submit/i }))

      expect(mockOnAnswer).toHaveBeenCalledWith({
        correct: false,
        order: [1, 0, 2],
      })
    })
  })

  describe('feedback', () => {
    it('shows success feedback after correct answer', async () => {
      const user = userEvent.setup()
      render(<MiddlewareSequence config={defaultConfig} onAnswer={mockOnAnswer} />)

      await user.click(screen.getByRole('button', { name: /submit/i }))

      expect(screen.getByText(/correct.*middleware/i)).toBeInTheDocument()
    })

    it('shows error feedback after wrong answer', async () => {
      const user = userEvent.setup()
      render(<MiddlewareSequence config={defaultConfig} onAnswer={mockOnAnswer} />)

      // Mess up the order
      const downButtons = screen.getAllByRole('button', { name: /move down/i })
      await user.click(downButtons[0])

      await user.click(screen.getByRole('button', { name: /submit/i }))

      expect(screen.getByText(/incorrect/i)).toBeInTheDocument()
    })

    it('disables reordering after submission', async () => {
      const user = userEvent.setup()
      render(<MiddlewareSequence config={defaultConfig} onAnswer={mockOnAnswer} />)

      await user.click(screen.getByRole('button', { name: /submit/i }))

      const upButtons = screen.getAllByRole('button', { name: /move up/i })
      const downButtons = screen.getAllByRole('button', { name: /move down/i })

      upButtons.forEach(btn => expect(btn).toBeDisabled())
      downButtons.forEach(btn => expect(btn).toBeDisabled())
    })
  })
})
