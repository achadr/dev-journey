import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MenuPage from '@/app/menu/page'

// Mock next/navigation
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
}))

// Mock useAuth hook
const mockLogout = vi.fn()
const mockUseAuth = vi.fn()
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}))

describe('MenuPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('loading state', () => {
    it('shows loading spinner while checking auth', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: true,
        isAuthenticated: false,
        logout: mockLogout,
      })

      render(<MenuPage />)

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    })
  })

  describe('unauthenticated state', () => {
    it('redirects to login when not authenticated', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        logout: mockLogout,
      })

      render(<MenuPage />)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login')
      })
    })
  })

  describe('authenticated state', () => {
    const mockUser = {
      id: '1',
      email: 'test@test.com',
      username: 'TestPlayer',
      role: 'PLAYER',
    }

    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        isLoading: false,
        isAuthenticated: true,
        isGuest: false,
        logout: mockLogout,
      })
    })

    it('displays welcome message with username', () => {
      render(<MenuPage />)

      expect(screen.getByText(/welcome.*testplayer/i)).toBeInTheDocument()
    })

    it('displays game title', () => {
      render(<MenuPage />)

      expect(screen.getByText('Packet Journey')).toBeInTheDocument()
    })

    it('shows play button', () => {
      render(<MenuPage />)

      expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument()
    })

    it('shows settings button', () => {
      render(<MenuPage />)

      expect(screen.getByRole('button', { name: /settings/i })).toBeInTheDocument()
    })

    it('shows logout button', () => {
      render(<MenuPage />)

      expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument()
    })

    it('navigates to quest selection on play click', async () => {
      const user = userEvent.setup()
      render(<MenuPage />)

      await user.click(screen.getByRole('button', { name: /play/i }))

      expect(mockPush).toHaveBeenCalledWith('/quests')
    })

    it('calls logout and redirects on logout click', async () => {
      const user = userEvent.setup()
      mockLogout.mockResolvedValueOnce(undefined)

      render(<MenuPage />)

      await user.click(screen.getByRole('button', { name: /logout/i }))

      expect(mockLogout).toHaveBeenCalled()
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login')
      })
    })
  })

  describe('guest mode', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: {
          id: 'guest',
          email: '',
          username: 'Guest',
          role: 'GUEST',
        },
        isLoading: false,
        isAuthenticated: true,
        isGuest: true,
        logout: mockLogout,
      })
    })

    it('displays guest welcome message', () => {
      render(<MenuPage />)

      expect(screen.getByText(/welcome.*guest/i)).toBeInTheDocument()
    })

    it('shows sign up prompt for guests', () => {
      render(<MenuPage />)

      expect(screen.getByText(/create an account to save progress/i)).toBeInTheDocument()
    })
  })

  describe('user stats display', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: {
          id: '1',
          email: 'test@test.com',
          username: 'TestPlayer',
          role: 'PLAYER',
        },
        isLoading: false,
        isAuthenticated: true,
        isGuest: false,
        logout: mockLogout,
      })
    })

    it('shows user avatar or placeholder', () => {
      render(<MenuPage />)

      expect(screen.getByTestId('user-avatar')).toBeInTheDocument()
    })
  })
})
