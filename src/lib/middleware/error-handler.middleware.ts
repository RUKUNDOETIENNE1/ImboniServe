/**
 * Centralized Error Handling Middleware
 * Provides consistent error logging and response formatting
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { logger } from '@/lib/logger'
import { errorResponse, internalServerErrorResponse, validationErrorResponse } from '@/lib/api/response-helpers'
import { ZodError } from 'zod'

export type ApiHandler = (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void

/**
 * Wraps an API handler with standardized error handling
 */
export function withErrorHandler(handler: ApiHandler) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      await handler(req, res)
    } catch (error) {
      handleApiError(error, req, res)
    }
  }
}

/**
 * Handles API errors with consistent logging and response formatting
 */
export function handleApiError(error: unknown, req: NextApiRequest, res: NextApiResponse) {
  const method = req.method || 'UNKNOWN'
  const url = req.url || 'unknown'
  
  // Log error with context
  logger.error('API error', {
    method,
    url,
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    userId: (req as any).session?.user?.id,
    businessId: (req as any).session?.user?.businessId
  })

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return res.status(400).json(validationErrorResponse(error.errors))
  }

  // Handle known error types
  if (error instanceof Error) {
    // Check for specific error messages that should be exposed
    if (error.message.includes('not found')) {
      return res.status(404).json(errorResponse(error.message))
    }

    if (error.message.includes('Unauthorized') || error.message.includes('unauthorized')) {
      return res.status(401).json(errorResponse('Unauthorized'))
    }

    if (error.message.includes('Forbidden') || error.message.includes('forbidden')) {
      return res.status(403).json(errorResponse('Forbidden'))
    }

    if (error.message.includes('Invalid') || error.message.includes('invalid')) {
      return res.status(400).json(errorResponse(error.message))
    }

    // Database constraint violations
    if (error.message.includes('Unique constraint')) {
      return res.status(409).json(errorResponse('Resource already exists'))
    }

    // Foreign key violations
    if (error.message.includes('Foreign key constraint')) {
      return res.status(400).json(errorResponse('Invalid reference'))
    }
  }

  // Default to 500 internal server error (don't expose details)
  return res.status(500).json(internalServerErrorResponse())
}

/**
 * Error class for API errors with status codes
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * Throws a 400 Bad Request error
 */
export function throwBadRequest(message: string, details?: any): never {
  throw new ApiError(400, message, details)
}

/**
 * Throws a 401 Unauthorized error
 */
export function throwUnauthorized(message: string = 'Unauthorized'): never {
  throw new ApiError(401, message)
}

/**
 * Throws a 403 Forbidden error
 */
export function throwForbidden(message: string = 'Forbidden'): never {
  throw new ApiError(403, message)
}

/**
 * Throws a 404 Not Found error
 */
export function throwNotFound(resource: string = 'Resource'): never {
  throw new ApiError(404, `${resource} not found`)
}

/**
 * Throws a 409 Conflict error
 */
export function throwConflict(message: string): never {
  throw new ApiError(409, message)
}

/**
 * Throws a 422 Unprocessable Entity error
 */
export function throwUnprocessable(message: string, details?: any): never {
  throw new ApiError(422, message, details)
}

/**
 * Throws a 500 Internal Server Error
 */
export function throwInternalError(message: string = 'Internal server error'): never {
  throw new ApiError(500, message)
}
