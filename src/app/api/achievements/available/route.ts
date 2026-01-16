import { type NextRequest } from 'next/server'
import { successResponse, errors } from '@/lib/api/response'
import { prisma } from '@/lib/db/client'
import { getSession } from '@/lib/auth/session'

/**
 * GET /api/achievements/available
 * Get all achievements that the user hasn't unlocked yet
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getSession(request)
    if (!session) {
      return errors.unauthorized()
    }

    // Get all achievements
    const allAchievements = await prisma.achievement.findMany({
      orderBy: [
        { category: 'asc' },
        { xpReward: 'desc' },
      ],
    })

    // Get user's unlocked achievements
    const unlockedAchievements = await prisma.userAchievement.findMany({
      where: {
        userId: session.userId,
      },
      select: {
        achievementId: true,
      },
    })

    const unlockedIds = new Set(unlockedAchievements.map((ua) => ua.achievementId))

    // Filter out unlocked achievements
    const availableAchievements = allAchievements.filter(
      (achievement) => !unlockedIds.has(achievement.id)
    )

    return successResponse({
      achievements: availableAchievements,
    })
  } catch (error) {
    console.error('Get available achievements failed:', error)
    return errors.internal()
  }
}
