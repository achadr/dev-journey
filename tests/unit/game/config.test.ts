import { describe, it, expect, vi } from 'vitest'
import { createGameConfig, GAME_WIDTH, GAME_HEIGHT } from '@/game/config'

// Mock Phaser since it requires browser environment
vi.mock('phaser', () => ({
  default: {
    AUTO: 0,
    Scale: {
      FIT: 'FIT',
      CENTER_BOTH: 'CENTER_BOTH',
    },
  },
}))

describe('Game Config', () => {
  describe('constants', () => {
    it('exports GAME_WIDTH as 1280', () => {
      expect(GAME_WIDTH).toBe(1280)
    })

    it('exports GAME_HEIGHT as 720', () => {
      expect(GAME_HEIGHT).toBe(720)
    })
  })

  describe('createGameConfig', () => {
    it('returns a valid Phaser config object', () => {
      const mockParent = document.createElement('div')
      const config = createGameConfig(mockParent)

      expect(config).toBeDefined()
      expect(config.parent).toBe(mockParent)
    })

    it('sets correct dimensions', () => {
      const mockParent = document.createElement('div')
      const config = createGameConfig(mockParent)

      expect(config.width).toBe(GAME_WIDTH)
      expect(config.height).toBe(GAME_HEIGHT)
    })

    it('sets background color to dark theme', () => {
      const mockParent = document.createElement('div')
      const config = createGameConfig(mockParent)

      expect(config.backgroundColor).toBe('#1a1a2e')
    })

    it('configures arcade physics', () => {
      const mockParent = document.createElement('div')
      const config = createGameConfig(mockParent)

      expect(config.physics).toBeDefined()
      expect(config.physics?.default).toBe('arcade')
      expect(config.physics?.arcade?.gravity).toEqual({ x: 0, y: 0 })
    })

    it('configures scale mode for responsive display', () => {
      const mockParent = document.createElement('div')
      const config = createGameConfig(mockParent)

      expect(config.scale).toBeDefined()
      expect(config.scale?.mode).toBe('FIT')
      expect(config.scale?.autoCenter).toBe('CENTER_BOTH')
    })

    it('enables antialiasing for smooth rendering', () => {
      const mockParent = document.createElement('div')
      const config = createGameConfig(mockParent)

      expect(config.render?.antialias).toBe(true)
      expect(config.render?.pixelArt).toBe(false)
    })

    it('includes scene array', () => {
      const mockParent = document.createElement('div')
      const config = createGameConfig(mockParent)

      expect(config.scene).toBeDefined()
      expect(Array.isArray(config.scene)).toBe(true)
    })
  })
})
