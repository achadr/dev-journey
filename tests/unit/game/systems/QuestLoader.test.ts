import { describe, it, expect, beforeEach, vi } from 'vitest'
import { QuestLoader } from '@/game/systems/QuestLoader'

describe('QuestLoader', () => {
  let loader: QuestLoader

  beforeEach(() => {
    loader = new QuestLoader()
    vi.resetAllMocks()
  })

  describe('load', () => {
    it('fetches quest from API', async () => {
      const mockQuest = {
        id: 'test-1',
        name: 'Test Quest',
        layers: [{ type: 'BROWSER', challenge: { type: 'SELECT_METHOD' } }],
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockQuest }),
      })

      const quest = await loader.load('test-1')

      expect(fetch).toHaveBeenCalledWith('/api/quests/test-1')
      expect(quest).toEqual(mockQuest)
    })

    it('returns cached quest on subsequent calls', async () => {
      const mockQuest = {
        id: 'test-1',
        name: 'Test Quest',
        layers: [{ type: 'BROWSER', challenge: { type: 'SELECT_METHOD' } }],
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockQuest }),
      })

      await loader.load('test-1')
      await loader.load('test-1')

      expect(fetch).toHaveBeenCalledTimes(1)
    })

    it('throws error for invalid quest (missing id)', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: { name: 'Test' } }),
      })

      await expect(loader.load('test-1')).rejects.toThrow('Invalid quest structure')
    })

    it('throws error for invalid quest (missing name)', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: { id: 'test-1' } }),
      })

      await expect(loader.load('test-1')).rejects.toThrow('Invalid quest structure')
    })

    it('throws error for invalid quest (missing layers)', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: { id: 'test-1', name: 'Test' } }),
      })

      await expect(loader.load('test-1')).rejects.toThrow('Invalid quest structure')
    })

    it('throws error for quest with no layers', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: { id: 'test-1', name: 'Test', layers: [] }
        }),
      })

      await expect(loader.load('test-1')).rejects.toThrow('Quest must have at least one layer')
    })

    it('throws error for invalid layer (missing type)', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: { id: 'test-1', name: 'Test', layers: [{ challenge: {} }] }
        }),
      })

      await expect(loader.load('test-1')).rejects.toThrow('Invalid layer structure')
    })

    it('throws error for invalid layer (missing challenge)', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: { id: 'test-1', name: 'Test', layers: [{ type: 'BROWSER' }] }
        }),
      })

      await expect(loader.load('test-1')).rejects.toThrow('Invalid layer structure')
    })

    it('throws error when API fails', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      })

      await expect(loader.load('nonexistent')).rejects.toThrow('Failed to load quest: nonexistent')
    })

    it('throws error when API returns success: false', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: false, error: 'Not found' }),
      })

      await expect(loader.load('test-1')).rejects.toThrow('Failed to load quest: test-1')
    })

    it('throws error on network failure', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

      await expect(loader.load('test-1')).rejects.toThrow('Network error')
    })
  })

  describe('clearCache', () => {
    it('clears cached quests', async () => {
      const mockQuest = {
        id: 'test-1',
        name: 'Test Quest',
        layers: [{ type: 'BROWSER', challenge: { type: 'SELECT_METHOD' } }],
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockQuest }),
      })

      await loader.load('test-1')
      loader.clearCache()
      await loader.load('test-1')

      expect(fetch).toHaveBeenCalledTimes(2)
    })
  })

  describe('isCached', () => {
    it('returns false when quest is not cached', () => {
      expect(loader.isCached('test-1')).toBe(false)
    })

    it('returns true when quest is cached', async () => {
      const mockQuest = {
        id: 'test-1',
        name: 'Test Quest',
        layers: [{ type: 'BROWSER', challenge: { type: 'SELECT_METHOD' } }],
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockQuest }),
      })

      await loader.load('test-1')

      expect(loader.isCached('test-1')).toBe(true)
    })

    it('returns false after cache is cleared', async () => {
      const mockQuest = {
        id: 'test-1',
        name: 'Test Quest',
        layers: [{ type: 'BROWSER', challenge: { type: 'SELECT_METHOD' } }],
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockQuest }),
      })

      await loader.load('test-1')
      loader.clearCache()

      expect(loader.isCached('test-1')).toBe(false)
    })
  })
})
