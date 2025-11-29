import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Phaser before importing BaseScene
vi.mock('phaser', () => ({
  default: {
    Scene: class MockScene {
      scene = {
        start: vi.fn(),
        pause: vi.fn(),
        resume: vi.fn(),
      }
      input = {
        keyboard: {
          on: vi.fn(),
        },
      }
      add = {
        text: vi.fn(() => ({ setOrigin: vi.fn() })),
      }
    },
  },
}))

import { BaseScene, type LayerConfig, type Quest } from '@/game/scenes/BaseScene'
import { EventBus } from '@/game/EventBus'

// Create a concrete implementation for testing
class TestScene extends BaseScene {
  constructor() {
    super({ key: 'TestScene' })
  }

  create(): void {
    super.create()
  }

  // Expose protected methods for testing
  public testEmitDamage(amount: number, source: string): void {
    this.emitDamage(amount, source)
  }

  public testEmitScore(points: number, reason: string): void {
    this.emitScore(points, reason)
  }

  public testCompleteLayer(score: number): void {
    this.completeLayer(score)
  }

  public getPlayerHealth(): number {
    return this.playerHealth
  }

  public getQuest(): Quest | undefined {
    return this.quest
  }

  public getLayerConfig(): LayerConfig | undefined {
    return this.layerConfig
  }
}

describe('BaseScene', () => {
  let scene: TestScene

  beforeEach(() => {
    scene = new TestScene()
    EventBus.removeAllListeners()
  })

  describe('init', () => {
    it('sets quest and layer config from data', () => {
      const mockQuest: Quest = {
        id: 'test-quest',
        name: 'Test Quest',
        layers: [
          { type: 'BROWSER', challenge: { type: 'SELECT_METHOD' } },
          { type: 'NETWORK', challenge: { type: 'PLATFORMER' } },
        ],
      }

      scene.init({ quest: mockQuest, layerIndex: 0 })

      expect(scene.getQuest()).toEqual(mockQuest)
      expect(scene.getLayerConfig()).toEqual(mockQuest.layers[0])
    })

    it('sets layer config for specified index', () => {
      const mockQuest: Quest = {
        id: 'test-quest',
        name: 'Test Quest',
        layers: [
          { type: 'BROWSER', challenge: { type: 'SELECT_METHOD' } },
          { type: 'NETWORK', challenge: { type: 'PLATFORMER' } },
        ],
      }

      scene.init({ quest: mockQuest, layerIndex: 1 })

      expect(scene.getLayerConfig()).toEqual(mockQuest.layers[1])
    })
  })

  describe('emitDamage', () => {
    it('reduces player health', () => {
      const mockQuest: Quest = {
        id: 'test-quest',
        name: 'Test Quest',
        layers: [{ type: 'BROWSER', challenge: { type: 'SELECT_METHOD' } }],
      }
      scene.init({ quest: mockQuest, layerIndex: 0 })

      const initialHealth = scene.getPlayerHealth()
      scene.testEmitDamage(20, 'firewall')

      expect(scene.getPlayerHealth()).toBe(initialHealth - 20)
    })

    it('emits player:damaged event', () => {
      const mockQuest: Quest = {
        id: 'test-quest',
        name: 'Test Quest',
        layers: [{ type: 'BROWSER', challenge: { type: 'SELECT_METHOD' } }],
      }
      scene.init({ quest: mockQuest, layerIndex: 0 })

      const handler = vi.fn()
      EventBus.on('player:damaged', handler)

      scene.testEmitDamage(20, 'firewall')

      expect(handler).toHaveBeenCalledWith({ amount: 20, source: 'firewall' })
    })

    it('emits player:died when health reaches zero', () => {
      const mockQuest: Quest = {
        id: 'test-quest',
        name: 'Test Quest',
        layers: [{ type: 'BROWSER', challenge: { type: 'SELECT_METHOD' } }],
      }
      scene.init({ quest: mockQuest, layerIndex: 0 })

      const handler = vi.fn()
      EventBus.on('player:died', handler)

      scene.testEmitDamage(100, 'fatal')

      expect(handler).toHaveBeenCalled()
    })
  })

  describe('emitScore', () => {
    it('emits score:added event', () => {
      const handler = vi.fn()
      EventBus.on('score:added', handler)

      scene.testEmitScore(100, 'Correct answer')

      expect(handler).toHaveBeenCalledWith({ points: 100, reason: 'Correct answer' })
    })
  })

  describe('completeLayer', () => {
    it('emits layer:completed event', () => {
      const mockQuest: Quest = {
        id: 'test-quest',
        name: 'Test Quest',
        layers: [{ type: 'BROWSER', challenge: { type: 'SELECT_METHOD' } }],
      }
      scene.init({ quest: mockQuest, layerIndex: 0 })

      const handler = vi.fn()
      EventBus.on('layer:completed', handler)

      scene.testCompleteLayer(150)

      expect(handler).toHaveBeenCalledWith({ layer: 'BROWSER', score: 150 })
    })

    it('transitions to next layer scene when more layers exist', () => {
      const mockQuest: Quest = {
        id: 'test-quest',
        name: 'Test Quest',
        layers: [
          { type: 'BROWSER', challenge: { type: 'SELECT_METHOD' } },
          { type: 'NETWORK', challenge: { type: 'PLATFORMER' } },
        ],
      }
      scene.init({ quest: mockQuest, layerIndex: 0 })

      scene.testCompleteLayer(150)

      expect(scene.scene.start).toHaveBeenCalledWith('NetworkLayer', {
        quest: mockQuest,
        layerIndex: 1,
      })
    })

    it('transitions to victory scene on last layer', () => {
      const mockQuest: Quest = {
        id: 'test-quest',
        name: 'Test Quest',
        layers: [{ type: 'BROWSER', challenge: { type: 'SELECT_METHOD' } }],
      }
      scene.init({ quest: mockQuest, layerIndex: 0 })

      scene.testCompleteLayer(150)

      expect(scene.scene.start).toHaveBeenCalledWith('VictoryScene', {
        quest: mockQuest,
      })
    })
  })

  describe('getSceneKey', () => {
    it('maps BROWSER to BrowserLayer', () => {
      const mockQuest: Quest = {
        id: 'test-quest',
        name: 'Test Quest',
        layers: [
          { type: 'BROWSER', challenge: { type: 'SELECT_METHOD' } },
          { type: 'BROWSER', challenge: { type: 'ADD_HEADERS' } },
        ],
      }
      scene.init({ quest: mockQuest, layerIndex: 0 })
      scene.testCompleteLayer(100)

      expect(scene.scene.start).toHaveBeenCalledWith('BrowserLayer', expect.any(Object))
    })

    it('maps NETWORK to NetworkLayer', () => {
      const mockQuest: Quest = {
        id: 'test-quest',
        name: 'Test Quest',
        layers: [
          { type: 'BROWSER', challenge: { type: 'SELECT_METHOD' } },
          { type: 'NETWORK', challenge: { type: 'PLATFORMER' } },
        ],
      }
      scene.init({ quest: mockQuest, layerIndex: 0 })
      scene.testCompleteLayer(100)

      expect(scene.scene.start).toHaveBeenCalledWith('NetworkLayer', expect.any(Object))
    })

    it('maps API to APILayer', () => {
      const mockQuest: Quest = {
        id: 'test-quest',
        name: 'Test Quest',
        layers: [
          { type: 'BROWSER', challenge: { type: 'SELECT_METHOD' } },
          { type: 'API', challenge: { type: 'PICK_ENDPOINT' } },
        ],
      }
      scene.init({ quest: mockQuest, layerIndex: 0 })
      scene.testCompleteLayer(100)

      expect(scene.scene.start).toHaveBeenCalledWith('APILayer', expect.any(Object))
    })

    it('maps DATABASE to DatabaseLayer', () => {
      const mockQuest: Quest = {
        id: 'test-quest',
        name: 'Test Quest',
        layers: [
          { type: 'BROWSER', challenge: { type: 'SELECT_METHOD' } },
          { type: 'DATABASE', challenge: { type: 'SELECT_QUERY' } },
        ],
      }
      scene.init({ quest: mockQuest, layerIndex: 0 })
      scene.testCompleteLayer(100)

      expect(scene.scene.start).toHaveBeenCalledWith('DatabaseLayer', expect.any(Object))
    })
  })
})
