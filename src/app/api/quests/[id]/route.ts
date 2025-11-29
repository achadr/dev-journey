import { type NextRequest } from 'next/server'
import { successResponse, errors } from '@/lib/api/response'
import { validateParams } from '@/lib/api/validate'
import { questIdSchema } from '@/lib/validation/schemas'
import { getQuestWithLayers } from '@/lib/db/queries'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Await params (Next.js 15+ requirement)
    const resolvedParams = await params

    // Validate path parameter
    const validation = validateParams(resolvedParams, questIdSchema)
    if ('error' in validation) return validation.error

    const { id } = validation.data

    // Fetch quest
    const quest = await getQuestWithLayers(id)

    if (!quest) {
      return errors.notFound('Quest')
    }

    return successResponse(quest)
  } catch (error) {
    console.error('Failed to fetch quest:', error)
    return errors.internal()
  }
}
