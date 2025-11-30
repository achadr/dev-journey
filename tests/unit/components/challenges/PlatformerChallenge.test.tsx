import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
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
    platforms: [
      { x: 0, y: 600, width: 500 },
    ],
    obstacles: [
      { x: 400, y: 550, type: 'firewall' },
    ],
  }

  const mockOnAnswer = vi.fn()

  beforeEach(() => {
    mockOnAnswer.mockClear()
    EventBus.removeAllListeners()
  })

  afterEach(async () => {
    vi.clearAllMocks()
    EventBus.removeAllListeners()
    // Allow any pending state updates to settle
    await new Promise(resolve => setTimeout(resolve, 0))
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

    it('renders TCP handshake progress indicator', () => {
      render(<PlatformerChallenge config={defaultConfig} onAnswer={mockOnAnswer} />)

      expect(screen.getByTestId('handshake-progress')).toBeInTheDocument()
      expect(screen.getByText('SYN')).toBeInTheDocument()
      expect(screen.getByText('SYN-ACK')).toBeInTheDocument()
      expect(screen.getByText('ACK')).toBeInTheDocument()
    })

    it('renders packet assembly progress indicator', () => {
      render(<PlatformerChallenge config={defaultConfig} onAnswer={mockOnAnswer} />)

      expect(screen.getByTestId('packet-progress')).toBeInTheDocument()
      expect(screen.getByText('Header')).toBeInTheDocument()
      expect(screen.getByText('Payload')).toBeInTheDocument()
      expect(screen.getByText('Checksum')).toBeInTheDocument()
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

      EventBus.emit('player:damaged', { amount: 20, source: 'firewall' })

      await waitFor(() => {
        const healthBar = screen.getByTestId('health-bar')
        expect(healthBar).toHaveAttribute('data-health', '80')
      })
    })

    it('updates score when score event received', async () => {
      render(<PlatformerChallenge config={defaultConfig} onAnswer={mockOnAnswer} />)

      EventBus.emit('score:added', { points: 100, reason: 'packet' })

      await waitFor(() => {
        expect(screen.getByTestId('score-display')).toHaveTextContent('100')
      })
    })
  })

  describe('TCP handshake mechanics', () => {
    it('updates handshake progress when token collected', async () => {
      render(<PlatformerChallenge config={defaultConfig} onAnswer={mockOnAnswer} />)

      EventBus.emit('handshake:collected', { token: 'SYN', collected: ['SYN'] })

      await waitFor(() => {
        const synToken = screen.getByText('SYN')
        expect(synToken).toHaveClass('bg-green-500')
      })
    })

    it('shows all tokens collected correctly', async () => {
      render(<PlatformerChallenge config={defaultConfig} onAnswer={mockOnAnswer} />)

      EventBus.emit('handshake:collected', { token: 'SYN', collected: ['SYN'] })
      EventBus.emit('handshake:collected', { token: 'SYN-ACK', collected: ['SYN', 'SYN-ACK'] })
      EventBus.emit('handshake:collected', { token: 'ACK', collected: ['SYN', 'SYN-ACK', 'ACK'] })

      await waitFor(() => {
        expect(screen.getByText('SYN')).toHaveClass('bg-green-500')
        expect(screen.getByText('SYN-ACK')).toHaveClass('bg-green-500')
        expect(screen.getByText('ACK')).toHaveClass('bg-green-500')
      })
    })

    it('shows checkmark when handshake complete', async () => {
      render(<PlatformerChallenge config={defaultConfig} onAnswer={mockOnAnswer} />)

      EventBus.emit('handshake:complete')

      await waitFor(() => {
        const handshakeProgress = screen.getByTestId('handshake-progress')
        expect(handshakeProgress.querySelector('svg')).toBeInTheDocument()
      })
    })
  })

  describe('packet assembly mechanics', () => {
    it('updates packet progress when part collected', async () => {
      render(<PlatformerChallenge config={defaultConfig} onAnswer={mockOnAnswer} />)

      EventBus.emit('packet:part', { part: 'header', collected: ['header'], inOrder: true })

      await waitFor(() => {
        const headerPart = screen.getByText('Header')
        expect(headerPart).toHaveClass('bg-purple-500')
      })
    })

    it('shows all parts collected correctly', async () => {
      render(<PlatformerChallenge config={defaultConfig} onAnswer={mockOnAnswer} />)

      EventBus.emit('packet:part', { part: 'header', collected: ['header'], inOrder: true })
      EventBus.emit('packet:part', { part: 'payload', collected: ['header', 'payload'], inOrder: true })
      EventBus.emit('packet:part', { part: 'checksum', collected: ['header', 'payload', 'checksum'], inOrder: true })

      await waitFor(() => {
        expect(screen.getByText('Header')).toHaveClass('bg-purple-500')
        expect(screen.getByText('Payload')).toHaveClass('bg-purple-500')
        expect(screen.getByText('Checksum')).toHaveClass('bg-purple-500')
      })
    })

    it('shows sparkles when packet assembled', async () => {
      render(<PlatformerChallenge config={defaultConfig} onAnswer={mockOnAnswer} />)

      EventBus.emit('packet:assembled', { bonus: true })

      await waitFor(() => {
        const packetProgress = screen.getByTestId('packet-progress')
        expect(packetProgress.querySelector('svg')).toBeInTheDocument()
      })
    })
  })

  describe('educational popups', () => {
    it('shows educational popup when event received', async () => {
      render(<PlatformerChallenge config={defaultConfig} onAnswer={mockOnAnswer} />)

      EventBus.emit('education:show', {
        title: 'Firewall Blocked!',
        message: 'Firewalls filter network traffic',
        type: 'warning'
      })

      await waitFor(() => {
        expect(screen.getByText('Firewall Blocked!')).toBeInTheDocument()
        expect(screen.getByText('Firewalls filter network traffic')).toBeInTheDocument()
      })
    })

    it('hides educational popup when hide event received', async () => {
      render(<PlatformerChallenge config={defaultConfig} onAnswer={mockOnAnswer} />)

      EventBus.emit('education:show', {
        title: 'Test Title',
        message: 'Test message',
        type: 'info'
      })

      await waitFor(() => {
        expect(screen.getByText('Test Title')).toBeInTheDocument()
      })

      EventBus.emit('education:hide')

      await waitFor(() => {
        expect(screen.queryByText('Test Title')).not.toBeInTheDocument()
      })
    })
  })

  describe('game completion', () => {
    it('calls onAnswer with correct=true when layer completed', async () => {
      render(<PlatformerChallenge config={defaultConfig} onAnswer={mockOnAnswer} />)

      EventBus.emit('layer:completed', { layer: 'NETWORK', score: 500 })

      await waitFor(() => {
        expect(mockOnAnswer).toHaveBeenCalledWith({
          correct: true,
          score: 500,
        })
      })
    })

    it('calls onAnswer with correct=false when player dies', async () => {
      render(<PlatformerChallenge config={defaultConfig} onAnswer={mockOnAnswer} />)

      EventBus.emit('player:died')

      await waitFor(() => {
        expect(mockOnAnswer).toHaveBeenCalledWith({
          correct: false,
          score: expect.any(Number),
        })
      })
    })

    it('shows success message on completion', async () => {
      render(<PlatformerChallenge config={defaultConfig} onAnswer={mockOnAnswer} />)

      EventBus.emit('layer:completed', { layer: 'NETWORK', score: 500 })

      await waitFor(() => {
        expect(screen.getByText(/completed/i)).toBeInTheDocument()
      })
    })

    it('shows game over message on death', async () => {
      render(<PlatformerChallenge config={defaultConfig} onAnswer={mockOnAnswer} />)

      EventBus.emit('player:died')

      await waitFor(() => {
        expect(screen.getByText(/game over/i)).toBeInTheDocument()
      })
    })

    it('shows handshake status in completion summary', async () => {
      render(<PlatformerChallenge config={defaultConfig} onAnswer={mockOnAnswer} />)

      EventBus.emit('handshake:complete')
      EventBus.emit('layer:completed', { layer: 'NETWORK', score: 500 })

      await waitFor(() => {
        expect(screen.getByText(/TCP Handshake: Complete/i)).toBeInTheDocument()
      })
    })

    it('shows packet assembly status in completion summary', async () => {
      render(<PlatformerChallenge config={defaultConfig} onAnswer={mockOnAnswer} />)

      EventBus.emit('packet:assembled', { bonus: true })
      EventBus.emit('layer:completed', { layer: 'NETWORK', score: 500 })

      await waitFor(() => {
        expect(screen.getByText(/Packets Assembled: Yes/i)).toBeInTheDocument()
      })
    })
  })

  describe('pause functionality', () => {
    it('shows pause overlay when game paused', async () => {
      render(<PlatformerChallenge config={defaultConfig} onAnswer={mockOnAnswer} />)

      EventBus.emit('game:pause')

      await waitFor(() => {
        expect(screen.getByText(/paused/i)).toBeInTheDocument()
      })
    })
  })
})
