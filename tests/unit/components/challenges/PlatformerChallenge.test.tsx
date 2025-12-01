import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, cleanup, act } from '@testing-library/react'
import { PlatformerChallenge } from '@/components/challenges/PlatformerChallenge'
import { EventBus } from '@/game/EventBus'

// Mock Phaser
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
        getScene: vi.fn(() => null),
      },
      events: {
        once: vi.fn(),
        on: vi.fn(),
        off: vi.fn(),
      },
    })),
  },
}))

// Mock BaseScene to avoid the Phaser.Scene extension issue
vi.mock('@/game/scenes/BaseScene', () => ({
  BaseScene: class MockBaseScene {},
  SceneData: {},
}))

// Mock NetworkScene
vi.mock('@/game/scenes/NetworkScene', () => ({
  NetworkScene: vi.fn(),
}))

describe('PlatformerChallenge', () => {
  const defaultConfig = {
    levelLength: 3000,
    obstacles: 5,
    theme: 'tcp',
  }

  const mockOnAnswer = vi.fn()

  beforeEach(() => {
    mockOnAnswer.mockClear()
    EventBus.removeAllListeners()
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
    EventBus.removeAllListeners()
  })

  describe('rendering', () => {
    it('renders game container', () => {
      render(<PlatformerChallenge config={defaultConfig} onAnswer={mockOnAnswer} />)

      expect(screen.getByTestId('platformer-game')).toBeInTheDocument()
    })

    it('renders instructions text', () => {
      render(<PlatformerChallenge config={defaultConfig} onAnswer={mockOnAnswer} />)

      expect(screen.getByText(/navigate.*network/i)).toBeInTheDocument()
    })

    it('renders controls hint', () => {
      render(<PlatformerChallenge config={defaultConfig} onAnswer={mockOnAnswer} />)

      expect(screen.getByText(/arrow keys/i)).toBeInTheDocument()
    })
  })

  describe('game state display', () => {
    it('displays health bar', () => {
      render(<PlatformerChallenge config={defaultConfig} onAnswer={mockOnAnswer} />)

      expect(screen.getByTestId('health-bar')).toBeInTheDocument()
    })

    it('displays score', () => {
      render(<PlatformerChallenge config={defaultConfig} onAnswer={mockOnAnswer} />)

      expect(screen.getByTestId('score-display')).toBeInTheDocument()
    })

    it('updates health when damage event received', async () => {
      render(<PlatformerChallenge config={defaultConfig} onAnswer={mockOnAnswer} />)

      await act(async () => {
        EventBus.emit('player:damaged', { amount: 20, source: 'firewall' })
      })

      const healthBar = screen.getByTestId('health-bar')
      expect(healthBar).toHaveAttribute('data-health', '80')
    })

    it('updates score when score event received', async () => {
      render(<PlatformerChallenge config={defaultConfig} onAnswer={mockOnAnswer} />)

      await act(async () => {
        EventBus.emit('score:added', { points: 100, reason: 'packet' })
      })

      expect(screen.getByTestId('score-display')).toHaveTextContent('100')
    })
  })

  describe('theme-based collectible mechanics', () => {
    it('shows collectible progress when theme:init event received', async () => {
      render(<PlatformerChallenge config={defaultConfig} onAnswer={mockOnAnswer} />)

      await act(async () => {
        EventBus.emit('theme:init', {
          theme: 'tcp',
          themeConfig: {
            name: 'TCP Handshake',
            description: 'Learn the TCP three-way handshake',
            collectibles: [
              { id: 'SYN', label: 'SYN' },
              { id: 'SYN-ACK', label: 'SYN-ACK' },
              { id: 'ACK', label: 'ACK' },
            ],
          },
          collectibles: [
            { id: 'SYN', label: 'SYN', order: 0 },
            { id: 'SYN-ACK', label: 'SYN-ACK', order: 1 },
            { id: 'ACK', label: 'ACK', order: 2 },
          ],
        })
      })

      expect(screen.getByTestId('collectible-progress')).toBeInTheDocument()
      expect(screen.getByText('SYN')).toBeInTheDocument()
      expect(screen.getByText('SYN-ACK')).toBeInTheDocument()
      expect(screen.getByText('ACK')).toBeInTheDocument()
    })

    it('updates collectible progress when collectible:collected event received', async () => {
      render(<PlatformerChallenge config={defaultConfig} onAnswer={mockOnAnswer} />)

      // Initialize theme
      await act(async () => {
        EventBus.emit('theme:init', {
          theme: 'tcp',
          themeConfig: {
            name: 'TCP Handshake',
            description: 'Learn the TCP three-way handshake',
            collectibles: [
              { id: 'SYN', label: 'SYN' },
              { id: 'SYN-ACK', label: 'SYN-ACK' },
              { id: 'ACK', label: 'ACK' },
            ],
          },
          collectibles: [
            { id: 'SYN', label: 'SYN', order: 0 },
            { id: 'SYN-ACK', label: 'SYN-ACK', order: 1 },
            { id: 'ACK', label: 'ACK', order: 2 },
          ],
        })
      })

      // Collect first item
      await act(async () => {
        EventBus.emit('collectible:collected', {
          id: 'SYN',
          label: 'SYN',
          order: 0,
          inOrder: true,
          collected: ['SYN'],
          theme: 'tcp',
        })
      })

      const synElement = screen.getByText('SYN')
      expect(synElement).toHaveClass('bg-green-500')
    })

    it('shows all collectibles collected correctly', async () => {
      render(<PlatformerChallenge config={defaultConfig} onAnswer={mockOnAnswer} />)

      // Initialize theme
      await act(async () => {
        EventBus.emit('theme:init', {
          theme: 'tcp',
          themeConfig: {
            name: 'TCP Handshake',
            description: 'Learn the TCP three-way handshake',
            collectibles: [
              { id: 'SYN', label: 'SYN' },
              { id: 'SYN-ACK', label: 'SYN-ACK' },
              { id: 'ACK', label: 'ACK' },
            ],
          },
          collectibles: [
            { id: 'SYN', label: 'SYN', order: 0 },
            { id: 'SYN-ACK', label: 'SYN-ACK', order: 1 },
            { id: 'ACK', label: 'ACK', order: 2 },
          ],
        })
      })

      // Collect all items
      await act(async () => {
        EventBus.emit('collectible:collected', { id: 'SYN', label: 'SYN', order: 0, inOrder: true, collected: ['SYN'], theme: 'tcp' })
        EventBus.emit('collectible:collected', { id: 'SYN-ACK', label: 'SYN-ACK', order: 1, inOrder: true, collected: ['SYN', 'SYN-ACK'], theme: 'tcp' })
        EventBus.emit('collectible:collected', { id: 'ACK', label: 'ACK', order: 2, inOrder: true, collected: ['SYN', 'SYN-ACK', 'ACK'], theme: 'tcp' })
      })

      expect(screen.getByText('SYN')).toHaveClass('bg-green-500')
      expect(screen.getByText('SYN-ACK')).toHaveClass('bg-green-500')
      expect(screen.getByText('ACK')).toHaveClass('bg-green-500')
    })

    it('shows sparkles when collectibles complete event received', async () => {
      render(<PlatformerChallenge config={defaultConfig} onAnswer={mockOnAnswer} />)

      // Initialize theme
      await act(async () => {
        EventBus.emit('theme:init', {
          theme: 'tcp',
          themeConfig: {
            name: 'TCP Handshake',
            description: 'Learn the TCP three-way handshake',
            collectibles: [
              { id: 'SYN', label: 'SYN' },
              { id: 'SYN-ACK', label: 'SYN-ACK' },
              { id: 'ACK', label: 'ACK' },
            ],
          },
          collectibles: [
            { id: 'SYN', label: 'SYN', order: 0 },
            { id: 'SYN-ACK', label: 'SYN-ACK', order: 1 },
            { id: 'ACK', label: 'ACK', order: 2 },
          ],
        })
        EventBus.emit('collectibles:complete', { theme: 'tcp', bonus: true })
      })

      const progressElement = screen.getByTestId('collectible-progress')
      // Sparkles icon should be present
      expect(progressElement.querySelector('svg')).toBeInTheDocument()
    })

    it('works with different themes (http)', async () => {
      render(<PlatformerChallenge config={{ ...defaultConfig, theme: 'http' }} onAnswer={mockOnAnswer} />)

      await act(async () => {
        EventBus.emit('theme:init', {
          theme: 'http',
          themeConfig: {
            name: 'HTTP Request',
            description: 'Understand HTTP request/response flow',
            collectibles: [
              { id: 'REQUEST', label: 'Request' },
              { id: 'RESPONSE', label: 'Response' },
              { id: 'DATA', label: 'Data' },
            ],
          },
          collectibles: [
            { id: 'REQUEST', label: 'Request', order: 0 },
            { id: 'RESPONSE', label: 'Response', order: 1 },
            { id: 'DATA', label: 'Data', order: 2 },
          ],
        })
      })

      expect(screen.getByText('Request')).toBeInTheDocument()
      expect(screen.getByText('Response')).toBeInTheDocument()
      expect(screen.getByText('Data')).toBeInTheDocument()
    })

    it('works with auth theme', async () => {
      render(<PlatformerChallenge config={{ ...defaultConfig, theme: 'auth' }} onAnswer={mockOnAnswer} />)

      await act(async () => {
        EventBus.emit('theme:init', {
          theme: 'auth',
          themeConfig: {
            name: 'Authentication',
            description: 'Learn authentication concepts',
            collectibles: [
              { id: 'CREDENTIALS', label: 'Credentials' },
              { id: 'TOKEN', label: 'Token' },
              { id: 'SESSION', label: 'Session' },
            ],
          },
          collectibles: [
            { id: 'CREDENTIALS', label: 'Credentials', order: 0 },
            { id: 'TOKEN', label: 'Token', order: 1 },
            { id: 'SESSION', label: 'Session', order: 2 },
          ],
        })
      })

      expect(screen.getByText('Credentials')).toBeInTheDocument()
      expect(screen.getByText('Token')).toBeInTheDocument()
      expect(screen.getByText('Session')).toBeInTheDocument()
    })

    it('does not show collectible progress for none theme', () => {
      render(<PlatformerChallenge config={{ ...defaultConfig, theme: 'none' }} onAnswer={mockOnAnswer} />)

      // No theme:init event means no collectibles are shown
      // The collectible progress element should not be present
      expect(screen.queryByTestId('collectible-progress')).not.toBeInTheDocument()
    })
  })

  describe('educational popups', () => {
    it('shows educational popup when event received', async () => {
      render(<PlatformerChallenge config={defaultConfig} onAnswer={mockOnAnswer} />)

      await act(async () => {
        EventBus.emit('education:show', {
          title: 'Firewall Blocked!',
          message: 'Firewalls filter network traffic',
          type: 'warning'
        })
      })

      expect(screen.getByText('Firewall Blocked!')).toBeInTheDocument()
      expect(screen.getByText('Firewalls filter network traffic')).toBeInTheDocument()
    })

    it('hides educational popup when hide event received', async () => {
      render(<PlatformerChallenge config={defaultConfig} onAnswer={mockOnAnswer} />)

      await act(async () => {
        EventBus.emit('education:show', {
          title: 'Test Title',
          message: 'Test message',
          type: 'info'
        })
      })

      expect(screen.getByText('Test Title')).toBeInTheDocument()

      await act(async () => {
        EventBus.emit('education:hide')
      })

      expect(screen.queryByText('Test Title')).not.toBeInTheDocument()
    })
  })

  describe('game completion', () => {
    it('calls onAnswer with correct=true when layer completed', async () => {
      render(<PlatformerChallenge config={defaultConfig} onAnswer={mockOnAnswer} />)

      await act(async () => {
        EventBus.emit('layer:completed', { layer: 'NETWORK', score: 500 })
      })

      expect(mockOnAnswer).toHaveBeenCalledWith({
        correct: true,
        score: 500,
      })
    })

    it('calls onAnswer with correct=false when player dies', async () => {
      render(<PlatformerChallenge config={defaultConfig} onAnswer={mockOnAnswer} />)

      await act(async () => {
        EventBus.emit('player:died')
      })

      expect(mockOnAnswer).toHaveBeenCalledWith({
        correct: false,
        score: expect.any(Number),
      })
    })

    it('shows success message on completion', async () => {
      render(<PlatformerChallenge config={defaultConfig} onAnswer={mockOnAnswer} />)

      await act(async () => {
        EventBus.emit('layer:completed', { layer: 'NETWORK', score: 500 })
      })

      expect(screen.getByText(/completed/i)).toBeInTheDocument()
    })

    it('shows game over message on death', async () => {
      render(<PlatformerChallenge config={defaultConfig} onAnswer={mockOnAnswer} />)

      await act(async () => {
        EventBus.emit('player:died')
      })

      expect(screen.getByText(/game over/i)).toBeInTheDocument()
    })

    it('shows collectible status in completion summary when theme is active', async () => {
      render(<PlatformerChallenge config={defaultConfig} onAnswer={mockOnAnswer} />)

      // Initialize theme
      await act(async () => {
        EventBus.emit('theme:init', {
          theme: 'tcp',
          themeConfig: {
            name: 'TCP Handshake',
            description: 'Learn the TCP three-way handshake',
            collectibles: [
              { id: 'SYN', label: 'SYN' },
              { id: 'SYN-ACK', label: 'SYN-ACK' },
              { id: 'ACK', label: 'ACK' },
            ],
          },
          collectibles: [
            { id: 'SYN', label: 'SYN', order: 0 },
            { id: 'SYN-ACK', label: 'SYN-ACK', order: 1 },
            { id: 'ACK', label: 'ACK', order: 2 },
          ],
        })
        EventBus.emit('collectibles:complete', { theme: 'tcp', bonus: true })
        EventBus.emit('layer:completed', { layer: 'NETWORK', score: 500 })
      })

      expect(screen.getByText(/TCP Handshake: Complete/i)).toBeInTheDocument()
    })
  })

  describe('pause functionality', () => {
    it('shows pause overlay when game paused', async () => {
      render(<PlatformerChallenge config={defaultConfig} onAnswer={mockOnAnswer} />)

      await act(async () => {
        EventBus.emit('game:pause')
      })

      expect(screen.getByText(/paused/i)).toBeInTheDocument()
    })
  })
})
