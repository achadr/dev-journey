import Phaser from 'phaser'
import { BaseScene, SceneData } from './BaseScene'
import { EventBus } from '../EventBus'
import { GAME_HEIGHT } from '../config'
import {
  generateLevel,
  GeneratedLevel,
  SimpleLevelConfig,
  CollectibleTheme,
} from '../utils/levelGenerator'

// Simple config from database (seed.ts format)
interface PlatformerConfig extends SimpleLevelConfig {
  // All fields inherited from SimpleLevelConfig
}

// Educational explanations for obstacles
const OBSTACLE_EXPLANATIONS: Record<string, { title: string; message: string }> = {
  firewall: {
    title: '🔥 Firewall Blocked!',
    message: 'Firewalls filter network traffic. Packets without proper authorization are rejected.',
  },
  packet_loss: {
    title: '📦 Packet Lost!',
    message: 'Networks can lose data in transit due to congestion or errors. Lost packets must be retransmitted.',
  },
  timeout: {
    title: '⏱️ Connection Timeout!',
    message: 'The server took too long to respond. Network latency can cause timeouts.',
  },
  latency: {
    title: '🐌 High Latency!',
    message: 'Network delay slows down communication. Data takes time to travel between servers.',
  },
  'latency-cloud': {
    title: '☁️ Network Congestion!',
    message: 'Too many requests at once can slow down the network.',
  },
  'rate-limit': {
    title: '🚫 Rate Limited!',
    message: 'APIs limit how many requests you can make per second to prevent abuse.',
  },
  'mitm-attack': {
    title: '🕵️ Man-in-the-Middle!',
    message: 'An attacker can intercept unencrypted traffic. Always use HTTPS!',
  },
}

// Educational messages for each collectible type
const COLLECTIBLE_MESSAGES: Record<string, { title: string; message: string }> = {
  // TCP theme
  'SYN': {
    title: '✅ SYN Received!',
    message: 'Client sends SYN to initiate connection. "Hey server, let\'s connect!"',
  },
  'SYN-ACK': {
    title: '✅ SYN-ACK Received!',
    message: 'Server acknowledges with SYN-ACK. "Got it! I\'m ready too!"',
  },
  'ACK': {
    title: '✅ ACK Received!',
    message: 'Client confirms with ACK. Connection established! "Great, let\'s talk!"',
  },
  // HTTP theme
  'REQUEST': {
    title: '📤 Request Sent!',
    message: 'HTTP requests contain method, URL, headers, and optional body.',
  },
  'RESPONSE': {
    title: '📥 Response Received!',
    message: 'Server responds with status code, headers, and response body.',
  },
  'DATA': {
    title: '📦 Data Transferred!',
    message: 'The actual content (HTML, JSON, images) travels in the response body.',
  },
  // Auth theme
  'CREDENTIALS': {
    title: '🔑 Credentials Collected!',
    message: 'Username and password are sent to authenticate the user.',
  },
  'TOKEN': {
    title: '🎫 Token Acquired!',
    message: 'Auth tokens prove identity without sending passwords repeatedly.',
  },
  'SESSION': {
    title: '💾 Session Created!',
    message: 'Sessions track authenticated users across multiple requests.',
  },
  // API theme
  'ENDPOINT': {
    title: '🎯 Endpoint Found!',
    message: 'API endpoints are URLs that accept specific HTTP methods.',
  },
  'METHOD': {
    title: '📋 Method Selected!',
    message: 'HTTP methods (GET, POST, PUT, DELETE) define the action type.',
  },
  'STATUS': {
    title: '📊 Status Received!',
    message: 'Status codes (200, 404, 500) indicate success or failure.',
  },
}

// Color schemes for different themes
const THEME_COLORS: Record<CollectibleTheme, number[]> = {
  tcp: [0x44aaff, 0xaa44ff, 0x44ffaa],
  http: [0xff8844, 0x44ff88, 0x4488ff],
  auth: [0xffaa00, 0x00ffaa, 0xaa00ff],
  api: [0xff4488, 0x88ff44, 0x4488ff],
  none: [],
}

export class NetworkScene extends BaseScene {
  private player!: Phaser.Physics.Arcade.Sprite
  private platforms!: Phaser.Physics.Arcade.StaticGroup
  private obstacles!: Phaser.Physics.Arcade.Group
  private collectiblesGroup!: Phaser.Physics.Arcade.Group
  private gatesGroup!: Phaser.Physics.Arcade.StaticGroup
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private levelLength: number = 3000
  private score: number = 0

  // Generated level data
  private generatedLevel!: GeneratedLevel

  // Collection state
  private collectedIds: string[] = []

  private readonly PLAYER_SPEED = 350
  private readonly JUMP_VELOCITY = -650
  private readonly GRAVITY = 900
  private readonly OBSTACLE_DAMAGE = 20
  private readonly COLLECTIBLE_SCORE = 150
  private readonly COMPLETION_BONUS = 500

  constructor() {
    super('NetworkScene')
  }

  init(data: SceneData): void {
    super.init(data)
    this.score = 0
    this.collectedIds = []

    const config = this.layerConfig.challenge?.config as PlatformerConfig | undefined

    // Generate level from config
    this.generatedLevel = generateLevel({
      obstacles: config?.obstacles,
      speed: config?.speed,
      obstacleTypes: config?.obstacleTypes,
      levelLength: config?.levelLength,
      theme: config?.theme,
    })

    this.levelLength = this.generatedLevel.levelLength
  }

  create(): void {
    super.create()

    this.physics.world.setBounds(0, 0, this.levelLength, GAME_HEIGHT)
    this.createBackground()
    this.createPlatforms()
    this.createPlayer()
    this.createObstacles()
    this.createCollectibles()
    this.createGates()
    this.setupCollisions()
    this.setupCamera()
    this.cursors = this.input.keyboard!.createCursorKeys()

    // Emit theme info to HUD after scene is fully created
    this.time.delayedCall(100, () => {
      EventBus.emit('theme:init', {
        theme: this.generatedLevel.theme,
        themeConfig: this.generatedLevel.themeConfig,
        collectibles: this.generatedLevel.collectibles.map(c => ({
          id: c.id,
          label: c.label,
          order: c.order,
        })),
      })
    })
  }

  update(): void {
    if (!this.player || !this.cursors) return

    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-this.PLAYER_SPEED)
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(this.PLAYER_SPEED)
    } else {
      this.player.setVelocityX(0)
    }

    const onGround = this.player.body?.blocked.down
    if ((this.cursors.up.isDown || this.cursors.space?.isDown) && onGround) {
      this.player.setVelocityY(this.JUMP_VELOCITY)
    }

    this.checkLevelCompletion()
  }

  private createBackground(): void {
    const bgColor = 0x1a1a2e
    this.cameras.main.setBackgroundColor(bgColor)

    const graphics = this.add.graphics()
    graphics.fillStyle(0x2d2d44, 0.3)

    for (let x = 0; x < this.levelLength; x += 100) {
      graphics.fillRect(x, 0, 2, GAME_HEIGHT)
    }
    for (let y = 0; y < GAME_HEIGHT; y += 100) {
      graphics.fillRect(0, y, this.levelLength, 2)
    }
  }

  private createPlatforms(): void {
    this.platforms = this.physics.add.staticGroup()

    this.generatedLevel.platforms.forEach((p) => {
      const platform = this.platforms.create(p.x, p.y, undefined) as Phaser.Physics.Arcade.Sprite
      platform.setOrigin(0, 0)
      platform.displayWidth = p.width
      platform.displayHeight = p.height || 32
      platform.refreshBody()

      // Visual rectangle
      const rect = this.add.rectangle(p.x, p.y, p.width, p.height || 32, 0x4a4a6a)
      rect.setOrigin(0, 0)
    })
  }

  private createPlayer(): void {
    this.player = this.physics.add.sprite(100, GAME_HEIGHT - 100, 'player')

    if (!this.textures.exists('player')) {
      const graphics = this.add.graphics()
      graphics.fillStyle(0x00ff88, 1)
      graphics.fillRect(0, 0, 32, 48)
      graphics.generateTexture('player', 32, 48)
      graphics.destroy()
      this.player.setTexture('player')
    }

    this.player.setCollideWorldBounds(true)
    this.player.setBounce(0.1)
    this.player.setGravityY(this.GRAVITY)
  }

  private createObstacles(): void {
    this.obstacles = this.physics.add.group()

    this.generatedLevel.obstacles.forEach((o) => {
      const obstacle = this.obstacles.create(o.x, o.y, undefined) as Phaser.Physics.Arcade.Sprite
      obstacle.setData('type', o.type)

      const color = this.getObstacleColor(o.type)
      const graphics = this.add.graphics()
      graphics.fillStyle(color, 1)
      graphics.fillRect(o.x - 20, o.y - 20, 40, 40)

      const label = this.add.text(o.x, o.y - 35, this.getObstacleLabel(o.type), {
        fontSize: '12px',
        color: '#ffffff',
        backgroundColor: '#00000088',
        padding: { x: 4, y: 2 },
      })
      label.setOrigin(0.5, 0.5)
    })
  }

  private getObstacleColor(type: string): number {
    const colors: Record<string, number> = {
      firewall: 0xff4444,
      packet_loss: 0xff8844,
      timeout: 0xffaa44,
      latency: 0xffff44,
      'latency-cloud': 0xaaaaff,
      'rate-limit': 0xff44aa,
      'mitm-attack': 0xff0000,
    }
    return colors[type] || 0xff0000
  }

  private getObstacleLabel(type: string): string {
    const labels: Record<string, string> = {
      firewall: '🔥 Firewall',
      packet_loss: '📦 Loss',
      timeout: '⏱️ Timeout',
      latency: '🐌 Latency',
      'latency-cloud': '☁️ Congestion',
      'rate-limit': '🚫 Rate Limit',
      'mitm-attack': '🕵️ MITM',
    }
    return labels[type] || type
  }

  private createCollectibles(): void {
    this.collectiblesGroup = this.physics.add.group()

    const theme = this.generatedLevel.theme
    const colors = THEME_COLORS[theme]

    this.generatedLevel.collectibles.forEach((c, index) => {
      const collectible = this.collectiblesGroup.create(c.x, c.y, undefined) as Phaser.Physics.Arcade.Sprite
      collectible.setData('id', c.id)
      collectible.setData('label', c.label)
      collectible.setData('order', c.order)

      // Visual - colored circle with label (same pattern as old handshake tokens)
      const color = colors[index % colors.length] || 0x44aaff
      const graphics = this.add.graphics()
      graphics.fillStyle(color, 1)
      graphics.fillCircle(c.x, c.y, 18)
      graphics.lineStyle(3, 0xffffff, 1)
      graphics.strokeCircle(c.x, c.y, 18)

      // Shorter label for display
      const displayLabel = c.label.length > 8 ? c.label.slice(0, 6) + '..' : c.label
      const label = this.add.text(c.x, c.y, displayLabel, {
        fontSize: '9px',
        color: '#000000',
        fontStyle: 'bold',
      })
      label.setOrigin(0.5, 0.5)

      collectible.setData('graphics', graphics)
      collectible.setData('labelText', label)
    })
  }

  private createGates(): void {
    this.gatesGroup = this.physics.add.staticGroup()

    this.generatedLevel.gates.forEach((g) => {
      const gate = this.gatesGroup.create(g.x, g.y, undefined) as Phaser.Physics.Arcade.Sprite
      gate.setData('requiresId', g.requiresId)
      gate.setData('open', false)
      gate.displayWidth = 20
      gate.displayHeight = 150
      gate.refreshBody()

      // Visual - gate barrier (same pattern as old handshake gates)
      const graphics = this.add.graphics()
      graphics.fillStyle(0x884444, 1)
      graphics.fillRect(g.x - 10, g.y - 75, 20, 150)

      const label = this.add.text(g.x, g.y - 90, g.label, {
        fontSize: '12px',
        color: '#ffaaaa',
        backgroundColor: '#00000088',
        padding: { x: 4, y: 2 },
      })
      label.setOrigin(0.5, 0.5)

      gate.setData('graphics', graphics)
      gate.setData('label', label)
    })
  }

  private setupCollisions(): void {
    this.physics.add.collider(this.player, this.platforms)

    // Obstacle collision
    this.physics.add.overlap(
      this.player,
      this.obstacles,
      (_, obstacle) => this.hitObstacle(obstacle as Phaser.Physics.Arcade.Sprite),
      undefined,
      this
    )

    // Collectible collection
    this.physics.add.overlap(
      this.player,
      this.collectiblesGroup,
      (_, collectible) => this.collectItem(collectible as Phaser.Physics.Arcade.Sprite),
      undefined,
      this
    )

    // Gate collision
    this.physics.add.collider(
      this.player,
      this.gatesGroup,
      (_, gate) => this.hitGate(gate as Phaser.Physics.Arcade.Sprite),
      (_, gate) => !((gate as Phaser.Physics.Arcade.Sprite).getData('open')),
      this
    )
  }

  private setupCamera(): void {
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1)
    this.cameras.main.setBounds(0, 0, this.levelLength, GAME_HEIGHT)
  }

  private hitObstacle(obstacle: Phaser.Physics.Arcade.Sprite): void {
    const type = obstacle.getData('type') || 'unknown'
    const explanation = OBSTACLE_EXPLANATIONS[type]

    this.emitDamage(this.OBSTACLE_DAMAGE, type)

    if (explanation) {
      EventBus.emit('education:show', {
        title: explanation.title,
        message: explanation.message,
        type: 'warning',
      })
    }

    this.cameras.main.shake(100, 0.01)

    obstacle.setActive(false)
    obstacle.setVisible(false)

    this.time.addEvent({
      delay: 2000,
      callback: () => {
        obstacle.setActive(true)
        obstacle.setVisible(true)
      },
    })
  }

  private collectItem(collectibleSprite: Phaser.Physics.Arcade.Sprite): void {
    const id = collectibleSprite.getData('id') as string
    const label = collectibleSprite.getData('label') as string
    const order = collectibleSprite.getData('order') as number

    // Hide visual elements
    const graphics = collectibleSprite.getData('graphics') as Phaser.GameObjects.Graphics
    const labelText = collectibleSprite.getData('labelText') as Phaser.GameObjects.Text
    if (graphics) graphics.destroy()
    if (labelText) labelText.destroy()
    collectibleSprite.destroy()

    // Check if collecting in correct order
    const expectedOrder = this.collectedIds.length
    const inOrder = order === expectedOrder

    this.collectedIds.push(id)
    this.score += this.COLLECTIBLE_SCORE
    this.emitScore(this.COLLECTIBLE_SCORE, `${label} collected`)

    // Emit collection event
    EventBus.emit('collectible:collected', {
      id,
      label,
      order,
      inOrder,
      collected: [...this.collectedIds],
      theme: this.generatedLevel.theme,
    })

    // Show educational message
    const message = COLLECTIBLE_MESSAGES[id]
    if (message) {
      EventBus.emit('education:show', {
        title: message.title,
        message: message.message,
        type: inOrder ? 'success' : 'warning',
      })
    }

    // Open corresponding gate
    this.openGate(id)

    // Check if all collected
    const totalCollectibles = this.generatedLevel.collectibles.length
    if (this.collectedIds.length === totalCollectibles && totalCollectibles > 0) {
      const allInOrder = this.generatedLevel.collectibles.every(
        (c, i) => this.collectedIds[i] === c.id
      )
      if (allInOrder) {
        this.score += this.COMPLETION_BONUS
        this.emitScore(this.COMPLETION_BONUS, `${this.generatedLevel.themeConfig.name} Complete!`)
      }
      EventBus.emit('collectibles:complete', {
        theme: this.generatedLevel.theme,
        bonus: allInOrder,
      })
    }

    this.cameras.main.flash(100, 0, 255, 255, false)
  }

  private openGate(collectibleId: string): void {
    this.gatesGroup.getChildren().forEach((child) => {
      const gate = child as Phaser.Physics.Arcade.Sprite
      if (gate.getData('requiresId') === collectibleId) {
        gate.setData('open', true)
        const graphics = gate.getData('graphics') as Phaser.GameObjects.Graphics
        const label = gate.getData('label') as Phaser.GameObjects.Text
        if (graphics) graphics.setVisible(false)
        if (label) label.setText(`✅ Unlocked`)
      }
    })
  }

  private hitGate(gate: Phaser.Physics.Arcade.Sprite): void {
    const requiresId = gate.getData('requiresId') as string
    const collectible = this.generatedLevel.collectibles.find(c => c.id === requiresId)
    const label = collectible?.label || requiresId

    EventBus.emit('education:show', {
      title: '🚧 Gate Locked!',
      message: `This gate requires "${label}". Find and collect it first!`,
      type: 'info',
    })
  }

  private checkLevelCompletion(): void {
    if (this.player.x >= this.levelLength - 100) {
      this.completeLayer(this.score)
    }
  }
}
