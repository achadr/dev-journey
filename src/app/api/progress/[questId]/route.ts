import { type NextRequest } from 'next/server'
import { successResponse, errors } from '@/lib/api/response'
import { prisma } from '@/lib/db/client'
import { getSession } from '@/lib/auth/session'

interface RouteContext {
  params: Promise<{
    questId: string
  }>
}

/**
 * GET /api/progress/[questId]
 * Get progress for a specific quest
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    // Check authentication
    const session = await getSession(request)
    if (!session) {
      return errors.unauthorized()
    }

    // Get questId from params
    const params = await context.params
    const { questId } = params

    // Validate questId
    if (!questId || questId.trim() === '') {
      return errors.validation({
        questId: ['Quest ID is required'],
      })
    }

    // Fetch progress for specific quest
    const progress = await prisma.progress.findUnique({
      where: {
        userId_questId: {
          userId: session.userId,
          questId,
        },
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
            layers: {
              select: {
                id: true,
                type: true,
                order: true,
              },
              orderBy: {
                order: 'asc',
              },
            },
          },
        },
      },
    })

    if (!progress) {
      return errors.notFound('Progress')
    }

    return successResponse({
      progress,
    })
  } catch (error) {
    console.error('Get quest progress failed:', error)
    return errors.internal()
  }
}
