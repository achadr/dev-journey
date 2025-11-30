import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PlayPage from '@/app/play/[id]/page'

// Mock Phaser to prevent canvas errors in JSDOM
vi.mock('phaser', () => ({
  default: {
    AUTO: 1,
    Scale: {
      FIT: 1,
      CENTER_BOTH: 2,
    },
    Game: vi.fn().mockImplementation(() => ({
      destroy: vi.fn(),
      scene: {
        start: vi.fn(),
        add: vi.fn(),
      },
    })),
  },
}))

// Mock NetworkScene
vi.mock('@/game/scenes/NetworkScene', () => ({
  NetworkScene: vi.fn(),
}))

// Mock next/navigation
const mockPush = vi.fn()
const mockParams = { id: 'quest-123' }

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  useParams: () => mockParams,
}))

// Mock useAuth hook
const mockUseAuth = vi.fn()
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}))

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

// Sample quest data with layers and challenges
const mockQuestWithLayers = {
  id: 'quest-123',
  name: 'HTTP Basics',
  description: 'Learn the fundamentals of HTTP protocol',
  difficulty: 2,
  layers: [
    {
      id: 'layer-1',
      type: 'BROWSER',
      order: 0,
      timeLimit: 120,
      challenge: {
        id: 'challenge-1',
        type: 'SELECT_METHOD',
        question: 'What HTTP method should you use to fetch users?',
        config: {
          question: 'What HTTP method should you use to fetch users?',
          options: ['GET', 'POST', 'PUT', 'DELETE'],
          answer: 'GET',
          explanation: 'GET is used to retrieve data.',
        },
      },
    },
    {
      id: 'layer-2',
      type: 'NETWORK',
      order: 1,
      timeLimit: 180,
      challenge: {
        id: 'challenge-2',
        type: 'PLATFORMER',
        question: 'Navigate through the network',
        config: {
          obstacles: 5,
          speed: 1,
        },
      },
    },
    {
      id: 'layer-3',
      type: 'API',
      order: 2,
      timeLimit: 150,
      challenge: {
        id: 'challenge-3',
        type: 'REQUEST_BUILDER',
        question: 'Build the correct HTTP request',
        config: {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        },
      },
    },
    {
      id: 'layer-4',
      type: 'DATABASE',
      order: 3,
      timeLimit: 200,
      challenge: {
        id: 'challenge-4',
        type: 'SQL_QUERY',
        question: 'Write a query to fetch all users',
        config: {
          expectedQuery: 'SELECT * FROM users',
        },
      },
    },
  ],
}

describe('PlayPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuth.mockReturnValue({
      user: { id: '1', email: 'test@test.com', username: 'TestPlayer', role: 'PLAYER' },
      isLoading: false,
      isAuthenticated: true,
      isGuest: false,
    })
  })

  describe('loading state', () => {
    it('shows loading state while fetching quest', () => {
      mockFetch.mockImplementation(() => new Promise(() => {})) // Never resolves

      render(<PlayPage />)

      expect(screen.getByTestId('play-loading')).toBeInTheDocument()
    })
  })

  describe('authentication', () => {
    it('redirects to login when not authenticated', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        isGuest: false,
      })
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockQuestWithLayers }),
      })

      render(<PlayPage />)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login')
      })
    })

    it('allows guest users to play', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'guest', email: '', username: 'Guest', role: 'GUEST' },
        isLoading: false,
        isAuthenticated: true,
        isGuest: true,
      })
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockQuestWithLayers }),
      })

      render(<PlayPage />)

      await waitFor(() => {
        expect(screen.getByText('HTTP Basics')).toBeInTheDocument()
      })
    })
  })

  describe('quest display', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockQuestWithLayers }),
      })
    })

    it('displays quest name', async () => {
      render(<PlayPage />)

      await waitFor(() => {
        expect(screen.getByText('HTTP Basics')).toBeInTheDocument()
      })
    })

    it('shows current layer indicator', async () => {
      render(<PlayPage />)

      await waitFor(() => {
        expect(screen.getByTestId('layer-indicator')).toBeInTheDocument()
        expect(screen.getByText(/layer 1/i)).toBeInTheDocument()
      })
    })

    it('displays layer progress (e.g., 1/4)', async () => {
      render(<PlayPage />)

      await waitFor(() => {
        expect(screen.getByText(/1.*4|1 of 4/i)).toBeInTheDocument()
      })
    })
  })

  describe('layer types', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockQuestWithLayers }),
      })
    })

    it('starts with Browser layer (first layer)', async () => {
      render(<PlayPage />)

      await waitFor(() => {
        expect(screen.getByTestId('layer-browser')).toBeInTheDocument()
      })
    })

    it('shows the challenge question', async () => {
      render(<PlayPage />)

      await waitFor(() => {
        expect(screen.getByText(/what http method/i)).toBeInTheDocument()
      })
    })
  })

  describe('timer', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockQuestWithLayers }),
      })
    })

    it('shows timer when layer has time limit', async () => {
      render(<PlayPage />)

      await waitFor(() => {
        expect(screen.getByTestId('layer-timer')).toBeInTheDocument()
      })
    })

    it('displays time in minutes:seconds format', async () => {
      render(<PlayPage />)

      await waitFor(() => {
        // 120 seconds = 2:00
        expect(screen.getByText(/2:00|02:00/)).toBeInTheDocument()
      })
    })
  })

  describe('navigation', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockQuestWithLayers }),
      })
    })

    it('has a quit/exit button', async () => {
      render(<PlayPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /quit|exit|leave/i })).toBeInTheDocument()
      })
    })

    it('shows confirmation when quit is clicked', async () => {
      const user = userEvent.setup()
      render(<PlayPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /quit/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /quit/i }))

      expect(screen.getByRole('heading', { name: /leave quest/i })).toBeInTheDocument()
    })

    it('navigates back to quest details on confirm quit', async () => {
      const user = userEvent.setup()
      render(<PlayPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /quit/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /quit/i }))

      // Click confirm button in modal - "Yes, Leave" button
      await user.click(screen.getByRole('button', { name: /yes, leave/i }))

      expect(mockPush).toHaveBeenCalledWith('/quests/quest-123')
    })
  })

  describe('layer progression', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockQuestWithLayers }),
      })
    })

    it('has a submit/check answer button', async () => {
      render(<PlayPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /submit|check|verify/i })).toBeInTheDocument()
      })
    })
  })

  describe('error handling', () => {
    beforeEach(() => {
      mockFetch.mockReset()
      mockFetch.mockRejectedValue(new Error('Network error'))
    })

    it('shows error message when fetch fails', async () => {
      render(<PlayPage />)

      await waitFor(() => {
        expect(screen.getByText('Error Loading Quest')).toBeInTheDocument()
      }, { timeout: 3000 })
    })

    it('has retry button on error', async () => {
      render(<PlayPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /try again|retry/i })).toBeInTheDocument()
      }, { timeout: 3000 })
    })

    it('has back to quests button on error', async () => {
      render(<PlayPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /back to quest|back/i })).toBeInTheDocument()
      }, { timeout: 3000 })
    })
  })

  describe('guest warning', () => {
    it('shows progress warning for guest users', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'guest', email: '', username: 'Guest', role: 'GUEST' },
        isLoading: false,
        isAuthenticated: true,
        isGuest: true,
      })
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockQuestWithLayers }),
      })

      render(<PlayPage />)

      await waitFor(() => {
        expect(screen.getByText(/progress.*not.*saved|guest/i)).toBeInTheDocument()
      })
    })
  })

  describe('HUD elements', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockQuestWithLayers }),
      })
    })

    it('shows layer type badge', async () => {
      render(<PlayPage />)

      await waitFor(() => {
        // Look for the badge specifically "Browser Layer"
        expect(screen.getByText(/browser layer/i)).toBeInTheDocument()
      })
    })

    it('has pause button', async () => {
      render(<PlayPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument()
      })
    })
  })
})
