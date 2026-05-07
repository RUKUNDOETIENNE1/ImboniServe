/**
 * Standardized API Response Helpers
 * Ensures consistent response shapes across all API endpoints
 */

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  pages: number
}

export interface SuccessResponse<T = any> {
  data: T
  message?: string
}

export interface ErrorResponse {
  error: string
  details?: any
}

export interface PaginatedResponse<T = any> {
  data: T[]
  meta: PaginationMeta
}

/**
 * Standard success response
 */
export function successResponse<T>(data: T, message?: string): SuccessResponse<T> {
  return message ? { data, message } : { data }
}

/**
 * Standard error response
 */
export function errorResponse(error: string, details?: any): ErrorResponse {
  return details ? { error, details } : { error }
}

/**
 * Standard paginated response
 */
export function paginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number
): PaginatedResponse<T> {
  return {
    data,
    meta: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  }
}

/**
 * Calculate pagination metadata
 */
export function calculatePaginationMeta(
  page: number,
  limit: number,
  total: number
): PaginationMeta {
  return {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit)
  }
}

/**
 * Standard validation error response
 */
export function validationErrorResponse(details: any): ErrorResponse {
  return {
    error: 'Validation failed',
    details
  }
}

/**
 * Standard not found error response
 */
export function notFoundResponse(resource: string = 'Resource'): ErrorResponse {
  return {
    error: `${resource} not found`
  }
}

/**
 * Standard unauthorized error response
 */
export function unauthorizedResponse(message: string = 'Unauthorized'): ErrorResponse {
  return {
    error: message
  }
}

/**
 * Standard forbidden error response
 */
export function forbiddenResponse(message: string = 'Forbidden'): ErrorResponse {
  return {
    error: message
  }
}

/**
 * Standard method not allowed error response
 */
export function methodNotAllowedResponse(): ErrorResponse {
  return {
    error: 'Method not allowed'
  }
}

/**
 * Standard internal server error response
 */
export function internalServerErrorResponse(): ErrorResponse {
  return {
    error: 'Internal server error'
  }
}
