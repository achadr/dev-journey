import { type NextRequest } from 'next/server'
import { successResponse, errors } from '@/lib/api/response'
import { validateQuery } from '@/lib/api/validate'
import { questQuerySchema } from '@/lib/validation/schemas'
import { getPublicQuests } from '@/lib/db/queries'

export async function GET(request: NextRequest) {
  try {
    // Validate query parameters
    const validation = validateQuery(request, questQuerySchema)
    if ('error' in validation) return validation.error

    const { page, limit, difficulty, search } = validation.data

    // Fetch quests
    const { quests, total } = await getPublicQuests({
      page,
      limit,
      difficulty,
      search,
    })

    return successResponse(quests, { page, limit, total })
  } catch (error) {
    console.error('Failed to fetch quests:', error)
    return errors.internal()
  }
}
