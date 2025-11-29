import { describe, it, expect } from 'vitest'
import { CollisionSystem } from '@/game/systems/CollisionSystem'

describe('CollisionSystem', () => {
  describe('checkAABB', () => {
    it('returns true when rectangles overlap', () => {
      const a = { x: 0, y: 0, width: 10, height: 10 }
      const b = { x: 5, y: 5, width: 10, height: 10 }

      expect(CollisionSystem.checkAABB(a, b)).toBe(true)
    })

    it('returns false when rectangles do not overlap', () => {
      const a = { x: 0, y: 0, width: 10, height: 10 }
      const b = { x: 20, y: 20, width: 10, height: 10 }

      expect(CollisionSystem.checkAABB(a, b)).toBe(false)
    })

    it('returns false when rectangles touch edges (no overlap)', () => {
      const a = { x: 0, y: 0, width: 10, height: 10 }
      const b = { x: 10, y: 0, width: 10, height: 10 }

      expect(CollisionSystem.checkAABB(a, b)).toBe(false)
    })

    it('handles zero-size rectangles', () => {
      const a = { x: 5, y: 5, width: 0, height: 0 }
      const b = { x: 0, y: 0, width: 10, height: 10 }

      expect(CollisionSystem.checkAABB(a, b)).toBe(false)
    })

    it('detects partial horizontal overlap', () => {
      const a = { x: 0, y: 0, width: 10, height: 10 }
      const b = { x: 5, y: 0, width: 10, height: 10 }

      expect(CollisionSystem.checkAABB(a, b)).toBe(true)
    })

    it('detects partial vertical overlap', () => {
      const a = { x: 0, y: 0, width: 10, height: 10 }
      const b = { x: 0, y: 5, width: 10, height: 10 }

      expect(CollisionSystem.checkAABB(a, b)).toBe(true)
    })

    it('detects when one rectangle contains another', () => {
      const outer = { x: 0, y: 0, width: 100, height: 100 }
      const inner = { x: 25, y: 25, width: 50, height: 50 }

      expect(CollisionSystem.checkAABB(outer, inner)).toBe(true)
    })

    it('returns true for identical rectangles', () => {
      const a = { x: 10, y: 10, width: 20, height: 20 }
      const b = { x: 10, y: 10, width: 20, height: 20 }

      expect(CollisionSystem.checkAABB(a, b)).toBe(true)
    })

    it('handles negative coordinates', () => {
      const a = { x: -10, y: -10, width: 20, height: 20 }
      const b = { x: -5, y: -5, width: 10, height: 10 }

      expect(CollisionSystem.checkAABB(a, b)).toBe(true)
    })
  })

  describe('checkCircle', () => {
    it('returns true when circles overlap', () => {
      const a = { x: 0, y: 0, radius: 10 }
      const b = { x: 15, y: 0, radius: 10 }

      expect(CollisionSystem.checkCircle(a, b)).toBe(true)
    })

    it('returns false when circles do not overlap', () => {
      const a = { x: 0, y: 0, radius: 10 }
      const b = { x: 25, y: 0, radius: 10 }

      expect(CollisionSystem.checkCircle(a, b)).toBe(false)
    })

    it('returns false when circles just touch (no overlap)', () => {
      const a = { x: 0, y: 0, radius: 10 }
      const b = { x: 20, y: 0, radius: 10 }

      expect(CollisionSystem.checkCircle(a, b)).toBe(false)
    })

    it('returns true when one circle contains another', () => {
      const outer = { x: 0, y: 0, radius: 50 }
      const inner = { x: 10, y: 10, radius: 5 }

      expect(CollisionSystem.checkCircle(outer, inner)).toBe(true)
    })

    it('handles identical circles', () => {
      const a = { x: 10, y: 10, radius: 20 }
      const b = { x: 10, y: 10, radius: 20 }

      expect(CollisionSystem.checkCircle(a, b)).toBe(true)
    })

    it('handles zero radius circles', () => {
      const a = { x: 5, y: 5, radius: 0 }
      const b = { x: 5, y: 5, radius: 0 }

      // Two points at same location don't overlap
      expect(CollisionSystem.checkCircle(a, b)).toBe(false)
    })

    it('handles diagonal collision', () => {
      const a = { x: 0, y: 0, radius: 10 }
      const b = { x: 10, y: 10, radius: 10 }

      // Distance = sqrt(200) ≈ 14.14, combined radius = 20
      expect(CollisionSystem.checkCircle(a, b)).toBe(true)
    })

    it('handles diagonal non-collision', () => {
      const a = { x: 0, y: 0, radius: 5 }
      const b = { x: 10, y: 10, radius: 5 }

      // Distance = sqrt(200) ≈ 14.14, combined radius = 10
      expect(CollisionSystem.checkCircle(a, b)).toBe(false)
    })
  })

  describe('checkPointInRect', () => {
    it('returns true when point is inside rectangle', () => {
      const point = { x: 5, y: 5 }
      const rect = { x: 0, y: 0, width: 10, height: 10 }

      expect(CollisionSystem.checkPointInRect(point, rect)).toBe(true)
    })

    it('returns false when point is outside rectangle', () => {
      const point = { x: 15, y: 15 }
      const rect = { x: 0, y: 0, width: 10, height: 10 }

      expect(CollisionSystem.checkPointInRect(point, rect)).toBe(false)
    })

    it('returns false when point is on edge', () => {
      const point = { x: 10, y: 5 }
      const rect = { x: 0, y: 0, width: 10, height: 10 }

      expect(CollisionSystem.checkPointInRect(point, rect)).toBe(false)
    })

    it('returns true when point is at origin of rectangle', () => {
      const point = { x: 0, y: 0 }
      const rect = { x: 0, y: 0, width: 10, height: 10 }

      expect(CollisionSystem.checkPointInRect(point, rect)).toBe(true)
    })
  })

  describe('checkPointInCircle', () => {
    it('returns true when point is inside circle', () => {
      const point = { x: 5, y: 5 }
      const circle = { x: 5, y: 5, radius: 10 }

      expect(CollisionSystem.checkPointInCircle(point, circle)).toBe(true)
    })

    it('returns false when point is outside circle', () => {
      const point = { x: 20, y: 20 }
      const circle = { x: 5, y: 5, radius: 10 }

      expect(CollisionSystem.checkPointInCircle(point, circle)).toBe(false)
    })

    it('returns false when point is on circle edge', () => {
      const point = { x: 15, y: 5 }
      const circle = { x: 5, y: 5, radius: 10 }

      expect(CollisionSystem.checkPointInCircle(point, circle)).toBe(false)
    })

    it('returns true when point is at circle center', () => {
      const point = { x: 5, y: 5 }
      const circle = { x: 5, y: 5, radius: 10 }

      expect(CollisionSystem.checkPointInCircle(point, circle)).toBe(true)
    })
  })
})
