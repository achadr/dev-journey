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
          setInteractive: vi.fn().mockReturnThis(),
          on: vi.fn().mockReturnThis(),
        }),
        sprite: vi.fn().mockReturnValue({
          setOrigin: vi.fn().mockReturnThis(),
          setScrollFactor: vi.fn().mockReturnThis(),
          setDepth: vi.fn().mockReturnThis(),
          setScale: vi.fn().mockReturnThis(),
          play: vi.fn().mockReturnThis(),
        }),
        text: vi.fn().mockReturnValue({
          setOrigin: vi.fn().mockReturnThis(),
          setScrollFactor: vi.fn().mockReturnThis(),
          setDepth: vi.fn().mockReturnThis(),
          setFontSize: vi.fn().mockReturnThis(),
          setColor: vi.fn().mockReturnThis(),
          setText: vi.fn().mockReturnThis(),
          setInteractive: vi.fn().mockReturnThis(),
          on: vi.fn().mockReturnThis(),
        }),
        container: vi.fn().mockReturnValue({
          setDepth: vi.fn().mockReturnThis(),
          add: vi.fn().mockReturnThis(),
          setPosition: vi.fn().mockReturnThis(),
        }),
        graphics: vi.fn().mockReturnValue({
          fillStyle: vi.fn().mockReturnThis(),
          fillRect: vi.fn().mockReturnThis(),
          fillRoundedRect: vi.fn().mockReturnThis(),
          lineStyle: vi.fn().mockReturnThis(),
          strokeRect: vi.fn().mockReturnThis(),
          setDepth: vi.fn().mockReturnThis(),
        }),
      }
      physics = {
        add: {
          sprite: vi.fn().mockReturnValue({
            setOrigin: vi.fn().mockReturnThis(),
            setBounce: vi.fn().mockReturnThis(),
            setCollideWorldBounds: vi.fn().mockReturnThis(),
            setDepth: vi.fn().mockReturnThis(),
            body: { setGravityY: vi.fn(), velocity: { x: 0, y: 0 } },
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
          centerX: 640,
          centerY: 360,
          width: 1280,
          height: 720,
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
          on: vi.fn(),
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
        width: 1280,
        height: 720,
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
      Container: class {},
      Graphics: class {},
    },
    Input: {
      Keyboard: {
        KeyCodes: {
          ONE: 49,
          TWO: 50,
          THREE: 51,
          FOUR: 52,
          ENTER: 13,
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
    score = 0
    health = 100

    add = {
      rectangle: vi.fn().mockReturnValue({ setOrigin: vi.fn().mockReturnThis(), setScrollFactor: vi.fn().mockReturnThis(), setDepth: vi.fn().mockReturnThis(), setInteractive: vi.fn().mockReturnThis(), on: vi.fn().mockReturnThis() }),
      sprite: vi.fn().mockReturnValue({ setOrigin: vi.fn().mockReturnThis(), setScale: vi.fn().mockReturnThis(), setDepth: vi.fn().mockReturnThis() }),
      text: vi.fn().mockReturnValue({ setOrigin: vi.fn().mockReturnThis(), setScrollFactor: vi.fn().mockReturnThis(), setDepth: vi.fn().mockReturnThis(), setText: vi.fn().mockReturnThis(), setInteractive: vi.fn().mockReturnThis(), on: vi.fn().mockReturnThis() }),
      container: vi.fn().mockReturnValue({ setDepth: vi.fn().mockReturnThis(), add: vi.fn().mockReturnThis(), setPosition: vi.fn().mockReturnThis() }),
      graphics: vi.fn().mockReturnValue({ fillStyle: vi.fn().mockReturnThis(), fillRect: vi.fn().mockReturnThis(), fillRoundedRect: vi.fn().mockReturnThis(), lineStyle: vi.fn().mockReturnThis(), strokeRect: vi.fn().mockReturnThis(), setDepth: vi.fn().mockReturnThis() }),
    }
    cameras = { main: { setBounds: vi.fn().mockReturnThis(), setBackgroundColor: vi.fn().mockReturnThis(), centerX: 640, centerY: 360, width: 1280, height: 720 } }
    input = { keyboard: { createCursorKeys: vi.fn().mockReturnValue({ left: { isDown: false }, right: { isDown: false }, up: { isDown: false } }), addKey: vi.fn().mockReturnValue({ isDown: false }), on: vi.fn() } }
    time = { delayedCall: vi.fn() }
    scene = { start: vi.fn(), pause: vi.fn(), resume: vi.fn() }
    scale = { width: 1280, height: 720 }

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
import { BrowserScene } from '@/game/scenes/BrowserScene'

describe('BrowserScene', () => {
  let scene: BrowserScene

  beforeEach(() => {
    scene = new BrowserScene()
    EventBus.removeAllListeners()
  })

  afterEach(() => {
    vi.clearAllMocks()
    EventBus.removeAllListeners()
  })

  describe('initialization', () => {
    it('initializes with default state', () => {
      scene.init({ questId: 'test-quest', layerId: 'browser-layer' })

      expect(scene['selectedMethod']).toBeNull()
      expect(scene['selectedHeaders']).toEqual([])
      expect(scene['requestUrl']).toBe('')
      expect(scene['requestBody']).toBeNull()
    })

    it('stores quest data on init', () => {
      const questData = { questId: 'browser-quest', layerId: 'browser-layer' }
      scene.init(questData)

      expect(scene['questData']).toEqual(questData)
    })

    it('resets state when reinitializing', () => {
      scene.init({ questId: 'test-1', layerId: 'layer-1' })
      scene['selectedMethod'] = 'GET'
      scene['selectedHeaders'] = ['Content-Type']

      scene.init({ questId: 'test-2', layerId: 'layer-2' })

      expect(scene['selectedMethod']).toBeNull()
      expect(scene['selectedHeaders']).toEqual([])
    })
  })

  describe('HTTP method selection', () => {
    beforeEach(() => {
      scene.init({ questId: 'test', layerId: 'browser' })
    })

    it('selects GET method', () => {
      const spy = vi.fn()
      EventBus.on('method:selected', spy)

      scene['selectMethod']('GET')

      expect(scene['selectedMethod']).toBe('GET')
      expect(spy).toHaveBeenCalledWith({ method: 'GET' })
    })

    it('selects POST method', () => {
      const spy = vi.fn()
      EventBus.on('method:selected', spy)

      scene['selectMethod']('POST')

      expect(scene['selectedMethod']).toBe('POST')
      expect(spy).toHaveBeenCalledWith({ method: 'POST' })
    })

    it('selects PUT method', () => {
      scene['selectMethod']('PUT')
      expect(scene['selectedMethod']).toBe('PUT')
    })

    it('selects DELETE method', () => {
      scene['selectMethod']('DELETE')
      expect(scene['selectedMethod']).toBe('DELETE')
    })

    it('selects PATCH method', () => {
      scene['selectMethod']('PATCH')
      expect(scene['selectedMethod']).toBe('PATCH')
    })

    it('shows educational popup for GET method', () => {
      scene['selectMethod']('GET')

      expect(scene['showEducationalPopup']).toHaveBeenCalledWith(
        'GET Method',
        expect.stringContaining('retrieve'),
        'info'
      )
    })

    it('shows educational popup for POST method', () => {
      scene['selectMethod']('POST')

      expect(scene['showEducationalPopup']).toHaveBeenCalledWith(
        'POST Method',
        expect.stringContaining('create'),
        'info'
      )
    })

    it('shows educational popup for PUT method', () => {
      scene['selectMethod']('PUT')

      expect(scene['showEducationalPopup']).toHaveBeenCalledWith(
        'PUT Method',
        expect.stringContaining('update'),
        'info'
      )
    })

    it('shows educational popup for DELETE method', () => {
      scene['selectMethod']('DELETE')

      expect(scene['showEducationalPopup']).toHaveBeenCalledWith(
        'DELETE Method',
        expect.stringContaining('remove'),
        'info'
      )
    })

    it('awards points for selecting correct method', () => {
      scene['selectMethod']('GET')
      expect(scene['emitScore']).toHaveBeenCalledWith(50, 'method_selected')
    })

    it('replaces previous method selection', () => {
      scene['selectMethod']('GET')
      scene['selectMethod']('POST')

      expect(scene['selectedMethod']).toBe('POST')
    })
  })

  describe('URL input', () => {
    beforeEach(() => {
      scene.init({ questId: 'test', layerId: 'browser' })
    })

    it('sets request URL', () => {
      const spy = vi.fn()
      EventBus.on('url:set', spy)

      scene['setRequestUrl']('/api/users')

      expect(scene['requestUrl']).toBe('/api/users')
      expect(spy).toHaveBeenCalledWith({ url: '/api/users' })
    })

    it('validates URL format', () => {
      scene['setRequestUrl']('/api/users')
      expect(scene['isValidUrl']()).toBe(true)
    })

    it('rejects empty URL', () => {
      scene['setRequestUrl']('')
      expect(scene['isValidUrl']()).toBe(false)
    })

    it('accepts URL with query parameters', () => {
      scene['setRequestUrl']('/api/users?page=1&limit=10')
      expect(scene['isValidUrl']()).toBe(true)
    })

    it('accepts URL with path parameters', () => {
      scene['setRequestUrl']('/api/users/123')
      expect(scene['isValidUrl']()).toBe(true)
    })
  })

  describe('header management', () => {
    beforeEach(() => {
      scene.init({ questId: 'test', layerId: 'browser' })
    })

    it('adds Content-Type header', () => {
      const spy = vi.fn()
      EventBus.on('header:added', spy)

      scene['addHeader']('Content-Type', 'application/json')

      expect(scene['selectedHeaders']).toContainEqual({
        name: 'Content-Type',
        value: 'application/json',
      })
      expect(spy).toHaveBeenCalledWith({
        header: 'Content-Type',
        value: 'application/json',
      })
    })

    it('adds Accept header', () => {
      scene['addHeader']('Accept', 'application/json')

      expect(scene['selectedHeaders']).toContainEqual({
        name: 'Accept',
        value: 'application/json',
      })
    })

    it('adds Authorization header', () => {
      scene['addHeader']('Authorization', 'Bearer token123')

      expect(scene['selectedHeaders']).toContainEqual({
        name: 'Authorization',
        value: 'Bearer token123',
      })
    })

    it('shows educational popup for Content-Type header', () => {
      scene['addHeader']('Content-Type', 'application/json')

      expect(scene['showEducationalPopup']).toHaveBeenCalledWith(
        'Content-Type Header',
        expect.stringContaining('format'),
        'info'
      )
    })

    it('shows educational popup for Authorization header', () => {
      scene['addHeader']('Authorization', 'Bearer token')

      expect(scene['showEducationalPopup']).toHaveBeenCalledWith(
        'Authorization Header',
        expect.stringContaining('credentials'),
        'info'
      )
    })

    it('does not add duplicate headers', () => {
      scene['addHeader']('Content-Type', 'application/json')
      scene['addHeader']('Content-Type', 'text/plain')

      const contentTypeHeaders = scene['selectedHeaders'].filter(
        (h: { name: string }) => h.name === 'Content-Type'
      )
      expect(contentTypeHeaders).toHaveLength(1)
      expect(contentTypeHeaders[0].value).toBe('text/plain') // Updates existing
    })

    it('removes header', () => {
      scene['addHeader']('Content-Type', 'application/json')
      scene['removeHeader']('Content-Type')

      expect(scene['selectedHeaders']).not.toContainEqual(
        expect.objectContaining({ name: 'Content-Type' })
      )
    })

    it('awards points for adding required header', () => {
      scene['addHeader']('Content-Type', 'application/json')
      expect(scene['emitScore']).toHaveBeenCalledWith(25, 'header_added')
    })
  })

  describe('request body', () => {
    beforeEach(() => {
      scene.init({ questId: 'test', layerId: 'browser' })
    })

    it('sets request body for POST request', () => {
      const body = { name: 'John', email: 'john@example.com' }
      scene['setRequestBody'](body)

      expect(scene['requestBody']).toEqual(body)
    })

    it('emits body:set event', () => {
      const spy = vi.fn()
      EventBus.on('body:set', spy)

      const body = { name: 'John' }
      scene['setRequestBody'](body)

      expect(spy).toHaveBeenCalledWith({ body })
    })

    it('clears request body', () => {
      scene['setRequestBody']({ name: 'John' })
      scene['clearRequestBody']()

      expect(scene['requestBody']).toBeNull()
    })

    it('validates JSON body format', () => {
      scene['setRequestBody']({ valid: true })
      expect(scene['isValidBody']()).toBe(true)
    })
  })

  describe('request building', () => {
    beforeEach(() => {
      scene.init({ questId: 'test', layerId: 'browser' })
    })

    it('builds complete request object', () => {
      scene['selectMethod']('POST')
      scene['setRequestUrl']('/api/users')
      scene['addHeader']('Content-Type', 'application/json')
      scene['setRequestBody']({ name: 'John' })

      const request = scene['buildRequest']()

      expect(request).toEqual({
        method: 'POST',
        url: '/api/users',
        headers: [{ name: 'Content-Type', value: 'application/json' }],
        body: { name: 'John' },
      })
    })

    it('emits request:built event', () => {
      const spy = vi.fn()
      EventBus.on('request:built', spy)

      scene['selectMethod']('GET')
      scene['setRequestUrl']('/api/users')
      scene['buildRequest']()

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'GET',
          url: '/api/users',
        })
      )
    })

    it('validates request has method', () => {
      scene['setRequestUrl']('/api/users')

      expect(scene['isRequestValid']()).toBe(false)
    })

    it('validates request has URL', () => {
      scene['selectMethod']('GET')

      expect(scene['isRequestValid']()).toBe(false)
    })

    it('validates complete GET request', () => {
      scene['selectMethod']('GET')
      scene['setRequestUrl']('/api/users')

      expect(scene['isRequestValid']()).toBe(true)
    })

    it('validates POST request requires body', () => {
      scene['selectMethod']('POST')
      scene['setRequestUrl']('/api/users')
      scene['addHeader']('Content-Type', 'application/json')
      // No body set

      expect(scene['isRequestValid']()).toBe(false)
    })

    it('validates complete POST request', () => {
      scene['selectMethod']('POST')
      scene['setRequestUrl']('/api/users')
      scene['addHeader']('Content-Type', 'application/json')
      scene['setRequestBody']({ name: 'John' })

      expect(scene['isRequestValid']()).toBe(true)
    })
  })

  describe('request submission', () => {
    beforeEach(() => {
      scene.init({ questId: 'test', layerId: 'browser' })
    })

    it('submits valid GET request successfully', () => {
      const spy = vi.fn()
      EventBus.on('request:success', spy)

      scene['selectMethod']('GET')
      scene['setRequestUrl']('/api/users')
      scene['submitRequest']()

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 200,
        })
      )
    })

    it('fails submission for incomplete request', () => {
      const spy = vi.fn()
      EventBus.on('request:invalid', spy)

      scene['selectMethod']('GET')
      // No URL set
      scene['submitRequest']()

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          reason: expect.stringContaining('URL'),
        })
      )
    })

    it('awards bonus points for correct request', () => {
      scene['selectMethod']('GET')
      scene['setRequestUrl']('/api/users')
      scene['submitRequest']()

      expect(scene['emitScore']).toHaveBeenCalledWith(100, 'correct_request')
    })

    it('shows success feedback for correct request', () => {
      scene['selectMethod']('GET')
      scene['setRequestUrl']('/api/users')
      scene['submitRequest']()

      expect(scene['showEducationalPopup']).toHaveBeenCalledWith(
        '200 OK',
        expect.stringContaining('successful'),
        'success'
      )
    })

    it('tracks submission attempts', () => {
      scene['selectMethod']('GET')
      scene['setRequestUrl']('/api/users')
      scene['submitRequest']()

      expect(scene['submissionCount']).toBe(1)
    })
  })

  describe('challenge validation', () => {
    beforeEach(() => {
      scene.init({
        questId: 'test',
        layerId: 'browser',
        challenge: {
          type: 'BUILD_REQUEST',
          config: {
            expectedMethod: 'POST',
            expectedUrl: '/api/users',
            requiredHeaders: ['Content-Type'],
            requiresBody: true,
          },
        },
      })
    })

    it('validates correct method against challenge', () => {
      scene['selectMethod']('POST')
      expect(scene['isMethodCorrect']()).toBe(true)
    })

    it('rejects incorrect method', () => {
      scene['selectMethod']('GET')
      expect(scene['isMethodCorrect']()).toBe(false)
    })

    it('validates correct URL against challenge', () => {
      scene['setRequestUrl']('/api/users')
      expect(scene['isUrlCorrect']()).toBe(true)
    })

    it('rejects incorrect URL', () => {
      scene['setRequestUrl']('/api/posts')
      expect(scene['isUrlCorrect']()).toBe(false)
    })

    it('validates required headers present', () => {
      scene['addHeader']('Content-Type', 'application/json')
      expect(scene['hasRequiredHeaders']()).toBe(true)
    })

    it('rejects missing required headers', () => {
      // No headers added
      expect(scene['hasRequiredHeaders']()).toBe(false)
    })

    it('validates complete challenge', () => {
      scene['selectMethod']('POST')
      scene['setRequestUrl']('/api/users')
      scene['addHeader']('Content-Type', 'application/json')
      scene['setRequestBody']({ name: 'John' })

      expect(scene['isChallengeComplete']()).toBe(true)
    })
  })

  describe('hints and guidance', () => {
    beforeEach(() => {
      scene.init({ questId: 'test', layerId: 'browser' })
    })

    it('provides hint after failed attempt', () => {
      const spy = vi.fn()
      EventBus.on('hint:shown', spy)

      scene['selectMethod']('GET')
      scene['submitRequest']() // Will fail - no URL

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          hint: expect.any(String),
        })
      )
    })

    it('provides progressive hints', () => {
      scene['showHint'](0)
      expect(scene['showEducationalPopup']).toHaveBeenCalledWith(
        'Hint',
        expect.stringContaining('method'),
        'info'
      )

      scene['showHint'](1)
      expect(scene['showEducationalPopup']).toHaveBeenCalledWith(
        'Hint',
        expect.stringContaining('URL'),
        'info'
      )
    })

    it('tracks hint usage', () => {
      scene['showHint'](0)
      scene['showHint'](1)

      expect(scene['hintsUsed']).toBe(2)
    })

    it('reduces score bonus when hints used', () => {
      // Set up challenge config so hint penalty applies
      scene.init({
        questId: 'test',
        layerId: 'browser',
        challenge: {
          type: 'BUILD_REQUEST',
          config: {
            expectedMethod: 'GET',
            expectedUrl: '/api/users',
            requiredHeaders: [],
            requiresBody: false,
          },
        },
      })
      scene['hintsUsed'] = 2
      scene['selectMethod']('GET')
      scene['setRequestUrl']('/api/users')
      scene['submitRequest']()

      // Score should be reduced due to hints (100 - 2*15 = 70)
      const scoreCall = (scene['emitScore'] as ReturnType<typeof vi.fn>).mock.calls.find(
        (call: unknown[]) => call[1] === 'correct_request'
      )
      expect(scoreCall?.[0]).toBeLessThan(100)
      expect(scoreCall?.[0]).toBe(70) // 100 - (2 hints * 15 penalty)
    })
  })

  describe('layer completion', () => {
    beforeEach(() => {
      scene.init({
        questId: 'test',
        layerId: 'browser',
        challenge: {
          type: 'BUILD_REQUEST',
          config: {
            expectedMethod: 'GET',
            expectedUrl: '/api/users',
            requiredHeaders: [],
            requiresBody: false,
          },
        },
      })
    })

    it('completes layer when challenge solved', () => {
      scene['selectMethod']('GET')
      scene['setRequestUrl']('/api/users')
      scene['submitRequest']()

      expect(scene['completeLayer']).toHaveBeenCalled()
    })

    it('calculates final score based on performance', () => {
      scene['score'] = 150
      scene['hintsUsed'] = 0
      scene['submissionCount'] = 1

      scene['selectMethod']('GET')
      scene['setRequestUrl']('/api/users')
      scene['submitRequest']()

      expect(scene['completeLayer']).toHaveBeenCalledWith(expect.any(Number))
    })

    it('emits layer:completed event', () => {
      const spy = vi.fn()
      EventBus.on('layer:completed', spy)

      scene['selectMethod']('GET')
      scene['setRequestUrl']('/api/users')
      scene['submitRequest']()

      // completeLayer is mocked, so we verify it was called
      expect(scene['completeLayer']).toHaveBeenCalled()
    })
  })

  describe('educational content', () => {
    beforeEach(() => {
      scene.init({ questId: 'test', layerId: 'browser' })
    })

    it('explains HTTP methods on first selection', () => {
      scene['selectMethod']('GET')

      expect(scene['showEducationalPopup']).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('retrieve'),
        expect.any(String)
      )
    })

    it('explains request/response cycle', () => {
      scene['selectMethod']('GET')
      scene['setRequestUrl']('/api/users')
      scene['submitRequest']()

      expect(scene['showEducationalPopup']).toHaveBeenCalledWith(
        expect.stringContaining('200'),
        expect.any(String),
        expect.any(String)
      )
    })

    it('explains common status codes', () => {
      scene['explainStatusCode'](404)

      expect(scene['showEducationalPopup']).toHaveBeenCalledWith(
        '404 Not Found',
        expect.stringContaining('not found'),
        'warning'
      )
    })

    it('explains 200 OK status code', () => {
      scene['explainStatusCode'](200)

      expect(scene['showEducationalPopup']).toHaveBeenCalledWith(
        '200 OK',
        expect.stringContaining('successful'),
        'success'
      )
    })

    it('explains 201 Created status code', () => {
      scene['explainStatusCode'](201)

      expect(scene['showEducationalPopup']).toHaveBeenCalledWith(
        '201 Created',
        expect.stringContaining('created'),
        'success'
      )
    })

    it('explains 400 Bad Request status code', () => {
      scene['explainStatusCode'](400)

      expect(scene['showEducationalPopup']).toHaveBeenCalledWith(
        '400 Bad Request',
        expect.stringContaining('invalid'),
        'warning'
      )
    })

    it('explains 401 Unauthorized status code', () => {
      scene['explainStatusCode'](401)

      expect(scene['showEducationalPopup']).toHaveBeenCalledWith(
        '401 Unauthorized',
        expect.stringContaining('authentication'),
        'warning'
      )
    })

    it('explains 500 Server Error status code', () => {
      scene['explainStatusCode'](500)

      expect(scene['showEducationalPopup']).toHaveBeenCalledWith(
        '500 Internal Server Error',
        expect.stringContaining('server'),
        'error'
      )
    })
  })

  describe('reset functionality', () => {
    beforeEach(() => {
      scene.init({ questId: 'test', layerId: 'browser' })
    })

    it('resets all selections', () => {
      scene['selectMethod']('GET')
      scene['setRequestUrl']('/api/users')
      scene['addHeader']('Content-Type', 'application/json')

      scene['resetRequest']()

      expect(scene['selectedMethod']).toBeNull()
      expect(scene['requestUrl']).toBe('')
      expect(scene['selectedHeaders']).toEqual([])
    })

    it('emits reset event', () => {
      const spy = vi.fn()
      EventBus.on('request:reset', spy)

      scene['resetRequest']()

      expect(spy).toHaveBeenCalled()
    })

    it('does not reset score or hints used', () => {
      scene['score'] = 100
      scene['hintsUsed'] = 2

      scene['resetRequest']()

      expect(scene['score']).toBe(100)
      expect(scene['hintsUsed']).toBe(2)
    })
  })
})
