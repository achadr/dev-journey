import { describe, it, expect, vi, beforeEach } from 'vitest'
import { EventBus } from '@/game/EventBus'

// Mock Phaser module with Scene class
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
          once: vi.fn(),
          addKey: vi.fn(() => ({
            on: vi.fn(),
          })),
        },
      }
      add = {
        rectangle: vi.fn(() => ({
          setOrigin: vi.fn().mockReturnThis(),
          setScrollFactor: vi.fn().mockReturnThis(),
          setDepth: vi.fn().mockReturnThis(),
          setInteractive: vi.fn().mockReturnThis(),
          on: vi.fn().mockReturnThis(),
          setStrokeStyle: vi.fn().mockReturnThis(),
          setFillStyle: vi.fn().mockReturnThis(),
        })),
        text: vi.fn(() => ({
          setOrigin: vi.fn().mockReturnThis(),
          setScrollFactor: vi.fn().mockReturnThis(),
          setDepth: vi.fn().mockReturnThis(),
          setText: vi.fn().mockReturnThis(),
          setAlpha: vi.fn().mockReturnThis(),
          setVisible: vi.fn().mockReturnThis(),
          setColor: vi.fn().mockReturnThis(),
        })),
        graphics: vi.fn(() => ({
          fillStyle: vi.fn().mockReturnThis(),
          fillRect: vi.fn().mockReturnThis(),
          fillCircle: vi.fn().mockReturnThis(),
          setScrollFactor: vi.fn().mockReturnThis(),
          generateTexture: vi.fn().mockReturnThis(),
          destroy: vi.fn().mockReturnThis(),
          lineStyle: vi.fn().mockReturnThis(),
          strokeRect: vi.fn().mockReturnThis(),
          strokeCircle: vi.fn().mockReturnThis(),
          setVisible: vi.fn().mockReturnThis(),
          clear: vi.fn().mockReturnThis(),
          beginPath: vi.fn().mockReturnThis(),
          arc: vi.fn().mockReturnThis(),
          strokePath: vi.fn().mockReturnThis(),
        })),
        container: vi.fn(() => ({
          add: vi.fn().mockReturnThis(),
          setPosition: vi.fn().mockReturnThis(),
          setVisible: vi.fn().mockReturnThis(),
          setAlpha: vi.fn().mockReturnThis(),
          setScrollFactor: vi.fn().mockReturnThis(),
        })),
      }
      cameras = {
        main: {
          setBackgroundColor: vi.fn(),
          flash: vi.fn(),
          centerX: 640,
          centerY: 360,
          width: 1280,
          height: 720,
        },
      }
      time = {
        addEvent: vi.fn(),
        delayedCall: vi.fn(),
      }
      tweens = {
        add: vi.fn(),
      }
    },
  },
}))

// Mock BaseScene
vi.mock('@/game/scenes/BaseScene', async () => {
  const { EventBus: EB } = await import('@/game/EventBus')
  return {
    BaseScene: class MockBaseScene {
      scene = {
        start: vi.fn(),
        pause: vi.fn(),
        resume: vi.fn(),
      }
      input = {
        keyboard: {
          on: vi.fn(),
          once: vi.fn(),
          addKey: vi.fn(() => ({
            on: vi.fn(),
          })),
        },
      }
      add = {
        rectangle: vi.fn(() => ({
          setOrigin: vi.fn().mockReturnThis(),
          setScrollFactor: vi.fn().mockReturnThis(),
          setDepth: vi.fn().mockReturnThis(),
          setInteractive: vi.fn().mockReturnThis(),
          on: vi.fn().mockReturnThis(),
          setStrokeStyle: vi.fn().mockReturnThis(),
          setFillStyle: vi.fn().mockReturnThis(),
        })),
        text: vi.fn(() => ({
          setOrigin: vi.fn().mockReturnThis(),
          setScrollFactor: vi.fn().mockReturnThis(),
          setDepth: vi.fn().mockReturnThis(),
          setText: vi.fn().mockReturnThis(),
          setAlpha: vi.fn().mockReturnThis(),
          setVisible: vi.fn().mockReturnThis(),
          setColor: vi.fn().mockReturnThis(),
        })),
        graphics: vi.fn(() => ({
          fillStyle: vi.fn().mockReturnThis(),
          fillRect: vi.fn().mockReturnThis(),
          fillCircle: vi.fn().mockReturnThis(),
          setScrollFactor: vi.fn().mockReturnThis(),
          generateTexture: vi.fn().mockReturnThis(),
          destroy: vi.fn().mockReturnThis(),
          lineStyle: vi.fn().mockReturnThis(),
          strokeRect: vi.fn().mockReturnThis(),
          strokeCircle: vi.fn().mockReturnThis(),
          setVisible: vi.fn().mockReturnThis(),
          clear: vi.fn().mockReturnThis(),
          beginPath: vi.fn().mockReturnThis(),
          arc: vi.fn().mockReturnThis(),
          strokePath: vi.fn().mockReturnThis(),
        })),
        container: vi.fn(() => ({
          add: vi.fn().mockReturnThis(),
          setPosition: vi.fn().mockReturnThis(),
          setVisible: vi.fn().mockReturnThis(),
          setAlpha: vi.fn().mockReturnThis(),
          setScrollFactor: vi.fn().mockReturnThis(),
        })),
      }
      cameras = {
        main: {
          setBackgroundColor: vi.fn(),
          flash: vi.fn(),
          centerX: 640,
          centerY: 360,
          width: 1280,
          height: 720,
        },
      }
      time = {
        addEvent: vi.fn(),
        delayedCall: vi.fn(),
      }
      tweens = {
        add: vi.fn(),
      }

      protected quest: unknown
      protected layerConfig: unknown
      protected playerHealth: number = 100

      init(data: { quest: unknown; layerIndex: number }) {
        this.quest = data.quest
        const quest = data.quest as { layers: unknown[] }
        this.layerConfig = quest.layers[data.layerIndex]
      }

      create() {
        // No-op for tests
      }

      protected emitDamage(amount: number, source: string) {
        this.playerHealth -= amount
        EB.emit('player:damaged', { amount, source })
        if (this.playerHealth <= 0) {
          EB.emit('player:died')
        }
      }

      protected emitScore(points: number, reason: string) {
        EB.emit('score:added', { points, reason })
      }

      protected completeLayer(score: number) {
        EB.emit('layer:completed', { layer: 'DATABASE', score })
      }
    },
    SceneData: {},
  }
})

// Import DatabaseScene AFTER mocking
import { DatabaseScene } from '@/game/scenes/DatabaseScene'

describe('DatabaseScene', () => {
  let scene: DatabaseScene

  const mockQuestData = {
    quest: {
      id: 'test-quest',
      name: 'Test Quest',
      layers: [
        {
          type: 'DATABASE',
          challenge: {
            type: 'SELECT_QUERY',
            config: {
              question: 'Select all users from the database',
              correctQuery: 'SELECT * FROM users',
              schema: {
                tables: [
                  {
                    name: 'users',
                    columns: ['id', 'name', 'email'],
                    rows: 3,
                  },
                ],
              },
            },
          },
          order: 0,
        },
      ],
    },
    layerIndex: 0,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    EventBus.removeAllListeners()
    scene = new DatabaseScene()
  })

  describe('initialization', () => {
    it('creates scene with correct key', () => {
      expect(scene.constructor.name).toBe('DatabaseScene')
    })

    it('initializes with quest data', () => {
      scene.init(mockQuestData)
      expect(scene['quest']).toEqual(mockQuestData.quest)
      expect(scene['layerConfig']).toEqual(mockQuestData.quest.layers[0])
    })

    it('sets up database schema from config', () => {
      scene.init(mockQuestData)
      scene.create()
      expect(scene['schema']).toBeDefined()
      expect(scene['schema'].tables).toHaveLength(1)
      expect(scene['schema'].tables[0].name).toBe('users')
    })
  })

  describe('database visualization', () => {
    it('renders database tables', () => {
      scene.init(mockQuestData)
      scene.create()
      expect(scene.add.rectangle).toHaveBeenCalled()
      expect(scene.add.text).toHaveBeenCalled()
    })

    it('displays table schema with columns', () => {
      scene.init(mockQuestData)
      scene.create()
      const textCalls = vi.mocked(scene.add.text).mock.calls
      const hasTableName = textCalls.some(call =>
        typeof call[2] === 'string' && call[2].includes('users')
      )
      expect(hasTableName).toBe(true)
    })

    it('shows row count for each table', () => {
      scene.init(mockQuestData)
      scene.create()
      expect(scene['schema'].tables[0].rows).toBe(3)
    })
  })

  describe('query interaction', () => {
    it('displays query input area', () => {
      scene.init(mockQuestData)
      scene.create()
      expect(scene.add.rectangle).toHaveBeenCalled()
    })

    it('shows query options for SELECT_QUERY challenge', () => {
      scene.init(mockQuestData)
      scene.create()
      expect(scene['challengeType']).toBe('SELECT_QUERY')
    })

    it('validates correct query selection', () => {
      scene.init(mockQuestData)
      scene.create()

      const correctQuery = 'SELECT * FROM users'
      scene['validateQuery'](correctQuery)

      expect(scene['isCorrect']).toBe(true)
    })

    it('rejects incorrect query selection', () => {
      scene.init(mockQuestData)
      scene.create()

      const incorrectQuery = 'DELETE FROM users'
      scene['validateQuery'](incorrectQuery)

      expect(scene['isCorrect']).toBe(false)
    })
  })

  describe('educational feedback', () => {
    it('shows explanation for correct query', () => {
      scene.init(mockQuestData)
      scene.create()

      scene['validateQuery']('SELECT * FROM users')

      // Just verify feedback text element was created
      expect(scene['feedbackText']).toBeDefined()
      expect(scene['isCorrect']).toBe(true)
    })

    it('provides hint about SQL syntax', () => {
      scene.init(mockQuestData)
      scene.create()

      scene['showHint']()

      expect(scene.add.text).toHaveBeenCalled()
    })

    it('displays query execution animation', () => {
      scene.init(mockQuestData)
      scene.create()

      scene['animateQueryExecution']()

      expect(scene.cameras.main.flash).toHaveBeenCalled()
    })
  })

  describe('challenge types', () => {
    it('handles SELECT_QUERY challenge type', () => {
      const selectData = {
        ...mockQuestData,
        quest: {
          ...mockQuestData.quest,
          layers: [{
            type: 'DATABASE',
            challenge: {
              type: 'SELECT_QUERY',
              config: { correctQuery: 'SELECT * FROM users' },
            },
          }],
        },
      }

      scene.init(selectData)
      scene.create()

      expect(scene['challengeType']).toBe('SELECT_QUERY')
    })

    it('handles WRITE_QUERY challenge type', () => {
      const writeData = {
        ...mockQuestData,
        quest: {
          ...mockQuestData.quest,
          layers: [{
            type: 'DATABASE',
            challenge: {
              type: 'WRITE_QUERY',
              config: { correctQuery: 'INSERT INTO users VALUES (?)' },
            },
          }],
        },
      }

      scene.init(writeData)
      scene.create()

      expect(scene['challengeType']).toBe('WRITE_QUERY')
    })

    it('handles FIX_QUERY challenge type', () => {
      const fixData = {
        ...mockQuestData,
        quest: {
          ...mockQuestData.quest,
          layers: [{
            type: 'DATABASE',
            challenge: {
              type: 'FIX_QUERY',
              config: {
                brokenQuery: 'SELCT * FROM users',
                correctQuery: 'SELECT * FROM users',
              },
            },
          }],
        },
      }

      scene.init(fixData)
      scene.create()

      expect(scene['challengeType']).toBe('FIX_QUERY')
    })
  })

  describe('completion', () => {
    it('emits layer completed event on correct query', () => {
      const scoreSpy = vi.fn()
      EventBus.on('score:added', scoreSpy)

      scene.init(mockQuestData)
      scene.create()
      scene['validateQuery']('SELECT * FROM users')
      scene['completeChallenge']()

      expect(scoreSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          points: expect.any(Number),
          reason: 'Database challenge completed',
        })
      )
    })

    it('calculates score based on performance', () => {
      scene.init(mockQuestData)
      scene.create()
      scene['validateQuery']('SELECT * FROM users')

      const score = scene['calculateScore']()

      expect(score).toBeGreaterThan(0)
    })

    it('applies penalty for using hints', () => {
      scene.init(mockQuestData)
      scene.create()

      const scoreBeforeHint = scene['calculateScore']()
      scene['showHint']()
      const scoreAfterHint = scene['calculateScore']()

      expect(scoreAfterHint).toBeLessThan(scoreBeforeHint)
    })
  })

  describe('visual effects', () => {
    it('highlights table on query execution', () => {
      scene.init(mockQuestData)
      scene.create()

      scene['highlightTable']('users')

      expect(scene.tweens.add).toHaveBeenCalled()
    })

    it('shows data flow animation for correct query', () => {
      scene.init(mockQuestData)
      scene.create()
      scene['validateQuery']('SELECT * FROM users')

      scene['showDataFlow']()

      expect(scene.add.graphics).toHaveBeenCalled()
    })
  })

  describe('error handling', () => {
    it('handles missing schema gracefully', () => {
      const invalidData = {
        ...mockQuestData,
        quest: {
          ...mockQuestData.quest,
          layers: [{
            type: 'DATABASE',
            challenge: {
              type: 'SELECT_QUERY',
              config: {},
            },
          }],
        },
      }

      expect(() => {
        scene.init(invalidData)
        scene.create()
      }).not.toThrow()
    })

    it('provides default schema if none specified', () => {
      const noSchemaData = {
        ...mockQuestData,
        quest: {
          ...mockQuestData.quest,
          layers: [{
            type: 'DATABASE',
            challenge: {
              type: 'SELECT_QUERY',
              config: {
                correctQuery: 'SELECT * FROM users',
              },
            },
          }],
        },
      }

      scene.init(noSchemaData)
      scene.create()

      expect(scene['schema']).toBeDefined()
    })
  })
})
