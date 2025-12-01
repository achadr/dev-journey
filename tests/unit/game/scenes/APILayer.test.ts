import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { EventBus } from '@/game/EventBus'

// Mock Phaser
vi.mock('phaser', () => ({
  default: {
    Scene: class MockScene {
      add = {
        rectangle: vi.fn().mockReturnValue({
          setOrigin: vi.fn().mockReturnThis(),
          setScrollFactor: vi.fn().mockReturnThis(),
          setDepth: vi.fn().mockReturnThis(),
        }),
        sprite: vi.fn().mockReturnValue({
          setOrigin: vi.fn().mockReturnThis(),
          setScrollFactor: vi.fn().mockReturnThis(),
          setDepth: vi.fn().mockReturnThis(),
          setScale: vi.fn().mockReturnThis(),
          play: vi.fn().mockReturnThis(),
          setBounce: vi.fn().mockReturnThis(),
          setCollideWorldBounds: vi.fn().mockReturnThis(),
          body: { setGravityY: vi.fn(), velocity: { x: 0, y: 0 } },
        }),
        text: vi.fn().mockReturnValue({
          setOrigin: vi.fn().mockReturnThis(),
          setScrollFactor: vi.fn().mockReturnThis(),
          setDepth: vi.fn().mockReturnThis(),
          setFontSize: vi.fn().mockReturnThis(),
          setColor: vi.fn().mockReturnThis(),
          setText: vi.fn().mockReturnThis(),
        }),
        circle: vi.fn().mockReturnValue({
          setOrigin: vi.fn().mockReturnThis(),
          setScrollFactor: vi.fn().mockReturnThis(),
          setDepth: vi.fn().mockReturnThis(),
          setStrokeStyle: vi.fn().mockReturnThis(),
        }),
        group: vi.fn().mockReturnValue({
          create: vi.fn().mockReturnValue({
            setOrigin: vi.fn().mockReturnThis(),
            refreshBody: vi.fn().mockReturnThis(),
          }),
        }),
      }
      physics = {
        add: {
          sprite: vi.fn().mockReturnValue({
            setOrigin: vi.fn().mockReturnThis(),
            setBounce: vi.fn().mockReturnThis(),
            setCollideWorldBounds: vi.fn().mockReturnThis(),
            setDepth: vi.fn().mockReturnThis(),
            body: {
              setGravityY: vi.fn(),
              velocity: { x: 0, y: 0 },
              blocked: { down: true },
            },
          }),
          staticGroup: vi.fn().mockReturnValue({
            create: vi.fn().mockReturnValue({
              setOrigin: vi.fn().mockReturnThis(),
              refreshBody: vi.fn().mockReturnThis(),
              setScale: vi.fn().mockReturnThis(),
            }),
          }),
          group: vi.fn().mockReturnValue({
            create: vi.fn().mockReturnValue({
              setOrigin: vi.fn().mockReturnThis(),
              setScale: vi.fn().mockReturnThis(),
              setData: vi.fn().mockReturnThis(),
            }),
            getChildren: vi.fn().mockReturnValue([]),
          }),
          collider: vi.fn(),
          overlap: vi.fn(),
        },
        world: {
          setBounds: vi.fn(),
        },
      }
      cameras = {
        main: {
          setBounds: vi.fn().mockReturnThis(),
          startFollow: vi.fn().mockReturnThis(),
          setBackgroundColor: vi.fn().mockReturnThis(),
          shake: vi.fn().mockReturnThis(),
        },
      }
      input = {
        keyboard: {
          createCursorKeys: vi.fn().mockReturnValue({
            left: { isDown: false },
            right: { isDown: false },
            up: { isDown: false },
            space: { isDown: false },
          }),
          addKey: vi.fn().mockReturnValue({ isDown: false }),
        },
      }
      time = {
        delayedCall: vi.fn(),
      }
      scene = {
        start: vi.fn(),
        pause: vi.fn(),
        resume: vi.fn(),
      }
      scale = {
        width: 800,
        height: 600,
      }
      sys = {
        game: { destroy: vi.fn() },
      }
    },
    Physics: {
      Arcade: {
        Sprite: class {},
        StaticGroup: class {},
        Group: class {},
      },
    },
    GameObjects: {
      Sprite: class {},
      Rectangle: class {},
      Text: class {},
      Circle: class {},
    },
    Input: {
      Keyboard: {
        KeyCodes: {
          W: 87,
          A: 65,
          S: 83,
          D: 68,
          SPACE: 32,
        },
      },
    },
  },
}))

// Mock BaseScene
vi.mock('@/game/scenes/BaseScene', () => ({
  BaseScene: class MockBaseScene {
    questData: unknown = null
    layerConfig: unknown = null
    player: unknown = null
    cursors: unknown = null
    score = 0
    health = 100

    add = {
      rectangle: vi.fn().mockReturnValue({ setOrigin: vi.fn().mockReturnThis(), setScrollFactor: vi.fn().mockReturnThis(), setDepth: vi.fn().mockReturnThis() }),
      sprite: vi.fn().mockReturnValue({ setOrigin: vi.fn().mockReturnThis(), setScale: vi.fn().mockReturnThis(), setDepth: vi.fn().mockReturnThis() }),
      text: vi.fn().mockReturnValue({ setOrigin: vi.fn().mockReturnThis(), setScrollFactor: vi.fn().mockReturnThis(), setDepth: vi.fn().mockReturnThis() }),
      circle: vi.fn().mockReturnValue({ setOrigin: vi.fn().mockReturnThis(), setDepth: vi.fn().mockReturnThis(), setStrokeStyle: vi.fn().mockReturnThis() }),
      group: vi.fn().mockReturnValue({ create: vi.fn() }),
    }
    physics = {
      add: {
        sprite: vi.fn().mockReturnValue({
          setOrigin: vi.fn().mockReturnThis(),
          setBounce: vi.fn().mockReturnThis(),
          setCollideWorldBounds: vi.fn().mockReturnThis(),
          setDepth: vi.fn().mockReturnThis(),
          setVelocityX: vi.fn().mockReturnThis(),
          setVelocityY: vi.fn().mockReturnThis(),
          body: { setGravityY: vi.fn(), velocity: { x: 0, y: 0 }, blocked: { down: true } },
        }),
        staticGroup: vi.fn().mockReturnValue({ create: vi.fn().mockReturnValue({ setOrigin: vi.fn().mockReturnThis(), refreshBody: vi.fn().mockReturnThis(), setScale: vi.fn().mockReturnThis(), displayWidth: 0, displayHeight: 0 }) }),
        group: vi.fn().mockReturnValue({ create: vi.fn().mockReturnValue({ setOrigin: vi.fn().mockReturnThis(), setScale: vi.fn().mockReturnThis(), setData: vi.fn().mockReturnThis(), destroy: vi.fn() }), getChildren: vi.fn().mockReturnValue([]) }),
        collider: vi.fn(),
        overlap: vi.fn(),
      },
      world: { setBounds: vi.fn() },
    }
    cameras = { main: { setBounds: vi.fn().mockReturnThis(), startFollow: vi.fn().mockReturnThis(), setBackgroundColor: vi.fn().mockReturnThis(), shake: vi.fn() } }
    input = { keyboard: { createCursorKeys: vi.fn().mockReturnValue({ left: { isDown: false }, right: { isDown: false }, up: { isDown: false }, space: { isDown: false } }), addKey: vi.fn().mockReturnValue({ isDown: false }) } }
    time = { delayedCall: vi.fn() }
    scene = { start: vi.fn(), pause: vi.fn(), resume: vi.fn() }
    scale = { width: 800, height: 600 }

    constructor(_key?: string) {}

    init(data: unknown) {
      this.questData = data
    }

    create() {}

    emitDamage = vi.fn()
    emitScore = vi.fn()
    completeLayer = vi.fn()
    showEducationalPopup = vi.fn()
  },
  SceneData: {},
}))

// Import after mocks
import { APILayer } from '@/game/scenes/APILayer'

describe('APILayer', () => {
  let scene: APILayer

  beforeEach(() => {
    scene = new APILayer()
    EventBus.removeAllListeners()
  })

  afterEach(() => {
    vi.clearAllMocks()
    EventBus.removeAllListeners()
  })

  describe('initialization', () => {
    it('initializes with default state', () => {
      scene.init({ questId: 'test-quest', layerId: 'api-layer' })

      expect(scene['collectedMethods']).toEqual([])
      expect(scene['collectedHeaders']).toEqual([])
      expect(scene['completedRequests']).toEqual([])
      expect(scene['hasAuthToken']).toBe(false)
    })

    it('stores quest data on init', () => {
      const questData = { questId: 'api-quest', layerId: 'api-layer' }
      scene.init(questData)

      expect(scene['questData']).toEqual(questData)
    })

    it('resets state when reinitializing', () => {
      scene.init({ questId: 'test-1', layerId: 'layer-1' })
      scene['collectedMethods'] = ['GET', 'POST']
      scene['hasAuthToken'] = true

      scene.init({ questId: 'test-2', layerId: 'layer-2' })

      expect(scene['collectedMethods']).toEqual([])
      expect(scene['hasAuthToken']).toBe(false)
    })
  })

  describe('HTTP method collection', () => {
    beforeEach(() => {
      scene.init({ questId: 'test', layerId: 'api' })
    })

    it('collects GET method token', () => {
      const spy = vi.fn()
      EventBus.on('method:collected', spy)

      scene['collectMethodToken']('GET')

      expect(scene['collectedMethods']).toContain('GET')
      expect(spy).toHaveBeenCalledWith({
        method: 'GET',
        collected: ['GET'],
      })
    })

    it('collects POST method token', () => {
      const spy = vi.fn()
      EventBus.on('method:collected', spy)

      scene['collectMethodToken']('POST')

      expect(scene['collectedMethods']).toContain('POST')
      expect(spy).toHaveBeenCalledWith({
        method: 'POST',
        collected: ['POST'],
      })
    })

    it('collects PUT method token', () => {
      scene['collectMethodToken']('PUT')
      expect(scene['collectedMethods']).toContain('PUT')
    })

    it('collects DELETE method token', () => {
      scene['collectMethodToken']('DELETE')
      expect(scene['collectedMethods']).toContain('DELETE')
    })

    it('adds score when collecting method token', () => {
      scene['collectMethodToken']('GET')
      expect(scene['emitScore']).toHaveBeenCalledWith(100, 'method_collected')
    })

    it('shows educational popup for GET method', () => {
      scene['collectMethodToken']('GET')

      expect(scene['showEducationalPopup']).toHaveBeenCalledWith(
        'GET Request',
        expect.stringContaining('retrieve'),
        'info'
      )
    })

    it('shows educational popup for POST method', () => {
      scene['collectMethodToken']('POST')

      expect(scene['showEducationalPopup']).toHaveBeenCalledWith(
        'POST Request',
        expect.stringContaining('create'),
        'info'
      )
    })

    it('does not collect duplicate methods', () => {
      scene['collectMethodToken']('GET')
      scene['collectMethodToken']('GET')

      expect(scene['collectedMethods'].filter(m => m === 'GET')).toHaveLength(1)
    })
  })

  describe('authentication token collection', () => {
    beforeEach(() => {
      scene.init({ questId: 'test', layerId: 'api' })
    })

    it('collects auth token', () => {
      const spy = vi.fn()
      EventBus.on('auth:acquired', spy)

      scene['collectAuthToken']()

      expect(scene['hasAuthToken']).toBe(true)
      expect(spy).toHaveBeenCalled()
    })

    it('adds Authorization header when collecting auth token', () => {
      scene['collectAuthToken']()

      expect(scene['collectedHeaders']).toContain('Authorization')
    })

    it('shows educational popup for auth token', () => {
      scene['collectAuthToken']()

      expect(scene['showEducationalPopup']).toHaveBeenCalledWith(
        'Authentication Token',
        expect.stringContaining('Bearer'),
        'success'
      )
    })

    it('awards bonus points for auth token', () => {
      scene['collectAuthToken']()

      expect(scene['emitScore']).toHaveBeenCalledWith(200, 'auth_token')
    })
  })

  describe('header collection', () => {
    beforeEach(() => {
      scene.init({ questId: 'test', layerId: 'api' })
    })

    it('collects Content-Type header', () => {
      const spy = vi.fn()
      EventBus.on('header:collected', spy)

      scene['collectHeader']('Content-Type')

      expect(scene['collectedHeaders']).toContain('Content-Type')
      expect(spy).toHaveBeenCalledWith({
        header: 'Content-Type',
        collected: ['Content-Type'],
      })
    })

    it('collects Accept header', () => {
      scene['collectHeader']('Accept')
      expect(scene['collectedHeaders']).toContain('Accept')
    })

    it('shows educational popup for Content-Type header', () => {
      scene['collectHeader']('Content-Type')

      expect(scene['showEducationalPopup']).toHaveBeenCalledWith(
        'Content-Type Header',
        expect.stringContaining('format'),
        'info'
      )
    })

    it('does not collect duplicate headers', () => {
      scene['collectHeader']('Content-Type')
      scene['collectHeader']('Content-Type')

      expect(scene['collectedHeaders'].filter(h => h === 'Content-Type')).toHaveLength(1)
    })
  })

  describe('API endpoint requests', () => {
    beforeEach(() => {
      scene.init({ questId: 'test', layerId: 'api' })
    })

    it('successfully makes GET request to public endpoint', () => {
      const spy = vi.fn()
      EventBus.on('request:success', spy)

      scene['collectedMethods'] = ['GET']
      scene['makeRequest']('/api/public', 'GET', false)

      expect(spy).toHaveBeenCalledWith({
        endpoint: '/api/public',
        method: 'GET',
        statusCode: 200,
      })
    })

    it('fails request to protected endpoint without auth', () => {
      const spy = vi.fn()
      EventBus.on('request:failed', spy)

      scene['collectedMethods'] = ['GET']
      scene['hasAuthToken'] = false
      scene['makeRequest']('/api/protected', 'GET', true)

      expect(spy).toHaveBeenCalledWith({
        endpoint: '/api/protected',
        method: 'GET',
        statusCode: 401,
        reason: expect.stringContaining('Unauthorized'),
      })
    })

    it('successfully makes request to protected endpoint with auth', () => {
      const spy = vi.fn()
      EventBus.on('request:success', spy)

      scene['collectedMethods'] = ['GET']
      scene['hasAuthToken'] = true
      scene['makeRequest']('/api/protected', 'GET', true)

      expect(spy).toHaveBeenCalledWith({
        endpoint: '/api/protected',
        method: 'GET',
        statusCode: 200,
      })
    })

    it('fails request without required method', () => {
      const spy = vi.fn()
      EventBus.on('request:failed', spy)

      scene['collectedMethods'] = ['GET'] // Only GET collected
      scene['makeRequest']('/api/users', 'POST', false)

      expect(spy).toHaveBeenCalledWith({
        endpoint: '/api/users',
        method: 'POST',
        statusCode: 405,
        reason: expect.stringContaining('Method Not Allowed'),
      })
    })

    it('tracks completed requests', () => {
      scene['collectedMethods'] = ['GET']
      scene['makeRequest']('/api/public', 'GET', false)

      expect(scene['completedRequests']).toContainEqual({
        endpoint: '/api/public',
        method: 'GET',
        success: true,
      })
    })

    it('awards points for successful request', () => {
      scene['collectedMethods'] = ['GET']
      scene['makeRequest']('/api/public', 'GET', false)

      expect(scene['emitScore']).toHaveBeenCalledWith(150, 'successful_request')
    })

    it('shows educational popup for 401 error', () => {
      scene['collectedMethods'] = ['GET']
      scene['hasAuthToken'] = false
      scene['makeRequest']('/api/protected', 'GET', true)

      expect(scene['showEducationalPopup']).toHaveBeenCalledWith(
        '401 Unauthorized',
        expect.stringContaining('authentication'),
        'warning'
      )
    })
  })

  describe('API obstacles', () => {
    beforeEach(() => {
      scene.init({ questId: 'test', layerId: 'api' })
    })

    it('handles 500 Internal Server Error obstacle', () => {
      scene['hitAPIError'](500)

      expect(scene['emitDamage']).toHaveBeenCalledWith(25, '500_error')
      expect(scene['showEducationalPopup']).toHaveBeenCalledWith(
        '500 Internal Server Error',
        expect.stringContaining('server'),
        'warning'
      )
    })

    it('handles 503 Service Unavailable obstacle', () => {
      scene['hitAPIError'](503)

      expect(scene['emitDamage']).toHaveBeenCalledWith(20, '503_error')
      expect(scene['showEducationalPopup']).toHaveBeenCalledWith(
        '503 Service Unavailable',
        expect.stringContaining('unavailable'),
        'warning'
      )
    })

    it('handles 429 Too Many Requests obstacle', () => {
      scene['hitAPIError'](429)

      expect(scene['emitDamage']).toHaveBeenCalledWith(15, '429_error')
      expect(scene['showEducationalPopup']).toHaveBeenCalledWith(
        '429 Too Many Requests',
        expect.stringContaining('rate limit'),
        'warning'
      )
    })

    it('handles 504 Gateway Timeout obstacle', () => {
      scene['hitAPIError'](504)

      expect(scene['emitDamage']).toHaveBeenCalledWith(20, '504_error')
      expect(scene['showEducationalPopup']).toHaveBeenCalledWith(
        '504 Gateway Timeout',
        expect.stringContaining('gateway'),
        'warning'
      )
    })

    it('shakes camera on error', () => {
      scene['hitAPIError'](500)

      expect(scene.cameras.main.shake).toHaveBeenCalled()
    })
  })

  describe('request sequence validation', () => {
    beforeEach(() => {
      scene.init({ questId: 'test', layerId: 'api' })
    })

    it('validates correct CRUD sequence', () => {
      scene['collectedMethods'] = ['POST', 'GET', 'PUT', 'DELETE']
      scene['hasAuthToken'] = true

      // Create -> Read -> Update -> Delete
      scene['makeRequest']('/api/users', 'POST', true)
      scene['makeRequest']('/api/users/1', 'GET', true)
      scene['makeRequest']('/api/users/1', 'PUT', true)
      scene['makeRequest']('/api/users/1', 'DELETE', true)

      expect(scene['completedRequests']).toHaveLength(4)
    })

    it('emits bonus for completing full CRUD cycle', () => {
      const spy = vi.fn()
      EventBus.on('crud:complete', spy)

      scene['collectedMethods'] = ['POST', 'GET', 'PUT', 'DELETE']
      scene['hasAuthToken'] = true

      scene['makeRequest']('/api/resource', 'POST', true)
      scene['makeRequest']('/api/resource/1', 'GET', true)
      scene['makeRequest']('/api/resource/1', 'PUT', true)
      scene['makeRequest']('/api/resource/1', 'DELETE', true)

      scene['checkCRUDCompletion']()

      expect(spy).toHaveBeenCalled()
    })

    it('awards bonus points for CRUD completion', () => {
      scene['collectedMethods'] = ['POST', 'GET', 'PUT', 'DELETE']
      scene['hasAuthToken'] = true

      scene['completedRequests'] = [
        { endpoint: '/api/r', method: 'POST', success: true },
        { endpoint: '/api/r/1', method: 'GET', success: true },
        { endpoint: '/api/r/1', method: 'PUT', success: true },
        { endpoint: '/api/r/1', method: 'DELETE', success: true },
      ]

      scene['checkCRUDCompletion']()

      expect(scene['emitScore']).toHaveBeenCalledWith(500, 'crud_complete')
    })
  })

  describe('status code response handling', () => {
    beforeEach(() => {
      scene.init({ questId: 'test', layerId: 'api' })
    })

    it('collects 200 OK status code knowledge', () => {
      const spy = vi.fn()
      EventBus.on('statuscode:learned', spy)

      scene['collectedMethods'] = ['GET']
      scene['makeRequest']('/api/test', 'GET', false)

      expect(spy).toHaveBeenCalledWith({
        code: 200,
        name: 'OK',
      })
    })

    it('collects 201 Created status code on POST', () => {
      const spy = vi.fn()
      EventBus.on('statuscode:learned', spy)

      scene['collectedMethods'] = ['POST']
      scene['makeRequest']('/api/users', 'POST', false)

      expect(spy).toHaveBeenCalledWith({
        code: 201,
        name: 'Created',
      })
    })

    it('tracks learned status codes', () => {
      scene['collectedMethods'] = ['GET', 'POST']

      scene['makeRequest']('/api/a', 'GET', false)
      scene['makeRequest']('/api/b', 'POST', false)

      expect(scene['learnedStatusCodes']).toContain(200)
      expect(scene['learnedStatusCodes']).toContain(201)
    })
  })

  describe('layer completion', () => {
    beforeEach(() => {
      scene.init({ questId: 'test', layerId: 'api' })
    })

    it('completes layer when all objectives met', () => {
      const spy = vi.fn()
      EventBus.on('layer:completed', spy)

      scene['collectedMethods'] = ['GET', 'POST', 'PUT', 'DELETE']
      scene['hasAuthToken'] = true
      scene['crudCompleted'] = true // Must have completed CRUD
      scene['completedRequests'] = [
        { endpoint: '/api/r', method: 'POST', success: true },
        { endpoint: '/api/r/1', method: 'GET', success: true },
        { endpoint: '/api/r/1', method: 'PUT', success: true },
        { endpoint: '/api/r/1', method: 'DELETE', success: true },
      ]
      scene['score'] = 1000

      scene['checkLayerCompletion']()

      expect(scene['completeLayer']).toHaveBeenCalledWith(1000)
    })

    it('does not complete layer without all methods', () => {
      scene['collectedMethods'] = ['GET', 'POST'] // Missing PUT, DELETE
      scene['hasAuthToken'] = true

      scene['checkLayerCompletion']()

      expect(scene['completeLayer']).not.toHaveBeenCalled()
    })

    it('does not complete layer without auth token', () => {
      scene['collectedMethods'] = ['GET', 'POST', 'PUT', 'DELETE']
      scene['hasAuthToken'] = false

      scene['checkLayerCompletion']()

      expect(scene['completeLayer']).not.toHaveBeenCalled()
    })
  })

  describe('player death', () => {
    beforeEach(() => {
      scene.init({ questId: 'test', layerId: 'api' })
    })

    it('emits player:died when health reaches 0', () => {
      const spy = vi.fn()
      EventBus.on('player:died', spy)

      scene['health'] = 0
      scene['checkPlayerDeath']()

      expect(spy).toHaveBeenCalled()
    })

    it('does not emit death when health is positive', () => {
      const spy = vi.fn()
      EventBus.on('player:died', spy)

      scene['health'] = 50
      scene['checkPlayerDeath']()

      expect(spy).not.toHaveBeenCalled()
    })
  })

  describe('educational messages', () => {
    beforeEach(() => {
      scene.init({ questId: 'test', layerId: 'api' })
    })

    it('explains REST principles when collecting all methods', () => {
      scene['collectedMethods'] = ['GET', 'POST', 'PUT']
      scene['collectMethodToken']('DELETE')

      expect(scene['showEducationalPopup']).toHaveBeenCalledWith(
        expect.stringContaining('REST'),
        expect.stringContaining('CRUD'),
        'success'
      )
    })

    it('explains idempotency for GET, PUT, DELETE', () => {
      scene['collectMethodToken']('GET')

      expect(scene['showEducationalPopup']).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('idempotent'),
        expect.any(String)
      )
    })
  })
})
