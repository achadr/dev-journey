import { type NextRequest } from 'next/server'
import { successResponse, errors } from '@/lib/api/response'
import { validateBody } from '@/lib/api/validate'
import { saveProgressSchema } from '@/lib/validation/schemas'
import { prisma } from '@/lib/db/client'
import { getSession } from '@/lib/auth/session'

/**
 * POST /api/progress
 * Save or update user's progress for a quest
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getSession(request)
    if (!session) {
      return errors.unauthorized()
    }

    // Validate body
    const validation = await validateBody(request, saveProgressSchema)
    if ('error' in validation) return validation.error

    const { questId, layerIndex, score, completed, timeSpent, layerProgress } = validation.data

    // Upsert quest progress
    const progress = await prisma.progress.upsert({
      where: {
        userId_questId: {
          userId: session.userId,
          questId,
        },
      },
      update: {
        layerIndex,
        score,
        completed,
        timeSpent: {
          increment: timeSpent,
        },
        attempts: {
          increment: 1,
        },
      },
      create: {
        userId: session.userId,
        questId,
        layerIndex,
        score,
        bestScore: score,
        completed,
        attempts: 1,
        timeSpent,
        bestTime: completed ? timeSpent : null,
      },
      include: {
        layerProgress: true,
      },
    })

    // Update bestScore manually if needed
    if (score > progress.bestScore) {
      await prisma.progress.update({
        where: { id: progress.id },
        data: { bestScore: score },
      })
    }

    // Update or create layer progress if provided
    if (layerProgress && layerProgress.length > 0) {
      for (const layer of layerProgress) {
        await prisma.layerProgress.upsert({
          where: {
            progressId_layerIndex: {
              progressId: progress.id,
              layerIndex: layer.layerIndex,
            },
          },
          update: {
            score: layer.score,
            completed: layer.completed,
            timeSpent: layer.timeSpent,
            attempts: {
              increment: 1,
            },
          },
          create: {
            progressId: progress.id,
            layerIndex: layer.layerIndex,
            score: layer.score,
            completed: layer.completed,
            timeSpent: layer.timeSpent,
            attempts: 1,
          },
        })
      }
    }

    // Fetch updated progress with layer progress
    const updatedProgress = await prisma.progress.findUnique({
      where: { id: progress.id },
      include: {
        layerProgress: {
          orderBy: { layerIndex: 'asc' },
        },
      },
    })

    return successResponse({
      progress: updatedProgress,
    })
  } catch (error) {
    console.error('Save progress failed:', error)
    return errors.internal()
  }
}

/**
 * GET /api/progress
 * Get all progress for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getSession(request)
    if (!session) {
      return errors.unauthorized()
    }

    // Fetch all progress for user
    const progress = await prisma.progress.findMany({
      where: {
        userId: session.userId,
      },
      include: {
        layerProgress: {
          orderBy: { layerIndex: 'asc' },
        },
        quest: {
          select: {
            id: true,
            name: true,
            difficulty: true,
            thumbnailUrl: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    })

    return successResponse({
      progress,
    })
  } catch (error) {
    console.error('Get progress failed:', error)
    return errors.internal()
  }
}
