import { type NextRequest } from 'next/server'
import { compare } from 'bcryptjs'
import { successResponse, errors } from '@/lib/api/response'
import { validateBody } from '@/lib/api/validate'
import { loginSchema } from '@/lib/validation/schemas'
import { prisma } from '@/lib/db/client'
import { createSession, setSessionCookie } from '@/lib/auth/session'

export async function POST(request: NextRequest) {
  try {
    // Validate body
    const validation = await validateBody(request, loginSchema)
    if ('error' in validation) return validation.error

    const { email, password } = validation.data

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return errors.validation({
        email: ['Invalid email or password'],
      })
    }

    // Verify password
    const isValid = await compare(password, user.password)

    if (!isValid) {
      return errors.validation({
        email: ['Invalid email or password'],
      })
    }

    // Create session
    const token = await createSession({
      userId: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    })

    await setSessionCookie(token)

    return successResponse({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
      },
    })
  } catch (error) {
    console.error('Login failed:', error)
    return errors.internal()
  }
}
