import { successResponse } from '@/lib/api/response'
import { clearSessionCookie } from '@/lib/auth/session'

export async function POST() {
  try {
    await clearSessionCookie()

    return successResponse({ message: 'Logged out successfully' })
  } catch (error) {
    console.error('Logout failed:', error)
    return successResponse({ message: 'Logged out' })
  }
}
