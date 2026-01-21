import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock modules before imports
vi.mock('@/lib/db/client', () => ({
  prisma: {
    achievement: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    userAchievement: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}))

vi.mock('@/lib/auth/session', () => ({
  getSession: vi.fn(),
}))

// Import after mocking
import { prisma } from '@/lib/db/client'
import { getSession } from '@/lib/auth/session'
import { GET as getAchievements, POST as unlockAchievement } from '@/app/api/achievements/route'
import { GET as getAvailableAchievements } from '@/app/api/achievements/available/route'

const mockSession = {
  userId: 'user-123',
  email: 'test@example.com',
  username: 'testuser',
  role: 'PLAYER',
}

const mockAchievements = [
  {
    id: 'achievement-1',
    name: 'First Steps',
    description: 'Complete your first quest',
    icon: '🎯',
    category: 'PROGRESS',
    condition: { questsCompleted: 1 },
    xpReward: 100,
    createdAt: new Date(),
  },
  {
    id: 'achievement-2',
    name: 'Speed Demon',
    description: 'Complete a network layer in under 30 seconds',
    icon: '⚡',
    category: 'SPEED',
    condition: { layerType: 'NETWORK', maxTime: 30 },
    xpReward: 200,
    createdAt: new Date(),
  },
]

const mockUserAchievement = {
  id: 'user-achievement-1',
  userId: 'user-123',
  achievementId: 'achievement-1',
  unlockedAt: new Date(),
  achievement: mockAchievements[0],
}

describe('GET /api/achievements', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns all unlocked achievements for authenticated user', async () => {
    vi.mocked(getSession).mockResolvedValue(mockSession)
    vi.mocked(prisma.userAchievement.findMany).mockResolvedValue([
      mockUserAchievement,
    ])

    const request = new NextRequest('http://localhost:3000/api/achievements', {
      method: 'GET',
    })

    const response = await getAchievements(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.achievements).toHaveLength(1)
    expect(data.data.achievements[0].achievement.name).toBe('First Steps')
  })

  it('returns 401 when user is not authenticated', async () => {
    vi.mocked(getSession).mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/achievements', {
      method: 'GET',
    })

    const response = await getAchievements(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('UNAUTHORIZED')
  })

  it('returns empty array when user has no achievements', async () => {
    vi.mocked(getSession).mockResolvedValue(mockSession)
    vi.mocked(prisma.userAchievement.findMany).mockResolvedValue([])

    const request = new NextRequest('http://localhost:3000/api/achievements', {
      method: 'GET',
    })

    const response = await getAchievements(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.achievements).toEqual([])
  })

  it('includes achievement details in response', async () => {
    vi.mocked(getSession).mockResolvedValue(mockSession)
    vi.mocked(prisma.userAchievement.findMany).mockResolvedValue([
      mockUserAchievement,
    ])

    const request = new NextRequest('http://localhost:3000/api/achievements', {
      method: 'GET',
    })

    const response = await getAchievements(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.data.achievements[0]).toHaveProperty('achievement')
    expect(data.data.achievements[0].achievement).toHaveProperty('name')
    expect(data.data.achievements[0].achievement).toHaveProperty('description')
    expect(data.data.achievements[0].achievement).toHaveProperty('icon')
    expect(data.data.achievements[0].achievement).toHaveProperty('xpReward')
  })

  it('handles database errors gracefully', async () => {
    vi.mocked(getSession).mockResolvedValue(mockSession)
    vi.mocked(prisma.userAchievement.findMany).mockRejectedValue(new Error('Database error'))

    const request = new NextRequest('http://localhost:3000/api/achievements', {
      method: 'GET',
    })

    const response = await getAchievements(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('INTERNAL_ERROR')
  })
})

describe('POST /api/achievements/unlock', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('unlocks achievement for authenticated user', async () => {
    vi.mocked(getSession).mockResolvedValue(mockSession)
    vi.mocked(prisma.achievement.findUnique).mockResolvedValue(mockAchievements[0])
    vi.mocked(prisma.userAchievement.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.userAchievement.create).mockResolvedValue(mockUserAchievement)

    const request = new NextRequest('http://localhost:3000/api/achievements/unlock', {
      method: 'POST',
      body: JSON.stringify({ achievementId: 'achievement-1' }),
    })

    const response = await unlockAchievement(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.userAchievement).toBeDefined()
    expect(data.data.xpGained).toBe(100)
  })

  it('returns 401 when user is not authenticated', async () => {
    vi.mocked(getSession).mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/achievements/unlock', {
      method: 'POST',
      body: JSON.stringify({ achievementId: 'achievement-1' }),
    })

    const response = await unlockAchievement(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('UNAUTHORIZED')
  })

  it('validates required achievementId field', async () => {
    vi.mocked(getSession).mockResolvedValue(mockSession)

    const request = new NextRequest('http://localhost:3000/api/achievements/unlock', {
      method: 'POST',
      body: JSON.stringify({}),
    })

    const response = await unlockAchievement(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('VALIDATION_ERROR')
  })

  it('returns 404 when achievement does not exist', async () => {
    vi.mocked(getSession).mockResolvedValue(mockSession)
    vi.mocked(prisma.achievement.findUnique).mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/achievements/unlock', {
      method: 'POST',
      body: JSON.stringify({ achievementId: 'nonexistent' }),
    })

    const response = await unlockAchievement(request)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('NOT_FOUND')
  })

  it('returns 409 when achievement is already unlocked', async () => {
    vi.mocked(getSession).mockResolvedValue(mockSession)
    vi.mocked(prisma.achievement.findUnique).mockResolvedValue(mockAchievements[0])
    vi.mocked(prisma.userAchievement.findUnique).mockResolvedValue(mockUserAchievement)

    const request = new NextRequest('http://localhost:3000/api/achievements/unlock', {
      method: 'POST',
      body: JSON.stringify({ achievementId: 'achievement-1' }),
    })

    const response = await unlockAchievement(request)
    const data = await response.json()

    expect(response.status).toBe(409)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('CONFLICT')
    expect(data.error.message).toContain('already unlocked')
  })

  it('handles database errors gracefully', async () => {
    vi.mocked(getSession).mockResolvedValue(mockSession)
    vi.mocked(prisma.achievement.findUnique).mockRejectedValue(new Error('Database error'))

    const request = new NextRequest('http://localhost:3000/api/achievements/unlock', {
      method: 'POST',
      body: JSON.stringify({ achievementId: 'achievement-1' }),
    })

    const response = await unlockAchievement(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('INTERNAL_ERROR')
  })
})

describe('GET /api/achievements/available', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns all available achievements for authenticated user', async () => {
    vi.mocked(getSession).mockResolvedValue(mockSession)
    vi.mocked(prisma.achievement.findMany).mockResolvedValue(mockAchievements)
    vi.mocked(prisma.userAchievement.findMany).mockResolvedValue([
      { achievementId: 'achievement-1' },
    ] as any)

    const request = new NextRequest('http://localhost:3000/api/achievements/available', {
      method: 'GET',
    })

    const response = await getAvailableAchievements(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.achievements).toHaveLength(1)
    expect(data.data.achievements[0].id).toBe('achievement-2')
  })

  it('returns 401 when user is not authenticated', async () => {
    vi.mocked(getSession).mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/achievements/available', {
      method: 'GET',
    })

    const response = await getAvailableAchievements(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('UNAUTHORIZED')
  })

  it('returns all achievements when user has none unlocked', async () => {
    vi.mocked(getSession).mockResolvedValue(mockSession)
    vi.mocked(prisma.achievement.findMany).mockResolvedValue(mockAchievements)
    vi.mocked(prisma.userAchievement.findMany).mockResolvedValue([])

    const request = new NextRequest('http://localhost:3000/api/achievements/available', {
      method: 'GET',
    })

    const response = await getAvailableAchievements(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.achievements).toHaveLength(2)
  })

  it('returns empty array when user has unlocked all achievements', async () => {
    vi.mocked(getSession).mockResolvedValue(mockSession)
    vi.mocked(prisma.achievement.findMany).mockResolvedValue(mockAchievements)
    vi.mocked(prisma.userAchievement.findMany).mockResolvedValue([
      { achievementId: 'achievement-1' },
      { achievementId: 'achievement-2' },
    ] as any)

    const request = new NextRequest('http://localhost:3000/api/achievements/available', {
      method: 'GET',
    })

    const response = await getAvailableAchievements(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.achievements).toEqual([])
  })

  it('handles database errors gracefully', async () => {
    vi.mocked(getSession).mockResolvedValue(mockSession)
    vi.mocked(prisma.achievement.findMany).mockRejectedValue(new Error('Database error'))

    const request = new NextRequest('http://localhost:3000/api/achievements/available', {
      method: 'GET',
    })

    const response = await getAvailableAchievements(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('INTERNAL_ERROR')
  })
})
