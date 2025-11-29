import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import QuestsPage from '@/app/quests/page'

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
const mockUseAuth = vi.fn()
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}))

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

// Sample quest data
const mockQuests = [
  {
    id: 'quest-1',
    name: 'HTTP Basics',
    description: 'Learn the fundamentals of HTTP protocol',
    difficulty: 1,
    playCount: 150,
    thumbnailUrl: null,
    tags: ['http', 'basics'],
    author: { username: 'admin' },
    _count: { layers: 4 },
  },
  {
    id: 'quest-2',
    name: 'REST API Design',
    description: 'Master RESTful API design patterns',
    difficulty: 3,
    playCount: 89,
    thumbnailUrl: null,
    tags: ['api', 'rest'],
    author: { username: 'creator1' },
    _count: { layers: 6 },
  },
  {
    id: 'quest-3',
    name: 'Database Queries',
    description: 'Learn SQL and database optimization',
    difficulty: 5,
    playCount: 45,
    thumbnailUrl: null,
    tags: ['sql', 'database'],
    author: { username: 'admin' },
    _count: { layers: 8 },
  },
]

describe('QuestsPage', () => {
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
    it('shows loading skeleton while fetching quests', () => {
      mockFetch.mockImplementation(() => new Promise(() => {})) // Never resolves

      render(<QuestsPage />)

      expect(screen.getByTestId('quests-loading')).toBeInTheDocument()
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
        json: () => Promise.resolve({ success: true, data: [], pagination: { total: 0 } }),
      })

      render(<QuestsPage />)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login')
      })
    })

    it('allows guest users to view quests', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'guest', email: '', username: 'Guest', role: 'GUEST' },
        isLoading: false,
        isAuthenticated: true,
        isGuest: true,
      })
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockQuests, pagination: { total: 3 } }),
      })

      render(<QuestsPage />)

      await waitFor(() => {
        expect(screen.getByText('HTTP Basics')).toBeInTheDocument()
      })
    })
  })

  describe('quest display', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockQuests, pagination: { total: 3 } }),
      })
    })

    it('displays page title', async () => {
      render(<QuestsPage />)

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /quests|select/i })).toBeInTheDocument()
      })
    })

    it('displays quest cards', async () => {
      render(<QuestsPage />)

      await waitFor(() => {
        expect(screen.getByText('HTTP Basics')).toBeInTheDocument()
        expect(screen.getByText('REST API Design')).toBeInTheDocument()
        expect(screen.getByText('Database Queries')).toBeInTheDocument()
      })
    })

    it('shows quest descriptions', async () => {
      render(<QuestsPage />)

      await waitFor(() => {
        expect(screen.getByText(/learn the fundamentals of http/i)).toBeInTheDocument()
      })
    })

    it('shows difficulty indicators', async () => {
      render(<QuestsPage />)

      await waitFor(() => {
        // Should have difficulty indicators for each quest
        const difficultyElements = screen.getAllByTestId(/difficulty-/i)
        expect(difficultyElements.length).toBeGreaterThan(0)
      })
    })

    it('shows layer count for each quest', async () => {
      render(<QuestsPage />)

      await waitFor(() => {
        expect(screen.getByText(/4 layers/i)).toBeInTheDocument()
        expect(screen.getByText(/6 layers/i)).toBeInTheDocument()
        expect(screen.getByText(/8 layers/i)).toBeInTheDocument()
      })
    })

    it('shows author name', async () => {
      render(<QuestsPage />)

      await waitFor(() => {
        // admin appears twice (in quest 1 and 3)
        const adminElements = screen.getAllByText(/admin/i)
        expect(adminElements.length).toBeGreaterThan(0)
        expect(screen.getByText(/creator1/i)).toBeInTheDocument()
      })
    })
  })

  describe('quest interaction', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockQuests, pagination: { total: 3 } }),
      })
    })

    it('navigates to quest details on card click', async () => {
      const user = userEvent.setup()
      render(<QuestsPage />)

      await waitFor(() => {
        expect(screen.getByText('HTTP Basics')).toBeInTheDocument()
      })

      const questCard = screen.getByText('HTTP Basics').closest('[data-testid="quest-card"]')
      await user.click(questCard!)

      expect(mockPush).toHaveBeenCalledWith('/quests/quest-1')
    })

    it('has a play button on each quest card', async () => {
      render(<QuestsPage />)

      await waitFor(() => {
        const playButtons = screen.getAllByRole('button', { name: /play|start/i })
        expect(playButtons.length).toBe(3)
      })
    })
  })

  describe('filtering and search', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockQuests, pagination: { total: 3 } }),
      })
    })

    it('has a search input', async () => {
      render(<QuestsPage />)

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument()
      })
    })

    it('has difficulty filter options', async () => {
      render(<QuestsPage />)

      await waitFor(() => {
        expect(screen.getByTestId('difficulty-filter')).toBeInTheDocument()
      })
    })

    it('filters quests by search term', async () => {
      const user = userEvent.setup()
      render(<QuestsPage />)

      await waitFor(() => {
        expect(screen.getByText('HTTP Basics')).toBeInTheDocument()
      })

      // Setup mock for filtered results
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: [mockQuests[0]], // Only HTTP Basics
          pagination: { total: 1 },
        }),
      })

      const searchInput = screen.getByPlaceholderText(/search/i)
      await user.type(searchInput, 'HTTP')

      // Wait for debounced search to trigger
      await waitFor(() => {
        // Check that fetch was called with search param in URL
        const calls = mockFetch.mock.calls
        const searchCall = calls.find((call) =>
          typeof call[0] === 'string' && call[0].includes('search=HTTP')
        )
        expect(searchCall).toBeDefined()
      }, { timeout: 1000 })
    })
  })

  describe('empty state', () => {
    it('shows message when no quests found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [], pagination: { total: 0 } }),
      })

      render(<QuestsPage />)

      await waitFor(() => {
        expect(screen.getByText(/no quests found/i)).toBeInTheDocument()
      })
    })
  })

  describe('error handling', () => {
    it('shows error message when fetch fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      render(<QuestsPage />)

      await waitFor(() => {
        expect(screen.getByText('Error Loading Quests')).toBeInTheDocument()
      }, { timeout: 3000 })
    })

    it('has retry button on error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      render(<QuestsPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
      }, { timeout: 3000 })
    })
  })

  describe('navigation', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockQuests, pagination: { total: 3 } }),
      })
    })

    it('has back button to menu', async () => {
      const user = userEvent.setup()
      render(<QuestsPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /back|menu/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /back|menu/i }))
      expect(mockPush).toHaveBeenCalledWith('/menu')
    })
  })
})
