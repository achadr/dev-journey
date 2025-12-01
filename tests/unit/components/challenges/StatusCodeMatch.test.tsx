import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Mock the ui components to avoid React version issues
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: React.ComponentProps<'button'>) => (
    <button {...props}>{children}</button>
  ),
}))

import { StatusCodeMatch } from '@/components/challenges/StatusCodeMatch'

describe('StatusCodeMatch', () => {
  const defaultConfig = {
    scenario: 'The requested resource was not found on the server',
    statusCodes: [200, 201, 404, 500],
    correctCode: 404,
    explanation: '404 Not Found is returned when the server cannot find the requested resource.',
  }

  const mockOnAnswer = vi.fn()

  beforeEach(() => {
    mockOnAnswer.mockClear()
  })

  describe('rendering', () => {
    it('renders the scenario description', () => {
      render(<StatusCodeMatch config={defaultConfig} onAnswer={mockOnAnswer} />)

      expect(screen.getByText(defaultConfig.scenario)).toBeInTheDocument()
    })

    it('renders all status code options', () => {
      render(<StatusCodeMatch config={defaultConfig} onAnswer={mockOnAnswer} />)

      defaultConfig.statusCodes.forEach((code) => {
        expect(screen.getByRole('button', { name: new RegExp(code.toString()) })).toBeInTheDocument()
      })
    })

    it('displays status code descriptions', () => {
      render(<StatusCodeMatch config={defaultConfig} onAnswer={mockOnAnswer} />)

      // Check each status code button has an aria-label with its description
      expect(screen.getByRole('button', { name: /200 OK/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /201 Created/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /404 Not Found/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /500 Internal Server Error/i })).toBeInTheDocument()
    })

    it('renders status codes with appropriate color coding', () => {
      render(<StatusCodeMatch config={defaultConfig} onAnswer={mockOnAnswer} />)

      // 2xx should be green, 4xx should be yellow/orange, 5xx should be red
      const successCode = screen.getByRole('button', { name: /200/ })
      const clientError = screen.getByRole('button', { name: /404/ })
      const serverError = screen.getByRole('button', { name: /500/ })

      expect(successCode).toHaveAttribute('data-category', 'success')
      expect(clientError).toHaveAttribute('data-category', 'client-error')
      expect(serverError).toHaveAttribute('data-category', 'server-error')
    })
  })

  describe('selection', () => {
    it('allows selecting a status code', async () => {
      const user = userEvent.setup()
      render(<StatusCodeMatch config={defaultConfig} onAnswer={mockOnAnswer} />)

      await user.click(screen.getByRole('button', { name: /404/ }))

      expect(screen.getByRole('button', { name: /404/ })).toHaveAttribute('data-selected', 'true')
    })

    it('changes selection when different code clicked', async () => {
      const user = userEvent.setup()
      render(<StatusCodeMatch config={defaultConfig} onAnswer={mockOnAnswer} />)

      await user.click(screen.getByRole('button', { name: /404/ }))
      await user.click(screen.getByRole('button', { name: /200/ }))

      expect(screen.getByRole('button', { name: /404/ })).toHaveAttribute('data-selected', 'false')
      expect(screen.getByRole('button', { name: /200/ })).toHaveAttribute('data-selected', 'true')
    })
  })

  describe('submission', () => {
    it('calls onAnswer with correct=true when correct code selected', async () => {
      const user = userEvent.setup()
      render(<StatusCodeMatch config={defaultConfig} onAnswer={mockOnAnswer} />)

      await user.click(screen.getByRole('button', { name: /404/ }))
      await user.click(screen.getByRole('button', { name: /submit/i }))

      expect(mockOnAnswer).toHaveBeenCalledWith({
        correct: true,
        answer: 404,
      })
    })

    it('calls onAnswer with correct=false when wrong code selected', async () => {
      const user = userEvent.setup()
      render(<StatusCodeMatch config={defaultConfig} onAnswer={mockOnAnswer} />)

      await user.click(screen.getByRole('button', { name: /200/ }))
      await user.click(screen.getByRole('button', { name: /submit/i }))

      expect(mockOnAnswer).toHaveBeenCalledWith({
        correct: false,
        answer: 200,
      })
    })

    it('disables submit button when no code selected', () => {
      render(<StatusCodeMatch config={defaultConfig} onAnswer={mockOnAnswer} />)

      expect(screen.getByRole('button', { name: /submit/i })).toBeDisabled()
    })

    it('enables submit button when code selected', async () => {
      const user = userEvent.setup()
      render(<StatusCodeMatch config={defaultConfig} onAnswer={mockOnAnswer} />)

      await user.click(screen.getByRole('button', { name: /404/ }))

      expect(screen.getByRole('button', { name: /submit/i })).not.toBeDisabled()
    })
  })

  describe('feedback', () => {
    it('shows success feedback after correct answer', async () => {
      const user = userEvent.setup()
      render(<StatusCodeMatch config={defaultConfig} onAnswer={mockOnAnswer} />)

      await user.click(screen.getByRole('button', { name: /404/ }))
      await user.click(screen.getByRole('button', { name: /submit/i }))

      expect(screen.getByText(/correct/i)).toBeInTheDocument()
    })

    it('shows error feedback after wrong answer', async () => {
      const user = userEvent.setup()
      render(<StatusCodeMatch config={defaultConfig} onAnswer={mockOnAnswer} />)

      await user.click(screen.getByRole('button', { name: /500/ }))
      await user.click(screen.getByRole('button', { name: /submit/i }))

      expect(screen.getByText(/incorrect/i)).toBeInTheDocument()
    })

    it('shows explanation after submission', async () => {
      const user = userEvent.setup()
      render(<StatusCodeMatch config={defaultConfig} onAnswer={mockOnAnswer} />)

      await user.click(screen.getByRole('button', { name: /404/ }))
      await user.click(screen.getByRole('button', { name: /submit/i }))

      expect(screen.getByText(defaultConfig.explanation)).toBeInTheDocument()
    })

    it('disables options after submission', async () => {
      const user = userEvent.setup()
      render(<StatusCodeMatch config={defaultConfig} onAnswer={mockOnAnswer} />)

      await user.click(screen.getByRole('button', { name: /404/ }))
      await user.click(screen.getByRole('button', { name: /submit/i }))

      defaultConfig.statusCodes.forEach((code) => {
        expect(screen.getByRole('button', { name: new RegExp(code.toString()) })).toBeDisabled()
      })
    })

    it('highlights the correct answer after wrong submission', async () => {
      const user = userEvent.setup()
      render(<StatusCodeMatch config={defaultConfig} onAnswer={mockOnAnswer} />)

      await user.click(screen.getByRole('button', { name: /500/ }))
      await user.click(screen.getByRole('button', { name: /submit/i }))

      expect(screen.getByRole('button', { name: /404/ })).toHaveAttribute('data-correct', 'true')
    })
  })

  describe('educational content', () => {
    it('shows HTTP status code category labels', () => {
      render(<StatusCodeMatch config={defaultConfig} onAnswer={mockOnAnswer} />)

      expect(screen.getByText(/2xx.*Success/i)).toBeInTheDocument()
      expect(screen.getByText(/4xx.*Client Error/i)).toBeInTheDocument()
      expect(screen.getByText(/5xx.*Server Error/i)).toBeInTheDocument()
    })
  })

  describe('different scenarios', () => {
    it('handles success scenario correctly', async () => {
      const successConfig = {
        scenario: 'The request was successful and the resource was returned',
        statusCodes: [200, 201, 204, 404],
        correctCode: 200,
        explanation: '200 OK indicates a successful request with response body.',
      }

      const user = userEvent.setup()
      render(<StatusCodeMatch config={successConfig} onAnswer={mockOnAnswer} />)

      await user.click(screen.getByRole('button', { name: /200/ }))
      await user.click(screen.getByRole('button', { name: /submit/i }))

      expect(mockOnAnswer).toHaveBeenCalledWith({
        correct: true,
        answer: 200,
      })
    })

    it('handles server error scenario correctly', async () => {
      const serverErrorConfig = {
        scenario: 'The server encountered an unexpected error while processing the request',
        statusCodes: [200, 400, 404, 500],
        correctCode: 500,
        explanation: '500 Internal Server Error indicates an unexpected server-side failure.',
      }

      const user = userEvent.setup()
      render(<StatusCodeMatch config={serverErrorConfig} onAnswer={mockOnAnswer} />)

      await user.click(screen.getByRole('button', { name: /500/ }))
      await user.click(screen.getByRole('button', { name: /submit/i }))

      expect(mockOnAnswer).toHaveBeenCalledWith({
        correct: true,
        answer: 500,
      })
    })

    it('handles unauthorized scenario correctly', async () => {
      const unauthorizedConfig = {
        scenario: 'The user tried to access a protected resource without authentication',
        statusCodes: [200, 401, 403, 404],
        correctCode: 401,
        explanation: '401 Unauthorized means authentication is required but was not provided.',
      }

      const user = userEvent.setup()
      render(<StatusCodeMatch config={unauthorizedConfig} onAnswer={mockOnAnswer} />)

      await user.click(screen.getByRole('button', { name: /401/ }))
      await user.click(screen.getByRole('button', { name: /submit/i }))

      expect(mockOnAnswer).toHaveBeenCalledWith({
        correct: true,
        answer: 401,
      })
    })
  })
})
