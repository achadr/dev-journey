import Phaser from 'phaser'
import { BaseScene, SceneData } from './BaseScene'
import { EventBus, HandshakeToken, PacketPart } from '../EventBus'
import { GAME_WIDTH, GAME_HEIGHT } from '../config'

interface PlatformConfig {
  x: number
  y: number
  width: number
  height?: number
}

interface ObstacleConfig {
  x: number
  y: number
  type: string
}

interface HandshakeTokenConfig {
  x: number
  y: number
  token: HandshakeToken
}

interface HandshakeGateConfig {
  x: number
  y: number
  requires: HandshakeToken
}

interface PacketPartConfig {
  x: number
  y: number
  part: PacketPart
}

interface PlatformerConfig {
  levelLength?: number
  platforms?: PlatformConfig[]
  obstacles?: ObstacleConfig[]
  handshakeTokens?: HandshakeTokenConfig[]
  handshakeGates?: HandshakeGateConfig[]
  packetParts?: PacketPartConfig[]
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
}

export class NetworkScene extends BaseScene {
  private player!: Phaser.Physics.Arcade.Sprite
  private platforms!: Phaser.Physics.Arcade.StaticGroup
  private obstacles!: Phaser.Physics.Arcade.Group
  private handshakeTokens!: Phaser.Physics.Arcade.Group
  private handshakeGates!: Phaser.Physics.Arcade.StaticGroup
  private packetParts!: Phaser.Physics.Arcade.Group
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private levelLength: number = 3000
  private score: number = 0

  // Educational state
  private collectedHandshake: HandshakeToken[] = []
  private collectedPacketParts: PacketPart[] = []
  private readonly CORRECT_HANDSHAKE_ORDER: HandshakeToken[] = ['SYN', 'SYN-ACK', 'ACK']
  private readonly CORRECT_PACKET_ORDER: PacketPart[] = ['header', 'payload', 'checksum']

  private readonly PLAYER_SPEED = 350
  private readonly JUMP_VELOCITY = -650
  private readonly GRAVITY = 900
  private readonly OBSTACLE_DAMAGE = 20
  private readonly TOKEN_SCORE = 150
  private readonly PACKET_PART_SCORE = 100
  private readonly HANDSHAKE_BONUS = 500
  private readonly PACKET_ASSEMBLY_BONUS = 300

  constructor() {
    super('NetworkScene')
  }

  init(data: SceneData): void {
    super.init(data)
    this.score = 0
    this.collectedHandshake = []
    this.collectedPacketParts = []

    const config = this.layerConfig.challenge?.config as PlatformerConfig | undefined
    if (config?.levelLength) {
      this.levelLength = config.levelLength
    }
  }

  create(): void {
    super.create()

    this.physics.world.setBounds(0, 0, this.levelLength, GAME_HEIGHT)
    this.createBackground()
    this.createPlatforms()
    this.createPlayer()
    this.createObstacles()
    this.createHandshakeTokens()
    this.createHandshakeGates()
    this.createPacketParts()
    this.setupCollisions()
    this.setupCamera()
    this.cursors = this.input.keyboard!.createCursorKeys()
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

    const config = this.layerConfig.challenge?.config as PlatformerConfig | undefined
    const platformConfigs = Array.isArray(config?.platforms) ? config.platforms : this.getDefaultPlatforms()

    platformConfigs.forEach((p) => {
      const platform = this.platforms.create(p.x, p.y, undefined) as Phaser.Physics.Arcade.Sprite
      platform.setOrigin(0, 0)
      platform.displayWidth = p.width
      platform.displayHeight = p.height || 32
      platform.refreshBody()

      const rect = this.add.rectangle(p.x, p.y, p.width, p.height || 32, 0x4a4a6a)
      rect.setOrigin(0, 0)
    })
  }

  private getDefaultPlatforms(): PlatformConfig[] {
    return [
      // Ground sections with gaps - shorter gaps between platforms
      { x: 0, y: GAME_HEIGHT - 32, width: 700 },
      { x: 800, y: GAME_HEIGHT - 32, width: 600 },
      { x: 1500, y: GAME_HEIGHT - 32, width: 600 },
      { x: 2200, y: GAME_HEIGHT - 32, width: 800 },
      // Floating platforms - more reachable heights (max 150px between platforms)
      { x: 200, y: 550, width: 180 },
      { x: 450, y: 480, width: 180 },
      { x: 750, y: 550, width: 180 },
      { x: 1000, y: 480, width: 180 },
      { x: 1250, y: 550, width: 180 },
      { x: 1550, y: 480, width: 180 },
      { x: 1850, y: 550, width: 180 },
      { x: 2100, y: 480, width: 180 },
      { x: 2400, y: 550, width: 180 },
      { x: 2700, y: 480, width: 180 },
    ]
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

    const config = this.layerConfig.challenge?.config as PlatformerConfig | undefined
    const obstacleConfigs = Array.isArray(config?.obstacles) ? config.obstacles : this.getDefaultObstacles()

    obstacleConfigs.forEach((o) => {
      const obstacle = this.obstacles.create(o.x, o.y, undefined) as Phaser.Physics.Arcade.Sprite
      obstacle.setData('type', o.type)

      const color = this.getObstacleColor(o.type)
      const graphics = this.add.graphics()
      graphics.fillStyle(color, 1)
      graphics.fillRect(o.x - 20, o.y - 20, 40, 40)

      // Add label
      const label = this.add.text(o.x, o.y - 35, this.getObstacleLabel(o.type), {
        fontSize: '12px',
        color: '#ffffff',
        backgroundColor: '#00000088',
        padding: { x: 4, y: 2 },
      })
      label.setOrigin(0.5, 0.5)
    })
  }

  private getDefaultObstacles(): ObstacleConfig[] {
    return [
      { x: 450, y: GAME_HEIGHT - 64, type: 'firewall' },
      { x: 1000, y: 448, type: 'packet_loss' },
      { x: 1600, y: GAME_HEIGHT - 64, type: 'timeout' },
      { x: 2200, y: 418, type: 'latency' },
      { x: 2800, y: GAME_HEIGHT - 64, type: 'firewall' },
    ]
  }

  private getObstacleColor(type: string): number {
    const colors: Record<string, number> = {
      firewall: 0xff4444,
      packet_loss: 0xff8844,
      timeout: 0xffaa44,
      latency: 0xffff44,
    }
    return colors[type] || 0xff0000
  }

  private getObstacleLabel(type: string): string {
    const labels: Record<string, string> = {
      firewall: '🔥 Firewall',
      packet_loss: '📦 Loss',
      timeout: '⏱️ Timeout',
      latency: '🐌 Latency',
    }
    return labels[type] || type
  }

  private createHandshakeTokens(): void {
    this.handshakeTokens = this.physics.add.group()

    const config = this.layerConfig.challenge?.config as PlatformerConfig | undefined
    const tokenConfigs = Array.isArray(config?.handshakeTokens) ? config.handshakeTokens : this.getDefaultHandshakeTokens()

    tokenConfigs.forEach((t) => {
      const token = this.handshakeTokens.create(t.x, t.y, undefined) as Phaser.Physics.Arcade.Sprite
      token.setData('token', t.token)

      // Visual - colored circle with label
      const color = this.getHandshakeColor(t.token)
      const graphics = this.add.graphics()
      graphics.fillStyle(color, 1)
      graphics.fillCircle(t.x, t.y, 18)
      graphics.lineStyle(3, 0xffffff, 1)
      graphics.strokeCircle(t.x, t.y, 18)

      const label = this.add.text(t.x, t.y, t.token, {
        fontSize: '10px',
        color: '#000000',
        fontStyle: 'bold',
      })
      label.setOrigin(0.5, 0.5)
    })
  }

  private getDefaultHandshakeTokens(): HandshakeTokenConfig[] {
    return [
      { x: 300, y: 480, token: 'SYN' },
      { x: 1200, y: 340, token: 'SYN-ACK' },
      { x: 2200, y: 340, token: 'ACK' },
    ]
  }

  private getHandshakeColor(token: HandshakeToken): number {
    const colors: Record<HandshakeToken, number> = {
      'SYN': 0x44aaff,
      'SYN-ACK': 0xaa44ff,
      'ACK': 0x44ffaa,
    }
    return colors[token]
  }

  private createHandshakeGates(): void {
    this.handshakeGates = this.physics.add.staticGroup()

    const config = this.layerConfig.challenge?.config as PlatformerConfig | undefined
    const gateConfigs = Array.isArray(config?.handshakeGates) ? config.handshakeGates : this.getDefaultHandshakeGates()

    gateConfigs.forEach((g) => {
      const gate = this.handshakeGates.create(g.x, g.y, undefined) as Phaser.Physics.Arcade.Sprite
      gate.setData('requires', g.requires)
      gate.setData('open', false)
      gate.displayWidth = 20
      gate.displayHeight = 150
      gate.refreshBody()

      // Visual - gate barrier
      const graphics = this.add.graphics()
      graphics.fillStyle(0x884444, 1)
      graphics.fillRect(g.x - 10, g.y - 75, 20, 150)

      const label = this.add.text(g.x, g.y - 90, `Requires: ${g.requires}`, {
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

  private getDefaultHandshakeGates(): HandshakeGateConfig[] {
    return [
      { x: 650, y: GAME_HEIGHT - 107, requires: 'SYN' },
      { x: 1650, y: GAME_HEIGHT - 107, requires: 'SYN-ACK' },
      { x: 2650, y: GAME_HEIGHT - 107, requires: 'ACK' },
    ]
  }

  private createPacketParts(): void {
    this.packetParts = this.physics.add.group()

    const config = this.layerConfig.challenge?.config as PlatformerConfig | undefined
    const partConfigs = Array.isArray(config?.packetParts) ? config.packetParts : this.getDefaultPacketParts()

    partConfigs.forEach((p) => {
      const part = this.packetParts.create(p.x, p.y, undefined) as Phaser.Physics.Arcade.Sprite
      part.setData('part', p.part)

      // Visual - packet piece
      const color = this.getPacketPartColor(p.part)
      const graphics = this.add.graphics()
      graphics.fillStyle(color, 1)
      graphics.fillRoundedRect(p.x - 15, p.y - 10, 30, 20, 5)

      const label = this.add.text(p.x, p.y, this.getPacketPartLabel(p.part), {
        fontSize: '9px',
        color: '#000000',
        fontStyle: 'bold',
      })
      label.setOrigin(0.5, 0.5)
    })
  }

  private getDefaultPacketParts(): PacketPartConfig[] {
    return [
      { x: 400, y: 380, part: 'header' },
      { x: 1400, y: 410, part: 'payload' },
      { x: 2500, y: 340, part: 'checksum' },
    ]
  }

  private getPacketPartColor(part: PacketPart): number {
    const colors: Record<PacketPart, number> = {
      header: 0x66ff66,
      payload: 0x6666ff,
      checksum: 0xff66ff,
    }
    return colors[part]
  }

  private getPacketPartLabel(part: PacketPart): string {
    const labels: Record<PacketPart, string> = {
      header: 'HDR',
      payload: 'DATA',
      checksum: 'CHK',
    }
    return labels[part]
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

    // Handshake token collection
    this.physics.add.overlap(
      this.player,
      this.handshakeTokens,
      (_, token) => this.collectHandshakeToken(token as Phaser.Physics.Arcade.Sprite),
      undefined,
      this
    )

    // Gate collision
    this.physics.add.collider(
      this.player,
      this.handshakeGates,
      (_, gate) => this.hitGate(gate as Phaser.Physics.Arcade.Sprite),
      (_, gate) => !((gate as Phaser.Physics.Arcade.Sprite).getData('open')),
      this
    )

    // Packet part collection
    this.physics.add.overlap(
      this.player,
      this.packetParts,
      (_, part) => this.collectPacketPart(part as Phaser.Physics.Arcade.Sprite),
      undefined,
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

    // Emit damage with explanation
    this.emitDamage(this.OBSTACLE_DAMAGE, type)

    // Show educational message
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

  private collectHandshakeToken(tokenSprite: Phaser.Physics.Arcade.Sprite): void {
    const token = tokenSprite.getData('token') as HandshakeToken
    tokenSprite.destroy()

    // Check if collecting in correct order
    const expectedIndex = this.collectedHandshake.length
    const expectedToken = this.CORRECT_HANDSHAKE_ORDER[expectedIndex]

    if (token === expectedToken) {
      this.collectedHandshake.push(token)
      this.score += this.TOKEN_SCORE
      this.emitScore(this.TOKEN_SCORE, `${token} collected`)

      EventBus.emit('handshake:collected', {
        token,
        collected: [...this.collectedHandshake],
      })

      // Show success message
      EventBus.emit('education:show', {
        title: `✅ ${token} Received!`,
        message: this.getHandshakeMessage(token),
        type: 'success',
      })

      // Open corresponding gate
      this.openGate(token)

      // Check if handshake complete
      if (this.collectedHandshake.length === 3) {
        this.score += this.HANDSHAKE_BONUS
        this.emitScore(this.HANDSHAKE_BONUS, 'TCP Handshake Complete!')
        EventBus.emit('handshake:complete')
      }
    } else {
      // Wrong order - penalty but still collect
      this.collectedHandshake.push(token)
      EventBus.emit('handshake:failed', {
        reason: `Expected ${expectedToken} but got ${token}`,
      })
      EventBus.emit('education:show', {
        title: '❌ Wrong Sequence!',
        message: `TCP handshake requires: SYN → SYN-ACK → ACK. You collected ${token} out of order.`,
        type: 'warning',
      })
    }

    this.cameras.main.flash(100, 0, 255, 255, false)
  }

  private getHandshakeMessage(token: HandshakeToken): string {
    const messages: Record<HandshakeToken, string> = {
      'SYN': 'Client sends SYN to initiate connection. "Hey server, let\'s connect!"',
      'SYN-ACK': 'Server acknowledges with SYN-ACK. "Got it! I\'m ready too!"',
      'ACK': 'Client confirms with ACK. Connection established! "Great, let\'s talk!"',
    }
    return messages[token]
  }

  private openGate(token: HandshakeToken): void {
    this.handshakeGates.getChildren().forEach((child) => {
      const gate = child as Phaser.Physics.Arcade.Sprite
      if (gate.getData('requires') === token) {
        gate.setData('open', true)
        const graphics = gate.getData('graphics') as Phaser.GameObjects.Graphics
        const label = gate.getData('label') as Phaser.GameObjects.Text
        if (graphics) graphics.setVisible(false)
        if (label) label.setText(`✅ ${token}`)
      }
    })
  }

  private hitGate(gate: Phaser.Physics.Arcade.Sprite): void {
    const requires = gate.getData('requires') as HandshakeToken
    EventBus.emit('education:show', {
      title: '🚧 Gate Locked!',
      message: `This gate requires the ${requires} token. Find and collect it first!`,
      type: 'info',
    })
  }

  private collectPacketPart(partSprite: Phaser.Physics.Arcade.Sprite): void {
    const part = partSprite.getData('part') as PacketPart
    partSprite.destroy()

    const expectedIndex = this.collectedPacketParts.length
    const expectedPart = this.CORRECT_PACKET_ORDER[expectedIndex]
    const inOrder = part === expectedPart

    this.collectedPacketParts.push(part)
    this.score += this.PACKET_PART_SCORE
    this.emitScore(this.PACKET_PART_SCORE, `${part} collected`)

    EventBus.emit('packet:part', {
      part,
      collected: [...this.collectedPacketParts],
      inOrder,
    })

    // Show educational message
    EventBus.emit('education:show', {
      title: `📦 ${part.toUpperCase()} Collected!`,
      message: this.getPacketPartMessage(part),
      type: 'success',
    })

    // Check if packet complete
    if (this.collectedPacketParts.length === 3) {
      const allInOrder = this.collectedPacketParts.every(
        (p, i) => p === this.CORRECT_PACKET_ORDER[i]
      )
      if (allInOrder) {
        this.score += this.PACKET_ASSEMBLY_BONUS
        this.emitScore(this.PACKET_ASSEMBLY_BONUS, 'Packet assembled correctly!')
      }
      EventBus.emit('packet:assembled', { bonus: allInOrder })
    }

    this.cameras.main.flash(100, 0, 255, 0, false)
  }

  private getPacketPartMessage(part: PacketPart): string {
    const messages: Record<PacketPart, string> = {
      header: 'Headers contain routing info: source IP, destination IP, protocol type.',
      payload: 'Payload is the actual data being transmitted - your message content!',
      checksum: 'Checksum verifies data integrity. It detects if data was corrupted.',
    }
    return messages[part]
  }

  private checkLevelCompletion(): void {
    if (this.player.x >= this.levelLength - 100) {
      this.completeLayer(this.score)
    }
  }
}
