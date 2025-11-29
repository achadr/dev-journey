import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import QuestDetailPage from '@/app/quests/[id]/page'

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

// Sample quest data with layers
const mockQuest = {
  id: 'quest-123',
  name: 'HTTP Basics',
  description: 'Learn the fundamentals of HTTP protocol including requests, responses, and status codes.',
  difficulty: 2,
  playCount: 150,
  thumbnailUrl: null,
  tags: ['http', 'basics', 'web'],
  author: {
    id: 'author-1',
    username: 'admin',
    avatarUrl: null,
  },
  layers: [
    {
      id: 'layer-1',
      type: 'BROWSER',
      order: 0,
      timeLimit: 120,
      challenge: { id: 'ch-1', type: 'URL_BUILDER' },
    },
    {
      id: 'layer-2',
      type: 'NETWORK',
      order: 1,
      timeLimit: 180,
      challenge: { id: 'ch-2', type: 'PACKET_ROUTING' },
    },
    {
      id: 'layer-3',
      type: 'API',
      order: 2,
      timeLimit: 150,
      challenge: { id: 'ch-3', type: 'REQUEST_BUILDER' },
    },
    {
      id: 'layer-4',
      type: 'DATABASE',
      order: 3,
      timeLimit: 200,
      challenge: { id: 'ch-4', type: 'SQL_QUERY' },
    },
  ],
}

describe('QuestDetailPage', () => {
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
    it('shows loading skeleton while fetching quest', () => {
      mockFetch.mockImplementation(() => new Promise(() => {})) // Never resolves

      render(<QuestDetailPage />)

      expect(screen.getByTestId('quest-detail-loading')).toBeInTheDocument()
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
        json: () => Promise.resolve({ success: true, data: mockQuest }),
      })

      render(<QuestDetailPage />)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login')
      })
    })

    it('allows guest users to view quest details', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'guest', email: '', username: 'Guest', role: 'GUEST' },
        isLoading: false,
        isAuthenticated: true,
        isGuest: true,
      })
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockQuest }),
      })

      render(<QuestDetailPage />)

      await waitFor(() => {
        expect(screen.getByText('HTTP Basics')).toBeInTheDocument()
      })
    })
  })

  describe('quest display', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockQuest }),
      })
    })

    it('displays quest name as heading', async () => {
      render(<QuestDetailPage />)

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'HTTP Basics' })).toBeInTheDocument()
      })
    })

    it('displays quest description', async () => {
      render(<QuestDetailPage />)

      await waitFor(() => {
        expect(screen.getByText(/learn the fundamentals of http protocol/i)).toBeInTheDocument()
      })
    })

    it('shows difficulty indicator', async () => {
      render(<QuestDetailPage />)

      await waitFor(() => {
        expect(screen.getByTestId('quest-difficulty')).toBeInTheDocument()
      })
    })

    it('shows author information', async () => {
      render(<QuestDetailPage />)

      await waitFor(() => {
        expect(screen.getByText(/admin/i)).toBeInTheDocument()
      })
    })

    it('shows play count', async () => {
      render(<QuestDetailPage />)

      await waitFor(() => {
        expect(screen.getByText(/150/)).toBeInTheDocument()
      })
    })

    it('displays quest tags', async () => {
      render(<QuestDetailPage />)

      await waitFor(() => {
        expect(screen.getByText('http')).toBeInTheDocument()
        expect(screen.getByText('basics')).toBeInTheDocument()
        expect(screen.getByText('web')).toBeInTheDocument()
      })
    })
  })

  describe('layers display', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockQuest }),
      })
    })

    it('shows total layer count', async () => {
      render(<QuestDetailPage />)

      await waitFor(() => {
        expect(screen.getByText(/4 layers/i)).toBeInTheDocument()
      })
    })

    it('displays layer types', async () => {
      render(<QuestDetailPage />)

      await waitFor(() => {
        expect(screen.getByText(/browser/i)).toBeInTheDocument()
        expect(screen.getByText(/network/i)).toBeInTheDocument()
        expect(screen.getByText(/api/i)).toBeInTheDocument()
        expect(screen.getByText(/database/i)).toBeInTheDocument()
      })
    })

    it('shows layer order indicators', async () => {
      render(<QuestDetailPage />)

      await waitFor(() => {
        const layerItems = screen.getAllByTestId(/layer-item/)
        expect(layerItems.length).toBe(4)
      })
    })
  })

  describe('actions', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockQuest }),
      })
    })

    it('has a start quest button', async () => {
      render(<QuestDetailPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /start|play/i })).toBeInTheDocument()
      })
    })

    it('navigates to game on start click', async () => {
      const user = userEvent.setup()
      render(<QuestDetailPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /start|play/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /start|play/i }))

      expect(mockPush).toHaveBeenCalledWith('/play/quest-123')
    })

    it('has a back button', async () => {
      render(<QuestDetailPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument()
      })
    })

    it('navigates back to quests on back click', async () => {
      const user = userEvent.setup()
      render(<QuestDetailPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /back/i }))

      expect(mockPush).toHaveBeenCalledWith('/quests')
    })
  })

  describe('error handling', () => {
    beforeEach(() => {
      mockFetch.mockReset()
      mockFetch.mockRejectedValue(new Error('Network error'))
    })

    it('shows error message when fetch fails', async () => {
      render(<QuestDetailPage />)

      await waitFor(() => {
        expect(screen.getByText('Error Loading Quest')).toBeInTheDocument()
      }, { timeout: 3000 })
    })

    it('has retry button on error', async () => {
      render(<QuestDetailPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
      }, { timeout: 3000 })
    })

    it('shows back to quests button on error', async () => {
      render(<QuestDetailPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /back to quests/i })).toBeInTheDocument()
      }, { timeout: 3000 })
    })
  })

  describe('guest restrictions', () => {
    it('shows sign up prompt for guest users', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'guest', email: '', username: 'Guest', role: 'GUEST' },
        isLoading: false,
        isAuthenticated: true,
        isGuest: true,
      })
      mockFetch.mockImplementation(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockQuest }),
      }))

      render(<QuestDetailPage />)

      await waitFor(() => {
        expect(screen.getByText(/playing as guest/i)).toBeInTheDocument()
      })
    })
  })
})
