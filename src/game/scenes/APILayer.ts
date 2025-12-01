import { BaseScene, SceneData } from './BaseScene'
import { EventBus } from '../EventBus'

// HTTP Methods
export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

// Headers that can be collected
export type APIHeader = 'Authorization' | 'Content-Type' | 'Accept' | 'Cache-Control'

// Completed request tracking
interface CompletedRequest {
  endpoint: string
  method: HTTPMethod
  success: boolean
}

// API error codes that appear as obstacles
type APIErrorCode = 429 | 500 | 503 | 504

// Educational info for HTTP methods
const METHOD_INFO: Record<HTTPMethod, { title: string; description: string }> = {
  GET: {
    title: 'GET Request',
    description: 'Used to retrieve data from a server. GET requests are idempotent - they can be repeated without changing the result.',
  },
  POST: {
    title: 'POST Request',
    description: 'Used to create new resources on the server. POST requests send data in the request body.',
  },
  PUT: {
    title: 'PUT Request',
    description: 'Used to update existing resources. PUT is idempotent - multiple identical requests have the same effect.',
  },
  DELETE: {
    title: 'DELETE Request',
    description: 'Used to remove resources from the server. DELETE is also idempotent.',
  },
}

// Educational info for headers
const HEADER_INFO: Record<APIHeader, { title: string; description: string }> = {
  Authorization: {
    title: 'Authorization Header',
    description: 'Contains credentials (like Bearer tokens) to authenticate the request with the server.',
  },
  'Content-Type': {
    title: 'Content-Type Header',
    description: 'Specifies the format of the request body (e.g., application/json).',
  },
  Accept: {
    title: 'Accept Header',
    description: 'Tells the server what response formats the client can handle.',
  },
  'Cache-Control': {
    title: 'Cache-Control Header',
    description: 'Directives for caching mechanisms in both requests and responses.',
  },
}

// Educational info for status codes
const STATUS_CODE_INFO: Record<number, { name: string; description: string }> = {
  200: { name: 'OK', description: 'The request succeeded. This is the standard success response.' },
  201: { name: 'Created', description: 'A new resource was successfully created (typically after POST).' },
  401: { name: 'Unauthorized', description: 'Authentication is required. You need to provide valid credentials.' },
  405: { name: 'Method Not Allowed', description: 'The HTTP method is not supported for this endpoint.' },
  429: { name: 'Too Many Requests', description: 'You have exceeded the rate limit. Wait before making more requests.' },
  500: { name: 'Internal Server Error', description: 'The server encountered an unexpected error.' },
  503: { name: 'Service Unavailable', description: 'The server is temporarily unavailable (maintenance or overload).' },
  504: { name: 'Gateway Timeout', description: 'The server acting as a gateway did not receive a timely response.' },
}

// Damage amounts for API errors
const ERROR_DAMAGE: Record<APIErrorCode, number> = {
  429: 15,
  500: 25,
  503: 20,
  504: 20,
}

export class APILayer extends BaseScene {
  // Player properties
  protected player!: Phaser.Physics.Arcade.Sprite
  protected cursors: Phaser.Types.Input.Keyboard.CursorKeys | undefined
  protected score: number = 0
  protected health: number = 100

  // State tracking
  private collectedMethods: HTTPMethod[] = []
  private collectedHeaders: APIHeader[] = []
  private completedRequests: CompletedRequest[] = []
  private learnedStatusCodes: number[] = []
  private hasAuthToken: boolean = false
  private crudCompleted: boolean = false

  // Game objects
  private methodTokens!: Phaser.Physics.Arcade.Group
  private headerTokens!: Phaser.Physics.Arcade.Group
  private authTokens!: Phaser.Physics.Arcade.Group
  private apiEndpoints!: Phaser.Physics.Arcade.Group
  private errorObstacles!: Phaser.Physics.Arcade.Group
  private platforms!: Phaser.Physics.Arcade.StaticGroup

  constructor() {
    super('APILayer')
  }

  init(data: SceneData): void {
    super.init(data)
    this.resetState()
  }

  private resetState(): void {
    this.collectedMethods = []
    this.collectedHeaders = []
    this.completedRequests = []
    this.learnedStatusCodes = []
    this.hasAuthToken = false
    this.crudCompleted = false
  }

  create(): void {
    super.create()

    // Create visual elements
    this.createBackground()
    this.createPlatforms()
    this.createPlayer()
    this.createMethodTokens()
    this.createHeaderTokens()
    this.createAuthTokens()
    this.createAPIEndpoints()
    this.createErrorObstacles()
    this.setupCollisions()
    this.setupCamera()

    // Listen for game events
    EventBus.on('game:resume', this.resumeGame, this)
  }

  private createBackground(): void {
    const width: number = (this.layerConfig?.challenge?.config?.levelLength as number) || 3000
    const height = 600

    // API-themed background (server room style)
    this.add.rectangle(width / 2, height / 2, width, height, 0x1a1a2e)
      .setScrollFactor(1)
      .setDepth(-10)

    // Grid pattern for server room aesthetic
    const gridSize = 50
    for (let x = 0; x < width; x += gridSize) {
      for (let y = 0; y < height; y += gridSize) {
        this.add.rectangle(x, y, 1, gridSize, 0x16213e, 0.3)
          .setScrollFactor(1)
          .setDepth(-9)
        this.add.rectangle(x, y, gridSize, 1, 0x16213e, 0.3)
          .setScrollFactor(1)
          .setDepth(-9)
      }
    }
  }

  private createPlatforms(): void {
    this.platforms = this.physics.add.staticGroup()

    const config = this.layerConfig?.challenge?.config as { platforms?: { x: number; y: number; width: number }[] } | undefined
    const platformConfigs: { x: number; y: number; width: number }[] = config?.platforms || [
      { x: 0, y: 568, width: 800 },
      { x: 900, y: 500, width: 200 },
      { x: 1200, y: 450, width: 200 },
      { x: 1500, y: 400, width: 200 },
      { x: 1800, y: 450, width: 200 },
      { x: 2100, y: 500, width: 200 },
      { x: 2400, y: 568, width: 600 },
    ]

    platformConfigs.forEach((p: { x: number; y: number; width: number }) => {
      const platform = this.platforms.create(p.x + p.width / 2, p.y, undefined) as Phaser.Physics.Arcade.Sprite
      platform.setOrigin(0.5, 0.5)
      platform.displayWidth = p.width
      platform.displayHeight = 32
      platform.refreshBody()

      // Platform visual
      this.add.rectangle(p.x + p.width / 2, p.y, p.width, 32, 0x0f3460)
        .setDepth(0)
    })
  }

  private createPlayer(): void {
    this.player = this.physics.add.sprite(100, 450, 'player')
      .setOrigin(0.5, 1)
      .setBounce(0.1)
      .setCollideWorldBounds(true)
      .setDepth(10)

    const body = this.player.body as Phaser.Physics.Arcade.Body
    body?.setGravityY(300)

    // Player visual (simple rectangle for now)
    this.add.rectangle(100, 450, 32, 48, 0x00ff88)
      .setOrigin(0.5, 1)
      .setDepth(10)

    this.cursors = this.input.keyboard?.createCursorKeys()
  }

  private createMethodTokens(): void {
    this.methodTokens = this.physics.add.group()

    const methods: HTTPMethod[] = ['GET', 'POST', 'PUT', 'DELETE']
    const positions = [
      { x: 300, y: 500 },
      { x: 1000, y: 430 },
      { x: 1600, y: 330 },
      { x: 2200, y: 430 },
    ]

    const colors: Record<HTTPMethod, number> = {
      GET: 0x00ff00,    // Green
      POST: 0xffff00,   // Yellow
      PUT: 0x00ffff,    // Cyan
      DELETE: 0xff0000, // Red
    }

    methods.forEach((method, i) => {
      const pos = positions[i]
      const token = this.methodTokens.create(pos.x, pos.y, undefined) as Phaser.Physics.Arcade.Sprite
      token.setData('method', method)
      token.setOrigin(0.5)

      // Visual representation
      this.add.circle(pos.x, pos.y, 20, colors[method])
        .setDepth(5)
      this.add.text(pos.x, pos.y, method, { fontSize: '10px', color: '#000' })
        .setOrigin(0.5)
        .setDepth(6)
    })
  }

  private createHeaderTokens(): void {
    this.headerTokens = this.physics.add.group()

    const headers: APIHeader[] = ['Content-Type', 'Accept']
    const positions = [
      { x: 600, y: 500 },
      { x: 1300, y: 380 },
    ]

    headers.forEach((header, i) => {
      const pos = positions[i]
      const token = this.headerTokens.create(pos.x, pos.y, undefined) as Phaser.Physics.Arcade.Sprite
      token.setData('header', header)
      token.setOrigin(0.5)

      // Visual - rectangle for headers
      this.add.rectangle(pos.x, pos.y, 60, 20, 0x9966ff)
        .setDepth(5)
      this.add.text(pos.x, pos.y, header.substring(0, 6), { fontSize: '8px', color: '#fff' })
        .setOrigin(0.5)
        .setDepth(6)
    })
  }

  private createAuthTokens(): void {
    this.authTokens = this.physics.add.group()

    // Auth token positioned mid-level
    const token = this.authTokens.create(1400, 350, undefined) as Phaser.Physics.Arcade.Sprite
    token.setData('type', 'auth')
    token.setOrigin(0.5)

    // Visual - gold key/token
    this.add.circle(1400, 350, 25, 0xffd700)
      .setDepth(5)
      .setStrokeStyle(3, 0xffaa00)
    this.add.text(1400, 350, '🔑', { fontSize: '20px' })
      .setOrigin(0.5)
      .setDepth(6)
  }

  private createAPIEndpoints(): void {
    this.apiEndpoints = this.physics.add.group()

    const endpoints = [
      { x: 500, y: 520, path: '/api/public', method: 'GET' as HTTPMethod, requiresAuth: false },
      { x: 1100, y: 450, path: '/api/users', method: 'POST' as HTTPMethod, requiresAuth: false },
      { x: 1700, y: 350, path: '/api/protected', method: 'GET' as HTTPMethod, requiresAuth: true },
      { x: 2000, y: 400, path: '/api/users/1', method: 'PUT' as HTTPMethod, requiresAuth: true },
      { x: 2500, y: 520, path: '/api/users/1', method: 'DELETE' as HTTPMethod, requiresAuth: true },
    ]

    endpoints.forEach((ep) => {
      const endpoint = this.apiEndpoints.create(ep.x, ep.y, undefined) as Phaser.Physics.Arcade.Sprite
      endpoint.setData('path', ep.path)
      endpoint.setData('method', ep.method)
      endpoint.setData('requiresAuth', ep.requiresAuth)
      endpoint.setOrigin(0.5)

      // Visual - server icon
      const color = ep.requiresAuth ? 0xff6b6b : 0x6bff6b
      this.add.rectangle(ep.x, ep.y, 80, 40, color)
        .setDepth(4)
      this.add.text(ep.x, ep.y - 10, ep.path, { fontSize: '8px', color: '#000' })
        .setOrigin(0.5)
        .setDepth(5)
      this.add.text(ep.x, ep.y + 10, ep.method, { fontSize: '10px', color: '#000', fontStyle: 'bold' })
        .setOrigin(0.5)
        .setDepth(5)
    })
  }

  private createErrorObstacles(): void {
    this.errorObstacles = this.physics.add.group()

    const errors: { x: number; y: number; code: APIErrorCode }[] = [
      { x: 800, y: 530, code: 500 },
      { x: 1450, y: 380, code: 429 },
      { x: 1900, y: 430, code: 503 },
      { x: 2300, y: 480, code: 504 },
    ]

    errors.forEach((err) => {
      const obstacle = this.errorObstacles.create(err.x, err.y, undefined) as Phaser.Physics.Arcade.Sprite
      obstacle.setData('errorCode', err.code)
      obstacle.setOrigin(0.5)

      // Visual - red warning
      this.add.rectangle(err.x, err.y, 40, 40, 0xff0000, 0.7)
        .setDepth(4)
      this.add.text(err.x, err.y, err.code.toString(), { fontSize: '12px', color: '#fff', fontStyle: 'bold' })
        .setOrigin(0.5)
        .setDepth(5)
    })
  }

  private setupCollisions(): void {
    // Player-platform collision
    this.physics.add.collider(this.player!, this.platforms)

    // Collectibles
    this.physics.add.overlap(this.player!, this.methodTokens, this.onMethodTokenCollision, undefined, this)
    this.physics.add.overlap(this.player!, this.headerTokens, this.onHeaderTokenCollision, undefined, this)
    this.physics.add.overlap(this.player!, this.authTokens, this.onAuthTokenCollision, undefined, this)
    this.physics.add.overlap(this.player!, this.apiEndpoints, this.onEndpointCollision, undefined, this)
    this.physics.add.overlap(this.player!, this.errorObstacles, this.onErrorCollision, undefined, this)
  }

  private setupCamera(): void {
    const levelWidth: number = (this.layerConfig?.challenge?.config?.levelLength as number) || 3000

    this.cameras.main.setBounds(0, 0, levelWidth, 600)
    this.cameras.main.startFollow(this.player!, true, 0.1, 0.1)
    this.cameras.main.setBackgroundColor('#1a1a2e')
  }

  // Collision handlers
  private onMethodTokenCollision(_player: unknown, token: unknown): void {
    const sprite = token as Phaser.Physics.Arcade.Sprite
    const method = sprite.getData('method') as HTTPMethod
    sprite.destroy()
    this.collectMethodToken(method)
  }

  private onHeaderTokenCollision(_player: unknown, token: unknown): void {
    const sprite = token as Phaser.Physics.Arcade.Sprite
    const header = sprite.getData('header') as APIHeader
    sprite.destroy()
    this.collectHeader(header)
  }

  private onAuthTokenCollision(_player: unknown, token: unknown): void {
    const sprite = token as Phaser.Physics.Arcade.Sprite
    sprite.destroy()
    this.collectAuthToken()
  }

  private onEndpointCollision(_player: unknown, endpoint: unknown): void {
    const sprite = endpoint as Phaser.Physics.Arcade.Sprite
    const path = sprite.getData('path') as string
    const method = sprite.getData('method') as HTTPMethod
    const requiresAuth = sprite.getData('requiresAuth') as boolean

    this.makeRequest(path, method, requiresAuth)
    sprite.destroy()
  }

  private onErrorCollision(_player: unknown, obstacle: unknown): void {
    const sprite = obstacle as Phaser.Physics.Arcade.Sprite
    const errorCode = sprite.getData('errorCode') as APIErrorCode

    this.hitAPIError(errorCode)

    // Respawn after delay
    sprite.setActive(false).setVisible(false)
    this.time.delayedCall(2000, () => {
      sprite.setActive(true).setVisible(true)
    })
  }

  // Game mechanics
  private collectMethodToken(method: HTTPMethod): void {
    if (this.collectedMethods.includes(method)) return

    this.collectedMethods.push(method)

    EventBus.emit('method:collected', {
      method,
      collected: [...this.collectedMethods],
    })

    this.emitScore(100, 'method_collected')

    const info = METHOD_INFO[method]
    this.showEducationalPopup(info.title, info.description, 'info')

    // Check if all methods collected
    if (this.collectedMethods.length === 4) {
      this.showEducationalPopup(
        'REST Complete!',
        'You\'ve learned all CRUD operations: Create (POST), Read (GET), Update (PUT), Delete (DELETE).',
        'success'
      )
      this.emitScore(300, 'all_methods')
    }
  }

  private collectHeader(header: APIHeader): void {
    if (this.collectedHeaders.includes(header)) return

    this.collectedHeaders.push(header)

    EventBus.emit('header:collected', {
      header,
      collected: [...this.collectedHeaders],
    })

    this.emitScore(75, 'header_collected')

    const info = HEADER_INFO[header]
    this.showEducationalPopup(info.title, info.description, 'info')
  }

  private collectAuthToken(): void {
    if (this.hasAuthToken) return

    this.hasAuthToken = true
    this.collectedHeaders.push('Authorization')

    EventBus.emit('auth:acquired', {
      token: 'Bearer xxx',
      headers: [...this.collectedHeaders],
    })

    this.emitScore(200, 'auth_token')

    this.showEducationalPopup(
      'Authentication Token',
      'You acquired a Bearer token! This goes in the Authorization header to access protected endpoints.',
      'success'
    )
  }

  private makeRequest(endpoint: string, method: HTTPMethod, requiresAuth: boolean): void {
    // Check if player has the required method
    if (!this.collectedMethods.includes(method)) {
      EventBus.emit('request:failed', {
        endpoint,
        method,
        statusCode: 405,
        reason: 'Method Not Allowed - You haven\'t learned this HTTP method yet!',
      })

      this.showEducationalPopup(
        '405 Method Not Allowed',
        `You need to collect the ${method} method token first!`,
        'warning'
      )
      return
    }

    // Check authentication for protected endpoints
    if (requiresAuth && !this.hasAuthToken) {
      EventBus.emit('request:failed', {
        endpoint,
        method,
        statusCode: 401,
        reason: 'Unauthorized - This endpoint requires authentication.',
      })

      this.showEducationalPopup(
        '401 Unauthorized',
        'This endpoint requires authentication. Find the auth token first!',
        'warning'
      )

      this.completedRequests.push({ endpoint, method, success: false })
      return
    }

    // Success!
    const statusCode = method === 'POST' ? 201 : 200

    EventBus.emit('request:success', {
      endpoint,
      method,
      statusCode,
    })

    // Learn status code
    if (!this.learnedStatusCodes.includes(statusCode)) {
      this.learnedStatusCodes.push(statusCode)
      EventBus.emit('statuscode:learned', {
        code: statusCode,
        name: STATUS_CODE_INFO[statusCode].name,
      })
    }

    this.completedRequests.push({ endpoint, method, success: true })
    this.emitScore(150, 'successful_request')

    const statusInfo = STATUS_CODE_INFO[statusCode]
    this.showEducationalPopup(
      `${statusCode} ${statusInfo.name}`,
      statusInfo.description,
      'success'
    )

    this.checkCRUDCompletion()
    this.checkLayerCompletion()
  }

  private hitAPIError(errorCode: APIErrorCode): void {
    const damage = ERROR_DAMAGE[errorCode]
    const info = STATUS_CODE_INFO[errorCode]

    this.emitDamage(damage, `${errorCode}_error`)

    this.showEducationalPopup(
      `${errorCode} ${info.name}`,
      info.description,
      'warning'
    )

    this.cameras.main.shake(200, 0.01)

    this.checkPlayerDeath()
  }

  private checkCRUDCompletion(): void {
    if (this.crudCompleted) return

    const successfulMethods = new Set(
      this.completedRequests
        .filter(r => r.success)
        .map(r => r.method)
    )

    const requiredMethods: HTTPMethod[] = ['GET', 'POST', 'PUT', 'DELETE']
    const hasAllMethods = requiredMethods.every(m => successfulMethods.has(m))

    if (hasAllMethods) {
      this.crudCompleted = true
      EventBus.emit('crud:complete', {})
      this.emitScore(500, 'crud_complete')

      this.showEducationalPopup(
        'CRUD Mastery!',
        'You\'ve successfully performed all CRUD operations: Create, Read, Update, Delete!',
        'success'
      )
    }
  }

  private checkLayerCompletion(): void {
    // Need all methods, auth token, and successful CRUD
    const hasAllMethods = this.collectedMethods.length === 4
    const hasAuth = this.hasAuthToken
    const hasCRUD = this.crudCompleted

    if (hasAllMethods && hasAuth && hasCRUD) {
      this.completeLayer(this.score)
    }
  }

  private checkPlayerDeath(): void {
    if (this.health <= 0) {
      EventBus.emit('player:died')
    }
  }

  private resumeGame(): void {
    this.scene.resume()
  }

  protected showEducationalPopup(title: string, message: string, type: 'info' | 'warning' | 'success'): void {
    EventBus.emit('education:show', { title, message, type })
  }

  update(): void {
    if (!this.player || !this.cursors) return

    // Horizontal movement
    if (this.cursors.left?.isDown) {
      this.player.setVelocityX(-200)
    } else if (this.cursors.right?.isDown) {
      this.player.setVelocityX(200)
    } else {
      this.player.setVelocityX(0)
    }

    // Jumping
    const onGround = this.player.body?.blocked.down
    if ((this.cursors.up?.isDown || this.cursors.space?.isDown) && onGround) {
      this.player.setVelocityY(-400)
    }
  }

  shutdown(): void {
    EventBus.off('game:resume', this.resumeGame, this)
  }
}
