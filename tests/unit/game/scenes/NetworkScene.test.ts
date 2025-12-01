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
          createCursorKeys: vi.fn(() => ({
            left: { isDown: false },
            right: { isDown: false },
            up: { isDown: false },
            space: { isDown: false },
          })),
        },
      }
      add = {
        rectangle: vi.fn(() => ({ setOrigin: vi.fn().mockReturnThis(), setScrollFactor: vi.fn().mockReturnThis() })),
        text: vi.fn(() => ({ setOrigin: vi.fn().mockReturnThis(), setScrollFactor: vi.fn().mockReturnThis(), setDepth: vi.fn().mockReturnThis() })),
        graphics: vi.fn(() => ({
          fillStyle: vi.fn().mockReturnThis(),
          fillRect: vi.fn().mockReturnThis(),
          fillCircle: vi.fn().mockReturnThis(),
          setScrollFactor: vi.fn().mockReturnThis(),
          generateTexture: vi.fn().mockReturnThis(),
          destroy: vi.fn().mockReturnThis(),
          lineStyle: vi.fn().mockReturnThis(),
          strokeRect: vi.fn().mockReturnThis(),
        })),
      }
      physics = {
        world: {
          setBounds: vi.fn(),
        },
        add: {
          sprite: vi.fn(() => ({
            setCollideWorldBounds: vi.fn().mockReturnThis(),
            setBounce: vi.fn().mockReturnThis(),
            setGravityY: vi.fn().mockReturnThis(),
            setVelocityX: vi.fn().mockReturnThis(),
            setVelocityY: vi.fn().mockReturnThis(),
            setTexture: vi.fn().mockReturnThis(),
            setData: vi.fn().mockReturnThis(),
            getData: vi.fn((key: string) => key === 'type' ? 'firewall' : undefined),
            setActive: vi.fn().mockReturnThis(),
            setVisible: vi.fn().mockReturnThis(),
            destroy: vi.fn().mockReturnThis(),
            body: { blocked: { down: false }, velocity: { x: 0, y: 0 } },
            x: 100,
            y: 500,
          })),
          staticGroup: vi.fn(() => ({
            create: vi.fn(() => ({
              setOrigin: vi.fn().mockReturnThis(),
              refreshBody: vi.fn().mockReturnThis(),
              displayWidth: 200,
              displayHeight: 32,
            })),
            getChildren: vi.fn(() => []),
          })),
          group: vi.fn(() => ({
            create: vi.fn(() => ({
              setOrigin: vi.fn().mockReturnThis(),
              setVelocityX: vi.fn().mockReturnThis(),
              setData: vi.fn().mockReturnThis(),
              getData: vi.fn((key: string) => key === 'type' ? 'firewall' : undefined),
              body: {},
              setDepth: vi.fn().mockReturnThis(),
            })),
            getChildren: vi.fn(() => []),
          })),
          collider: vi.fn(),
          overlap: vi.fn(),
        },
      }
      cameras = {
        main: {
          startFollow: vi.fn(),
          setBounds: vi.fn(),
          setBackgroundColor: vi.fn(),
          shake: vi.fn(),
          flash: vi.fn(),
        },
      }
      time = {
        addEvent: vi.fn(),
        delayedCall: vi.fn(),
      }
      textures = {
        exists: vi.fn(() => false),
      }
    },
  },
}))

// Mock BaseScene - import EventBus within the factory to avoid hoisting issues
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
          createCursorKeys: vi.fn(() => ({
            left: { isDown: false },
            right: { isDown: false },
            up: { isDown: false },
            space: { isDown: false },
          })),
        },
      }
      add = {
        rectangle: vi.fn(() => ({ setOrigin: vi.fn().mockReturnThis(), setScrollFactor: vi.fn().mockReturnThis() })),
        text: vi.fn(() => ({ setOrigin: vi.fn().mockReturnThis(), setScrollFactor: vi.fn().mockReturnThis(), setDepth: vi.fn().mockReturnThis(), setText: vi.fn().mockReturnThis() })),
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
        })),
      }
      physics = {
        world: {
          setBounds: vi.fn(),
        },
        add: {
          sprite: vi.fn(() => ({
            setCollideWorldBounds: vi.fn().mockReturnThis(),
            setBounce: vi.fn().mockReturnThis(),
            setGravityY: vi.fn().mockReturnThis(),
            setVelocityX: vi.fn().mockReturnThis(),
            setVelocityY: vi.fn().mockReturnThis(),
            setTexture: vi.fn().mockReturnThis(),
            setData: vi.fn().mockReturnThis(),
            getData: vi.fn((key: string) => key === 'type' ? 'firewall' : undefined),
            setActive: vi.fn().mockReturnThis(),
            setVisible: vi.fn().mockReturnThis(),
            destroy: vi.fn().mockReturnThis(),
            body: { blocked: { down: false }, velocity: { x: 0, y: 0 } },
            x: 100,
            y: 500,
          })),
          staticGroup: vi.fn(() => ({
            create: vi.fn(() => ({
              setOrigin: vi.fn().mockReturnThis(),
              refreshBody: vi.fn().mockReturnThis(),
              displayWidth: 200,
              displayHeight: 32,
              setData: vi.fn().mockReturnThis(),
              getData: vi.fn(),
            })),
            getChildren: vi.fn(() => []),
          })),
          group: vi.fn(() => ({
            create: vi.fn(() => ({
              setOrigin: vi.fn().mockReturnThis(),
              setVelocityX: vi.fn().mockReturnThis(),
              setData: vi.fn().mockReturnThis(),
              getData: vi.fn((key: string) => key === 'type' ? 'firewall' : undefined),
              body: {},
              setDepth: vi.fn().mockReturnThis(),
              destroy: vi.fn().mockReturnThis(),
            })),
            getChildren: vi.fn(() => []),
          })),
          collider: vi.fn(),
          overlap: vi.fn(),
        },
      }
      cameras = {
        main: {
          startFollow: vi.fn(),
          setBounds: vi.fn(),
          setBackgroundColor: vi.fn(),
          shake: vi.fn(),
          flash: vi.fn(),
        },
      }
      time = {
        addEvent: vi.fn(),
        delayedCall: vi.fn(),
      }
      textures = {
        exists: vi.fn(() => false),
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
        EB.emit('layer:completed', { layer: 'NETWORK', score })
      }
    },
    SceneData: {},
  }
})

// Import NetworkScene AFTER mocking
import { NetworkScene } from '@/game/scenes/NetworkScene'

describe('NetworkScene', () => {
  let scene: NetworkScene

  const mockQuestData = {
    quest: {
      id: 'test-quest',
      name: 'Test Quest',
      layers: [
        {
          type: 'NETWORK',
          challenge: {
            type: 'PLATFORMER',
            config: {
              levelLength: 3000,
              platforms: [
                { x: 0, y: 600, width: 500 },
                { x: 600, y: 500, width: 200 },
              ],
              obstacles: [
                { x: 400, y: 550, type: 'firewall' },
              ],
              collectibles: [
                { x: 300, y: 500, type: 'packet' },
              ],
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
    scene = new NetworkScene()
  })

  describe('initialization', () => {
    it('creates scene with correct key', () => {
      expect(scene.constructor.name).toBe('NetworkScene')
    })

    it('initializes with quest data', () => {
      scene.init(mockQuestData)
      expect(scene['quest']).toEqual(mockQuestData.quest)
      expect(scene['layerConfig']).toEqual(mockQuestData.quest.layers[0])
    })

    it('sets default player properties', () => {
      scene.init(mockQuestData)
      expect(scene['playerHealth']).toBe(100)
    })

    it('initializes empty collectibles collection', () => {
      scene.init(mockQuestData)
      expect(scene['collectedIds']).toEqual([])
    })

    it('initializes score to zero', () => {
      scene.init(mockQuestData)
      expect(scene['score']).toBe(0)
    })
  })

  describe('player controls', () => {
    beforeEach(() => {
      scene.init(mockQuestData)
      scene.create()
    })

    it('creates player sprite', () => {
      expect(scene['player']).toBeDefined()
    })

    it('sets up cursor keys for input', () => {
      expect(scene.input.keyboard?.createCursorKeys).toHaveBeenCalled()
    })

    it('handles left movement in update', () => {
      const cursors = {
        left: { isDown: true },
        right: { isDown: false },
        up: { isDown: false },
        space: { isDown: false },
      }
      scene['cursors'] = cursors as unknown as Phaser.Types.Input.Keyboard.CursorKeys
      scene['player'] = {
        setVelocityX: vi.fn(),
        setVelocityY: vi.fn(),
        body: { blocked: { down: true }, velocity: { y: 0 } },
        x: 100,
      } as unknown as Phaser.Physics.Arcade.Sprite

      scene.update()

      expect(scene['player'].setVelocityX).toHaveBeenCalledWith(-350)
    })

    it('handles right movement in update', () => {
      const cursors = {
        left: { isDown: false },
        right: { isDown: true },
        up: { isDown: false },
        space: { isDown: false },
      }
      scene['cursors'] = cursors as unknown as Phaser.Types.Input.Keyboard.CursorKeys
      scene['player'] = {
        setVelocityX: vi.fn(),
        setVelocityY: vi.fn(),
        body: { blocked: { down: true }, velocity: { y: 0 } },
        x: 100,
      } as unknown as Phaser.Physics.Arcade.Sprite

      scene.update()

      expect(scene['player'].setVelocityX).toHaveBeenCalledWith(350)
    })

    it('handles jump when on ground', () => {
      const cursors = {
        left: { isDown: false },
        right: { isDown: false },
        up: { isDown: true },
        space: { isDown: false },
      }
      scene['cursors'] = cursors as unknown as Phaser.Types.Input.Keyboard.CursorKeys
      scene['player'] = {
        setVelocityX: vi.fn(),
        setVelocityY: vi.fn(),
        body: { blocked: { down: true }, velocity: { y: 0 } },
        x: 100,
      } as unknown as Phaser.Physics.Arcade.Sprite

      scene.update()

      expect(scene['player'].setVelocityY).toHaveBeenCalledWith(-650)
    })

    it('prevents jump when in air', () => {
      const cursors = {
        left: { isDown: false },
        right: { isDown: false },
        up: { isDown: true },
        space: { isDown: false },
      }
      scene['cursors'] = cursors as unknown as Phaser.Types.Input.Keyboard.CursorKeys
      scene['player'] = {
        setVelocityX: vi.fn(),
        setVelocityY: vi.fn(),
        body: { blocked: { down: false }, velocity: { y: 0 } },
        x: 100,
      } as unknown as Phaser.Physics.Arcade.Sprite

      scene.update()

      expect(scene['player'].setVelocityY).not.toHaveBeenCalled()
    })
  })

  describe('level generation', () => {
    beforeEach(() => {
      scene.init(mockQuestData)
    })

    it('creates platforms from config', () => {
      scene.create()
      expect(scene.physics.add.staticGroup).toHaveBeenCalled()
    })

    it('creates obstacles from config', () => {
      scene.create()
      expect(scene.physics.add.group).toHaveBeenCalled()
    })

    it('sets up camera to follow player', () => {
      scene.create()
      expect(scene.cameras.main.startFollow).toHaveBeenCalled()
    })

    it('sets camera bounds based on level length', () => {
      scene.create()
      expect(scene.cameras.main.setBounds).toHaveBeenCalled()
    })
  })

  describe('collisions', () => {
    beforeEach(() => {
      scene.init(mockQuestData)
      scene.create()
    })

    it('sets up player-platform collision', () => {
      expect(scene.physics.add.collider).toHaveBeenCalled()
    })

    it('sets up player-obstacle overlap', () => {
      expect(scene.physics.add.overlap).toHaveBeenCalled()
    })
  })

  describe('collectibles mechanics', () => {
    beforeEach(() => {
      scene.init(mockQuestData)
      scene.create()
    })

    it('has collectibles group created', () => {
      expect(scene.physics.add.group).toHaveBeenCalled()
    })

    it('has gates group created', () => {
      expect(scene.physics.add.staticGroup).toHaveBeenCalled()
    })
  })

  describe('scoring and completion', () => {
    beforeEach(() => {
      scene.init(mockQuestData)
      scene.create()
    })

    it('emits damage event when hitting obstacle', () => {
      const damageSpy = vi.fn()
      EventBus.on('player:damaged', damageSpy)

      const mockObstacle = {
        getData: vi.fn(() => 'firewall'),
        setActive: vi.fn(),
        setVisible: vi.fn(),
      }
      scene['hitObstacle'](mockObstacle as unknown as Phaser.Physics.Arcade.Sprite)

      expect(damageSpy).toHaveBeenCalledWith(
        expect.objectContaining({ source: 'firewall' })
      )
    })

    it('completes layer when reaching end', () => {
      const completeSpy = vi.fn()
      EventBus.on('layer:completed', completeSpy)

      scene['player'] = { x: 3000 } as unknown as Phaser.Physics.Arcade.Sprite
      scene['levelLength'] = 2900
      scene['checkLevelCompletion']()

      expect(completeSpy).toHaveBeenCalled()
    })
  })

  describe('educational messages', () => {
    beforeEach(() => {
      scene.init(mockQuestData)
      scene.create()
    })

    it('emits education:show when hitting firewall', () => {
      const educationSpy = vi.fn()
      EventBus.on('education:show', educationSpy)

      const mockObstacle = {
        getData: vi.fn(() => 'firewall'),
        setActive: vi.fn(),
        setVisible: vi.fn(),
      }
      scene['hitObstacle'](mockObstacle as unknown as Phaser.Physics.Arcade.Sprite)

      expect(educationSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          title: expect.any(String),
          message: expect.any(String),
          type: 'warning',
        })
      )
    })
  })

  describe('game over', () => {
    beforeEach(() => {
      scene.init(mockQuestData)
      scene.create()
    })

    it('emits player died event when health reaches zero', () => {
      const deathSpy = vi.fn()
      EventBus.on('player:died', deathSpy)

      scene['playerHealth'] = 10
      const mockObstacle = {
        getData: vi.fn(() => 'firewall'),
        setActive: vi.fn(),
        setVisible: vi.fn(),
      }
      scene['hitObstacle'](mockObstacle as unknown as Phaser.Physics.Arcade.Sprite)

      expect(deathSpy).toHaveBeenCalled()
    })
  })
})
