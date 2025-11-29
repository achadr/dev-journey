import { type NextRequest } from 'next/server'
import { successResponse, errors } from '@/lib/api/response'
import { getSession } from '@/lib/auth/session'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request)

    if (!session) {
      return errors.unauthorized()
    }

    return successResponse({
      user: {
        id: session.userId,
        email: session.email,
        username: session.username,
        role: session.role,
      },
    })
  } catch (error) {
    console.error('Failed to get current user:', error)
    return errors.internal()
  }
}
