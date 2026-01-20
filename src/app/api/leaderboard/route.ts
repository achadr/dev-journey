import { type NextRequest } from 'next/server'
import { successResponse, errors } from '@/lib/api/response'
import { validateQuery } from '@/lib/api/validate'
import { leaderboardQuerySchema } from '@/lib/validation/schemas'
import { prisma } from '@/lib/db/client'
import { getSession } from '@/lib/auth/session'
import { LeaderboardPeriod } from '@prisma/client'

/**
 * Map query period to Prisma enum
 */
function mapPeriodToEnum(period: string): LeaderboardPeriod {
  const periodMap: Record<string, LeaderboardPeriod> = {
    daily: 'DAILY',
    weekly: 'WEEKLY',
    monthly: 'MONTHLY',
    'all-time': 'ALL_TIME',
  }
  return periodMap[period] || 'ALL_TIME'
}

/**
 * Get the current period start date based on period type
 */
function getPeriodStart(period: LeaderboardPeriod): Date {
  const now = new Date()

  switch (period) {
    case 'DAILY':
      return new Date(now.getFullYear(), now.getMonth(), now.getDate())
    case 'WEEKLY':
      const dayOfWeek = now.getDay()
      const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1) // Monday start
      return new Date(now.getFullYear(), now.getMonth(), diff)
    case 'MONTHLY':
      return new Date(now.getFullYear(), now.getMonth(), 1)
    case 'ALL_TIME':
    default:
      return new Date(2000, 0, 1) // Far in the past for all-time
  }
}

/**
 * GET /api/leaderboard
 * Get leaderboard entries with optional filtering by period
 */
export async function GET(request: NextRequest) {
  try {
    // Validate query params
    const validation = validateQuery(request, leaderboardQuerySchema)
    if ('error' in validation) return validation.error

    const { period, page, limit } = validation.data
    const prismaPeriod = mapPeriodToEnum(period)
    const periodStart = getPeriodStart(prismaPeriod)

    // Get optional session for user rank
    const session = await getSession(request)

    // Calculate pagination
    const skip = (page - 1) * limit

    // Fetch leaderboard entries
    const entries = await prisma.leaderboardEntry.findMany({
      where: {
        period: prismaPeriod,
        periodStart: {
          gte: periodStart,
        },
      },
      orderBy: {
        totalScore: 'desc',
      },
      skip,
      take: limit,
    })

    // Get total count for pagination
    const total = await prisma.leaderboardEntry.count({
      where: {
        period: prismaPeriod,
        periodStart: {
          gte: periodStart,
        },
      },
    })

    // Find user's rank if authenticated
    let userRank = null
    if (session) {
      const userEntry = entries.find((entry) => entry.userId === session.userId)
      if (userEntry) {
        userRank = {
          rank: userEntry.rank,
          username: userEntry.username,
          totalScore: userEntry.totalScore,
          questsCompleted: userEntry.questsCompleted,
        }
      }
    }

    return successResponse(
      {
        entries,
        userRank,
      },
      {
        page,
        limit,
        total,
      }
    )
  } catch (error) {
    console.error('Get leaderboard failed:', error)
    return errors.internal()
  }
}
