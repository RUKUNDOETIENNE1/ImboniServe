import { NextApiRequest } from 'next'

export interface PaginationParams {
  page: number
  limit: number
  skip: number
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

/**
 * Extract and validate pagination parameters from request query
 */
export function getPaginationParams(req: NextApiRequest): PaginationParams {
  const page = Math.max(1, parseInt(req.query.page as string) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20))
  const skip = (page - 1) * limit

  return { page, limit, skip }
}

/**
 * Generate pagination metadata for response
 */
export function getPaginationMeta(
  page: number,
  limit: number,
  total: number
): PaginationMeta {
  const totalPages = Math.ceil(total / limit)

  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  }
}

/**
 * Create paginated response object
 */
export function createPaginatedResponse<T>(
  data: T[],
  meta: PaginationMeta
) {
  return {
    data,
    pagination: meta,
  }
}
