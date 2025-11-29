import { type NextRequest } from 'next/server'
import { type ZodSchema, ZodError } from 'zod'
import { errorResponse } from './response'

export async function validateBody<T>(
  request: NextRequest,
  schema: ZodSchema<T>
): Promise<{ data: T } | { error: ReturnType<typeof errorResponse> }> {
  try {
    const body = await request.json()
    const data = schema.parse(body)
    return { data }
  } catch (error) {
    if (error instanceof ZodError) {
      const details: Record<string, string[]> = {}
      error.errors.forEach((err) => {
        const path = err.path.join('.')
        if (!details[path]) details[path] = []
        details[path].push(err.message)
      })
      return { error: errorResponse('VALIDATION_ERROR', 'Invalid request data', 400, details) }
    }
    return { error: errorResponse('INVALID_JSON', 'Invalid JSON body', 400) }
  }
}

export function validateQuery<T>(
  request: NextRequest,
  schema: ZodSchema<T>
): { data: T } | { error: ReturnType<typeof errorResponse> } {
  try {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams)
    const data = schema.parse(searchParams)
    return { data }
  } catch (error) {
    if (error instanceof ZodError) {
      const details: Record<string, string[]> = {}
      error.errors.forEach((err) => {
        const path = err.path.join('.')
        if (!details[path]) details[path] = []
        details[path].push(err.message)
      })
      return { error: errorResponse('VALIDATION_ERROR', 'Invalid query parameters', 400, details) }
    }
    return { error: errorResponse('VALIDATION_ERROR', 'Invalid query parameters', 400) }
  }
}

export function validateParams<T>(
  params: Record<string, string>,
  schema: ZodSchema<T>
): { data: T } | { error: ReturnType<typeof errorResponse> } {
  try {
    const data = schema.parse(params)
    return { data }
  } catch (error) {
    if (error instanceof ZodError) {
      return { error: errorResponse('VALIDATION_ERROR', 'Invalid path parameters', 400) }
    }
    return { error: errorResponse('VALIDATION_ERROR', 'Invalid path parameters', 400) }
  }
}
