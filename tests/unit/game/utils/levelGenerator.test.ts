import { describe, it, expect } from 'vitest'
import { generateLevel, THEMES, CollectibleTheme } from '@/game/utils/levelGenerator'

describe('levelGenerator', () => {
  describe('generateLevel', () => {
    it('generates level with default config when no params provided', () => {
      const level = generateLevel({})

      expect(level.platforms.length).toBeGreaterThan(0)
      expect(level.obstacles.length).toBe(5) // default obstacle count
      expect(level.theme).toBe('none') // default theme
      expect(level.collectibles).toHaveLength(0) // 'none' theme has no collectibles
      expect(level.gates).toHaveLength(0)
    })

    it('respects obstacle count parameter', () => {
      const level5 = generateLevel({ obstacles: 5 })
      const level10 = generateLevel({ obstacles: 10 })

      expect(level5.obstacles.length).toBe(5)
      expect(level10.obstacles.length).toBe(10)
    })

    it('uses specified obstacle types', () => {
      const level = generateLevel({
        obstacles: 5,
        obstacleTypes: ['firewall', 'timeout'],
      })

      level.obstacles.forEach((obstacle) => {
        expect(['firewall', 'timeout']).toContain(obstacle.type)
      })
    })

    it('respects custom level length', () => {
      const level = generateLevel({ levelLength: 5000 })

      expect(level.levelLength).toBe(5000)
    })

    it('calculates level length based on obstacle count when not specified', () => {
      const level5 = generateLevel({ obstacles: 5 })
      const level15 = generateLevel({ obstacles: 15 })

      // More obstacles = longer level
      expect(level15.levelLength).toBeGreaterThan(level5.levelLength)
    })

    it('generates different levels for different obstacle counts', () => {
      const level5 = generateLevel({ obstacles: 5 })
      const level10 = generateLevel({ obstacles: 10 })

      // Different obstacle counts should produce different layouts
      expect(level5.obstacles.length).not.toBe(level10.obstacles.length)
      expect(level5.levelLength).not.toBe(level10.levelLength)
    })

    it('generates reproducible levels with same config', () => {
      const config = { obstacles: 7, obstacleTypes: ['firewall', 'latency'], theme: 'tcp' as CollectibleTheme }
      const level1 = generateLevel(config)
      const level2 = generateLevel(config)

      // Same config should produce same level
      expect(level1.levelLength).toBe(level2.levelLength)
      expect(level1.obstacles.length).toBe(level2.obstacles.length)

      // Check obstacle positions are same
      level1.obstacles.forEach((obstacle, index) => {
        expect(obstacle.x).toBe(level2.obstacles[index].x)
        expect(obstacle.y).toBe(level2.obstacles[index].y)
        expect(obstacle.type).toBe(level2.obstacles[index].type)
      })

      // Check collectibles are same
      expect(level1.collectibles.length).toBe(level2.collectibles.length)
      level1.collectibles.forEach((collectible, index) => {
        expect(collectible.id).toBe(level2.collectibles[index].id)
        expect(collectible.x).toBe(level2.collectibles[index].x)
      })
    })

    it('generates ground platforms that span the level', () => {
      const level = generateLevel({ obstacles: 5 })
      const groundPlatforms = level.platforms.filter((p) => p.y > 600)

      // Should have multiple ground segments
      expect(groundPlatforms.length).toBeGreaterThan(0)

      // First platform should start at or near x=0
      const sortedByX = [...groundPlatforms].sort((a, b) => a.x - b.x)
      expect(sortedByX[0].x).toBeLessThanOrEqual(50)
    })

    it('generates floating platforms at reachable heights', () => {
      const level = generateLevel({ obstacles: 5 })
      const floatingPlatforms = level.platforms.filter((p) => p.y < 600)

      // Should have floating platforms
      expect(floatingPlatforms.length).toBeGreaterThan(0)

      // Heights should be between 350 and 600 (reachable with jumps)
      floatingPlatforms.forEach((platform) => {
        expect(platform.y).toBeGreaterThanOrEqual(350)
        expect(platform.y).toBeLessThan(600)
      })
    })
  })

  describe('theme system', () => {
    it('generates TCP handshake collectibles for tcp theme', () => {
      const level = generateLevel({ obstacles: 5, theme: 'tcp' })

      expect(level.theme).toBe('tcp')
      expect(level.themeConfig.name).toBe('TCP Handshake')
      expect(level.collectibles).toHaveLength(3)

      const ids = level.collectibles.map((c) => c.id)
      expect(ids).toContain('SYN')
      expect(ids).toContain('SYN-ACK')
      expect(ids).toContain('ACK')
    })

    it('generates HTTP request collectibles for http theme', () => {
      const level = generateLevel({ obstacles: 5, theme: 'http' })

      expect(level.theme).toBe('http')
      expect(level.themeConfig.name).toBe('HTTP Request')
      expect(level.collectibles).toHaveLength(3)

      const ids = level.collectibles.map((c) => c.id)
      expect(ids).toContain('REQUEST')
      expect(ids).toContain('RESPONSE')
      expect(ids).toContain('DATA')
    })

    it('generates authentication collectibles for auth theme', () => {
      const level = generateLevel({ obstacles: 5, theme: 'auth' })

      expect(level.theme).toBe('auth')
      expect(level.themeConfig.name).toBe('Authentication')
      expect(level.collectibles).toHaveLength(3)

      const ids = level.collectibles.map((c) => c.id)
      expect(ids).toContain('CREDENTIALS')
      expect(ids).toContain('TOKEN')
      expect(ids).toContain('SESSION')
    })

    it('generates API concept collectibles for api theme', () => {
      const level = generateLevel({ obstacles: 5, theme: 'api' })

      expect(level.theme).toBe('api')
      expect(level.themeConfig.name).toBe('API Concepts')
      expect(level.collectibles).toHaveLength(3)

      const ids = level.collectibles.map((c) => c.id)
      expect(ids).toContain('ENDPOINT')
      expect(ids).toContain('METHOD')
      expect(ids).toContain('STATUS')
    })

    it('generates no collectibles for none theme', () => {
      const level = generateLevel({ obstacles: 5, theme: 'none' })

      expect(level.theme).toBe('none')
      expect(level.themeConfig.name).toBe('Navigation')
      expect(level.collectibles).toHaveLength(0)
      expect(level.gates).toHaveLength(0)
    })

    it('positions collectibles in order along the level', () => {
      const level = generateLevel({ obstacles: 5, theme: 'tcp' })

      // Collectibles should be sorted by order
      const sortedByOrder = [...level.collectibles].sort((a, b) => a.order - b.order)

      // SYN should come before SYN-ACK, which should come before ACK
      expect(sortedByOrder[0].id).toBe('SYN')
      expect(sortedByOrder[1].id).toBe('SYN-ACK')
      expect(sortedByOrder[2].id).toBe('ACK')

      // Positions should be in order too
      expect(sortedByOrder[0].x).toBeLessThan(sortedByOrder[1].x)
      expect(sortedByOrder[1].x).toBeLessThan(sortedByOrder[2].x)
    })

    it('generates gates for themes that require them', () => {
      // TCP theme has gates
      const tcpLevel = generateLevel({ obstacles: 5, theme: 'tcp' })
      expect(tcpLevel.gates.length).toBe(3)

      // Auth theme has gates
      const authLevel = generateLevel({ obstacles: 5, theme: 'auth' })
      expect(authLevel.gates.length).toBe(3)

      // HTTP theme has no gates
      const httpLevel = generateLevel({ obstacles: 5, theme: 'http' })
      expect(httpLevel.gates.length).toBe(0)

      // API theme has no gates
      const apiLevel = generateLevel({ obstacles: 5, theme: 'api' })
      expect(apiLevel.gates.length).toBe(0)
    })

    it('positions gates after their corresponding collectibles', () => {
      const level = generateLevel({ obstacles: 5, theme: 'tcp' })

      level.collectibles.forEach((collectible) => {
        const correspondingGate = level.gates.find(
          (g) => g.requiresId === collectible.id
        )
        expect(correspondingGate).toBeDefined()
        expect(correspondingGate!.x).toBeGreaterThan(collectible.x)
      })
    })
  })

  describe('theme config validation', () => {
    it('all themes have valid configuration', () => {
      const themes: CollectibleTheme[] = ['tcp', 'http', 'auth', 'api', 'none']

      themes.forEach((theme) => {
        expect(THEMES[theme]).toBeDefined()
        expect(THEMES[theme].name).toBeTruthy()
        expect(THEMES[theme].description).toBeTruthy()
        expect(Array.isArray(THEMES[theme].collectibles)).toBe(true)
        expect(typeof THEMES[theme].gates).toBe('boolean')
      })
    })

    it('collectible themes have exactly 3 collectibles (except none)', () => {
      const themesWithCollectibles: CollectibleTheme[] = ['tcp', 'http', 'auth', 'api']

      themesWithCollectibles.forEach((theme) => {
        expect(THEMES[theme].collectibles.length).toBe(3)
      })

      expect(THEMES['none'].collectibles.length).toBe(0)
    })
  })

  describe('level variety by quest', () => {
    it('tutorial quest config produces shorter level', () => {
      const tutorialLevel = generateLevel({ obstacles: 5, speed: 1 })
      const advancedLevel = generateLevel({ obstacles: 10, speed: 1.5 })

      expect(tutorialLevel.levelLength).toBeLessThan(advancedLevel.levelLength)
    })

    it('different quests produce different gameplay layouts and themes', () => {
      // Tutorial quest config from seed.ts (HTTP theme)
      const tutorial = generateLevel({
        obstacles: 5,
        obstacleTypes: ['firewall', 'latency-cloud'],
        theme: 'http',
      })

      // Auth quest config from seed.ts (Auth theme)
      const auth = generateLevel({
        obstacles: 10,
        obstacleTypes: ['firewall', 'mitm-attack', 'packet-loss'],
        theme: 'auth',
      })

      // API quest config from seed.ts (API theme)
      const api = generateLevel({
        obstacles: 8,
        obstacleTypes: ['latency-cloud', 'packet-loss', 'rate-limit'],
        theme: 'api',
      })

      // All should have different number of obstacles
      expect(tutorial.obstacles.length).toBe(5)
      expect(auth.obstacles.length).toBe(10)
      expect(api.obstacles.length).toBe(8)

      // All should have different level lengths
      expect(tutorial.levelLength).not.toBe(auth.levelLength)
      expect(auth.levelLength).not.toBe(api.levelLength)

      // Obstacle types should differ
      const tutorialTypes = new Set(tutorial.obstacles.map((o) => o.type))
      const authTypes = new Set(auth.obstacles.map((o) => o.type))
      expect([...tutorialTypes]).not.toEqual([...authTypes])

      // Most importantly: themes should differ!
      expect(tutorial.theme).toBe('http')
      expect(auth.theme).toBe('auth')
      expect(api.theme).toBe('api')

      // Collectible IDs should be completely different
      const tutorialIds = tutorial.collectibles.map((c) => c.id)
      const authIds = auth.collectibles.map((c) => c.id)
      const apiIds = api.collectibles.map((c) => c.id)

      expect(tutorialIds).toContain('REQUEST')
      expect(authIds).toContain('CREDENTIALS')
      expect(apiIds).toContain('ENDPOINT')

      // No overlap between collectible IDs
      expect(tutorialIds.some((id) => authIds.includes(id))).toBe(false)
      expect(authIds.some((id) => apiIds.includes(id))).toBe(false)
    })
  })
})
