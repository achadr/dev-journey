import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LoginPage from '@/app/login/page'

// Mock next/navigation
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
}))

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

// Helper to get the submit button (the one with type="submit")
const getSubmitButton = () => {
  return document.querySelector('button[type="submit"]') as HTMLButtonElement
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('renders login form by default', () => {
      render(<LoginPage />)

      expect(screen.getByText('Packet Journey')).toBeInTheDocument()
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
      expect(getSubmitButton()).toBeInTheDocument()
    })

    it('renders sign up form when tab is clicked', async () => {
      const user = userEvent.setup()
      render(<LoginPage />)

      // Click the Sign Up tab (first one in the tab section)
      const signUpTab = screen.getAllByRole('button').find(btn =>
        btn.textContent === 'Sign Up' && btn.className.includes('flex-1')
      )!
      await user.click(signUpTab)

      expect(screen.getByLabelText(/username/i)).toBeInTheDocument()
      expect(screen.getByText('Create Account')).toBeInTheDocument()
    })

    it('renders continue as guest button', () => {
      render(<LoginPage />)

      expect(screen.getByRole('button', { name: /continue as guest/i })).toBeInTheDocument()
    })
  })

  describe('login flow', () => {
    it('calls login API with credentials', async () => {
      const user = userEvent.setup()
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: {
            user: { id: '1', email: 'test@test.com', username: 'tester', role: 'USER' },
          },
        }),
      })

      render(<LoginPage />)

      await user.type(screen.getByLabelText(/email/i), 'test@test.com')
      await user.type(screen.getByLabelText(/password/i), 'password123')
      await user.click(getSubmitButton())

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'test@test.com', password: 'password123' }),
        })
      })
    })

    it('redirects to /menu on successful login', async () => {
      const user = userEvent.setup()
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: {
            user: { id: '1', email: 'test@test.com', username: 'tester', role: 'USER' },
          },
        }),
      })

      render(<LoginPage />)

      await user.type(screen.getByLabelText(/email/i), 'test@test.com')
      await user.type(screen.getByLabelText(/password/i), 'password123')
      await user.click(getSubmitButton())

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/menu')
      })
    })

    it('displays error message on login failure', async () => {
      const user = userEvent.setup()
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({
          success: false,
          error: { message: 'Invalid email or password' },
        }),
      })

      render(<LoginPage />)

      await user.type(screen.getByLabelText(/email/i), 'wrong@test.com')
      await user.type(screen.getByLabelText(/password/i), 'wrongpass')
      await user.click(getSubmitButton())

      await waitFor(() => {
        expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument()
      })
    })

    it('shows loading state during login', async () => {
      const user = userEvent.setup()
      mockFetch.mockImplementation(() => new Promise(() => {})) // Never resolves

      render(<LoginPage />)

      await user.type(screen.getByLabelText(/email/i), 'test@test.com')
      await user.type(screen.getByLabelText(/password/i), 'password123')
      await user.click(getSubmitButton())

      await waitFor(() => {
        expect(screen.getByText(/signing in/i)).toBeInTheDocument()
      })
    })
  })

  describe('register flow', () => {
    it('calls register API with credentials', async () => {
      const user = userEvent.setup()
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: {
            user: { id: '1', email: 'new@test.com', username: 'newuser', role: 'USER' },
          },
        }),
      })

      render(<LoginPage />)

      // Switch to sign up
      const signUpTab = screen.getAllByRole('button').find(btn =>
        btn.textContent === 'Sign Up' && btn.className.includes('flex-1')
      )!
      await user.click(signUpTab)

      await user.type(screen.getByLabelText(/username/i), 'newuser')
      await user.type(screen.getByLabelText(/email/i), 'new@test.com')
      await user.type(screen.getByLabelText(/password/i), 'password123')
      await user.click(getSubmitButton())

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: 'newuser',
            email: 'new@test.com',
            password: 'password123',
          }),
        })
      })
    })

    it('redirects to /menu on successful registration', async () => {
      const user = userEvent.setup()
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: {
            user: { id: '1', email: 'new@test.com', username: 'newuser', role: 'USER' },
          },
        }),
      })

      render(<LoginPage />)

      const signUpTab = screen.getAllByRole('button').find(btn =>
        btn.textContent === 'Sign Up' && btn.className.includes('flex-1')
      )!
      await user.click(signUpTab)
      await user.type(screen.getByLabelText(/username/i), 'newuser')
      await user.type(screen.getByLabelText(/email/i), 'new@test.com')
      await user.type(screen.getByLabelText(/password/i), 'password123')
      await user.click(getSubmitButton())

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/menu')
      })
    })

    it('displays error on duplicate email', async () => {
      const user = userEvent.setup()
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({
          success: false,
          error: {
            message: 'Validation failed',
            details: { email: ['Email already in use'] },
          },
        }),
      })

      render(<LoginPage />)

      const signUpTab = screen.getAllByRole('button').find(btn =>
        btn.textContent === 'Sign Up' && btn.className.includes('flex-1')
      )!
      await user.click(signUpTab)
      await user.type(screen.getByLabelText(/username/i), 'newuser')
      await user.type(screen.getByLabelText(/email/i), 'existing@test.com')
      await user.type(screen.getByLabelText(/password/i), 'password123')
      await user.click(getSubmitButton())

      await waitFor(() => {
        expect(screen.getByText(/email already in use/i)).toBeInTheDocument()
      })
    })
  })

  describe('guest login', () => {
    it('redirects to /menu as guest', async () => {
      const user = userEvent.setup()

      render(<LoginPage />)

      await user.click(screen.getByRole('button', { name: /continue as guest/i }))

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/menu')
      })
    })
  })

  describe('password visibility toggle', () => {
    it('toggles password visibility', async () => {
      const user = userEvent.setup()
      render(<LoginPage />)

      const passwordInput = screen.getByLabelText(/password/i)
      expect(passwordInput).toHaveAttribute('type', 'password')

      // Find and click the toggle button (the eye icon button)
      const toggleButton = passwordInput.parentElement?.querySelector('button')
      await user.click(toggleButton!)

      expect(passwordInput).toHaveAttribute('type', 'text')
    })
  })

  describe('form validation', () => {
    it('shows error when email is empty', async () => {
      const user = userEvent.setup()
      render(<LoginPage />)

      await user.type(screen.getByLabelText(/password/i), 'password123')
      await user.click(getSubmitButton())

      await waitFor(() => {
        expect(screen.getByText(/please fill in all fields/i)).toBeInTheDocument()
      })
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('shows error when password is empty', async () => {
      const user = userEvent.setup()
      render(<LoginPage />)

      await user.type(screen.getByLabelText(/email/i), 'test@test.com')
      await user.click(getSubmitButton())

      await waitFor(() => {
        expect(screen.getByText(/please fill in all fields/i)).toBeInTheDocument()
      })
      expect(mockFetch).not.toHaveBeenCalled()
    })
  })
})
