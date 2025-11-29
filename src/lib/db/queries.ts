import { prisma } from './client'
import { type Prisma } from '@prisma/client'

// ============================================
// QUEST QUERIES
// ============================================

export async function getQuestWithLayers(questId: string) {
  return prisma.quest.findUnique({
    where: { id: questId },
    include: {
      layers: {
        orderBy: { order: 'asc' },
        include: {
          challenge: true,
        },
      },
      author: {
        select: {
          id: true,
          username: true,
          avatarUrl: true,
        },
      },
    },
  })
}

export async function getPublicQuests(options: {
  page?: number
  limit?: number
  difficulty?: number
  search?: string
  tags?: string[]
}) {
  const { page = 1, limit = 10, difficulty, search, tags } = options
  const skip = (page - 1) * limit

  const where: Prisma.QuestWhereInput = {
    isPublic: true,
    isActive: true,
    ...(difficulty && { difficulty }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ],
    }),
    ...(tags?.length && { tags: { hasSome: tags } }),
  }

  const [quests, total] = await Promise.all([
    prisma.quest.findMany({
      where,
      skip,
      take: limit,
      orderBy: [
        { playCount: 'desc' },
        { createdAt: 'desc' },
      ],
      include: {
        author: {
          select: { username: true },
        },
        _count: {
          select: { layers: true },
        },
      },
    }),
    prisma.quest.count({ where }),
  ])

  return { quests, total, page, limit }
}

export async function incrementPlayCount(questId: string) {
  return prisma.quest.update({
    where: { id: questId },
    data: { playCount: { increment: 1 } },
  })
}

// ============================================
// PROGRESS QUERIES
// ============================================

export async function getUserProgress(userId: string) {
  return prisma.progress.findMany({
    where: { userId },
    include: {
      quest: {
        select: {
          id: true,
          name: true,
          difficulty: true,
          _count: { select: { layers: true } },
        },
      },
      layerProgress: {
        orderBy: { layerIndex: 'asc' },
      },
    },
    orderBy: { updatedAt: 'desc' },
  })
}

export async function getOrCreateProgress(userId: string, questId: string) {
  return prisma.progress.upsert({
    where: {
      userId_questId: { userId, questId },
    },
    create: {
      userId,
      questId,
      layerIndex: 0,
    },
    update: {},
    include: {
      layerProgress: true,
    },
  })
}

export async function updateProgress(
  userId: string,
  questId: string,
  data: {
    layerIndex: number
    score: number
    completed?: boolean
    timeSpent?: number
  }
) {
  const { layerIndex, score, completed, timeSpent } = data

  return prisma.progress.update({
    where: {
      userId_questId: { userId, questId },
    },
    data: {
      layerIndex,
      score,
      bestScore: Math.max(score, 0),
      completed: completed ?? false,
      attempts: { increment: 1 },
      timeSpent: timeSpent ? { increment: timeSpent } : undefined,
    },
  })
}

// ============================================
// LEADERBOARD QUERIES
// ============================================

export async function getLeaderboard(options: {
  period?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'ALL_TIME'
  limit?: number
  questId?: string
}) {
  const { period = 'ALL_TIME', limit = 10, questId } = options

  if (questId) {
    // Quest-specific leaderboard
    return prisma.progress.findMany({
      where: {
        questId,
        completed: true,
      },
      orderBy: [
        { bestScore: 'desc' },
        { bestTime: 'asc' },
      ],
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    })
  }

  // Global leaderboard from materialized view
  const now = new Date()
  let periodStart: Date

  switch (period) {
    case 'DAILY':
      periodStart = new Date(now.setHours(0, 0, 0, 0))
      break
    case 'WEEKLY':
      periodStart = new Date(now.setDate(now.getDate() - now.getDay()))
      break
    case 'MONTHLY':
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
      break
    default:
      periodStart = new Date(0) // Beginning of time
  }

  return prisma.leaderboardEntry.findMany({
    where: {
      period,
      periodStart: { gte: periodStart },
    },
    orderBy: { totalScore: 'desc' },
    take: limit,
  })
}

// ============================================
// ACHIEVEMENT QUERIES
// ============================================

export async function getUserAchievements(userId: string) {
  return prisma.userAchievement.findMany({
    where: { userId },
    include: {
      achievement: true,
    },
    orderBy: { unlockedAt: 'desc' },
  })
}

export async function unlockAchievement(userId: string, achievementId: string) {
  return prisma.userAchievement.create({
    data: {
      userId,
      achievementId,
    },
  })
}
