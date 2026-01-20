import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock modules before imports
vi.mock('@/lib/db/client', () => ({
  prisma: {
    leaderboardEntry: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    progress: {
      groupBy: vi.fn(),
    },
  },
}))

vi.mock('@/lib/auth/session', () => ({
  getSession: vi.fn(),
}))

// Import after mocking
import { prisma } from '@/lib/db/client'
import { getSession } from '@/lib/auth/session'
import { GET } from '@/app/api/leaderboard/route'

const mockSession = {
  userId: 'user-123',
  email: 'test@example.com',
  username: 'testuser',
  role: 'PLAYER',
}

const mockLeaderboardEntries = [
  {
    id: 'entry-1',
    userId: 'user-1',
    username: 'topplayer',
    totalScore: 5000,
    questsCompleted: 10,
    rank: 1,
    period: 'ALL_TIME',
    periodStart: new Date('2024-01-01'),
    periodEnd: new Date('2024-12-31'),
    updatedAt: new Date(),
  },
  {
    id: 'entry-2',
    userId: 'user-2',
    username: 'secondplace',
    totalScore: 4500,
    questsCompleted: 8,
    rank: 2,
    period: 'ALL_TIME',
    periodStart: new Date('2024-01-01'),
    periodEnd: new Date('2024-12-31'),
    updatedAt: new Date(),
  },
  {
    id: 'entry-3',
    userId: 'user-123',
    username: 'testuser',
    totalScore: 3000,
    questsCompleted: 5,
    rank: 3,
    period: 'ALL_TIME',
    periodStart: new Date('2024-01-01'),
    periodEnd: new Date('2024-12-31'),
    updatedAt: new Date(),
  },
]

describe('GET /api/leaderboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns leaderboard entries without authentication', async () => {
    vi.mocked(getSession).mockResolvedValue(null)
    vi.mocked(prisma.leaderboardEntry.findMany).mockResolvedValue(mockLeaderboardEntries)
    vi.mocked(prisma.leaderboardEntry.count).mockResolvedValue(3)

    const request = new NextRequest('http://localhost:3000/api/leaderboard', {
      method: 'GET',
    })

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.entries).toHaveLength(3)
    expect(data.data.entries[0].username).toBe('topplayer')
    expect(data.data.entries[0].rank).toBe(1)
  })

  it('returns leaderboard with user rank when authenticated', async () => {
    vi.mocked(getSession).mockResolvedValue(mockSession)
    vi.mocked(prisma.leaderboardEntry.findMany).mockResolvedValue(mockLeaderboardEntries)
    vi.mocked(prisma.leaderboardEntry.count).mockResolvedValue(3)

    const request = new NextRequest('http://localhost:3000/api/leaderboard', {
      method: 'GET',
    })

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.userRank).toBeDefined()
    expect(data.data.userRank.rank).toBe(3)
    expect(data.data.userRank.username).toBe('testuser')
  })

  it('filters by weekly period', async () => {
    vi.mocked(getSession).mockResolvedValue(null)
    vi.mocked(prisma.leaderboardEntry.findMany).mockResolvedValue([mockLeaderboardEntries[0]])
    vi.mocked(prisma.leaderboardEntry.count).mockResolvedValue(1)

    const request = new NextRequest('http://localhost:3000/api/leaderboard?period=weekly', {
      method: 'GET',
    })

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(prisma.leaderboardEntry.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          period: 'WEEKLY',
        }),
      })
    )
  })

  it('filters by monthly period', async () => {
    vi.mocked(getSession).mockResolvedValue(null)
    vi.mocked(prisma.leaderboardEntry.findMany).mockResolvedValue([mockLeaderboardEntries[0]])
    vi.mocked(prisma.leaderboardEntry.count).mockResolvedValue(1)

    const request = new NextRequest('http://localhost:3000/api/leaderboard?period=monthly', {
      method: 'GET',
    })

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(prisma.leaderboardEntry.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          period: 'MONTHLY',
        }),
      })
    )
  })

  it('defaults to all-time period', async () => {
    vi.mocked(getSession).mockResolvedValue(null)
    vi.mocked(prisma.leaderboardEntry.findMany).mockResolvedValue(mockLeaderboardEntries)
    vi.mocked(prisma.leaderboardEntry.count).mockResolvedValue(3)

    const request = new NextRequest('http://localhost:3000/api/leaderboard', {
      method: 'GET',
    })

    const response = await GET(request)

    expect(response.status).toBe(200)
    expect(prisma.leaderboardEntry.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          period: 'ALL_TIME',
        }),
      })
    )
  })

  it('supports pagination with limit parameter', async () => {
    vi.mocked(getSession).mockResolvedValue(null)
    vi.mocked(prisma.leaderboardEntry.findMany).mockResolvedValue([mockLeaderboardEntries[0]])
    vi.mocked(prisma.leaderboardEntry.count).mockResolvedValue(3)

    const request = new NextRequest('http://localhost:3000/api/leaderboard?limit=1', {
      method: 'GET',
    })

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.data.entries).toHaveLength(1)
    expect(prisma.leaderboardEntry.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 1,
      })
    )
  })

  it('supports pagination with page parameter', async () => {
    vi.mocked(getSession).mockResolvedValue(null)
    vi.mocked(prisma.leaderboardEntry.findMany).mockResolvedValue([mockLeaderboardEntries[1]])
    vi.mocked(prisma.leaderboardEntry.count).mockResolvedValue(3)

    const request = new NextRequest('http://localhost:3000/api/leaderboard?page=2&limit=1', {
      method: 'GET',
    })

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(prisma.leaderboardEntry.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 1,
        take: 1,
      })
    )
  })

  it('returns empty array when no entries exist', async () => {
    vi.mocked(getSession).mockResolvedValue(null)
    vi.mocked(prisma.leaderboardEntry.findMany).mockResolvedValue([])
    vi.mocked(prisma.leaderboardEntry.count).mockResolvedValue(0)

    const request = new NextRequest('http://localhost:3000/api/leaderboard', {
      method: 'GET',
    })

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.entries).toEqual([])
  })

  it('returns pagination metadata', async () => {
    vi.mocked(getSession).mockResolvedValue(null)
    vi.mocked(prisma.leaderboardEntry.findMany).mockResolvedValue(mockLeaderboardEntries)
    vi.mocked(prisma.leaderboardEntry.count).mockResolvedValue(100)

    const request = new NextRequest('http://localhost:3000/api/leaderboard?page=1&limit=10', {
      method: 'GET',
    })

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.meta).toBeDefined()
    expect(data.meta.page).toBe(1)
    expect(data.meta.limit).toBe(10)
    expect(data.meta.total).toBe(100)
  })

  it('validates invalid period parameter', async () => {
    vi.mocked(getSession).mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/leaderboard?period=invalid', {
      method: 'GET',
    })

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('VALIDATION_ERROR')
  })

  it('handles database errors gracefully', async () => {
    vi.mocked(getSession).mockResolvedValue(null)
    vi.mocked(prisma.leaderboardEntry.findMany).mockRejectedValue(new Error('Database error'))

    const request = new NextRequest('http://localhost:3000/api/leaderboard', {
      method: 'GET',
    })

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('INTERNAL_ERROR')
  })

  it('orders entries by totalScore descending', async () => {
    vi.mocked(getSession).mockResolvedValue(null)
    vi.mocked(prisma.leaderboardEntry.findMany).mockResolvedValue(mockLeaderboardEntries)
    vi.mocked(prisma.leaderboardEntry.count).mockResolvedValue(3)

    const request = new NextRequest('http://localhost:3000/api/leaderboard', {
      method: 'GET',
    })

    const response = await GET(request)

    expect(response.status).toBe(200)
    expect(prisma.leaderboardEntry.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: {
          totalScore: 'desc',
        },
      })
    )
  })
})
