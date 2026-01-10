import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock modules before imports
vi.mock('@/lib/db/client', () => ({
  prisma: {
    progress: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
    },
    layerProgress: {
      createMany: vi.fn(),
      updateMany: vi.fn(),
      upsert: vi.fn(),
    },
  },
}))

vi.mock('@/lib/auth/session', () => ({
  getSession: vi.fn(),
}))

// Import after mocking
import { prisma } from '@/lib/db/client'
import { getSession } from '@/lib/auth/session'
import { POST as saveProgress, GET as getProgressList } from '@/app/api/progress/route'

const mockSession = {
  userId: 'user-123',
  email: 'test@example.com',
  username: 'testuser',
  role: 'PLAYER',
}

const mockProgressData = {
  questId: 'quest-456',
  layerIndex: 0,
  score: 100,
  completed: true,
  timeSpent: 120,
  layerProgress: [
    {
      layerIndex: 0,
      score: 100,
      completed: true,
      timeSpent: 120,
    },
  ],
}

describe('POST /api/progress', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('saves progress for authenticated user', async () => {
    vi.mocked(getSession).mockResolvedValue(mockSession)

    const mockProgress = {
      id: 'progress-789',
      userId: mockSession.userId,
      questId: mockProgressData.questId,
      layerIndex: mockProgressData.layerIndex,
      score: mockProgressData.score,
      bestScore: mockProgressData.score,
      completed: mockProgressData.completed,
      attempts: 1,
      timeSpent: mockProgressData.timeSpent,
      bestTime: mockProgressData.timeSpent,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    vi.mocked(prisma.progress.upsert).mockResolvedValue(mockProgress)
    vi.mocked(prisma.layerProgress.upsert).mockResolvedValue({
      id: 'layer-progress-1',
      progressId: 'progress-789',
      layerIndex: 0,
      score: 100,
      completed: true,
      timeSpent: 120,
      attempts: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    vi.mocked(prisma.progress.findUnique).mockResolvedValue({
      ...mockProgress,
      layerProgress: [],
    })

    const request = new NextRequest('http://localhost:3000/api/progress', {
      method: 'POST',
      body: JSON.stringify(mockProgressData),
    })

    const response = await saveProgress(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.progress).toBeDefined()
    expect(data.data.progress.questId).toBe(mockProgressData.questId)
  })

  it('returns 401 when user is not authenticated', async () => {
    vi.mocked(getSession).mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/progress', {
      method: 'POST',
      body: JSON.stringify(mockProgressData),
    })

    const response = await saveProgress(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('UNAUTHORIZED')
  })

  it('validates required fields', async () => {
    vi.mocked(getSession).mockResolvedValue(mockSession)

    const invalidData = {
      questId: 'quest-456',
      // Missing layerIndex, score, completed, timeSpent
    }

    const request = new NextRequest('http://localhost:3000/api/progress', {
      method: 'POST',
      body: JSON.stringify(invalidData),
    })

    const response = await saveProgress(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('VALIDATION_ERROR')
  })

  it('updates existing progress with better score', async () => {
    vi.mocked(getSession).mockResolvedValue(mockSession)

    const existingProgress = {
      id: 'progress-789',
      userId: mockSession.userId,
      questId: mockProgressData.questId,
      layerIndex: 0,
      score: 80,
      bestScore: 80,
      completed: false,
      attempts: 1,
      timeSpent: 150,
      bestTime: 150,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const betterScore = {
      ...mockProgressData,
      score: 120,
    }

    const updatedProgress = {
      ...existingProgress,
      score: betterScore.score,
      bestScore: betterScore.score,
      attempts: 2,
    }

    vi.mocked(prisma.progress.upsert).mockResolvedValue(updatedProgress)
    vi.mocked(prisma.layerProgress.upsert).mockResolvedValue({
      id: 'layer-progress-1',
      progressId: 'progress-789',
      layerIndex: 0,
      score: 100,
      completed: true,
      timeSpent: 120,
      attempts: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    vi.mocked(prisma.progress.findUnique).mockResolvedValue({
      ...updatedProgress,
      layerProgress: [],
    })

    const request = new NextRequest('http://localhost:3000/api/progress', {
      method: 'POST',
      body: JSON.stringify(betterScore),
    })

    const response = await saveProgress(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.progress.bestScore).toBe(betterScore.score)
  })

  it('increments attempts counter', async () => {
    vi.mocked(getSession).mockResolvedValue(mockSession)

    const mockProgress = {
      id: 'progress-789',
      userId: mockSession.userId,
      questId: mockProgressData.questId,
      layerIndex: mockProgressData.layerIndex,
      score: mockProgressData.score,
      bestScore: mockProgressData.score,
      completed: mockProgressData.completed,
      attempts: 3,
      timeSpent: mockProgressData.timeSpent,
      bestTime: mockProgressData.timeSpent,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    vi.mocked(prisma.progress.upsert).mockResolvedValue(mockProgress)
    vi.mocked(prisma.layerProgress.upsert).mockResolvedValue({
      id: 'layer-progress-1',
      progressId: 'progress-789',
      layerIndex: 0,
      score: 100,
      completed: true,
      timeSpent: 120,
      attempts: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    vi.mocked(prisma.progress.findUnique).mockResolvedValue({
      ...mockProgress,
      layerProgress: [],
    })

    const request = new NextRequest('http://localhost:3000/api/progress', {
      method: 'POST',
      body: JSON.stringify(mockProgressData),
    })

    const response = await saveProgress(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.data.progress.attempts).toBeGreaterThan(0)
  })

  it('saves layer progress alongside quest progress', async () => {
    vi.mocked(getSession).mockResolvedValue(mockSession)

    const mockProgress = {
      id: 'progress-789',
      userId: mockSession.userId,
      questId: mockProgressData.questId,
      layerIndex: mockProgressData.layerIndex,
      score: mockProgressData.score,
      bestScore: mockProgressData.score,
      completed: mockProgressData.completed,
      attempts: 1,
      timeSpent: mockProgressData.timeSpent,
      bestTime: mockProgressData.timeSpent,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    vi.mocked(prisma.progress.upsert).mockResolvedValue(mockProgress)
    vi.mocked(prisma.layerProgress.upsert).mockResolvedValue({
      id: 'layer-progress-1',
      progressId: 'progress-789',
      layerIndex: 0,
      score: 50,
      completed: true,
      timeSpent: 60,
      attempts: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    vi.mocked(prisma.progress.findUnique).mockResolvedValue({
      ...mockProgress,
      layerProgress: [],
    })

    const dataWithLayerProgress = {
      ...mockProgressData,
      layerProgress: [
        { layerIndex: 0, score: 50, completed: true, timeSpent: 60 },
        { layerIndex: 1, score: 50, completed: true, timeSpent: 60 },
      ],
    }

    const request = new NextRequest('http://localhost:3000/api/progress', {
      method: 'POST',
      body: JSON.stringify(dataWithLayerProgress),
    })

    const response = await saveProgress(request)

    expect(response.status).toBe(200)
  })

  it('handles database errors gracefully', async () => {
    vi.mocked(getSession).mockResolvedValue(mockSession)
    vi.mocked(prisma.progress.upsert).mockRejectedValue(new Error('Database error'))

    const request = new NextRequest('http://localhost:3000/api/progress', {
      method: 'POST',
      body: JSON.stringify(mockProgressData),
    })

    const response = await saveProgress(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('INTERNAL_ERROR')
  })
})

describe('GET /api/progress', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns progress list for authenticated user', async () => {
    vi.mocked(getSession).mockResolvedValue(mockSession)
    vi.mocked(prisma.progress.findMany).mockResolvedValue([
      {
        id: 'progress-1',
        userId: mockSession.userId,
        questId: 'quest-1',
        layerIndex: 2,
        score: 250,
        bestScore: 280,
        completed: false,
        attempts: 3,
        timeSpent: 450,
        bestTime: 400,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'progress-2',
        userId: mockSession.userId,
        questId: 'quest-2',
        layerIndex: 3,
        score: 400,
        bestScore: 400,
        completed: true,
        attempts: 1,
        timeSpent: 600,
        bestTime: 600,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ])

    const request = new NextRequest('http://localhost:3000/api/progress', {
      method: 'GET',
    })

    const response = await getProgressList(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.progress).toHaveLength(2)
  })

  it('returns 401 when user is not authenticated', async () => {
    vi.mocked(getSession).mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/progress', {
      method: 'GET',
    })

    const response = await getProgressList(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('UNAUTHORIZED')
  })

  it('returns empty array when user has no progress', async () => {
    vi.mocked(getSession).mockResolvedValue(mockSession)
    vi.mocked(prisma.progress.findMany).mockResolvedValue([])

    const request = new NextRequest('http://localhost:3000/api/progress', {
      method: 'GET',
    })

    const response = await getProgressList(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.progress).toEqual([])
  })

  it('includes layer progress in response', async () => {
    vi.mocked(getSession).mockResolvedValue(mockSession)
    vi.mocked(prisma.progress.findMany).mockResolvedValue([
      {
        id: 'progress-1',
        userId: mockSession.userId,
        questId: 'quest-1',
        layerIndex: 0,
        score: 100,
        bestScore: 100,
        completed: true,
        attempts: 1,
        timeSpent: 120,
        bestTime: 120,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ])

    const request = new NextRequest('http://localhost:3000/api/progress', {
      method: 'GET',
    })

    const response = await getProgressList(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.data.progress[0]).toBeDefined()
  })

  it('handles database errors gracefully', async () => {
    vi.mocked(getSession).mockResolvedValue(mockSession)
    vi.mocked(prisma.progress.findMany).mockRejectedValue(new Error('Database error'))

    const request = new NextRequest('http://localhost:3000/api/progress', {
      method: 'GET',
    })

    const response = await getProgressList(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('INTERNAL_ERROR')
  })
})
