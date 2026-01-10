import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock modules before imports
vi.mock('@/lib/db/client', () => ({
  prisma: {
    progress: {
      findUnique: vi.fn(),
    },
  },
}))

vi.mock('@/lib/auth/session', () => ({
  getSession: vi.fn(),
}))

// Import after mocking
import { prisma } from '@/lib/db/client'
import { getSession } from '@/lib/auth/session'
import { GET as getQuestProgress } from '@/app/api/progress/[questId]/route'

const mockSession = {
  userId: 'user-123',
  email: 'test@example.com',
  username: 'testuser',
  role: 'PLAYER',
}

describe('GET /api/progress/[questId]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns progress for specific quest', async () => {
    vi.mocked(getSession).mockResolvedValue(mockSession)
    vi.mocked(prisma.progress.findUnique).mockResolvedValue({
      id: 'progress-789',
      userId: mockSession.userId,
      questId: 'quest-456',
      layerIndex: 2,
      score: 250,
      bestScore: 280,
      completed: false,
      attempts: 3,
      timeSpent: 450,
      bestTime: 400,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const request = new NextRequest('http://localhost:3000/api/progress/quest-456', {
      method: 'GET',
    })

    const response = await getQuestProgress(request, { params: Promise.resolve({ questId: 'quest-456' }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.progress).toBeDefined()
    expect(data.data.progress.questId).toBe('quest-456')
  })

  it('returns 401 when user is not authenticated', async () => {
    vi.mocked(getSession).mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/progress/quest-456', {
      method: 'GET',
    })

    const response = await getQuestProgress(request, { params: Promise.resolve({ questId: 'quest-456' }) })
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('UNAUTHORIZED')
  })

  it('returns 404 when progress not found', async () => {
    vi.mocked(getSession).mockResolvedValue(mockSession)
    vi.mocked(prisma.progress.findUnique).mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/progress/quest-999', {
      method: 'GET',
    })

    const response = await getQuestProgress(request, { params: Promise.resolve({ questId: 'quest-999' }) })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('NOT_FOUND')
  })

  it('includes layer progress for the quest', async () => {
    vi.mocked(getSession).mockResolvedValue(mockSession)
    vi.mocked(prisma.progress.findUnique).mockResolvedValue({
      id: 'progress-789',
      userId: mockSession.userId,
      questId: 'quest-456',
      layerIndex: 1,
      score: 150,
      bestScore: 150,
      completed: false,
      attempts: 2,
      timeSpent: 300,
      bestTime: 280,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const request = new NextRequest('http://localhost:3000/api/progress/quest-456', {
      method: 'GET',
    })

    const response = await getQuestProgress(request, { params: Promise.resolve({ questId: 'quest-456' }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.data.progress).toBeDefined()
    expect(data.data.progress.layerIndex).toBe(1)
  })

  it('validates questId parameter', async () => {
    vi.mocked(getSession).mockResolvedValue(mockSession)

    const request = new NextRequest('http://localhost:3000/api/progress/', {
      method: 'GET',
    })

    const response = await getQuestProgress(request, { params: Promise.resolve({ questId: '' }) })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('VALIDATION_ERROR')
  })

  it('returns progress with completion status', async () => {
    vi.mocked(getSession).mockResolvedValue(mockSession)
    vi.mocked(prisma.progress.findUnique).mockResolvedValue({
      id: 'progress-789',
      userId: mockSession.userId,
      questId: 'quest-456',
      layerIndex: 3,
      score: 400,
      bestScore: 400,
      completed: true,
      attempts: 1,
      timeSpent: 600,
      bestTime: 600,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const request = new NextRequest('http://localhost:3000/api/progress/quest-456', {
      method: 'GET',
    })

    const response = await getQuestProgress(request, { params: Promise.resolve({ questId: 'quest-456' }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.data.progress.completed).toBe(true)
    expect(data.data.progress.layerIndex).toBe(3)
  })

  it('handles database errors gracefully', async () => {
    vi.mocked(getSession).mockResolvedValue(mockSession)
    vi.mocked(prisma.progress.findUnique).mockRejectedValue(new Error('Database error'))

    const request = new NextRequest('http://localhost:3000/api/progress/quest-456', {
      method: 'GET',
    })

    const response = await getQuestProgress(request, { params: Promise.resolve({ questId: 'quest-456' }) })
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('INTERNAL_ERROR')
  })
})
