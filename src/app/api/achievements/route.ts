import { type NextRequest } from 'next/server'
import { successResponse, errors } from '@/lib/api/response'
import { validateBody } from '@/lib/api/validate'
import { unlockAchievementSchema } from '@/lib/validation/schemas'
import { prisma } from '@/lib/db/client'
import { getSession } from '@/lib/auth/session'

/**
 * GET /api/achievements
 * Get all unlocked achievements for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getSession(request)
    if (!session) {
      return errors.unauthorized()
    }

    // Fetch all user achievements with achievement details
    const achievements = await prisma.userAchievement.findMany({
      where: {
        userId: session.userId,
      },
      include: {
        achievement: true,
      },
      orderBy: {
        unlockedAt: 'desc',
      },
    })

    return successResponse({
      achievements,
    })
  } catch (error) {
    console.error('Get achievements failed:', error)
    return errors.internal()
  }
}

/**
 * POST /api/achievements/unlock
 * Unlock an achievement for the authenticated user
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getSession(request)
    if (!session) {
      return errors.unauthorized()
    }

    // Validate body
    const validation = await validateBody(request, unlockAchievementSchema)
    if ('error' in validation) return validation.error

    const { achievementId } = validation.data

    // Check if achievement exists
    const achievement = await prisma.achievement.findUnique({
      where: { id: achievementId },
    })

    if (!achievement) {
      return errors.notFound('Achievement')
    }

    // Check if user already has this achievement
    const existingUnlock = await prisma.userAchievement.findUnique({
      where: {
        userId_achievementId: {
          userId: session.userId,
          achievementId,
        },
      },
    })

    if (existingUnlock) {
      return errors.conflict('Achievement already unlocked')
    }

    // Create user achievement
    const userAchievement = await prisma.userAchievement.create({
      data: {
        userId: session.userId,
        achievementId,
      },
      include: {
        achievement: true,
      },
    })

    // Update user XP
    await prisma.user.update({
      where: { id: session.userId },
      data: {
        xp: {
          increment: achievement.xpReward,
        },
      },
    })

    return successResponse({
      userAchievement,
      xpGained: achievement.xpReward,
    })
  } catch (error) {
    console.error('Unlock achievement failed:', error)
    return errors.internal()
  }
}
