import { describe, it, expect, beforeEach, vi } from 'vitest'
import { EventBus, type GameResult } from '@/game/EventBus'

describe('EventBus', () => {
  beforeEach(() => {
    EventBus.removeAllListeners()
  })

  describe('game lifecycle events', () => {
    it('emits and receives game:ready event', () => {
      const handler = vi.fn()
      EventBus.on('game:ready', handler)

      EventBus.emit('game:ready')

      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('emits and receives game:end event with result', () => {
      const handler = vi.fn()
      const result: GameResult = {
        victory: true,
        score: 1000,
        time: 120,
        layersCompleted: 4,
      }

      EventBus.on('game:end', handler)
      EventBus.emit('game:end', result)

      expect(handler).toHaveBeenCalledWith(result)
    })

    it('emits and receives game:pause event', () => {
      const handler = vi.fn()
      EventBus.on('game:pause', handler)

      EventBus.emit('game:pause')

      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('emits and receives game:resume event', () => {
      const handler = vi.fn()
      EventBus.on('game:resume', handler)

      EventBus.emit('game:resume')

      expect(handler).toHaveBeenCalledTimes(1)
    })
  })

  describe('player events', () => {
    it('emits player:damaged event with amount and source', () => {
      const handler = vi.fn()
      EventBus.on('player:damaged', handler)

      EventBus.emit('player:damaged', { amount: 20, source: 'firewall' })

      expect(handler).toHaveBeenCalledWith({ amount: 20, source: 'firewall' })
    })

    it('emits player:healed event with amount', () => {
      const handler = vi.fn()
      EventBus.on('player:healed', handler)

      EventBus.emit('player:healed', { amount: 10 })

      expect(handler).toHaveBeenCalledWith({ amount: 10 })
    })

    it('emits player:died event', () => {
      const handler = vi.fn()
      EventBus.on('player:died', handler)

      EventBus.emit('player:died')

      expect(handler).toHaveBeenCalledTimes(1)
    })
  })

  describe('layer events', () => {
    it('emits layer:entered event with layer type', () => {
      const handler = vi.fn()
      EventBus.on('layer:entered', handler)

      EventBus.emit('layer:entered', { layer: 'NETWORK' })

      expect(handler).toHaveBeenCalledWith({ layer: 'NETWORK' })
    })

    it('emits layer:completed event with layer and score', () => {
      const handler = vi.fn()
      EventBus.on('layer:completed', handler)

      EventBus.emit('layer:completed', { layer: 'BROWSER', score: 150 })

      expect(handler).toHaveBeenCalledWith({ layer: 'BROWSER', score: 150 })
    })
  })

  describe('challenge events', () => {
    it('emits challenge:started event', () => {
      const handler = vi.fn()
      EventBus.on('challenge:started', handler)

      EventBus.emit('challenge:started', { type: 'SELECT_METHOD' })

      expect(handler).toHaveBeenCalledWith({ type: 'SELECT_METHOD' })
    })

    it('emits challenge:completed event with success status', () => {
      const handler = vi.fn()
      EventBus.on('challenge:completed', handler)

      EventBus.emit('challenge:completed', { type: 'PICK_ENDPOINT', success: true })

      expect(handler).toHaveBeenCalledWith({ type: 'PICK_ENDPOINT', success: true })
    })
  })

  describe('score events', () => {
    it('emits score:added event with points and reason', () => {
      const handler = vi.fn()
      EventBus.on('score:added', handler)

      EventBus.emit('score:added', { points: 100, reason: 'Correct answer' })

      expect(handler).toHaveBeenCalledWith({ points: 100, reason: 'Correct answer' })
    })
  })

  describe('event handling', () => {
    it('supports once listeners', () => {
      const handler = vi.fn()
      EventBus.once('game:ready', handler)

      EventBus.emit('game:ready')
      EventBus.emit('game:ready')

      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('supports removing specific listeners', () => {
      const handler = vi.fn()
      EventBus.on('game:pause', handler)
      EventBus.off('game:pause', handler)

      EventBus.emit('game:pause')

      expect(handler).not.toHaveBeenCalled()
    })

    it('supports removing all listeners', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()
      EventBus.on('game:ready', handler1)
      EventBus.on('game:pause', handler2)

      EventBus.removeAllListeners()

      EventBus.emit('game:ready')
      EventBus.emit('game:pause')

      expect(handler1).not.toHaveBeenCalled()
      expect(handler2).not.toHaveBeenCalled()
    })
  })
})
