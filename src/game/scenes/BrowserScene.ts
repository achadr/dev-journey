import { BaseScene, type SceneData } from './BaseScene'
import { EventBus } from '../EventBus'

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'

interface Header {
  name: string
  value: string
}

interface Request {
  method: HttpMethod
  url: string
  headers: Header[]
  body: Record<string, unknown> | null
}

interface ChallengeConfig {
  expectedMethod?: HttpMethod
  expectedUrl?: string
  requiredHeaders?: string[]
  requiresBody?: boolean
}

interface BrowserSceneData extends SceneData {
  questId?: string
  layerId?: string
  challenge?: {
    type: string
    config: ChallengeConfig
  }
}

const METHOD_INFO: Record<HttpMethod, { title: string; description: string }> = {
  GET: {
    title: 'GET Method',
    description: 'Used to retrieve data from a server. GET requests should only retrieve data and have no other effect.',
  },
  POST: {
    title: 'POST Method',
    description: 'Used to create new resources on the server. POST requests typically include a request body with the data to create.',
  },
  PUT: {
    title: 'PUT Method',
    description: 'Used to update or replace an existing resource. PUT requests replace the entire resource with the provided data.',
  },
  DELETE: {
    title: 'DELETE Method',
    description: 'Used to remove a resource from the server. DELETE requests permanently delete the specified resource.',
  },
  PATCH: {
    title: 'PATCH Method',
    description: 'Used to partially update an existing resource. PATCH requests only modify the specified fields.',
  },
}

const HEADER_INFO: Record<string, { title: string; description: string }> = {
  'Content-Type': {
    title: 'Content-Type Header',
    description: 'Specifies the format of the request body data. Common values include application/json for JSON data.',
  },
  Accept: {
    title: 'Accept Header',
    description: 'Tells the server what content types the client can process in the response.',
  },
  Authorization: {
    title: 'Authorization Header',
    description: 'Contains credentials for authenticating the request. Often uses Bearer tokens for API authentication.',
  },
}

const STATUS_CODE_INFO: Record<number, { name: string; description: string; type: 'success' | 'warning' | 'error' }> = {
  200: {
    name: '200 OK',
    description: 'The request was successful. The server has returned the requested data.',
    type: 'success',
  },
  201: {
    name: '201 Created',
    description: 'The request was successful and a new resource was created on the server.',
    type: 'success',
  },
  400: {
    name: '400 Bad Request',
    description: 'The server could not understand the request due to invalid syntax or missing data.',
    type: 'warning',
  },
  401: {
    name: '401 Unauthorized',
    description: 'Authentication is required. The request lacks valid authentication credentials.',
    type: 'warning',
  },
  404: {
    name: '404 Not Found',
    description: 'The requested resource was not found on the server.',
    type: 'warning',
  },
  500: {
    name: '500 Internal Server Error',
    description: 'The server encountered an unexpected error while processing the request.',
    type: 'error',
  },
}

const HINTS = [
  'Start by selecting an HTTP method. What action do you want to perform?',
  'Enter the URL for your request. Where should this request be sent?',
  'Check if your request needs any headers. POST requests usually need Content-Type.',
  'For POST/PUT requests, you need to include a request body with your data.',
]

export class BrowserScene extends BaseScene {
  private selectedMethod: HttpMethod | null = null
  private selectedHeaders: Header[] = []
  private requestUrl: string = ''
  private requestBody: Record<string, unknown> | null = null
  private submissionCount: number = 0
  private hintsUsed: number = 0
  private score: number = 0
  private challengeConfig: ChallengeConfig | null = null

  constructor() {
    super({ key: 'BrowserLayer' })
  }

  init(data: BrowserSceneData): void {
    super.init(data as SceneData)

    // Reset state
    this.selectedMethod = null
    this.selectedHeaders = []
    this.requestUrl = ''
    this.requestBody = null
    this.submissionCount = 0
    this.hintsUsed = 0
    this.score = 0

    // Store challenge config if provided
    if (data.challenge?.config) {
      this.challengeConfig = data.challenge.config
    }
  }

  create(): void {
    super.create()
    this.createUI()
  }

  private createUI(): void {
    // Background
    this.cameras.main.setBackgroundColor('#1a1a2e')

    // Title
    this.add.text(this.cameras.main.centerX, 50, 'Browser Layer', {
      fontSize: '32px',
      color: '#22c55e',
    }).setOrigin(0.5)

    // Subtitle
    this.add.text(this.cameras.main.centerX, 90, 'Build your HTTP Request', {
      fontSize: '18px',
      color: '#94a3b8',
    }).setOrigin(0.5)

    this.createMethodSelector()
    this.createUrlInput()
    this.createHeadersSection()
    this.createBodySection()
    this.createSubmitButton()
  }

  private createMethodSelector(): void {
    const methods: HttpMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
    const startX = 200
    const y = 180

    this.add.text(startX - 100, y, 'Method:', {
      fontSize: '16px',
      color: '#e2e8f0',
    }).setOrigin(0, 0.5)

    methods.forEach((method, index) => {
      const button = this.add.text(startX + index * 100, y, method, {
        fontSize: '14px',
        color: '#64748b',
        backgroundColor: '#334155',
        padding: { x: 12, y: 8 },
      })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.selectMethod(method))
        .on('pointerover', () => button.setColor('#22c55e'))
        .on('pointerout', () => {
          if (this.selectedMethod !== method) {
            button.setColor('#64748b')
          }
        })
    })
  }

  private createUrlInput(): void {
    const y = 260

    this.add.text(100, y, 'URL:', {
      fontSize: '16px',
      color: '#e2e8f0',
    }).setOrigin(0, 0.5)

    // URL display (simulated input)
    this.add.rectangle(500, y, 600, 40, 0x334155)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.promptUrl())

    this.add.text(500, y, this.requestUrl || 'Click to enter URL...', {
      fontSize: '14px',
      color: this.requestUrl ? '#e2e8f0' : '#64748b',
    }).setOrigin(0.5)
  }

  private createHeadersSection(): void {
    const y = 340

    this.add.text(100, y, 'Headers:', {
      fontSize: '16px',
      color: '#e2e8f0',
    }).setOrigin(0, 0.5)

    const commonHeaders = ['Content-Type', 'Accept', 'Authorization']
    commonHeaders.forEach((header, index) => {
      const button = this.add.text(250 + index * 150, y, header, {
        fontSize: '12px',
        color: '#64748b',
        backgroundColor: '#334155',
        padding: { x: 8, y: 6 },
      })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.addHeader(header, 'application/json'))
    })
  }

  private createBodySection(): void {
    const y = 420

    this.add.text(100, y, 'Body:', {
      fontSize: '16px',
      color: '#e2e8f0',
    }).setOrigin(0, 0.5)

    this.add.rectangle(500, y + 50, 600, 100, 0x334155)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.promptBody())
  }

  private createSubmitButton(): void {
    const button = this.add.text(this.cameras.main.centerX, 600, 'Send Request', {
      fontSize: '18px',
      color: '#ffffff',
      backgroundColor: '#22c55e',
      padding: { x: 24, y: 12 },
    })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.submitRequest())
      .on('pointerover', () => button.setStyle({ backgroundColor: '#16a34a' }))
      .on('pointerout', () => button.setStyle({ backgroundColor: '#22c55e' }))
  }

  private promptUrl(): void {
    // In a real implementation, this would show a proper input dialog
    // For now, we'll use a simple simulated URL
    const urls = ['/api/users', '/api/posts', '/api/comments']
    const randomUrl = urls[Math.floor(Math.random() * urls.length)]
    this.setRequestUrl(randomUrl)
  }

  private promptBody(): void {
    // Simulated body input
    this.setRequestBody({ name: 'John', email: 'john@example.com' })
  }

  // Public methods for testing and interaction

  protected selectMethod(method: HttpMethod): void {
    this.selectedMethod = method
    EventBus.emit('method:selected', { method })
    this.emitScore(50, 'method_selected')

    const info = METHOD_INFO[method]
    this.showEducationalPopup(info.title, info.description, 'info')
  }

  protected setRequestUrl(url: string): void {
    this.requestUrl = url
    EventBus.emit('url:set', { url })
  }

  protected isValidUrl(): boolean {
    return this.requestUrl.length > 0
  }

  protected addHeader(name: string, value: string): void {
    // Check if header already exists
    const existingIndex = this.selectedHeaders.findIndex(h => h.name === name)

    if (existingIndex >= 0) {
      // Update existing header
      this.selectedHeaders[existingIndex].value = value
    } else {
      // Add new header
      this.selectedHeaders.push({ name, value })
      this.emitScore(25, 'header_added')
    }

    EventBus.emit('header:added', { header: name, value })

    const info = HEADER_INFO[name]
    if (info) {
      this.showEducationalPopup(info.title, info.description, 'info')
    }
  }

  protected removeHeader(name: string): void {
    this.selectedHeaders = this.selectedHeaders.filter(h => h.name !== name)
    EventBus.emit('header:removed', { header: name })
  }

  protected setRequestBody(body: Record<string, unknown>): void {
    this.requestBody = body
    EventBus.emit('body:set', { body })
  }

  protected clearRequestBody(): void {
    this.requestBody = null
    EventBus.emit('body:cleared', {})
  }

  protected isValidBody(): boolean {
    return this.requestBody !== null && typeof this.requestBody === 'object'
  }

  protected buildRequest(): Request {
    const request: Request = {
      method: this.selectedMethod!,
      url: this.requestUrl,
      headers: [...this.selectedHeaders],
      body: this.requestBody,
    }

    EventBus.emit('request:built', request)
    return request
  }

  protected isRequestValid(): boolean {
    // Must have a method
    if (!this.selectedMethod) return false

    // Must have a URL
    if (!this.requestUrl) return false

    // POST, PUT, PATCH require a body
    if (['POST', 'PUT', 'PATCH'].includes(this.selectedMethod) && !this.requestBody) {
      return false
    }

    return true
  }

  protected submitRequest(): void {
    this.submissionCount++

    if (!this.isRequestValid()) {
      let reason = 'Invalid request'
      if (!this.selectedMethod) reason = 'Please select an HTTP method'
      else if (!this.requestUrl) reason = 'Please enter a URL'
      else if (['POST', 'PUT', 'PATCH'].includes(this.selectedMethod!) && !this.requestBody) {
        reason = 'POST/PUT/PATCH requests require a body'
      }

      EventBus.emit('request:invalid', { reason })
      EventBus.emit('hint:shown', { hint: reason })
      return
    }

    const request = this.buildRequest()

    // Check if challenge is complete
    if (this.challengeConfig && this.isChallengeComplete()) {
      // Calculate score with hint penalty
      const baseScore = 100
      const hintPenalty = this.hintsUsed * 15
      const finalScore = Math.max(baseScore - hintPenalty, 50)

      this.emitScore(finalScore, 'correct_request')

      const statusCode = this.selectedMethod === 'POST' ? 201 : 200
      this.explainStatusCode(statusCode)

      EventBus.emit('request:success', {
        endpoint: request.url,
        method: request.method,
        statusCode,
      })

      // Complete the layer
      this.completeLayer(this.score + finalScore)
    } else if (!this.challengeConfig) {
      // No challenge config, just show success
      const statusCode = this.selectedMethod === 'POST' ? 201 : 200
      this.emitScore(100, 'correct_request')
      this.explainStatusCode(statusCode)

      EventBus.emit('request:success', {
        endpoint: request.url,
        method: request.method,
        statusCode,
      })

      this.completeLayer(this.score + 100)
    } else {
      // Challenge not complete, provide feedback
      this.provideFeedback()
    }
  }

  // Challenge validation methods

  protected isMethodCorrect(): boolean {
    if (!this.challengeConfig?.expectedMethod) return true
    return this.selectedMethod === this.challengeConfig.expectedMethod
  }

  protected isUrlCorrect(): boolean {
    if (!this.challengeConfig?.expectedUrl) return true
    return this.requestUrl === this.challengeConfig.expectedUrl
  }

  protected hasRequiredHeaders(): boolean {
    if (!this.challengeConfig?.requiredHeaders?.length) return true
    return this.challengeConfig.requiredHeaders.every(required =>
      this.selectedHeaders.some(h => h.name === required)
    )
  }

  protected isChallengeComplete(): boolean {
    return this.isMethodCorrect() && this.isUrlCorrect() && this.hasRequiredHeaders()
  }

  private provideFeedback(): void {
    if (!this.isMethodCorrect()) {
      this.showEducationalPopup(
        'Wrong Method',
        `Expected ${this.challengeConfig?.expectedMethod} method`,
        'warning'
      )
    } else if (!this.isUrlCorrect()) {
      this.showEducationalPopup(
        'Wrong URL',
        `Expected URL: ${this.challengeConfig?.expectedUrl}`,
        'warning'
      )
    } else if (!this.hasRequiredHeaders()) {
      this.showEducationalPopup(
        'Missing Headers',
        `Required headers: ${this.challengeConfig?.requiredHeaders?.join(', ')}`,
        'warning'
      )
    }
  }

  // Hint system

  protected showHint(hintIndex: number): void {
    this.hintsUsed++
    const hint = HINTS[hintIndex] || HINTS[0]

    this.showEducationalPopup('Hint', hint, 'info')
    EventBus.emit('hint:shown', { hint })
  }

  // Educational content

  protected explainStatusCode(code: number): void {
    const info = STATUS_CODE_INFO[code]
    if (info) {
      this.showEducationalPopup(info.name, info.description, info.type)
    }
  }

  protected showEducationalPopup(
    title: string,
    message: string,
    type: 'info' | 'success' | 'warning' | 'error'
  ): void {
    EventBus.emit('education:show', { title, message, type })
  }

  // Reset functionality

  protected resetRequest(): void {
    this.selectedMethod = null
    this.requestUrl = ''
    this.selectedHeaders = []
    this.requestBody = null

    EventBus.emit('request:reset', {})
  }
}
