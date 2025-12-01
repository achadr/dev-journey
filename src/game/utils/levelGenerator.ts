// Constants - must match game config (defined here to avoid Phaser imports for testability)
const GAME_HEIGHT = 720

// =============================================================================
// COLLECTIBLE THEMES - Each quest can have a different educational theme
// =============================================================================

// Theme types that can be specified in seed.ts config
export type CollectibleTheme = 'tcp' | 'http' | 'auth' | 'api' | 'none'

// Generic collectible that works for any theme
export interface Collectible {
  x: number
  y: number
  id: string      // Unique identifier (e.g., 'SYN', 'GET', 'token')
  label: string   // Display label
  order: number   // Required collection order (0-based)
}

// Gate that requires a specific collectible
export interface Gate {
  x: number
  y: number
  requiresId: string  // ID of collectible required to pass
  label: string       // Display label
}

// Theme definition with collectibles and educational content
export interface ThemeConfig {
  name: string
  collectibles: Array<{ id: string; label: string }>
  gates: boolean  // Whether to generate gates
  description: string
}

// Available themes
export const THEMES: Record<CollectibleTheme, ThemeConfig> = {
  tcp: {
    name: 'TCP Handshake',
    collectibles: [
      { id: 'SYN', label: 'SYN' },
      { id: 'SYN-ACK', label: 'SYN-ACK' },
      { id: 'ACK', label: 'ACK' },
    ],
    gates: true,
    description: 'Learn the TCP three-way handshake',
  },
  http: {
    name: 'HTTP Request',
    collectibles: [
      { id: 'REQUEST', label: 'Request' },
      { id: 'RESPONSE', label: 'Response' },
      { id: 'DATA', label: 'Data' },
    ],
    gates: false,
    description: 'Understand HTTP request/response flow',
  },
  auth: {
    name: 'Authentication',
    collectibles: [
      { id: 'CREDENTIALS', label: 'Credentials' },
      { id: 'TOKEN', label: 'Token' },
      { id: 'SESSION', label: 'Session' },
    ],
    gates: true,
    description: 'Learn authentication concepts',
  },
  api: {
    name: 'API Concepts',
    collectibles: [
      { id: 'ENDPOINT', label: 'Endpoint' },
      { id: 'METHOD', label: 'Method' },
      { id: 'STATUS', label: 'Status' },
    ],
    gates: false,
    description: 'Understand REST API concepts',
  },
  none: {
    name: 'Navigation',
    collectibles: [],
    gates: false,
    description: 'Just navigate through obstacles',
  },
}

// =============================================================================
// LEVEL STRUCTURE
// =============================================================================

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

export interface GeneratedLevel {
  levelLength: number
  platforms: PlatformConfig[]
  obstacles: ObstacleConfig[]
  theme: CollectibleTheme
  themeConfig: ThemeConfig
  collectibles: Collectible[]
  gates: Gate[]
}

export interface SimpleLevelConfig {
  obstacles?: number
  speed?: number
  obstacleTypes?: string[]
  levelLength?: number
  theme?: CollectibleTheme
}

// =============================================================================
// LEVEL GENERATION
// =============================================================================

// Seeded random number generator for deterministic level generation
function seededRandom(seed: number): () => number {
  return () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff
    return seed / 0x7fffffff
  }
}

/**
 * Generates a complete level configuration from simple parameters.
 * Uses the obstacle count to seed the random generator for reproducible levels.
 */
export function generateLevel(config: SimpleLevelConfig): GeneratedLevel {
  const obstacleCount = config.obstacles || 5
  const obstacleTypes = config.obstacleTypes || ['firewall', 'packet_loss', 'timeout', 'latency']
  const levelLength = config.levelLength || 2000 + (obstacleCount * 300)
  const theme = config.theme || 'none'
  const themeConfig = THEMES[theme]

  // Create seeded random from obstacle count for reproducibility
  const random = seededRandom(obstacleCount * 7919)

  const platforms = generatePlatforms(levelLength, random)
  const obstacles = generateObstacles(obstacleCount, obstacleTypes, levelLength, platforms, random)
  const collectibles = generateCollectibles(theme, levelLength, platforms, random)
  const gates = generateGates(theme, levelLength, collectibles)

  return {
    levelLength,
    platforms,
    obstacles,
    theme,
    themeConfig,
    collectibles,
    gates,
  }
}

function generatePlatforms(levelLength: number, random: () => number): PlatformConfig[] {
  const platforms: PlatformConfig[] = []
  const groundY = GAME_HEIGHT - 32

  // Generate ground sections with gaps
  let x = 0
  const minGap = 80
  const maxGap = 120
  const minPlatformWidth = 400
  const maxPlatformWidth = 700

  while (x < levelLength) {
    const width = minPlatformWidth + random() * (maxPlatformWidth - minPlatformWidth)
    platforms.push({ x, y: groundY, width })
    x += width + minGap + random() * (maxGap - minGap)
  }

  // Generate floating platforms at varied heights
  const floatingCount = Math.floor(levelLength / 300)
  for (let i = 0; i < floatingCount; i++) {
    const platformX = 150 + (i * levelLength / floatingCount) + (random() - 0.5) * 100
    const platformY = 400 + random() * 150
    const width = 150 + random() * 80
    platforms.push({ x: platformX, y: platformY, width })
  }

  return platforms
}

function generateObstacles(
  count: number,
  types: string[],
  levelLength: number,
  platforms: PlatformConfig[],
  random: () => number
): ObstacleConfig[] {
  const obstacles: ObstacleConfig[] = []
  const groundY = GAME_HEIGHT - 64

  const spacing = levelLength / (count + 1)

  for (let i = 0; i < count; i++) {
    const baseX = spacing * (i + 1)
    const x = baseX + (random() - 0.5) * (spacing * 0.3)
    const type = types[Math.floor(random() * types.length)]

    let y = groundY
    if (random() > 0.6) {
      const floatingPlatforms = platforms.filter(p => p.y < GAME_HEIGHT - 100)
      const nearbyPlatform = floatingPlatforms.find(p =>
        x >= p.x && x <= p.x + p.width
      )
      if (nearbyPlatform) {
        y = nearbyPlatform.y - 32
      }
    }

    obstacles.push({ x, y, type })
  }

  return obstacles
}

function generateCollectibles(
  theme: CollectibleTheme,
  levelLength: number,
  platforms: PlatformConfig[],
  random: () => number
): Collectible[] {
  const themeConfig = THEMES[theme]
  if (themeConfig.collectibles.length === 0) {
    return []
  }

  const collectibles: Collectible[] = []
  const count = themeConfig.collectibles.length

  // Place collectibles evenly across level
  themeConfig.collectibles.forEach((item, index) => {
    const targetX = levelLength * (index + 1) / (count + 1)
    const x = targetX + (random() - 0.5) * 100

    const floatingPlatforms = platforms.filter(p => p.y < GAME_HEIGHT - 100)
    let y = 350

    const nearbyPlatform = floatingPlatforms.find(p =>
      Math.abs(p.x + p.width / 2 - x) < 200
    )
    if (nearbyPlatform) {
      y = nearbyPlatform.y - 60
    }

    collectibles.push({
      x,
      y,
      id: item.id,
      label: item.label,
      order: index,
    })
  })

  return collectibles
}

function generateGates(
  theme: CollectibleTheme,
  levelLength: number,
  collectibles: Collectible[]
): Gate[] {
  const themeConfig = THEMES[theme]
  if (!themeConfig.gates || collectibles.length === 0) {
    return []
  }

  const gates: Gate[] = []
  const gateY = GAME_HEIGHT - 107

  collectibles.forEach((collectible, index) => {
    const gateX = collectible.x + 200 + index * 50
    gates.push({
      x: Math.min(gateX, levelLength - 100),
      y: gateY,
      requiresId: collectible.id,
      label: `Requires: ${collectible.label}`,
    })
  })

  return gates
}
