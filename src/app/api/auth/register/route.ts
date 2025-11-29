import { type NextRequest } from 'next/server'
import { hash } from 'bcryptjs'
import { successResponse, errors } from '@/lib/api/response'
import { validateBody } from '@/lib/api/validate'
import { registerSchema } from '@/lib/validation/schemas'
import { prisma } from '@/lib/db/client'
import { createSession, setSessionCookie } from '@/lib/auth/session'

export async function POST(request: NextRequest) {
  try {
    // Validate body
    const validation = await validateBody(request, registerSchema)
    if ('error' in validation) return validation.error

    const { email, password, username } = validation.data

    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    })

    if (existingUser) {
      return errors.validation({
        email: existingUser.email === email ? ['Email already in use'] : [],
        username: existingUser.username === username ? ['Username already taken'] : [],
      })
    }

    // Hash password
    const hashedPassword = await hash(password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
      },
    })

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
    }, undefined, 201)
  } catch (error) {
    console.error('Registration failed:', error)
    return errors.internal()
  }
}
