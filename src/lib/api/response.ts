import { NextResponse } from 'next/server'

export function successResponse<T>(
  data: T,
  meta?: { page?: number; limit?: number; total?: number },
  status: number = 200
) {
  return NextResponse.json(
    { success: true, data, meta },
    { status }
  )
}

export function errorResponse(
  code: string,
  message: string,
  status: number = 400,
  details?: Record<string, string[]>
) {
  return NextResponse.json(
    {
      success: false,
      error: { code, message, details },
    },
    { status }
  )
}

// Common error responses
export const errors = {
  unauthorized: () =>
    errorResponse('UNAUTHORIZED', 'Authentication required', 401),

  forbidden: () =>
    errorResponse('FORBIDDEN', 'Access denied', 403),

  notFound: (resource: string) =>
    errorResponse('NOT_FOUND', `${resource} not found`, 404),

  validation: (details: Record<string, string[]>) =>
    errorResponse('VALIDATION_ERROR', 'Invalid request data', 400, details),

  internal: (message: string = 'Internal server error') =>
    errorResponse('INTERNAL_ERROR', message, 500),
}
